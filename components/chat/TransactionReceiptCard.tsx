"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, TrendingUp } from "lucide-react";

export interface OperationItem {
  kind: "EXPENSE" | "INCOME" | "BUDGET_UPDATE";
  amount: number;
  category?: string;
  subcategory?: string;
  source?: string;
  note?: string;
  date?: string;
}

export function TransactionReceiptCard({ operations }: { operations: OperationItem[] }) {
  if (!operations || !operations.length) return null;

  const totalExpense = operations
    .filter((o) => o.kind === "EXPENSE")
    .reduce((sum, o) => sum + o.amount, 0);

  const totalIncome = operations
    .filter((o) => o.kind === "INCOME")
    .reduce((sum, o) => sum + o.amount, 0);

  const netImpact = totalIncome - totalExpense;

  return (
    <div className="mt-2.5 rounded-2xl bg-surface-variant/90 border border-border-subtle p-3 space-y-2 text-left shadow-sm">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Recorded Transactions ({operations.length})
        </span>
      </div>

      <div className="space-y-1.5">
        {operations.map((op, idx) => {
          const isExpense = op.kind === "EXPENSE";
          const isIncome = op.kind === "INCOME";
          const isBudget = op.kind === "BUDGET_UPDATE";

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border-subtle/70"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isExpense
                      ? "bg-rose-500/10 text-rose-500"
                      : isIncome
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-indigo-500/10 text-indigo-500"
                  }`}
                >
                  {isExpense ? (
                    <ArrowDownRight size={15} />
                  ) : isIncome ? (
                    <ArrowUpRight size={15} />
                  ) : (
                    <TrendingUp size={15} />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-foreground truncate">
                    {op.subcategory || op.source || (isBudget ? "Monthly Budget" : "Transaction")}
                  </p>
                  <p className="text-[9px] font-semibold text-muted truncate">
                    {isExpense ? `${op.category || "Needs"} • ` : ""}{op.note || op.date || "Today"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span
                  className={`text-xs font-black ${
                    isExpense
                      ? "text-rose-500"
                      : isIncome
                      ? "text-emerald-500"
                      : "text-indigo-500"
                  }`}
                >
                  {isExpense ? "-" : isIncome ? "+" : ""}₹{op.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {operations.length > 1 && (totalExpense > 0 || totalIncome > 0) && (
        <div className="flex items-center justify-between pt-1.5 px-1 border-t border-border-subtle/50 text-[10px] font-bold">
          <span className="text-muted">Net Cashflow Impact</span>
          <span className={netImpact >= 0 ? "text-emerald-500 font-black" : "text-rose-500 font-black"}>
            {netImpact >= 0 ? "+" : "-"}₹{Math.abs(netImpact).toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  );
}
