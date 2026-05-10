import { User } from "@prisma/client";

export interface GroupMemberData {
  id: string;
  userId: string;
  groupId: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED";
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

export interface GroupData {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMemberData[];
  expenses: GroupExpenseData[];
}

export type SplitType = "equal" | "count" | "custom";

export interface ExpenseSplitData {
  id?: string;
  userId: string;
  amount: number;
  splitType: SplitType;
  count?: number | null;
  user?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface GroupExpenseData {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  date: Date;
  paidById: string;
  status: "PENDING" | "PARTIAL" | "PAID";
  splits: ExpenseSplitData[];
  paidBy?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt: Date;
}

export interface MemberBalance {
  userId: string;
  name: string | null;
  email: string;
  avatar: string | null;
  totalOwed: number; // How much this person owes to the group
  totalPaid: number; // How much this person has paid for the group
  netBalance: number; // totalOwed - totalPaid (positive means they owe money, negative means they are owed money)
  borderColor: string;
}

export interface GroupBalanceSummary {
  groupId: string;
  totalGroupExpenses: number;
  memberBalances: MemberBalance[];
}
