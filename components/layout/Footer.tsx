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
} from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Links: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Portfolio", href: "https://vinoths.vercel.app/" },
    { label: "Privacy", href: "#" },
  ],
  Contact: [
    { label: "Help Center", href: "#" },
    { label: "Status Page", href: "#" },
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
    if (href.startsWith("#") && href.length > 1) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-surface pt-20 pb-10 overflow-hidden">
      {/* Dynamic top border gradient */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline mb-6 group"
            >
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <TrendingUp size={24} color="white" strokeWidth={2.5} />
              </motion.div>
              <span className="font-extrabold text-3xl text-foreground tracking-tight">
                Spend<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Wise</span>
              </span>
            </Link>
            <p className="text-secondary text-lg leading-relaxed max-w-sm mb-8">
              A beautifully simple personal finance manager. Track your daily
              expenses and reach your financial goals without the clutter.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-2xl bg-surface-variant/80 border border-border-subtle flex items-center justify-center text-secondary hover:text-indigo-500 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 hover:bg-surface transition-all duration-300"
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="sr-only">{label}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], idx) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="text-foreground font-bold text-lg mb-6 tracking-tight">
                {category}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-secondary hover:text-foreground flex items-center gap-1 group transition-colors relative origin-left"
                    >
                      <span className="relative overflow-hidden">
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-indigo-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                      </span>
                      <motion.span
                        initial={{ opacity: 0, x: -5, y: 5 }}
                        whileHover={{ opacity: 1, x: 0, y: 0 }}
                        className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-all"
                      >
                        <ArrowUpRight size={14} strokeWidth={2.5} />
                      </motion.span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-muted text-sm font-medium flex items-center gap-1.5">
              © {currentYear} SpendWise. Crafted with{" "}
              <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" /> by
              <span className="text-foreground font-bold hover:text-indigo-500 transition-colors cursor-pointer">Vinoth</span>
            </p>
            <p className="text-muted text-xs">
              Based in India • Standard Rupee (₹) enabled
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://vinoths.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-surface-variant/50 text-secondary hover:text-foreground hover:bg-surface-variant text-sm flex items-center gap-2 border border-transparent hover:border-border-subtle transition-all font-medium"
            >
              <LinkIcon size={16} />
              Vinoth S.
            </a>
          </div>
        </div>
      </div>
      
      {/* Decorative large bottom glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
    </footer>
  );
}
