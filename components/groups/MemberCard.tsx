"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Minus } from "lucide-react";
import { MemberBalance } from "@/types/group";

interface MemberCardProps {
  balance: MemberBalance;
}

export default function MemberCard({ balance }: MemberCardProps) {
  const isPositive = balance.netBalance > 0;
  const isNegative = balance.netBalance < 0;
  const isSettled = Math.abs(balance.netBalance) < 0.01;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`p-6 rounded-[2rem] border transition-all glass ${
        isPositive 
          ? "border-green-500/30 bg-green-500/5 shadow-lg shadow-green-500/5" 
          : isNegative 
            ? "border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5"
            : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-xl">
            {balance.avatar ? (
              <img src={balance.avatar} alt={balance.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black">{(balance.name || "U").charAt(0)}</span>
            )}
          </div>
          {/* Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface shadow-lg ${
            isPositive ? "bg-green-500 text-white" : isNegative ? "bg-red-500 text-white" : "bg-gray-500 text-white"
          }`}>
            {isPositive ? <ArrowDownLeft size={12} strokeWidth={3} /> : isNegative ? <ArrowUpRight size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-black tracking-tight">{balance.name || "Unknown User"}</h4>
          <p className="text-xs text-secondary font-bold uppercase tracking-widest">{balance.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Net Balance</p>
            <p className={`text-2xl font-black tracking-tighter ${
              isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-secondary"
            }`}>
              ₹{Math.abs(balance.netBalance).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Status</p>
             <p className={`text-xs font-black px-3 py-1 rounded-full ${
               isPositive ? "bg-green-500/10 text-green-500" : isNegative ? "bg-red-500/10 text-red-500" : "bg-white/10 text-secondary"
             }`}>
               {isPositive ? "Owes Money" : isNegative ? "Is Owed" : "Settled"}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-secondary/60">Total Paid</p>
            <p className="text-sm font-black">₹{balance.totalPaid.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-secondary/60">Total Share</p>
            <p className="text-sm font-black">₹{balance.totalOwed.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
