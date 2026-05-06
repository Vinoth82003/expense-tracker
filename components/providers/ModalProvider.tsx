"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface AlertOptions {
  title: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: () => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ isOpen: true, options, resolve });
    });
  };

  const alert = (options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setAlertState({ isOpen: true, options, resolve });
    });
  };

  const handleConfirmAction = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState({ ...confirmState, isOpen: false });
      setTimeout(() => setConfirmState(null), 300); // Wait for animation
    }
  };

  const handleAlertClose = () => {
    if (alertState) {
      alertState.resolve();
      setAlertState({ ...alertState, isOpen: false });
      setTimeout(() => setAlertState(null), 300);
    }
  };

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}

      <AnimatePresence>
        {confirmState?.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#161B27] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-2xl ${confirmState.options.danger ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-500'}`}>
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {confirmState.options.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                    {confirmState.options.message}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => handleConfirmAction(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {confirmState.options.cancelText || "Cancel"}
                </button>
                <button
                  onClick={() => handleConfirmAction(true)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                    confirmState.options.danger 
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                      : "bg-teal-500 hover:bg-teal-600 shadow-teal-500/20"
                  }`}
                >
                  {confirmState.options.confirmText || "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {alertState?.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#161B27] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <button 
                onClick={handleAlertClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex flex-col items-center text-center mt-2">
                <div className={`p-4 rounded-3xl mb-4 ${
                  alertState.options.type === 'error' ? 'bg-red-500/10 text-red-500' : 
                  alertState.options.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                  alertState.options.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-teal-500/10 text-teal-500'
                }`}>
                  {alertState.options.type === 'error' && <AlertCircle size={32} />}
                  {alertState.options.type === 'success' && <CheckCircle2 size={32} />}
                  {alertState.options.type === 'warning' && <AlertCircle size={32} />}
                  {(!alertState.options.type || alertState.options.type === 'info') && <Info size={32} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {alertState.options.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-3 leading-relaxed max-w-[250px]">
                  {alertState.options.message}
                </p>
                <button
                  onClick={handleAlertClose}
                  className="w-full mt-8 px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
                >
                  Okay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}
