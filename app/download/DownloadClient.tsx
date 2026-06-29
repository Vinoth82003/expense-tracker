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
  ArrowUpRight,
  Laptop,
  Terminal,
  ShieldCheck,
  Cpu
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type DetailedOS = "windows" | "macos" | "linux" | "ios" | "android" | "other";

export function DownloadClient() {
  const { data: session } = useSession();
  const [detectedOS, setDetectedOS] = useState<DetailedOS>("other");
  const [activeTab, setActiveTab] = useState<DetailedOS>("windows");
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const checkStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone);

    // Detect user OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform.toLowerCase();
    
    let os: DetailedOS = "windows"; // Default recommendation

    if (/iphone|ipad|ipod/.test(userAgent)) {
      os = "ios";
    } else if (/android/.test(userAgent)) {
      os = "android";
    } else if (/mac/.test(platform) || /mac/.test(userAgent)) {
      os = "macos";
    } else if (/linux/.test(platform) || /linux/.test(userAgent)) {
      os = "linux";
    } else if (/win/.test(platform) || /win/.test(userAgent)) {
      os = "windows";
    }

    setDetectedOS(os);
    setActiveTab(os);

    // PWA Prompt handling
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setIsStandalone(true);
      toast.success("SpendWise PWA installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handlePWAInstall = async () => {
    const prompt = deferredPrompt || (window as any).deferredPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          toast.success("Installing SpendWise PWA...");
          setDeferredPrompt(null);
        }
      } catch (err) {
        toast.error("Install prompt failed to trigger.");
      }
    } else {
      toast("To install, use your browser's menu -> 'Install SpendWise'.", { icon: "💡" });
    }
  };

  const getOSDisplayName = (os: DetailedOS) => {
    switch (os) {
      case "windows": return "Windows";
      case "macos": return "macOS";
      case "linux": return "Linux";
      case "ios": return "iOS (iPhone/iPad)";
      case "android": return "Android";
      default: return "Desktop";
    }
  };

  // Mock download triggering
  const handleDownloadDesktopApp = (os: DetailedOS) => {
    toast.success(`Starting download for SpendWise desktop app for ${getOSDisplayName(os)}...`, {
      icon: "🚀",
      duration: 3000
    });
    // In production, this would link to the actual packaged executable
    // window.location.href = `/downloads/SpendWise-setup.${os === 'windows' ? 'exe' : os === 'macos' ? 'dmg' : 'AppImage'}`;
  };

  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 min-h-screen bg-background relative overflow-hidden">
        {/* Dynamic ambient backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/10 blur-[130px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 blur-[110px] rounded-full" />
        </div>

        {/* Hero Section */}
        <section className="px-5 md:px-10 max-w-4xl mx-auto mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-500 text-[11px] font-extrabold tracking-widest uppercase border border-primary-500/20 backdrop-blur-md">
              <Sparkles size={12} className="animate-pulse" /> Desktop & Mobile Native Apps
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-none">
              Experience <span className="text-primary-500">SpendWise</span> Anywhere
            </h1>

            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed opacity-90">
              Download native desktop clients with custom system frames, window management, and native PWA clients for your mobile devices.
            </p>
          </motion.div>
        </section>

        {/* Core Content Container */}
        <section className="px-5 md:px-10 max-w-5xl mx-auto space-y-16">
          
          {/* Dynamic Auto-Detection Notification Banner */}
          {detectedOS !== "other" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[2.5rem] bg-gradient-to-r from-primary-500/10 via-violet-500/5 to-transparent border border-primary-500/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg"
            >
              <div className="flex items-center gap-5 text-left">
                <div className="w-14 h-14 rounded-2xl bg-primary-500/20 text-primary-500 flex items-center justify-center shrink-0">
                  {detectedOS === "windows" || detectedOS === "macos" || detectedOS === "linux" ? (
                    <Laptop size={28} />
                  ) : (
                    <Smartphone size={28} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">Detected System</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground">
                    SpendWise for {getOSDisplayName(detectedOS)}
                  </h3>
                  <p className="text-xs text-secondary font-medium mt-1">
                    Get the most optimized version tailored perfectly for your device.
                  </p>
                </div>
              </div>

              <div>
                {detectedOS === "windows" || detectedOS === "macos" || detectedOS === "linux" ? (
                  <button
                    onClick={() => handleDownloadDesktopApp(detectedOS)}
                    className="px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-sm shadow-xl shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download Native App
                  </button>
                ) : (
                  <button
                    onClick={handlePWAInstall}
                    className="px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-sm shadow-xl shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <Smartphone size={18} />
                    Install Native PWA
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Selector Tabs for OS Options */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-foreground tracking-tight">Choose Your Platform</h2>
              <p className="text-secondary text-sm font-medium">Select any operating system to access downloads or guides</p>
            </div>

            {/* Premium Selector Buttons */}
            <div className="flex flex-wrap justify-center gap-2 bg-surface-variant/20 p-2 rounded-[2rem] border border-border-subtle max-w-2xl mx-auto backdrop-blur-md">
              {(["windows", "macos", "linux", "ios", "android"] as DetailedOS[]).map((os) => (
                <button
                  key={os}
                  onClick={() => setActiveTab(os)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-xs transition-all uppercase tracking-wider ${
                    activeTab === os
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                      : "text-secondary hover:text-foreground hover:bg-surface-variant/30"
                  }`}
                >
                  {os === "windows" && <Laptop size={14} />}
                  {os === "macos" && <Cpu size={14} />}
                  {os === "linux" && <Terminal size={14} />}
                  {os === "ios" && <Smartphone size={14} />}
                  {os === "android" && <Globe size={14} />}
                  {os}
                </button>
              ))}
            </div>

            {/* Dynamic Tab Pane Render */}
            <div className="bg-surface border border-border-subtle rounded-[3rem] p-8 md:p-12 shadow-xl min-h-[400px] flex flex-col justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  {/* Info Card */}
                  <div className="space-y-6 text-left">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest border border-primary-500/20">
                        {activeTab === "windows" || activeTab === "macos" || activeTab === "linux" ? "Desktop App" : "PWA App"}
                      </span>
                      {detectedOS === activeTab && (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="text-4xl font-black text-foreground leading-tight tracking-tight">
                      SpendWise for {getOSDisplayName(activeTab)}
                    </h3>

                    <p className="text-base text-secondary font-medium leading-relaxed">
                      {activeTab === "windows" && "Experience SpendWise natively on your PC. Supports quick launch from Taskbar, custom borders, local file cache, and background services."}
                      {activeTab === "macos" && "Engineered specifically to blend into the macOS workspace. Supports dock pinning, native frame actions, and optimal memory management."}
                      {activeTab === "linux" && "Run SpendWise smoothly across all distributions with our packaged AppImage bundle. Standard desktop integration and offline resources loaded by default."}
                      {activeTab === "ios" && "Access SpendWise on iOS devices with instant PWA setup. Add to your home screen directly from Safari with complete hardware acceleration."}
                      {activeTab === "android" && "Enjoy full mobile control. Receive background push notification sync, fast layout caching, and standalone offline-first ledger logs."}
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3 text-sm font-semibold text-secondary">
                        <ShieldCheck size={18} className="text-emerald-500" /> Safe & verified installation binary.
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-secondary">
                        <Zap size={18} className="text-amber-500" /> Full auto-update capability enabled.
                      </div>
                    </div>

                    <div className="pt-4">
                      {activeTab === "windows" || activeTab === "macos" || activeTab === "linux" ? (
                        <button
                          onClick={() => handleDownloadDesktopApp(activeTab)}
                          className="px-10 py-5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-base shadow-2xl shadow-primary-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                        >
                          <Download size={20} />
                          Download Installer
                        </button>
                      ) : (
                        <button
                          onClick={handlePWAInstall}
                          className="px-10 py-5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-base shadow-2xl shadow-primary-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                        >
                          <Smartphone size={20} />
                          Install PWA App
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Guide / Specs Card */}
                  <div className="p-8 rounded-[2rem] bg-surface-variant/30 border border-border-subtle space-y-6 text-left backdrop-blur-md">
                    <h4 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                      <Info size={18} className="text-primary-500" /> Setup & Specs
                    </h4>

                    {activeTab === "windows" && (
                      <div className="space-y-4 text-xs font-semibold text-secondary">
                        <p>1. Run the downloaded installer file <code className="text-primary-500 font-mono">SpendWise-setup.exe</code>.</p>
                        <p>2. Complete setup prompts on your Windows system.</p>
                        <p>3. Run SpendWise directly from your desktop or start menu.</p>
                        <div className="border-t border-border-subtle pt-4 space-y-1">
                          <p><strong className="text-foreground">Requirement:</strong> Windows 10 or later</p>
                          <p><strong className="text-foreground">Arch:</strong> x64, ARM64</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "macos" && (
                      <div className="space-y-4 text-xs font-semibold text-secondary">
                        <p>1. Download the file <code className="text-primary-500 font-mono">SpendWise-mac.dmg</code>.</p>
                        <p>2. Drag SpendWise to your <code className="text-foreground">Applications</code> folder.</p>
                        <p>3. Launch from Launchpad or Finder.</p>
                        <div className="border-t border-border-subtle pt-4 space-y-1">
                          <p><strong className="text-foreground">Requirement:</strong> macOS Big Sur (11.0) or later</p>
                          <p><strong className="text-foreground">Arch:</strong> Apple Silicon (M1/M2/M3) & Intel</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "linux" && (
                      <div className="space-y-4 text-xs font-semibold text-secondary">
                        <p>1. Fetch the binary <code className="text-primary-500 font-mono">SpendWise.AppImage</code>.</p>
                        <p>2. Set executable permission: <code className="text-primary-500 font-mono bg-surface p-1 rounded">chmod +x SpendWise.AppImage</code>.</p>
                        <p>3. Execute from terminal or files app.</p>
                        <div className="border-t border-border-subtle pt-4 space-y-1">
                          <p><strong className="text-foreground">Requirement:</strong> glibc 2.28 or later</p>
                          <p><strong className="text-foreground">Arch:</strong> x64</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "ios" && (
                      <div className="space-y-4 text-xs font-semibold text-secondary">
                        <p>1. Launch the default <code className="text-foreground">Safari Browser</code>.</p>
                        <p>2. Tap the browser's <strong className="text-foreground">Share</strong> icon at the bottom center.</p>
                        <p>3. Choose <strong className="text-foreground">Add to Home Screen</strong> from the listing options.</p>
                        <div className="border-t border-border-subtle pt-4 space-y-1">
                          <p><strong className="text-foreground">Requirement:</strong> iOS 14+ / iPadOS 14+</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "android" && (
                      <div className="space-y-4 text-xs font-semibold text-secondary">
                        <p>1. Use Google Chrome browser on your phone.</p>
                        <p>2. Click the <strong className="text-foreground">Install PWA App</strong> button on this card.</p>
                        <p>3. Tap the prompt to complete system integration.</p>
                        <div className="border-t border-border-subtle pt-4 space-y-1">
                          <p><strong className="text-foreground">Requirement:</strong> Android 8+ (Chrome / Edge recommended)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}
