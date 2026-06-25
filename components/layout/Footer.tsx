"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  X,
  Globe,
  Link as LinkIcon,
  Heart,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  isAction?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Download App", href: "/download" },
    { label: "AI Analysis", href: "/login" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "FAQ", href: "/faq" },
    { label: "Share Feedback", href: "/contact" },
    { label: "System Status", href: "/status" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact Us", href: "/contact" },
    { label: "Sitemap", href: "/sitemap" },
  ],
};

const socialLinks = [
  { icon: X, href: "#", label: "Twitter" },
  { icon: Globe, href: "https://github.com/Vinoth82003", label: "GitHub" },
  {
    icon: LinkIcon,
    href: "https://linkedin.com/in/vinoth82003",
    label: "LinkedIn",
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.includes("#")) {
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="relative bg-surface pt-24 pb-12 overflow-hidden border-t border-border-subtle">
      {/* ━━ DECORATIVE ELEMENTS ━━ */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[300px] bg-primary-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-24">
          
          {/* ━ Column 1: Brand ━ */}
          <div className="lg:col-span-4 space-y-10">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline group w-fit"
            >
              <motion.div 
                whileHover={{ rotate: 90 }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <TrendingUp size={24} color="white" strokeWidth={2.5} />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-black text-3xl text-foreground tracking-tightest leading-none">
                  Spend<span className="text-primary-600">Wise</span>
                </span>
                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-0.5 opacity-60">
                  Forensic Finance
                </span>
              </div>
            </Link>
            
            <p className="text-secondary text-lg leading-relaxed font-medium max-w-sm">
              The precision-engineered finance tracker for the modern Indian economy. 
              Master every rupee with forensic AI insights.
            </p>

            <div className="flex items-center gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.05 }}
                  className="w-11 h-11 rounded-xl bg-surface-variant/50 border border-border-subtle flex items-center justify-center text-secondary hover:text-primary-600 hover:border-primary-500/30 transition-all shadow-sm"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>

            {/* Security Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border-subtle bg-surface-variant/30">
              <ShieldCheck size={18} className="text-success" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Data Security</span>
                <span className="text-[11px] font-black text-foreground">Bank-Grade Encryption</span>
              </div>
            </div>
          </div>

          {/* ━ Column 2, 3, 4: Links ━ */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-8">
                <h3 className="text-foreground font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500/40" />
                  {category}
                </h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.isAction ? (
                        <button
                          onClick={() => window.dispatchEvent(new Event('showPwaInstall'))}
                          className="text-secondary hover:text-primary-600 font-bold text-[13px] flex items-center gap-2 group transition-all text-left"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={(e) => handleNavClick(e, link.href)}
                          className="text-secondary hover:text-primary-600 font-bold text-[13px] flex items-center gap-2 group transition-all"
                        >
                          {link.label}
                          {link.href.startsWith("http") && (
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ━ Column 5: Contact ━ */}
          <div className="lg:col-span-3 space-y-10">
            <h3 className="text-foreground font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500/40" />
              Support
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-variant/30 border border-border-subtle group hover:border-primary-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                  <Mail size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest">Direct Mail</span>
                  <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@spendwise.app'}`} className="text-[13px] font-black text-secondary hover:text-primary-600 transition-colors">
                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@spendwise.app'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-variant/30 border border-border-subtle group hover:border-primary-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest">Base Operations</span>
                  <span className="text-[13px] font-black text-secondary">
                    Tamil Nadu, India
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━ BOTTOM BAR ━━━━ */}
        <div className="pt-10 border-t border-border-subtle flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Copyright Area */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-black text-foreground tracking-tight">© {currentYear} SpendWise</span>
              <div className="w-1 h-1 rounded-full bg-border-subtle" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant/50 border border-border-subtle">
                <Heart size={12} className="text-rose-500 fill-rose-500" />
                <span className="text-[11px] font-black text-secondary">
                  Built by <a href="https://vinoths.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Vinoth S</a>
                </span>
              </div>
            </div>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
              Premium Financial Intelligence • Rupee Tracking Optimized
            </p>
          </div>

          {/* Social Proof Area */}
          <div className="flex flex-col items-center lg:items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 items-center">
                {['V', 'S', 'A', 'K'].map((initial, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-surface bg-surface-variant flex items-center justify-center text-[11px] font-black shadow-sm"
                    style={{ 
                      backgroundColor: i === 0 ? '#6366f1' : 'var(--bg-surface-variant)',
                      color: i === 0 ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {initial}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-surface bg-primary-500 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
                  +10
                </div>
              </div>
              <div className="h-6 w-px bg-border-subtle mx-2" />
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-foreground">Join the elite</span>
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Active wealth trackers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tracking-tightest {
          letter-spacing: -0.06em;
        }
      `}</style>
    </footer>
  );
}
