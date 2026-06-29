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

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-surface border-t border-border-subtle overflow-hidden"
          >
            <div className="p-5 flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "flex px-4 py-3 rounded-xl text-lg font-bold transition-all",
                      pathname === link.href 
                        ? "text-primary-600 bg-surface-variant" 
                        : "text-secondary hover:text-primary-600 hover:bg-surface-variant"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-4 border-t border-border-subtle flex flex-col gap-3"
              >
                <Link
                  href="/download"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-surface-variant border border-border-subtle text-foreground font-bold text-lg"
                >
                  <Download size={20} />
                  Download App
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-lg"
                >
                  Get Started Free
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>

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
