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
 */
export function redistributeCustomSplit(
  totalAmount: number, 
  members: { userId: string; amount: number }[], 
  changedUserId: string, 
  newAmount: number
): SplitResult[] {
  const results = [...members];
  const changedIdx = results.findIndex(m => m.userId === changedUserId);
  if (changedIdx === -1) return results;

  results[changedIdx].amount = newAmount;

  const otherMembers = results.filter((_, idx) => idx !== changedIdx);
  if (otherMembers.length === 0) return results;

  const remainingToDistribute = totalAmount - newAmount;
  
  // If remaining is negative, it's invalid but we handle it by setting others to 0 and adjusting the current?
  // Usually the UI prevents this, but let's be safe.
  if (remainingToDistribute < 0) {
    otherMembers.forEach(m => m.amount = 0);
    return results;
  }

  const distributed = calculateEqualSplit(remainingToDistribute, otherMembers.map(m => m.userId));
  
  distributed.forEach(d => {
    const idx = results.findIndex(r => r.userId === d.userId);
    results[idx].amount = d.amount;
  });

  return results;
}
