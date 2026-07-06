"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Laptop,
  Loader2,
  CheckCircle,
  Apple,
  Terminal,
  Monitor,
  Zap,
  Bell,
  WifiOff,
  Shield,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Share,
  PlusSquare,
  Globe,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const DOWNLOAD_URL =
  "https://github.com/Vinoth82003/expense-tracker/releases/download/Next.js/SpendWise.Setup.1.0.0.exe";

export default function DownloadClient() {
  const [os, setOs] = useState<string>("unknown");
  const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | "tablet">("desktop");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState("");
  const [sysReqOpen, setSysReqOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileOS, setMobileOS] = useState<"ios" | "android" | "unknown">("unknown");
  const [activeTab, setActiveTab] = useState<"ios" | "android">("android");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
      setDeviceType("tablet");
    } else if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos|skyfire|puffin|blazer|bolt|gobrowser|iris|maemo|semc|teashark|uzard)/.test(ua)) {
      setDeviceType("mobile");
    } else {
      setDeviceType("desktop");
    }

    if (ua.includes("win")) setOs("windows");
    else if (ua.includes("mac")) setOs("mac");
    else if (ua.includes("linux")) setOs("linux");

    if (/ipad|iphone|ipod/.test(ua)) {
      setMobileOS("ios");
      setActiveTab("ios");
    } else if (/android/.test(ua)) {
      setMobileOS("android");
      setActiveTab("android");
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleDownload = () => {
    setDownloading(true);

    const link = document.createElement("a");
    link.href = DOWNLOAD_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setDownloading(false);
    setDownloaded(true);
  };

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const isWindows = os === "windows";

  if (deviceType === "mobile" || deviceType === "tablet") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto space-y-12">
          {/* Mobile Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Smartphone size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              SpendWise on the Go
            </h1>
            <p className="text-lg text-secondary max-w-md mx-auto">
              Install our Progressive Web App for a native-like experience with offline support and zero App Store friction.
            </p>
            {deferredPrompt && (
              <button
                onClick={handlePwaInstall}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30"
              >
                <Download size={20} />
                Install App Now
              </button>
            )}
          </motion.div>

          {/* Installation Steps */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center text-foreground">Installation Guide</h2>
            <div className="flex gap-2 p-1 bg-surface-variant rounded-xl mb-8">
              <button
                onClick={() => setActiveTab("ios")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${activeTab === "ios" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                <Apple size={18} />
                iOS (Safari)
              </button>
              <button
                onClick={() => setActiveTab("android")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${activeTab === "android" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                <Globe size={18} />
                Android (Chrome)
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {activeTab === "ios" ? (
                  <>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">1</div>
                      <div>
                        <p className="font-medium text-foreground">Open in Safari</p>
                        <p className="text-sm text-secondary">Make sure you are using Safari browser on your iPhone or iPad.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">2</div>
                      <div>
                        <p className="font-medium flex items-center gap-2 text-foreground">Tap the Share button <Share size={16} className="text-blue-500" /></p>
                        <p className="text-sm text-secondary">It's located at the bottom of your screen on iPhone.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">3</div>
                      <div>
                        <p className="font-medium flex items-center gap-2 text-foreground">Select "Add to Home Screen" <PlusSquare size={16} className="text-blue-500" /></p>
                        <p className="text-sm text-secondary">Scroll down the share menu to find this option.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">1</div>
                      <div>
                        <p className="font-medium text-foreground">Open in Google Chrome</p>
                        <p className="text-sm text-secondary">Use Chrome for the best installation experience on Android.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">2</div>
                      <div>
                        <p className="font-medium text-foreground">Tap the Menu (3 dots)</p>
                        <p className="text-sm text-secondary">Located in the top right corner of the browser.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">3</div>
                      <div>
                        <p className="font-medium text-foreground">Select "Install App"</p>
                        <p className="text-sm text-secondary">Follow the prompt to add SpendWise to your home screen.</p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Why PWA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
              <Zap className="text-yellow-500 mb-4" size={24} />
              <h3 className="font-medium mb-2 text-foreground">Always Up to Date</h3>
              <p className="text-sm text-secondary">Updates happen seamlessly in the background.</p>
            </div>
            <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
              <WifiOff className="text-blue-500 mb-4" size={24} />
              <h3 className="font-medium mb-2 text-foreground">Offline Ready</h3>
              <p className="text-sm text-secondary">View and add transactions even without internet.</p>
            </div>
            <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
              <Smartphone className="text-purple-500 mb-4" size={24} />
              <h3 className="font-medium mb-2 text-foreground">Zero Storage Hog</h3>
              <p className="text-sm text-secondary">Takes up barely any space on your device.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Desktop View
  return (
    <>
      <Navbar />
      <main className="min-h-screen relative overflow-hidden pt-20" id="main-content">
        {/* Background glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Column: Hero & Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border-subtle text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Version 1.0.0
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 text-foreground">
                  The Ultimate <br />Desktop Tracker
                </h1>
                <p className="text-xl text-secondary max-w-md leading-relaxed">
                  Experience unparalleled speed and native integration. SpendWise Desktop puts your finances at your fingertips.
                </p>
              </div>

              <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Windows OS</h3>
                      <p className="text-muted text-sm mt-1 flex items-center gap-1">
                        <Laptop size={14} /> Detected Platform
                      </p>
                    </div>
                    <Monitor className="text-muted" size={48} />
                  </div>

                  {isWindows ? (
                    <div className="space-y-4">
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 text-white py-4 font-semibold hover:bg-indigo-700 transition-all disabled:opacity-80 disabled:cursor-not-allowed group"
                      >
                        {downloading ? (
                          <><Loader2 className="animate-spin text-white" size={24} /> Downloading...</>
                        ) : downloaded ? (
                          <><CheckCircle className="text-green-300" size={24} /> Download Complete</>
                        ) : (
                          <><Download size={24} className="group-hover:translate-y-1 transition-transform" /> Download for Windows</>
                        )}
                      </button>

                      <AnimatePresence>
                        {downloading && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-secondary font-medium">
                              <span>{progress > 0 ? `${progress}%` : "Preparing..."}</span>
                              <span>{downloadSpeed}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-variant rounded-2xl border border-border-subtle text-center text-secondary text-sm">
                      It looks like you're not on Windows. <br /> You can still download the installer.
                      <button onClick={handleDownload} className="mt-3 w-full py-2 bg-surface rounded-xl hover:bg-surface-variant transition shadow-sm border border-border-subtle">
                        Download Anyway
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-surface border border-border-subtle flex flex-col items-center justify-center text-center group hover:bg-surface-variant transition-colors">
                  <Apple size={28} className="text-muted mb-3 group-hover:text-foreground transition-colors" />
                  <h4 className="font-medium text-sm text-foreground">macOS</h4>
                  <span className="text-xs text-muted mt-1">Coming Q3 2026</span>
                </div>
                <div className="p-5 rounded-2xl bg-surface border border-border-subtle flex flex-col items-center justify-center text-center group hover:bg-surface-variant transition-colors">
                  <Terminal size={28} className="text-muted mb-3 group-hover:text-foreground transition-colors" />
                  <h4 className="font-medium text-sm text-foreground">Linux</h4>
                  <span className="text-xs text-muted mt-1">Coming Q4 2026</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Features & Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-surface border border-border-subtle hover:border-indigo-500/30 transition-colors">
                  <Zap className="text-indigo-500 mb-4" size={24} />
                  <h3 className="font-semibold mb-2 text-foreground">Lightning Fast</h3>
                  <p className="text-sm text-secondary">Native performance leveraging your hardware for instant load times.</p>
                </div>
                <div className="p-6 rounded-2xl bg-surface border border-border-subtle hover:border-purple-500/30 transition-colors">
                  <WifiOff className="text-purple-500 mb-4" size={24} />
                  <h3 className="font-semibold mb-2 text-foreground">Offline First</h3>
                  <p className="text-sm text-secondary">Add expenses without connection. Syncs automatically when online.</p>
                </div>
                <div className="p-6 rounded-2xl bg-surface border border-border-subtle hover:border-blue-500/30 transition-colors">
                  <Bell className="text-blue-500 mb-4" size={24} />
                  <h3 className="font-semibold mb-2 text-foreground">Native Alerts</h3>
                  <p className="text-sm text-secondary">System-level notifications for budget limits and reminders.</p>
                </div>
                <div className="p-6 rounded-2xl bg-surface border border-border-subtle hover:border-green-500/30 transition-colors">
                  <Shield className="text-green-500 mb-4" size={24} />
                  <h3 className="font-semibold mb-2 text-foreground">Secure Storage</h3>
                  <p className="text-sm text-secondary">Local encryption keeps your financial data strictly private.</p>
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-3">
                <div className="border border-border-subtle rounded-2xl bg-surface overflow-hidden">
                  <button
                    onClick={() => setSysReqOpen(!sysReqOpen)}
                    className="w-full flex items-center justify-between p-5 text-left font-medium text-foreground hover:bg-surface-variant transition-colors"
                  >
                    System Requirements
                    {sysReqOpen ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                  </button>
                  <AnimatePresence>
                    {sysReqOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 pt-0 text-sm text-secondary space-y-2 border-t border-border-subtle mt-2 pt-4">
                          <p><strong>OS:</strong> Windows 10 (64-bit) or later</p>
                          <p><strong>Processor:</strong> 1.5 GHz dual-core or faster</p>
                          <p><strong>Memory:</strong> 4 GB RAM minimum</p>
                          <p><strong>Storage:</strong> 250 MB available space</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border border-border-subtle rounded-2xl bg-surface overflow-hidden">
                  <button
                    onClick={() => setChangelogOpen(!changelogOpen)}
                    className="w-full flex items-center justify-between p-5 text-left font-medium text-foreground hover:bg-surface-variant transition-colors"
                  >
                    Release Notes (v1.0.0)
                    {changelogOpen ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                  </button>
                  <AnimatePresence>
                    {changelogOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 pt-0 text-sm text-secondary space-y-3 border-t border-border-subtle mt-2 pt-4">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Initial public release of SpendWise Desktop.</li>
                            <li>Seamless cloud syncing across all devices.</li>
                            <li>Added comprehensive expense categorization.</li>
                            <li>Introduced dark mode native support.</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}