"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastsProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function Toasts({ toasts, onClose }: ToastsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
          >
            <div className={`
              flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md
              ${toast.type === "success" ? "bg-success/10 border-success/20 text-success" : 
                toast.type === "error" ? "bg-error/10 border-error/20 text-error" : 
                "bg-surface/80 border-border-subtle text-foreground"}
            `}>
              <div className="shrink-0">
                {toast.type === "success" && <CheckCircle2 size={20} />}
                {toast.type === "error" && <AlertCircle size={20} />}
                {toast.type === "info" && <Info size={20} />}
              </div>
              <p className="font-bold text-sm flex-1">{toast.message}</p>
              <button 
                onClick={() => onClose(toast.id)}
                className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
