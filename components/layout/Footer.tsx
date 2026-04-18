"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  X,
  Globe,
  Link as LinkIcon,
  Heart,
  ArrowUpRight,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "AI Analysis", href: "/login" },
    { label: "Mobile App", href: "/#cta" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "FAQ", href: "/faq" },
    { label: "Status", href: "#" },
    { label: "Open Source", href: "https://github.com/Vinoth82003" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact Us", href: "/contact" },
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
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-primary-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline mb-8 group w-fit"
            >
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <TrendingUp size={24} color="white" strokeWidth={2.5} />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-black text-3xl text-foreground tracking-tighter">
                  Spend<span className="text-primary-600">Wise</span>
                </span>
                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] -mt-1">
                  Premium Finance
                </span>
              </div>
            </Link>
            <p className="text-secondary text-lg leading-relaxed max-w-sm mb-10 font-medium">
              Join 10,000+ users tracking their financial journey with India's most powerful personal expense manager.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, scale: 1.1, backgroundColor: "var(--bg-surface)" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-2xl bg-surface-variant/50 border border-border-subtle flex items-center justify-center text-secondary hover:text-primary-600 hover:border-primary-500/30 transition-all shadow-sm"
                >
                  <Icon size={20} />
                  <span className="sr-only">{label}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], idx) => (
            <div key={category} className="space-y-8">
              <h3 className="text-foreground font-black text-sm uppercase tracking-widest">
                {category}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href as string)}
                      className="text-secondary hover:text-primary-600 font-bold text-sm flex items-center gap-2 group transition-all"
                    >
                      <span>{link.label}</span>
                      {link.href.startsWith("http") && (
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info Column */}
          <div className="space-y-8">
            <h3 className="text-foreground font-black text-sm uppercase tracking-widest">
              Contact
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-variant/50 border border-border-subtle flex items-center justify-center text-primary-600 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted uppercase">Email Us</span>
                  <a href="mailto:support@spendwise.app" className="text-sm font-bold text-secondary hover:text-primary-600 transition-colors">
                    support@spendwise.app
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-variant/50 border border-border-subtle flex items-center justify-center text-primary-600 shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted uppercase">Location</span>
                  <span className="text-sm font-bold text-secondary">
                    Tamil Nadu, India
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 text-sm font-black text-muted uppercase tracking-widest">
              <span>© {currentYear} SpendWise</span>
              <span className="w-1 h-1 rounded-full bg-border-subtle" />
              <span className="flex items-center gap-1.5">
                Built with <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" /> by Vinoth
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted/60 uppercase tracking-tighter">
              A Premium Personal Finance Solution • Standard Rupee (₹) Formatting Enabled
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 items-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant flex items-center justify-center text-[10px] font-black first:bg-indigo-500 first:text-white">
                  {i === 1 ? "V" : i === 2 ? "S" : i === 3 ? "A" : "+"}
                </div>
              ))}
              <span className="ml-4 text-xs font-black text-secondary">Join 10k+ users</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
