"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Hash, PieChart, Info, IndianRupee } from "lucide-react";
import { calculateEqualSplit, calculateCountSplit, redistributeCustomSplit, SplitResult, SplitType } from "@/lib/split-logic";
import { GroupMemberData } from "@/types/group";

interface SplitCalculatorProps {
  totalAmount: number;
  members: GroupMemberData[];
  onSplitChange: (splits: SplitResult[], splitType: SplitType) => void;
  initialSplits?: SplitResult[];
  initialSplitType?: SplitType;
}

export default function SplitCalculator({ 
  totalAmount, 
  members, 
  onSplitChange,
  initialSplits,
  initialSplitType = "equal"
}: SplitCalculatorProps) {
  const [splitType, setSplitType] = useState<SplitType>(initialSplitType);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialSplits ? initialSplits.map(s => s.userId) : members.map(m => m.userId)
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SplitResult[]>(initialSplits || []);
  const [lockedMemberIds, setLockedMemberIds] = useState<string[]>([]);

  // Initialize counts
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    members.forEach(m => {
      initialCounts[m.userId] = 1;
    });
    setCounts(initialCounts);
  }, [members]);

  // Recalculate whenever inputs change
  useEffect(() => {
    if (splitType === "custom") return; // Handled separately via manual input

    let newResults: SplitResult[] = [];

    if (splitType === "equal") {
      newResults = calculateEqualSplit(totalAmount, selectedMemberIds);
    } else if (splitType === "count") {
      const activeMembers = members
        .filter(m => selectedMemberIds.includes(m.userId))
        .map(m => ({ userId: m.userId, count: counts[m.userId] || 1 }));
      newResults = calculateCountSplit(totalAmount, activeMembers);
    }

    setResults(newResults);
    onSplitChange(newResults, splitType);
  }, [totalAmount, selectedMemberIds, splitType, counts]);

  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
        setLockedMemberIds(lockedMemberIds.filter(id => id !== userId));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleCountChange = (userId: string, value: number) => {
    setCounts(prev => ({ ...prev, [userId]: Math.max(1, value) }));
  };

  const handleCustomAmountChange = (userId: string, value: number) => {
    // When manually changing, lock this member so they aren't auto-adjusted later
    const newLocked = lockedMemberIds.includes(userId) 
      ? lockedMemberIds 
      : [...lockedMemberIds, userId];
    
    setLockedMemberIds(newLocked);

    const newResults = redistributeCustomSplit(
      totalAmount,
      results.map(r => ({ userId: r.userId, amount: r.amount })),
      userId,
      value,
      lockedMemberIds // Pass currently locked (excluding the one being changed)
    );
    setResults(newResults);
    onSplitChange(newResults, splitType);
  };

  const handleTypeChange = (newType: SplitType) => {
    setSplitType(newType);
    setLockedMemberIds([]); // Reset locks when changing type
    if (newType === "custom" && (results.length === 0 || splitType !== "custom")) {
      const initial = calculateEqualSplit(totalAmount, selectedMemberIds);
      setResults(initial);
      onSplitChange(initial, "custom");
    }
  };

  return (
    <div className="space-y-6">
      {/* Split Type Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-surface-variant rounded-2xl border border-white/5">
        {[
          { id: "equal", label: "Equal", icon: Users },
          { id: "count", label: "Count", icon: Hash },
          { id: "custom", label: "Custom", icon: PieChart },
        ].map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTypeChange(type.id as SplitType)}
              className={`py-3 rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                splitType === type.id
                  ? "bg-primary-500 text-white shadow-lg"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Member Selection & Input */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">
          {splitType === "equal" ? "Who's involved?" : "Adjust Splits"}
        </label>
        
        <div className="space-y-2">
          {members.map((member) => {
            const isSelected = selectedMemberIds.includes(member.userId);
            const isLocked = lockedMemberIds.includes(member.userId);
            const result = results.find(r => r.userId === member.userId);
            
            return (
              <motion.div
                key={member.userId}
                layout
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected ? "bg-white/5 border-primary-500/30" : "bg-transparent border-white/5 opacity-60"
                } ${isLocked && splitType === "custom" ? "ring-1 ring-primary-500/20" : ""}`}
              >
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleMember(member.userId)}>
                   <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden border border-white/10">
                     {member.user.avatar ? (
                       <img src={member.user.avatar} alt={member.user.name || "User"} className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-xs font-bold">{(member.user.name || "U").charAt(0)}</span>
                     )}
                   </div>
                   <div>
                     <p className="text-sm font-bold flex items-center gap-2">
                        {member.user.name || "Unknown User"}
                        {isLocked && splitType === "custom" && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-primary-500/10 text-primary-500 rounded-full uppercase font-black">Locked</span>
                        )}
                     </p>
                     {isSelected && result && (
                       <p className="text-xs text-primary-500 font-black">₹{result.amount.toFixed(2)}</p>
                     )}
                   </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2">
                    {splitType === "count" && (
                      <div className="flex items-center bg-surface-variant rounded-lg overflow-hidden border border-white/5">
                        <button 
                          type="button"
                          onClick={() => handleCountChange(member.userId, (counts[member.userId] || 1) - 1)}
                          className="px-3 py-1 hover:bg-white/5 text-secondary transition-colors"
                        >-</button>
                        <span className="px-2 text-xs font-black min-w-[2rem] text-center">{counts[member.userId] || 1}</span>
                        <button 
                          type="button"
                          onClick={() => handleCountChange(member.userId, (counts[member.userId] || 1) + 1)}
                          className="px-3 py-1 hover:bg-white/5 text-secondary transition-colors"
                        >+</button>
                      </div>
                    )}

                    {splitType === "custom" && (
                      <div className="relative max-w-[100px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                          <IndianRupee size={12} />
                        </div>
                        <input
                          type="number"
                          value={result?.amount || 0}
                          onChange={(e) => handleCustomAmountChange(member.userId, parseFloat(e.target.value) || 0)}
                          className={`w-full pl-7 pr-3 py-2 bg-surface-variant border border-white/10 rounded-xl text-xs font-black focus:outline-none focus:border-primary-500 ${isLocked ? "text-primary-500" : ""}`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-2xl flex gap-3">
        <Info size={18} className="text-primary-500 shrink-0 mt-0.5" />
        <p className="text-xs text-secondary leading-relaxed font-medium">
          {splitType === "equal" && "The total will be split equally among all selected members."}
          {splitType === "count" && "Portion-based splitting. Each 'count' represents one share of the total."}
          {splitType === "custom" && "Manually enter amounts. Adjusting one will automatically redistribute the remainder."}
        </p>
      </div>
    </div>
  );
}
