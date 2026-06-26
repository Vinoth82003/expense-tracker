"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share,
  PlusSquare,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Globe,
  Monitor,
  Info,
  ChevronRight,
  Sparkles,
  Zap,
  Lock,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type PlatformType = "android" | "ios" | "desktop" | "other";

export function DownloadClient() {
  const { data: session } = useSession();
  const [platform, setPlatform] = useState<PlatformType>("other");
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<PlatformType>("android");

  // 1. Detect standalone mode, platform, and stashed prompt on mount
  useEffect(() => {
    // Check if running in standalone PWA mode
    const checkStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone);

    // Detect user platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    let detectedPlatform: PlatformType = "desktop";
    if (isIOS) {
      detectedPlatform = "ios";
    } else if (isAndroid) {
      detectedPlatform = "android";
    }

    setPlatform(detectedPlatform);
    setActiveTab(detectedPlatform);

    // Retrieve stashed prompt from layout script if available
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    // Bind event listeners for beforeinstallprompt stashing
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    // Bind event listener for PWA install completion
    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setIsStandalone(true);
      toast.success("SpendWise installed successfully! Open the app from your home screen.");
      
      // Track the download in the database (authenticated users)
      if (session?.user?.email) {
        fetch("/api/user/pwa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ installed: true }),
        })
        .then((res) => {
          if (!res.ok) console.error("Realtime tracking update failed");
        })
        .catch(console.error);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [session]);

  // 2. Trigger installation prompt
  const handleInstallClick = async () => {
    // If standalone is active, do nothing
    if (isStandalone) {
      toast("SpendWise is already installed and running!", { icon: "🎉" });
      return;
    }

    const prompt = deferredPrompt || (window as any).deferredPrompt;

    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log(`PWA prompt outcome: ${outcome}`);
        
        if (outcome === "accepted") {
          toast.success("Installing SpendWise...");
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;

          // Track the download in the database in real-time
          if (session?.user?.email) {
            await fetch("/api/user/pwa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ installed: true }),
            });
          }
        } else {
          toast("Installation cancelled", { icon: "ℹ️" });
        }
      } catch (err) {
        console.error("Installation prompt failed:", err);
        toast.error("Install prompt failed to trigger. Try using manual steps.");
      }
    } else {
      // Fallback instruction trigger
      if (platform === "ios") {
        toast("iOS requires manual install! Tap Share below then 'Add to Home Screen'.", {
          duration: 4000,
          icon: "📱",
        });
      } else {
        toast("Install prompt is not active. If it didn't open, use browser menu -> 'Install SpendWise'.", {
          duration: 5000,
          icon: "💡",
        });
      }
    }
  };

  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 min-h-screen bg-background relative overflow-hidden">
        {/* Background visual graphics */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full" />
        </div>

        {/* Core Hero Section */}
        <section className="px-5 md:px-10 max-w-4xl mx-auto mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/5 text-primary-600 text-[10px] font-black tracking-widest uppercase border border-primary-500/10 backdrop-blur-sm">
              <Smartphone size={12} /> Mobile First Experience
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-none">
              Download <br />
              <span className="text-primary-600">SpendWise App</span>
            </h1>

            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              Get the native application experience directly on your device. Works offline, loads instantly, and runs in fullscreen.
            </p>
          </motion.div>
        </section>

        {/* Standalone state or Download controller */}
        <section className="px-5 md:px-10 max-w-3xl mx-auto">
          {isStandalone || installSuccess ? (
            // App is already installed or runs in standalone PWA wrapper
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-[3rem] border-2 border-emerald-500/20 bg-emerald-500/5 text-center space-y-8 shadow-xl shadow-emerald-500/5"
            >
              <div className="w-20 h-20 rounded-[2.2rem] bg-emerald-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-foreground">SpendWise Installed!</h2>
                <p className="text-secondary font-medium max-w-md mx-auto">
                  You are viewing the site within standalone app mode or installation was successfully completed on this device.
                </p>
              </div>
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 text-white font-black text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Enter Dashboard <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          ) : (
            // Installation block
            <div className="space-y-12">
              {/* Install Action Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-8 md:p-12 rounded-[3rem] bg-surface border border-border-subtle shadow-xl relative overflow-hidden group text-center space-y-8"
              >
                {/* Visual glow decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-primary-500/5 blur-[100px] pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto">
                  <Download size={32} />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">One-Click Install</h2>
                  <p className="text-secondary font-medium max-w-md mx-auto text-sm">
                    Click the install button below to register SpendWise on your home screen or app launcher.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-10 py-4 rounded-xl bg-primary-600 text-white font-black text-base shadow-xl shadow-primary-600/20 hover:bg-primary-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Install SpendWise
                  </button>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-10 py-4 rounded-xl bg-surface-variant/50 border border-border-subtle text-secondary hover:text-foreground font-black text-base transition-all flex items-center justify-center gap-2"
                  >
                    Use Web Version <ArrowUpRight size={18} />
                  </Link>
                </div>

                {/* Status tip */}
                {!deferredPrompt && platform !== "ios" && (
                  <p className="text-xs text-secondary font-bold bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl max-w-md mx-auto flex items-start gap-2 text-left">
                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      If the installer does not trigger, please open your browser's menu (top-right three dots) and click <strong>'Install'</strong> or <strong>'Add to Home Screen'</strong>.
                    </span>
                  </p>
                )}
              </motion.div>

              {/* Step-by-Step Interactive Tabs */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Manual Install Guide</h3>
                  <p className="text-secondary text-sm font-medium">Select your device operating system to view instructions</p>
                </div>

                {/* Tabs selection */}
                <div className="flex justify-center gap-2 bg-surface-variant/30 p-1.5 rounded-2xl border border-border-subtle max-w-md mx-auto">
                  {(["android", "ios", "desktop"] as PlatformType[]).map((tab) => {
                    const LabelIcon = tab === "android" ? Globe : tab === "ios" ? Smartphone : Monitor;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-wider ${
                          activeTab === tab
                            ? "bg-primary-600 text-white shadow-md shadow-primary-600/10"
                            : "text-secondary hover:text-foreground"
                        }`}
                      >
                        <LabelIcon size={14} />
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Tabs Content */}
                <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-10 shadow-sm min-h-[300px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {activeTab === "ios" && (
                      <motion.div
                        key="ios-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-rose-500">
                          <Smartphone size={24} />
                          <h4 className="font-black text-lg">Apple iOS Safari Instructions</h4>
                        </div>
                        <p className="text-sm text-secondary font-medium leading-relaxed">
                          Apple iOS requires PWAs to be installed manually using the Safari Web Browser. App Store or third party browsers do not support direct PWA prompt events.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 font-black text-xs text-primary-600">1</div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Open Safari</p>
                              <p className="text-xs text-secondary mt-0.5">Ensure you are visiting this page using Safari.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 text-primary-600">
                              <Share size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Tap Share</p>
                              <p className="text-xs text-secondary mt-0.5">Tap the Safari Share button in the bottom navigation bar.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 text-primary-600">
                              <PlusSquare size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Add to Home Screen</p>
                              <p className="text-xs text-secondary mt-0.5">Scroll down the menu and tap 'Add to Home Screen'.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "android" && (
                      <motion.div
                        key="android-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-primary-600">
                          <Globe size={24} />
                          <h4 className="font-black text-lg">Google Android / Chrome Instructions</h4>
                        </div>
                        <p className="text-sm text-secondary font-medium leading-relaxed">
                          Android devices fully support automated installation prompts via Chrome, Edge, and other major browsers.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 font-black text-xs text-primary-600">1</div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Click 'Install SpendWise'</p>
                              <p className="text-xs text-secondary mt-0.5">Use the button above to launch the standard installer prompt.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 font-black text-xs text-primary-600">2</div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Verify Browser Menu</p>
                              <p className="text-xs text-secondary mt-0.5">If the button does not trigger, tap the three dots in your browser's top-right corner and select 'Install app'.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "desktop" && (
                      <motion.div
                        key="desktop-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-violet-600">
                          <Monitor size={24} />
                          <h4 className="font-black text-lg">Windows, macOS & Linux Instructions</h4>
                        </div>
                        <p className="text-sm text-secondary font-medium leading-relaxed">
                          PWAs can be loaded directly on desktop platforms, giving you a dedicated application window and offline tracking utilities.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 font-black text-xs text-primary-600">1</div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Install Button</p>
                              <p className="text-xs text-secondary mt-0.5">Click 'Install SpendWise' at the top of this page to activate the browser installer modal.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/30 border border-border-subtle">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-subtle shrink-0 font-black text-xs text-primary-600">2</div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Browser Address Bar Icon</p>
                              <p className="text-xs text-secondary mt-0.5">Alternatively, look at the right side of your browser's address bar. Click the monitor/down-arrow icon to install.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
