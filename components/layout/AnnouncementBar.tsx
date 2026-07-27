"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";

const DISMISS_KEY = "spendwise-announcement-dismissed";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[60] w-full overflow-hidden border-b border-border-subtle bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10">
            <div className="flex items-center justify-between h-10 sm:h-11">
              {/* Left / Center content */}
              <div className="flex-1 flex items-center justify-center gap-2 text-center">
                <span className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold text-white/90">
                  <Sparkles size={14} className="text-yellow-300 shrink-0" />
                  <span className="hidden sm:inline">Introducing</span>
                  <span className="font-bold text-white">Sage AI</span>
                  <span className="text-white/70 hidden md:inline">— your intelligent financial assistant</span>
                  <span className="text-white/70 sm:hidden">— try it free</span>
                </span>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] sm:text-[12px] font-bold text-white transition-colors shrink-0"
                >
                  Try Now
                  <ArrowRight size={12} />
                </Link>
              </div>

              {/* Close button */}
              <button
                onClick={dismiss}
                className="shrink-0 ml-2 p-1 rounded-md text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Dismiss announcement"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
