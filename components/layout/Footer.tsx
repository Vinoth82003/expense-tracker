"use client";

import Link from "next/link";
import { TrendingUp, X, Globe, Link as LinkIcon } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

const footerGroups: Record<string, FooterLink[]> = {
  Product: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Download App", href: "/download" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "System Status", href: "/status" },
    { label: "50/30/20 Calculator", href: "/tools/50-30-20-budget-calculator" },
  ],
  Compare: [
    { label: "SpendWise vs Walnut", href: "/compare/spendwise-vs-walnut" },
    { label: "SpendWise vs ET Money", href: "/compare/spendwise-vs-et-money" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Sitemap", href: "/sitemap" },
  ],
};

const socialLinks = [
  { icon: X, href: "#", label: "Twitter" },
  { icon: Globe, href: "https://github.com/Vinoth82003", label: "GitHub" },
  { icon: LinkIcon, href: "https://linkedin.com/in/vinoth82003", label: "LinkedIn" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface border-t border-border-subtle">
      <div className="mx-auto max-w-7xl px-5 md:px-10 pt-20 pb-6">
        {/* ── 4-Column Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-10 mb-16">
          {/* Column 1: Brand */}
          <div className="space-y-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 no-underline w-fit"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <TrendingUp
                  size={18}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">
                Spend<span className="text-primary-600">Wise</span>
              </span>
            </Link>
            <p className="text-sm text-secondary leading-relaxed max-w-[260px]">
              The smart UPI expense tracker and budget manager built for India.
              Master every rupee with AI-powered insights.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-secondary hover:text-primary-600 hover:border-primary-500/30 transition-colors"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2–4: Link Groups */}
          {Object.entries(footerGroups).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-5">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom Sub-bar ── */}
        <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; {currentYear} SpendWise. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Built with 💖 by{" "}
            <i>
              <b>
                <a
                  href="https://vinoths.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 transition-colors"
                >
                  Vinoth S
                </a>
              </b>
            </i>
          </p>
        </div>
      </div>
    </footer>
  );
}
