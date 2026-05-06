"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PublicMaintenanceBanner() {
  const pathname = usePathname();

  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: "",
  });

  // Hide banner on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  useEffect(() => {
    fetch("/api/system/status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.maintenance?.enabled) {
          setMaintenance({
            enabled: true,
            message:
              data.maintenance.message ||
              "We are currently undergoing maintenance. Certain features might be limited.",
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <AnimatePresence>
      {maintenance.enabled && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="fixed z-[1000] top-18 bg-amber-500/10 border-b border-amber-500/20 w-full overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-start sm:items-center gap-3">
            <AlertTriangle
              className="text-amber-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />

            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              <span className="uppercase tracking-widest text-xs font-black mr-2">
                Maintenance Mode
              </span>

              {maintenance.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}