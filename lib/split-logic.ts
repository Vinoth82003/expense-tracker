/**
 * Split Calculation Utilities
 */

export type SplitType = "equal" | "count" | "custom";

interface SplitMember {
  userId: string;
  count?: number;
  customAmount?: number;
}

export interface SplitResult {
  userId: string;
  amount: number;
}

/**
 * Calculates equal splits among members.
 * Handles rounding by adjusting the last member's amount.
 */
export function calculateEqualSplit(totalAmount: number, memberIds: string[]): SplitResult[] {
  if (memberIds.length === 0) return [];
  
  const perPerson = Math.floor((totalAmount / memberIds.length) * 100) / 100;
  const results: SplitResult[] = memberIds.map((id) => ({
    userId: id,
    amount: perPerson,
  }));

  // Adjust for rounding
  const calculatedTotal = results.reduce((sum, r) => sum + r.amount, 0);
  const diff = Math.round((totalAmount - calculatedTotal) * 100) / 100;
  
  if (diff !== 0) {
    results[results.length - 1].amount = Math.round((results[results.length - 1].amount + diff) * 100) / 100;
  }

  return results;
}

/**
 * Calculates splits based on "counts" (portions).
 */
export function calculateCountSplit(totalAmount: number, members: { userId: string; count: number }[]): SplitResult[] {
  const totalCounts = members.reduce((sum, m) => sum + m.count, 0);
  if (totalCounts === 0) return [];

  const results: SplitResult[] = members.map((m) => ({
    userId: m.userId,
    amount: Math.floor(((totalAmount / totalCounts) * m.count) * 100) / 100,
  }));

  // Adjust for rounding
  const calculatedTotal = results.reduce((sum, r) => sum + r.amount, 0);
  const diff = Math.round((totalAmount - calculatedTotal) * 100) / 100;

  if (diff !== 0) {
    // Add the difference to the member with the largest count (to minimize impact)
    const largestIndex = members.reduce((maxIdx, m, idx) => m.count > members[maxIdx].count ? idx : maxIdx, 0);
    results[largestIndex].amount = Math.round((results[largestIndex].amount + diff) * 100) / 100;
  }

  return results;
}

/**
 * Redistributes the remaining amount when one member's custom amount is changed.
 * Members in lockedUserIds will not have their amounts changed.
 */
export function redistributeCustomSplit(
  totalAmount: number, 
  members: { userId: string; amount: number }[], 
  changedUserId: string, 
  newAmount: number,
  lockedUserIds: string[] = []
): SplitResult[] {
  const results = [...members];
  const changedIdx = results.findIndex(m => m.userId === changedUserId);
  if (changedIdx === -1) return results;

  results[changedIdx].amount = newAmount;

  // Members who can be adjusted: not the one who just changed, and not locked
  const adjustableMembers = results.filter((m) => 
    m.userId !== changedUserId && !lockedUserIds.includes(m.userId)
  );

  if (adjustableMembers.length === 0) {
    // If no one else can be adjusted, we might have a discrepancy
    // But we'll let the rounding logic or validation handle it
    return results;
  }

  // Calculate what's already spoken for (changed user + locked users)
  const spokenForAmount = results
    .filter(m => m.userId === changedUserId || lockedUserIds.includes(m.userId))
    .reduce((sum, m) => sum + m.amount, 0);

  const remainingToDistribute = Math.max(0, totalAmount - spokenForAmount);
  
  const distributed = calculateEqualSplit(remainingToDistribute, adjustableMembers.map(m => m.userId));
  
  distributed.forEach(d => {
    const idx = results.findIndex(r => r.userId === d.userId);
    if (idx !== -1) {
      results[idx].amount = d.amount;
    }
  });

  return results;
}
