'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other' | null>(null);

  useEffect(() => {
    // 1. Detect platform and standalone mode
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

    // 2. Check if user already dismissed it
    const dismissed = localStorage.getItem('pwa-banner-dismissed-permanent');
    if (dismissed === 'true') return;

    // 3. Listen for beforeinstallprompt
    const handler = (e: any) => {
      // Prevent the browser's automatic prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 4. For iOS, we show the banner manually after a delay
    if (isIOS) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 5. Custom event listener to trigger banner
    const showHandler = () => setShowBanner(true);
    window.addEventListener('showPwaInstall', showHandler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('showPwaInstall', showHandler);
    };
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

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed-permanent', 'true');
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[9999]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl dark:bg-black/20">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-500/20 blur-3xl" />
            
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                <Download className="h-6 w-6" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Install SpendWise</h3>
                <p className="mt-1 text-sm text-secondary">
                  Install our app for a better, full-screen experience and faster access to your finances.
                </p>
                
                {platform === 'ios' ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-secondary bg-white/5 p-2 rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10">
                        <Share className="h-4 w-4" />
                      </div>
                      <span>Tap the <strong>Share</strong> button below</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-secondary bg-white/5 p-2 rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10">
                        <PlusSquare className="h-4 w-4" />
                      </div>
                      <span>Select <strong>'Add to Home Screen'</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={handleInstall}
                      className="flex-1 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-500 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Install App
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-secondary transition-all hover:bg-white/10"
                    >
                      Maybe Later
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleDismiss}
                className="absolute right-0 top-0 p-1 text-secondary/50 hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
