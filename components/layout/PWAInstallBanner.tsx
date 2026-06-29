'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other' | null>(null);
  const pathname = usePathname();

  // Detect platform once on mount
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }
  }, []);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Unified route-based show/hide logic
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const isDownloadPage = pathname === '/download';
    const isHomePage = pathname === '/';

    // /download page: ALWAYS show the banner (this is the dedicated install page)
    if (isDownloadPage) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Home page on FIRST EVER visit: show once, then mark as shown
    const hasSeenBanner = localStorage.getItem('pwa-banner-first-visit-shown');
    if (isHomePage && !hasSeenBanner) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const delay = isIOS ? 5000 : 2000;

      const timer = setTimeout(() => {
        setShowBanner(true);
        localStorage.setItem('pwa-banner-first-visit-shown', 'true');
      }, delay);

      return () => clearTimeout(timer);
    }

    // All other pages: hide the banner
    setShowBanner(false);
  }, [pathname]);

  // Custom event listener for manual trigger (e.g., from footer link)
  useEffect(() => {
    const showHandler = () => {
      setShowBanner(true);
    };
    window.addEventListener('showPwaInstall', showHandler);
    return () => window.removeEventListener('showPwaInstall', showHandler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    // Mark first visit as shown so it doesn't auto-appear on home page again
    localStorage.setItem('pwa-banner-first-visit-shown', 'true');
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999]"
        >
          <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-indigo-600/95 via-violet-600/95 to-indigo-700/95 shadow-2xl backdrop-blur-xl">
            {/* Decorative glow effects */}
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-300/10 blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
                {/* Left: Icon + Text */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-[15px] font-bold text-white leading-tight truncate">
                      Install SpendWise
                      <span className="hidden sm:inline text-white/70 font-medium ml-2">
                        — Full-screen experience & faster access
                      </span>
                    </p>

                    {platform === 'ios' && (
                      <p className="text-xs text-white/60 font-medium mt-0.5 hidden sm:block">
                        Tap <Share className="inline h-3 w-3 -mt-0.5" /> Share → Add to Home Screen <PlusSquare className="inline h-3 w-3 -mt-0.5" />
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {platform === 'ios' ? (
                    <button
                      onClick={handleDismiss}
                      className="rounded-lg bg-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white transition-all hover:bg-white/25 active:scale-[0.97]"
                    >
                      Got it
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleDismiss}
                        className="rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white/70 transition-all hover:text-white hover:bg-white/10 active:scale-[0.97]"
                      >
                        Later
                      </button>
                      <button
                        onClick={handleInstall}
                        className="rounded-lg bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-indigo-700 shadow-lg shadow-black/10 transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.97]"
                      >
                        Install
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close install banner"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
