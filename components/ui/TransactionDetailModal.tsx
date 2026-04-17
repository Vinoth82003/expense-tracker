"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar, 
  Clock, 
  Tag, 
  FileText, 
  IndianRupee,
  CalendarCheck,
  Zap,
  ChevronRight
} from "lucide-react";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  type: "expense" | "income";
}

export function TransactionDetailModal({ isOpen, onClose, transaction, type }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isExpense = type === "expense";
  const amount = transaction.amount || 0;
  const title = isExpense ? transaction.subcategory : transaction.source;
  const category = transaction.category; // Only for expenses
  const note = transaction.note;
  const date = new Date(transaction.date);
  const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-10 inset-0 z-[100] max-h-[90vh] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[400px] bg-surface border border-border-subtle rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col"
          >
            {/* Top Drag handle (decorative) */}
            <div className="w-10 h-1 bg-border-subtle rounded-full mx-auto mb-8 shrink-0" />

            {/* Header Row */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-normal text-2xl shrink-0 ${
                  isExpense 
                    ? (category === "Needs" ? "bg-primary-50 text-primary-600" : "bg-tertiary-50 text-tertiary-600")
                    : "bg-success/10 text-success"
                }`}>
                  {title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight mb-1.5 truncate text-foreground">{title}</h2>
                  <div className="flex items-center gap-2">
                     {isExpense && (
                       <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                         category === "Needs" 
                           ? "bg-primary-50 text-primary-600" 
                           : "bg-tertiary-50 text-tertiary-600"
                       }`}>
                         {category}
                       </span>
                     )}
                     <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isExpense ? "bg-surface-variant text-secondary" : "bg-success/10 text-success"
                     }`}>
                       {isExpense ? "Expense" : "Income"}
                     </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full border-2 border-border-subtle flex items-center justify-center hover:bg-surface-variant transition-colors text-error shrink-0 group relative overflow-hidden"
              >
                <X size={14} className=" transition-opacity" />
              </button>
            </div>

            {/* Amount */}
            <div className="flex items-baseline gap-1.5 mb-8">
              <span className="text-base text-secondary font-medium">₹</span>
              <span className="text-5xl font-medium tracking-tighter text-foreground">{amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="h-px w-full bg-border-subtle" />

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 py-5">
              <div className="flex flex-col gap-1.5 pr-4 border-r border-border-subtle">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted">Date</span>
                <span className="text-sm font-medium text-foreground">
                  {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pl-5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted">Added At</span>
                <span className="text-sm font-medium text-foreground">
                  {createdAt ? createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : "—"}
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-border-subtle" />

            {/* Recorded On */}
            <div className="flex items-center gap-3 py-4">
              <FileText size={16} className="text-muted" />
              <span className="text-sm text-secondary font-medium">
                Recorded on {createdAt ? createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
              </span>
            </div>

            <div className="h-px w-full bg-border-subtle" />

            {/* Note Section */}
            <div className="flex flex-col gap-2 py-5 mb-4 max-h-[140px] overflow-y-auto custom-scrollbar">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-muted">Note</span>
              <p className="text-sm text-foreground leading-relaxed">
                {note || "No additional notes for this transaction."}
              </p>
            </div>

            {/* Done Button */}
            <div className="mt-auto">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-foreground text-background rounded-2xl font-medium text-base hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
