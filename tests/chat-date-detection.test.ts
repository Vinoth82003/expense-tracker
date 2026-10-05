import { describe, expect, it } from "vitest";

import {
  detectDateInMessage,
  hasDateMention,
  isSettableDate,
  todayString,
  yesterdayString,
} from "@/lib/chat/v2/date-detection";

/**
 * The date rules are deterministic on purpose. Letting the model decide meant a
 * dateless entry ("spent 500 on food") could reach the ledger stamped with
 * today, and the user never learned about it. These tests pin that contract:
 * recognise what the user actually said, and never invent anything.
 */
const NOW = new Date(2026, 2, 5, 10, 30); // Thursday 5 March 2026

describe("detectDateInMessage", () => {
  it("finds an explicit ISO date", () => {
    expect(detectDateInMessage("spent 500 on food on 2026-03-01", NOW).date).toBe("2026-03-01");
  });

  it("finds an explicit slash date and normalises it", () => {
    expect(detectDateInMessage("paid rent on 01/03/2026", NOW).date).toBe("2026-03-01");
  });

  it("disambiguates a slash date by whichever part cannot be a month", () => {
    // 15 can only be a day; 03 can only be a month.
    expect(detectDateInMessage("spent 200 on 15/03/2026", NOW).date).toBe("2026-03-15");
  });

  it("finds a written month date", () => {
    expect(detectDateInMessage("coffee on 5 March 2026", NOW).date).toBe("2026-03-05");
  });

  it("reads 'today'", () => {
    const res = detectDateInMessage("spent 200 on lunch today", NOW);
    expect(res.found).toBe(true);
    expect(res.date).toBe("2026-03-05");
  });

  it("reads 'yesterday'", () => {
    const res = detectDateInMessage("spent 200 on lunch yesterday", NOW);
    expect(res.found).toBe(true);
    expect(res.date).toBe("2026-03-04");
  });

  it("reads 'the day before yesterday' as two days back", () => {
    expect(detectDateInMessage("spent 200 the day before yesterday", NOW).date).toBe(
      "2026-03-03",
    );
  });

  it("reads 'tonight' as today", () => {
    expect(detectDateInMessage("dinner tonight", NOW).date).toBe("2026-03-05");
  });

  it("reads a bare weekday as the most recent past occurrence", () => {
    // Said on a Thursday, "friday" means the Friday that already happened.
    expect(detectDateInMessage("lunch on friday", NOW).date).toBe("2026-02-27");
  });

  it("reads 'last friday' as the Friday before this week's", () => {
    expect(detectDateInMessage("lunch last friday", NOW).date).toBe("2026-02-27");
  });

  it("returns no match for a message with no date at all", () => {
    // This is the whole point: the caller must then ask the user.
    const res = detectDateInMessage("spent 500 on food", NOW);
    expect(res.found).toBe(false);
    expect(res.date).toBeUndefined();
  });

  it("does not mistake a four-digit amount for a year", () => {
    expect(detectDateInMessage("spent 2026 on rent", NOW).found).toBe(false);
  });

  it("does not mistake a small amount for a date", () => {
    expect(detectDateInMessage("spent 05 on tea", NOW).found).toBe(false);
  });

  it("does not invent a year for a slash date without one", () => {
    // Guessing the current year could file it into the wrong period.
    expect(detectDateInMessage("spent 200 on 15/03", NOW).found).toBe(false);
  });

  it("rejects an impossible calendar date rather than rolling it over", () => {
    // 30 February must not silently become 2 March.
    expect(detectDateInMessage("spent 200 on 2026-02-30", NOW).found).toBe(false);
  });

  it("echoes the matched text back for the prompt to reuse", () => {
    expect(detectDateInMessage("spent 500 on food on 2026-03-01", NOW).label).toBe("2026-03-01");
  });
});

describe("hasDateMention", () => {
  it("is true when a date is named", () => {
    expect(hasDateMention("spent 500 on food on 2026-03-01")).toBe(true);
  });

  it("is false when none is named", () => {
    expect(hasDateMention("spent 500 on food")).toBe(false);
  });
});

describe("todayString / yesterdayString", () => {
  it("returns local-time ISO dates", () => {
    expect(todayString(NOW)).toBe("2026-03-05");
    expect(yesterdayString(NOW)).toBe("2026-03-04");
  });
});

describe("isSettableDate", () => {
  it("accepts today and any past date", () => {
    expect(isSettableDate("2026-03-05", NOW)).toBe(true);
    expect(isSettableDate("2026-01-01", NOW)).toBe(true);
  });

  it("rejects a future date", () => {
    expect(isSettableDate("2026-03-06", NOW)).toBe(false);
    expect(isSettableDate("2030-01-01", NOW)).toBe(false);
  });

  it.each(["2026-13-01", "not-a-date", "", "2026-3-5", "05/03/2026", "2026-02-30"])(
    "rejects %s",
    (value) => {
      expect(isSettableDate(value, NOW)).toBe(false);
    },
  );
});