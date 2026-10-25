import { Prisma } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

/**
 * Single source of truth for "who will receive this announcement".
 *
 * The admin UI must never estimate the audience (the old hardcoded "~847 users"
 * preview disagreed with the 16 registered users everywhere else). Both the
 * send route and the recipient-count endpoint resolve recipients through this
 * module so the preview and the actual send always agree, and so exclusion
 * (unsubscribe) is applied identically in both.
 */

export interface RecipientFilter {
  twoFactorEnabled?: boolean;
  limitMode?: boolean;
  active30d?: boolean;
  newUsers?: boolean;
  incomeNoExpenses?: boolean;
  noIncomeNoExpenses?: boolean;
  inactive2d?: boolean;
  inactive7d?: boolean;
  onboarded?: boolean | null;
  noPWA?: boolean;
  specificEmail?: string;
}

export interface RecipientAudience {
  count: number;
  excludedUnsubscribed: number;
  filter: RecipientFilter;
}

/** Builds the Prisma where clause for a recipient filter, excluding unsubscribes. */
export function buildRecipientWhere(
  filter: RecipientFilter | null | undefined,
  unsubscribedEmails: string[]
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    email: { notIn: unsubscribedEmails },
  };

  if (!filter) return where;

  const {
    twoFactorEnabled,
    limitMode,
    active30d,
    newUsers,
    incomeNoExpenses,
    noIncomeNoExpenses,
    inactive2d,
    inactive7d,
    onboarded,
    noPWA,
    specificEmail,
  } = filter;

  if (twoFactorEnabled) where.twoFactorEnabled = true;
  if (limitMode) where.expenseMode = "limit";
  if (active30d) where.lastActive = { gte: subDays(new Date(), 30) };
  if (newUsers) where.createdAt = { gte: subDays(new Date(), 7) };

  if (incomeNoExpenses) {
    where.incomes = { some: {} };
    where.expenses = { none: {} };
  }

  if (noIncomeNoExpenses) {
    where.incomes = { none: {} };
    where.expenses = { none: {} };
  }

  if (inactive2d) where.lastActive = { lte: subDays(new Date(), 2) };
  if (inactive7d) where.lastActive = { lte: subDays(new Date(), 7) };

  if (onboarded === false) where.onboarded = false;
  if (noPWA === true) where.isPWAInstalled = false;
  if (specificEmail) where.email = specificEmail;

  return where;
}

export async function getUnsubscribedEmails(): Promise<string[]> {
  const unsubscribed = await prisma.unsubscribe.findMany({ select: { email: true } });
  return unsubscribed.map((u) => u.email);
}

/**
 * Resolves the exact, deliverable audience (matched users that have both an id
 * and an email). Also reports how many matched users were skipped from the
 * preview because they are unsubscribed, so the UI can disclose exclusions.
 */
export async function resolveAudience(
  filter: RecipientFilter | null | undefined
): Promise<RecipientAudience> {
  const unsubscribedEmails = await getUnsubscribedEmails();
  const where = buildRecipientWhere(filter, unsubscribedEmails);

  const matched = await prisma.user.findMany({
    where,
    select: { id: true, email: true },
  });

  const deliverable = matched.filter((u) => Boolean(u.id && u.email));

  return {
    count: deliverable.length,
    excludedUnsubscribed: unsubscribedEmails.length,
    filter: filter ?? {},
  };
}
