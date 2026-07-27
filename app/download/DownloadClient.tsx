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
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

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
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const isWindows = os === "windows";

  /* ── MOBILE / TABLET VIEW ── */
  if (deviceType === "mobile" || deviceType === "tablet") {
    return (
      <>
        <Navbar />
        <main className="overflow-x-hidden" id="main-content">
          {/* Hero */}
          <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
            <div className="max-w-7xl mx-auto text-center space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary"
              >
                <Smartphone size={12} className="text-primary-500" />
                Mobile
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[36px] md:text-[48px] font-bold leading-[1.1] tracking-tight text-foreground max-w-3xl mx-auto"
              >
                SpendWise{" "}
                <span className="text-primary-600">on the go.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[15px] text-secondary max-w-xl mx-auto leading-relaxed"
              >
                Install our Progressive Web App for a native-like experience
                with offline support and zero App Store friction.
              </motion.p>

              {deferredPrompt && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={handlePwaInstall}
                  className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-primary-600 text-white text-[16px] font-bold shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[52px]"
                >
                  <Download size={18} />
                  Install App Now
                </motion.button>
              )}
            </div>
          </section>

          <Separator />

          {/* Installation Steps */}
          <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
            <div className="max-w-[600px] mx-auto space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
                  Installation{" "}
                  <span className="text-primary-600">Guide</span>
                </h2>
                <p className="text-[15px] text-secondary leading-relaxed">
                  Follow these steps to install SpendWise on your device.
                </p>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-2 p-1 bg-surface-variant rounded-xl">
                <button
                  onClick={() => setActiveTab("ios")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-[13px] transition ${
                    activeTab === "ios"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Apple size={16} />
                  iOS (Safari)
                </button>
                <button
                  onClick={() => setActiveTab("android")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-[13px] transition ${
                    activeTab === "android"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Globe size={16} />
                  Android (Chrome)
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  {activeTab === "ios"
                    ? [
                        { step: "1", title: "Open in Safari", desc: "Make sure you are using Safari browser on your iPhone or iPad." },
                        { step: "2", title: "Tap the Share button", desc: "It's located at the bottom of your screen on iPhone." },
                        { step: "3", title: 'Select "Add to Home Screen"', desc: "Scroll down the share menu to find this option." },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/60 border border-border-subtle/50">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-600 text-[13px] font-bold">{s.step}</div>
                          <div>
                            <p className="font-bold text-[14px] text-foreground">{s.title}</p>
                            <p className="text-[13px] text-secondary mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))
                    : [
                        { step: "1", title: "Open in Google Chrome", desc: "Use Chrome for the best installation experience on Android." },
                        { step: "2", title: "Tap the Menu (3 dots)", desc: "Located in the top right corner of the browser." },
                        { step: "3", title: 'Select "Install App"', desc: "Follow the prompt to add SpendWise to your home screen." },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl bg-surface-variant/60 border border-border-subtle/50">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-600 text-[13px] font-bold">{s.step}</div>
                          <div>
                            <p className="font-bold text-[14px] text-foreground">{s.title}</p>
                            <p className="text-[13px] text-secondary mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          <Separator />

          {/* Why PWA */}
          <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
            <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Always Up to Date", desc: "Updates happen seamlessly in the background." },
                { icon: WifiOff, title: "Offline Ready", desc: "View and add transactions even without internet." },
                { icon: Smartphone, title: "Zero Storage Hog", desc: "Takes up barely any space on your device." },
              ].map((f, i) => (
                <div key={i} className="rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 mb-5">
                    <f.icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-[13px] text-secondary font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  /* ── DESKTOP VIEW ── */
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden" id="main-content">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Copy */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Version 1.0.0
              </div>

              <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
                The ultimate{" "}
                <span className="text-primary-600">desktop tracker.</span>
              </h1>

              <p className="text-[15px] md:text-[17px] text-secondary leading-relaxed max-w-[480px]">
                Experience unparalleled speed and native integration. SpendWise
                Desktop puts your finances at your fingertips.
              </p>
            </motion.div>

            {/* Right: Download Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >
              <div className="rounded-2xl border border-border-subtle bg-surface shadow-xl overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[20px] font-bold text-foreground">
                        Windows OS
                      </h3>
                      <p className="text-[13px] text-muted flex items-center gap-1.5 mt-1">
                        <Laptop size={13} /> Detected Platform
                      </p>
                    </div>
                    <Monitor className="text-muted" size={40} />
                  </div>

                  {isWindows ? (
                    <div className="space-y-4">
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-primary-600 text-white rounded-full font-bold text-[15px] shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Downloading...
                          </>
                        ) : downloaded ? (
                          <>
                            <CheckCircle size={18} />
                            Download Complete
                          </>
                        ) : (
                          <>
                            <Download size={18} />
                            Download for Windows
                          </>
                        )}
                      </button>

                      <AnimatePresence>
                        {downloading && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2"
                          >
                            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-secondary font-medium">
                              <span>
                                {progress > 0 ? `${progress}%` : "Preparing..."}
                              </span>
                              <span>{downloadSpeed}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-variant/60 rounded-xl border border-border-subtle text-center">
                      <p className="text-[13px] text-secondary">
                        It looks like you're not on Windows. You can still
                        download the installer.
                      </p>
                      <button
                        onClick={handleDownload}
                        className="mt-3 w-full py-2.5 bg-surface rounded-xl hover:bg-surface-variant transition font-bold text-[13px] border border-border-subtle"
                      >
                        Download Anyway
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Separator />

        {/* ═══════════ PLATFORM CARDS ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Apple, name: "macOS", status: "Coming Q3 2026" },
              { icon: Terminal, name: "Linux", status: "Coming Q4 2026" },
            ].map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border-subtle bg-surface-variant/40 p-6 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                  <p.icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground">
                    {p.name}
                  </h3>
                  <p className="text-[13px] text-muted">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ═══════════ FEATURES ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Native performance leveraging your hardware for instant load times.",
              },
              {
                icon: WifiOff,
                title: "Offline First",
                desc: "Add expenses without connection. Syncs automatically when online.",
              },
              {
                icon: Bell,
                title: "Native Alerts",
                desc: "System-level notifications for budget limits and reminders.",
              },
              {
                icon: Shield,
                title: "Secure Storage",
                desc: "Local encryption keeps your financial data strictly private.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-lg hover:border-primary-500/20 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 mb-5">
                  <f.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-[13px] text-secondary font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ═══════════ ACCORDIONS ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[700px] mx-auto space-y-4">
            <div className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
              <button
                onClick={() => setSysReqOpen(!sysReqOpen)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-[15px] text-foreground hover:bg-surface-variant/40 transition-colors"
              >
                System Requirements
                {sysReqOpen ? (
                  <ChevronUp size={18} className="text-muted" />
                ) : (
                  <ChevronDown size={18} className="text-muted" />
                )}
              </button>
              <AnimatePresence>
                {sysReqOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 text-[13px] text-secondary space-y-2 border-t border-border-subtle mt-2 pt-4">
                      <p>
                        <strong className="text-foreground">OS:</strong> Windows
                        10 (64-bit) or later
                      </p>
                      <p>
                        <strong className="text-foreground">Processor:</strong>{" "}
                        1.5 GHz dual-core or faster
                      </p>
                      <p>
                        <strong className="text-foreground">Memory:</strong> 4
                        GB RAM minimum
                      </p>
                      <p>
                        <strong className="text-foreground">Storage:</strong>{" "}
                        250 MB available space
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
              <button
                onClick={() => setChangelogOpen(!changelogOpen)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-[15px] text-foreground hover:bg-surface-variant/40 transition-colors"
              >
                Release Notes (v1.0.0)
                {changelogOpen ? (
                  <ChevronUp size={18} className="text-muted" />
                ) : (
                  <ChevronDown size={18} className="text-muted" />
                )}
              </button>
              <AnimatePresence>
                {changelogOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 text-[13px] text-secondary space-y-2 border-t border-border-subtle mt-2 pt-4">
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
        </section>

        <Separator />

        {/* ═══════════ CTA ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-5">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Prefer <span className="text-primary-600">mobile?</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[460px] mx-auto">
              Install SpendWise as a PWA on your phone for the same experience
              with offline support.
            </p>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View Mobile Install Guide
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
