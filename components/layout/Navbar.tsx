"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, TrendingUp, ChevronRight, ArrowUp } from "lucide-react";
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
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
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-surface border-b border-border-subtle transition-shadow duration-200",
          isScrolled && "shadow-sm"
        )}
      >
        <nav className="mx-auto max-w-7xl px-5 py-3 md:px-10 h-[72px] flex items-center justify-between">
          {/* ── Left: Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <TrendingUp size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Spend<span className="text-primary-600">Wise</span>
            </span>
          </Link>

          {/* ── Center: Nav Links (desktop) ── */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-md",
                  pathname === link.href
                    ? "text-primary-600"
                    : "text-secondary hover:text-primary-600"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right: Actions (desktop) ── */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle variant="navbar" />
            <Link
              href="/download"
              className="text-sm font-medium text-secondary hover:text-primary-600 transition-colors px-2 py-1"
            >
              Download
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Get Started
              <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* ── Mobile: Utility + Hamburger ── */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle variant="navbar" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-full border border-border-subtle flex items-center justify-center text-foreground hover:bg-surface-variant transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed top-[72px] left-0 right-0 z-[101] bg-surface border-b border-border-subtle shadow-lg lg:hidden"
            >
              <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "py-3 text-sm font-medium border-b border-border-subtle/50 transition-colors",
                      pathname === link.href
                        ? "text-primary-600"
                        : "text-secondary hover:text-primary-600"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-subtle">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Get Started
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Scroll-to-top FAB ── */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 p-3 sm:p-4 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
