"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SystemStatusChecker() {
  const router = useRouter();
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/system/status");
        if (!res.ok) return;
        const data = await res.json();

        // 1. Maintenance Check
        if (data?.maintenance?.enabled) {
          router.push("/maintenance");
          return;
        }

        // 2. Suspension Check
        if (data?.userStatus?.isSuspended) {
          setIsSuspended(true);
          setSuspensionReason(data.userStatus.suspensionReason || "Violation of terms of service.");
        }
      } catch (error) {
        console.error("Failed to check system status:", error);
      }
    };

    checkStatus();
    // Poll every 30 seconds for immediate kickout
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <AnimatePresence>
      {isSuspended && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-md w-full bg-surface border border-error/20 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            
            <div className="w-20 h-20 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6 text-error">
              <ShieldAlert size={40} />
            </div>

            <h2 className="text-2xl font-black text-foreground mb-2">Account Suspended</h2>
            <p className="text-secondary font-medium mb-6">
              Your account has been temporarily suspended by an administrator.
            </p>

            <div className="bg-error/5 border border-error/10 rounded-xl p-4 mb-8 text-left">
              <span className="text-xs font-black text-error uppercase tracking-widest mb-1 block">Reason</span>
              <p className="text-sm font-bold text-foreground">"{suspensionReason}"</p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-error text-white font-bold hover:bg-error/90 transition-colors"
            >
              <LogOut size={18} />
              Logout Securely
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
