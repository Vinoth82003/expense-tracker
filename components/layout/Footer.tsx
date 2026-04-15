"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  X,
  Globe,
  Link as LinkIcon,
  Mail,
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
    <footer className="bg-surface border-t border-border-subtle pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline mb-6 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp size={22} color="white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-2xl text-foreground tracking-tight">
                Spend<span className="text-primary-600">Wise</span>
              </span>
            </Link>
            <p className="text-secondary text-lg leading-relaxed max-w-sm mb-8">
              A beautifully simple personal finance manager. Track your daily
              expenses and reach your financial goals without the clutter.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.05 }}
                  className="w-11 h-11 rounded-xl bg-surface-variant border border-border-subtle flex items-center justify-center text-secondary hover:text-primary-600 hover:border-primary-600/30 shadow-sm transition-colors"
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-foreground font-bold text-lg mb-6 tracking-tight">
                {category}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-secondary hover:text-primary-600 flex items-center gap-1 group transition-colors"
                    >
                      {link.label}
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ArrowUpRight size={14} />
                      </motion.span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-border-subtle flex flex-col md:row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-muted text-sm font-medium flex items-center gap-1.5">
              © {currentYear} SpendWise. Crafted with{" "}
              <Heart size={14} className="text-red-500 fill-red-500" /> by
              <span className="text-foreground font-bold">Vinoth</span>
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
              className="text-muted hover:text-foreground text-sm flex items-center gap-2 transition-colors"
            >
              <LinkIcon size={16} />
              Vinoth S.
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
