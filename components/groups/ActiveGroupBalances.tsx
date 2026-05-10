"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ArrowUpRight, ArrowDownLeft, ChevronRight, Loader2, IndianRupee } from "lucide-react";
import Link from "next/link";
import { MemberBalance } from "@/types/group";

interface GroupSummary {
  groupId: string;
  groupName: string;
  balance: MemberBalance;
}

export default function ActiveGroupBalances() {
  const [summaries, setSummaries] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const res = await fetch("/api/groups/summary/balances");
      if (res.ok) {
        const data = await res.json();
        setSummaries(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 shadow-sm flex flex-col items-center justify-center h-full text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center text-primary-500">
          <Users size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black mb-2">Expense Groups</h3>
          <p className="text-sm text-secondary font-medium max-w-[200px]">
            Split bills and track shared expenses with friends.
          </p>
        </div>
        <Link 
          href="/groups" 
          className="px-6 py-3 bg-foreground text-background rounded-2xl font-black text-sm hover:scale-105 transition-all active:scale-95"
        >
          Create Group
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 shadow-sm flex flex-col h-full"
    >
       <div className="flex items-center justify-between mb-8">
         <h3 className="text-2xl font-black">Shared Balances</h3>
         <Link href="/groups" className="text-sm font-black text-primary-500 hover:text-primary-600 flex items-center gap-1.5 px-4 py-2 bg-primary-500/5 rounded-full transition-colors">
           All Groups <ChevronRight size={16} />
         </Link>
       </div>

       <div className="space-y-4 flex-1">
         {summaries.map((item) => {
           const isPositive = item.balance.netBalance > 0;
           const isNegative = item.balance.netBalance < 0;
           
           return (
             <Link key={item.groupId} href={`/groups/${item.groupId}`}>
               <motion.div
                 whileHover={{ x: 4 }}
                 className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between group cursor-pointer ${
                   isPositive ? "bg-green-500/5 border-green-500/10 hover:bg-green-500/10" : "bg-red-500/5 border-red-500/10 hover:bg-red-500/10"
                 }`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    }`}>
                      <Users size={22} />
                    </div>
                    <div>
                      <p className="font-black text-base truncate max-w-[120px]">{item.groupName}</p>
                      <p className="text-[10px] text-secondary font-black uppercase tracking-widest flex items-center gap-1">
                        {isPositive ? (
                          <>
                            <ArrowDownLeft size={10} className="text-green-500" />
                            You owe money
                          </>
                        ) : (
                          <>
                            <ArrowUpRight size={10} className="text-red-500" />
                            You are owed
                          </>
                        )}
                      </p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={`font-black text-xl tracking-tight ${isPositive ? "text-green-500" : "text-red-500"}`}>
                      ₹{Math.abs(item.balance.netBalance).toLocaleString()}
                    </p>
                 </div>
               </motion.div>
             </Link>
           );
         })}
       </div>

       <div className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-3 text-secondary">
             <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                <IndianRupee size={14} />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
               Settling shared debts can improve your <span className="text-foreground">financial score</span>.
             </p>
          </div>
       </div>
    </motion.div>
  );
}
