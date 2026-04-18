"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-surface border border-border-subtle rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
          <WifiOff size={40} strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">You are offline</h2>
        <p className="text-secondary mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={20} />
          Reload Page
        </button>
      </div>
    </div>
  );
}
