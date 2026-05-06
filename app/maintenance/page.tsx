"use client";

import { motion } from "framer-motion";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [message, setMessage] = useState("SpendWise is undergoing maintenance. We'll be back shortly.");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Optionally fetch message from localStorage if we passed it, or from API
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/system/status");
      const data = await res.json();
      if (data?.maintenance) {
        if (!data.maintenance.enabled) {
          router.push("/dashboard"); // Redirect back if maintenance is over
        } else if (data.maintenance.message) {
          setMessage(data.maintenance.message);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface border border-border-subtle rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 blur-3xl -ml-16 -mb-16 rounded-full" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
            <ShieldAlert size={40} className="text-amber-500" />
          </div>

          <h1 className="text-3xl font-black mb-3">System Maintenance</h1>
          <p className="text-secondary font-medium mb-8">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <button
              onClick={fetchStatus}
              disabled={isChecking}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 w-full"
            >
              <RefreshCw size={18} className={isChecking ? "animate-spin" : ""} />
              Check Status
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-variant text-foreground font-bold hover:bg-surface-variant/80 transition-colors w-full"
            >
              <Home size={18} />
              Homepage
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
