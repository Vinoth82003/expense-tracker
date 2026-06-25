"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false); // Re-show banner when going offline again
    };
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-3 bg-amber-500 text-white shadow-lg"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <WifiOff size={16} />
        <span>You&apos;re offline — some features may be limited. Cached data is available.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw size={13} />
          Retry
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Dismiss offline notice"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

