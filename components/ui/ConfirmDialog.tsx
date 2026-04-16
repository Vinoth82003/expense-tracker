"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ options, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-surface border border-border-subtle rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 pb-4 text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                options.variant === "danger" ? "bg-error/10 text-error" : "bg-primary-100 text-primary-600"
            }`}>
                {options.variant === "danger" ? <AlertTriangle size={32} /> : <Info size={32} />}
            </div>
          <h3 className="text-2xl font-black mb-3">{options.title}</h3>
          <p className="text-secondary font-bold">{options.message}</p>
        </div>
        
        <div className="p-8 pt-4 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-lg ${
              options.variant === "danger" 
                ? "bg-error text-white shadow-error/20" 
                : "bg-primary-500 text-white shadow-primary-500/20"
            }`}
          >
            {options.confirmText || "Confirm"}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl bg-surface-variant text-secondary font-bold hover:text-foreground transition-all"
          >
            {options.cancelText || "Cancel"}
          </button>
        </div>

        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-foreground hover:bg-surface-variant rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </motion.div>
    </div>
  );
}
