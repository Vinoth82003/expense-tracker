"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, TrendingUp, ChevronRight, Download, ArrowUp } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Docs", href: "/docs" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) : 0;
      setScrollProgress(scrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes("#")) {
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-violet-500 origin-left z-[60]"
        style={{ scaleX: scrollProgress }}
        initial={{ scaleX: 0 }}
      />
      <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" } as const}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled 
          ? "py-3 shadow-lg border-border-subtle" 
          : "py-4 border-border-subtle/50"
      )}
      style={{
        backgroundColor: "rgba(var(--bg-surface-rgb), 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <nav className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline group"
          id="navbar-logo"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-lg"
          >
            <TrendingUp size={22} color="white" strokeWidth={2.5} />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl leading-none text-foreground tracking-tight">
              Spend<span className="text-primary-600">Wise</span>
            </span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5 opacity-60">
              Personal Finance
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                pathname === link.href 
                  ? "text-primary-600 bg-surface-variant" 
                  : "text-secondary hover:text-primary-600 hover:bg-surface-variant"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/download"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-variant border border-border-subtle text-foreground font-bold text-sm hover:bg-border-subtle transition-all"
            >
              <Download size={16} />
              Download App
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm shadow-indigo-600/20 shadow-xl hover:opacity-90 transition-all"
            >
              Get Started
              <ChevronRight size={16} strokeWidth={3} />
            </Link>
          </motion.div>
        </div>

        {/* Mobile: Theme toggle + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-surface-variant transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
    </motion.header>

    {/* Mobile Menu Drawer (Right-side slide-in) */}
    <AnimatePresence>
      {isMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:hidden"
          />

          {/* Slide-in Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[101] w-[80vw] max-w-[360px] bg-surface shadow-2xl border-l border-border-subtle flex flex-col md:hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 no-underline"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                  <TrendingUp size={16} color="white" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-lg text-foreground tracking-tight">
                  Spend<span className="text-primary-600">Wise</span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-secondary hover:bg-surface-variant hover:text-foreground transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 text-base font-bold transition-all border-b border-border-subtle/40",
                      pathname === link.href 
                        ? "text-primary-600 bg-surface-variant" 
                        : "text-secondary hover:text-primary-600 hover:bg-surface-variant"
                    )}
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={16} className="opacity-40" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Action Buttons (Footer of drawer) */}
            <div className="p-5 border-t border-border-subtle bg-surface-variant/30 flex flex-col gap-3">
              <Link
                href="/download"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-surface-variant border border-border-subtle text-foreground font-bold text-base transition-all hover:bg-border-subtle"
              >
                <Download size={18} />
                Download App
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-base shadow-indigo-600/10 shadow-lg transition-all hover:opacity-95"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 p-3 sm:p-4 rounded-full bg-primary-600 text-white shadow-xl shadow-primary-600/30 hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all"
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
