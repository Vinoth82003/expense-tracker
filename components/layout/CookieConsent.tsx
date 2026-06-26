"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Check, X } from "lucide-react";
import Script from "next/script";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local storage for consent
    const consent = localStorage.getItem("cookie-consent");
    if (consent === "accepted") {
      setHasConsent(true);
    } else if (consent === "declined") {
      setHasConsent(false);
    } else {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setHasConsent(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setHasConsent(false);
    setShowBanner(false);
  };

  return (
    <>
      {/* Dynamic script injection for Google Analytics if consent is granted */}
      {hasConsent && process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = function() { window.dataLayer.push(arguments); };
              window.gtag('js', new Date());
              window.gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[9999] bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-6 shadow-2xl shadow-black/40 flex flex-col gap-4"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center text-primary-500 shrink-0">
                <Cookie size={24} className="animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  Cookie Preference
                  <span className="text-[10px] font-black text-primary-600 bg-primary-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    GDPR
                  </span>
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  We use cookies to measure site activity and improve your budget tracking experience. See our{" "}
                  <a href="/privacy" className="text-primary-600 hover:underline font-semibold">
                    Privacy Policy
                  </a>{" "}
                  for details.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={handleDecline}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-variant/30 text-secondary hover:text-foreground font-semibold text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <X size={14} />
                Decline All
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <Check size={14} />
                Accept All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
