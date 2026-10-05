/**
 * Deterministic date detection for the Sage batch pipeline.
 *
 * The LLM extractor is asked to emit `date: null` when the user never mentioned
 * a date, but models are unreliable at that distinction — a system prompt that
 * says "Today's date is: 2026-10-05" is very effective at making a model fill
 * in today's date whether or not the user said so. Silently defaulting a missing
 * date to today is exactly the behaviour this feature set removes, so the
 * presence of a date is verified here against the raw user text instead of
 * being trusted from the model.
 *
 * A match also lets us resolve relative dates ("yesterday", "last friday")
 * ourselves rather than trusting the model's date arithmetic.
 */

import { format, startOfDay, subDays } from "date-fns";

export interface DetectedDate {
  /** True when the message contains an explicit, resolvable date expression. */
  found: boolean;
  /** Resolved calendar date as YYYY-MM-DD, when `found`. */
  date?: string;
  /** The matched text, used for echoing back what Sage understood. */
  label?: string;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const MONTH_ALTERNATION = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join("|");

/** Longest-first month-name alternation, so "jan" never shadows "january". */
const MONTH_PATTERN = `(?<month>${MONTH_ALTERNATION})`;
const DAY_PATTERN = `(?<day>\\d{1,2})(?:st|nd|rd|th)?`;
const YEAR_PATTERN = `(?<year>\\d{4}|\\d{2})`;

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function build(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month, day);
  // Guards against overflow (e.g. Feb 31 silently becoming Mar 3).
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return d;
}

/**
 * Expands a two-digit year. Anything below the current year is read as this
 * century's (e.g. "23" -> 2023); anything above rolls into the next one only
 * when it is not in the past, matching how people write short dates.
 */
function expandYear(raw: string, now: Date): number {
  if (raw.length === 4) return Number(raw);
  const value = Number(raw);
  const currentYear = now.getFullYear();
  const century = Math.floor(currentYear / 100) * 100;
  const candidate = century + value;
  if (candidate > currentYear) return candidate - 100;
  return candidate;
}

/**
 * Resolves the last occurrence of a weekday strictly before today. "last
 * friday" said on a Friday means the Friday a week ago, not today.
 */
function previousWeekday(target: number, today: Date): Date {
  const d = new Date(today);
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() !== target);
  return startOfDay(d);
}

interface Rule {
  pattern: RegExp;
  resolve: (match: RegExpMatchArray, now: Date) => DetectedDate;
}

const NOT_FOUND: DetectedDate = { found: false };

/**
 * Ordered most-specific-first. A single message can contain several date
 * expressions ("paid rent on 1 Aug and groceries yesterday"); the first match
 * wins, and the rules are ordered so explicit calendar dates beat relative
 * phrases, since those are the ones a user bothered to type out.
 */
function buildRules(): Rule[] {
  return [
    // 2023-08-15 / 2023/08/15 — unambiguous, full ISO-ish form.
    {
      pattern: /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/,
      resolve: (m, now) => {
        const d = build(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return d ? { found: true, date: iso(d), label: m[0] } : NOT_FOUND;
      },
    },
    // 15 August 2023 / 15th August, 2023
    {
      pattern: new RegExp(
        `\\b${DAY_PATTERN}\\s+(?:of\\s+)?${MONTH_PATTERN},?\\s*${YEAR_PATTERN}\\b`,
        "i",
      ),
      resolve: (m, now) => {
        const g = m.groups || {};
        const d = build(
          expandYear(String(g.year), now),
          MONTHS[String(g.month).toLowerCase()],
          Number(g.day),
        );
        return d ? { found: true, date: iso(d), label: m[0].trim() } : NOT_FOUND;
      },
    },
    // August 15 2023 / August 15th
    {
      pattern: new RegExp(
        `\\b${MONTH_PATTERN}\\s+${DAY_PATTERN},?\\s*${YEAR_PATTERN}\\b`,
        "i",
      ),
      resolve: (m, now) => {
        const g = m.groups || {};
        const d = build(
          expandYear(String(g.year), now),
          MONTHS[String(g.month).toLowerCase()],
          Number(g.day),
        );
        return d ? { found: true, date: iso(d), label: m[0].trim() } : NOT_FOUND;
      },
    },
    // August 15th (no year — current year, and reject a day already past so we
    // do not log a future expense by accident)
    {
      pattern: new RegExp(`\\b${MONTH_PATTERN}\\s+${DAY_PATTERN}\\b`, "i"),
      resolve: (m, now) => {
        const g = m.groups || {};
        const month = MONTHS[String(g.month).toLowerCase()];
        const thisYear = build(now.getFullYear(), month, Number(g.day));
        if (!thisYear) return NOT_FOUND;
        const start = startOfDay(now);
        const resolved = thisYear > start ? subDays(thisYear, 365) : thisYear;
        return { found: true, date: iso(resolved), label: m[0].trim() };
      },
    },
    // 15/08/2023 or 08/15/2023 — day/month or month/day, disambiguated by
    // whichever component cannot be a month.
    {
      pattern: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/,
      resolve: (m, now) => {
        const first = Number(m[1]);
        const second = Number(m[2]);
        const year = expandYear(m[3], now);
        const dayMonth = build(year, second - 1, first);
        if (dayMonth) return { found: true, date: iso(dayMonth), label: m[0] };
        const monthDay = build(year, first - 1, second);
        if (monthDay) return { found: true, date: iso(monthDay), label: m[0] };
        return NOT_FOUND;
      },
    },
    // "the day before yesterday"
    {
      pattern: /\bthe\s+day\s+before\s+yesterday\b/i,
      resolve: (m, now) => ({
        found: true,
        date: iso(subDays(startOfDay(now), 2)),
        label: m[0],
      }),
    },
    // "yesterday" / "last night" (an evening, so it means the previous day)
    {
      pattern: /\b(?:yesterday|last\s+night)\b/i,
      resolve: (m, now) => ({
        found: true,
        date: iso(subDays(startOfDay(now), 1)),
        label: m[0].toLowerCase(),
      }),
    },
    // "last friday" / "on friday" — always the most recent past occurrence.
    {
      pattern: new RegExp(
        `\\b(?:(?:last|this|on)\\s+)?(${Object.keys(WEEKDAYS).join("|")})\\b`,
        "i",
      ),
      resolve: (m, now) => {
        const d = previousWeekday(WEEKDAYS[m[1].toLowerCase()], startOfDay(now));
        return { found: true, date: iso(d), label: m[1].toLowerCase() };
      },
    },
    // "this morning" / "tonight" / "this afternoon" — all today.
    {
      pattern: /\b(?:this\s+(?:morning|afternoon|evening)|tonight|earlier\s+today|just\s+now)\b/i,
      resolve: (m, now) => ({ found: true, date: iso(startOfDay(now)), label: m[0].toLowerCase() }),
    },
    // Bare "today" — last so it can never shadow an explicit calendar date.
    {
      pattern: /\btoday\b/i,
      resolve: (m, now) => ({ found: true, date: iso(startOfDay(now)), label: "today" }),
    },
  ];
}

const RULES = buildRules();

/**
 * Detects and resolves a date expression in a user message.
 *
 * Deliberately strict: a bare number is never treated as a date, because in
 * "spent 500 on groceries" the 500 is an amount. Dates therefore need a
 * separator, a month name, or an explicit date keyword.
 */
export function detectDateInMessage(message: string, now: Date = new Date()): DetectedDate {
  if (!message || !message.trim()) return NOT_FOUND;

  for (const rule of RULES) {
    const match = message.match(rule.pattern);
    if (!match) continue;
    const resolved = rule.resolve(match, now);
    if (resolved.found) return resolved;
  }

  return NOT_FOUND;
}

/** True when the message names a date, regardless of how it resolves. */
export function hasDateMention(message: string): boolean {
  return detectDateInMessage(message).found;
}

/** Today as YYYY-MM-DD in local time — the "Today" quick action's value. */
export function todayString(now: Date = new Date()): string {
  return iso(startOfDay(now));
}

/** Yesterday as YYYY-MM-DD in local time — the "Yesterday" quick action's value. */
export function yesterdayString(now: Date = new Date()): string {
  return iso(subDays(startOfDay(now), 1));
}

/**
 * Validates a date chosen from the follow-up picker. Rejects future dates and
 * unparseable input so a mistyped picker value cannot reach the database.
 */
export function isSettableDate(value: string, now: Date = new Date()): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  // JS rolls impossible dates over ("2026-02-30" becomes 2 March) rather than
  // rejecting them, so round-trip the value and refuse anything that shifted.
  if (iso(parsed) !== value) return false;
  return startOfDay(parsed) <= startOfDay(now);
}