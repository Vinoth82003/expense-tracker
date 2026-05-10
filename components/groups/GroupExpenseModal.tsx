"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, IndianRupee, FileText, Calendar, Loader2, Plus, ChevronDown, CheckCircle2, PieChart } from "lucide-react";
import toast from "react-hot-toast";
import SplitCalculator from "./SplitCalculator";
import { SplitResult, SplitType } from "@/lib/split-logic";
import { GroupMemberData, GroupExpenseData } from "@/types/group";

interface GroupExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMemberData[];
  onSuccess: () => void;
  editExpense?: GroupExpenseData | null;
}

export default function GroupExpenseModal({ 
  isOpen, 
  onClose, 
  groupId, 
  members, 
  onSuccess,
  editExpense 
}: GroupExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [splits, setSplits] = useState<SplitResult[]>([]);
  const [splitType, setSplitType] = useState<SplitType>("equal");

  useEffect(() => {
    if (isOpen) {
      if (editExpense) {
        setDescription(editExpense.description);
        setAmount(editExpense.amount.toString());
        setDate(new Date(editExpense.date).toISOString().split("T")[0]);
        setSplits(editExpense.splits.map(s => ({ userId: s.userId, amount: s.amount })));
        setSplitType(editExpense.splits[0]?.splitType as SplitType || "equal");
      } else {
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setSplits([]);
        setSplitType("equal");
      }
    }
  }, [isOpen, editExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return toast.error("Please enter a description");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Please enter a valid amount");
    if (splits.length === 0) return toast.error("Please select at least one member to split with");

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - parseFloat(amount)) > 0.05) {
      return toast.error("Split amounts must equal the total amount");
    }

    setLoading(true);
    try {
      const url = editExpense 
        ? `/api/expenses/${editExpense.id}` 
        : `/api/groups/${groupId}/expenses`;
      
      const method = editExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          date: new Date(date).toISOString(),
          splits: splits.map(s => ({
            userId: s.userId,
            amount: s.amount,
            splitType,
          })),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success(editExpense ? "Expense updated!" : "Expense added!");
        setTimeout(() => {
          onSuccess();
          onClose();
          setSubmitted(false);
        }, 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save expense");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="relative w-full sm:max-w-2xl bg-surface border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden glass max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <Plus size={20} />
                </div>
                <h3 className="text-xl font-black">{editExpense ? "Edit Shared Expense" : "Add Shared Expense"}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Amount Section */}
                  <div className="text-center">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary block mb-4">
                      How much was spent?
                    </label>
                    <div className="relative inline-flex items-center">
                       <IndianRupee size={32} className="text-primary-500 mr-2" />
                       <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent border-none text-5xl sm:text-6xl font-black tracking-tighter text-foreground p-0 focus:outline-none placeholder:text-white/20 w-[200px]"
                      />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                        <FileText size={18} />
                      </div>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What was it for?"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                        <Calendar size={18} />
                      </div>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>

                  {/* Split Calculator Integration */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                       <PieChart size={16} />
                       Splitting Logic
                     </h4>
                     <SplitCalculator 
                        totalAmount={parseFloat(amount) || 0}
                        members={members}
                        onSplitChange={(newSplits, newType) => {
                          setSplits(newSplits);
                          setSplitType(newType);
                        }}
                        initialSplits={editExpense ? editExpense.splits.map(s => ({ userId: s.userId, amount: s.amount })) : undefined}
                        initialSplitType={editExpense ? editExpense.splits[0]?.splitType as SplitType : "equal"}
                     />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 sticky bottom-0 bg-surface/80 backdrop-blur-md -mx-8 px-8 pb-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-foreground text-background rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <>
                          {editExpense ? "Update Expense" : "Add Shared Expense"}
                          <ChevronDown className="-rotate-90" size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-20 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-2xl font-black">{editExpense ? "Expense Updated!" : "Expense Added!"}</h4>
                  <p className="text-secondary font-medium">
                    The balances for all group members have been updated accordingly.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
