import type { Metadata } from "next";
import Link from "next/link";
import { SITE_ORIGIN } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Press Kit | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Press and media kit for SpendWise — verified product facts, quick facts for journalists, media assets (logo, social card), and interview contact.",
  alternates: {
    canonical: "/press",
  },
  openGraph: {
    title: "Press Kit | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Verified facts and media assets for journalists covering SpendWise.",
    url: `${SITE_ORIGIN}/press`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise — AI-powered expense tracker for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Press Kit | SpendWise",
    description:
      "Verified facts and media assets for journalists covering SpendWise.",
    images: ["/og-images/og-home-dark.png"],
  },
};

// Every fact below is sourced from within the product (homepage, /features,
// /download, /contact, sitemap lastmod dates). Nothing is estimated.
const QUICK_FACTS: { key: string; value: string; source: string }[] = [
  {
    key: "Product",
    value: "SpendWise — an AI-powered expense tracker and budget manager for India",
    source: "Homepage",
  },
  {
    key: "Pricing",
    value: "Free for personal use",
    source: "Homepage / FAQ",
  },
  {
    key: "Platform",
    value: "Web app (PWA), installable on Android, iOS, and desktop browsers",
    source: "/download",
  },
  {
    key: "AI features",
    value: "Forensic financial analysis and natural-language chat via external AI (Google Gemini or Groq)",
    source: "/features",
  },
  {
    key: "Founder",
    value: "Vinoth S (public GitHub and LinkedIn profiles)",
    source: "Footer / site",
  },
  {
    key: "Guidance",
    value: "Free budgeting and expense-tracking guides (50/30/20, monthly budgeting, category insights)",
    source: "/docs",
  },
  {
    key: "Contact",
    value: "Use the contact page — press inquiries welcome",
    source: "/contact",
  },
];

const MEDIA_ASSETS: { label: string; path: string; note: string }[] = [
  {
    label: "App icon (SVG)",
    path: "/icon0.svg",
    note: "Vector app icon, 192×205 px viewport",
  },
  {
    label: "App icon (PNG)",
    path: "/icon1.png",
    note: "Raster app icon",
  },
  {
    label: "Social card (PNG)",
    path: "/og-images/og-home-dark.png",
    note: "1200×630 marketing card used for share previews",
  },
];

export default function PressPage() {
  return (
    <main className="bg-surface min-h-screen">
      <div className="mx-auto max-w-7xl px-5 md:px-10 pt-20 pb-10">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Press & Media
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            SpendWise Press & Media Kit
          </h1>
          <p className="mt-4 text-lg text-secondary leading-relaxed">
            Verified facts about SpendWise for journalists, analysts, and
            content creators. Every statement on this page is sourced from a
            live SpendWise surface — nothing is estimated.
          </p>
        </header>

        <section className="mt-14 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Product Overview</h2>
              <p className="mt-3 text-secondary leading-relaxed">
                SpendWise is a free expense tracker and budget manager built for
                India. Users log expenses and income with two-tier Needs/Wants
                categorization, set monthly budgets, and export their data at any
                time. A built-in AI layer — powered by external AI providers
                (Google Gemini or Groq) — produces forensic, action-oriented
                analysis of a person&apos;s spending, including anomaly detection,
                budget burn-rate forecasting with reallocation tips, and
                hypothetical stress-test scenarios. SpendWise runs as a
                Progressive Web App that can be installed on Android, iOS, and
                desktop browsers.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight">What&apos;s Inside</h2>
              <ul className="mt-4 grid gap-2 text-secondary">
                <li>Expense & income tracking with Needs/Wants categories and CSV export</li>
                <li>AI forensic analysis of spending patterns, anomalies, and forecasts</li>
                <li>Natural-language chat to add expenses and query budgets</li>
                <li>Monthly budget limits, reports, and savings-rate trends</li>
                <li>Shared groups, 2FA-secured login, and privacy controls</li>
                <li>Free guides: 50/30/20 budgeting, monthly budgeting, expense tracking</li>
              </ul>
              <p className="mt-3 text-sm text-muted">
                Full details with sources:{" "}
                <Link href="/features" className="text-primary-600 underline">
                  /features
                </Link>{" "}
                and{" "}
                <Link href="/docs" className="text-primary-600 underline">
                  /docs
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight">Media Assets</h2>
              <ul className="mt-4 space-y-3 text-secondary">
                {MEDIA_ASSETS.map(({ label, path: asset, note }) => (
                  <li key={asset} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link
                      href={asset}
                      className="text-primary-600 underline"
                    >
                      {label}
                    </Link>
                    <span className="text-sm text-muted">
                      {`${SITE_ORIGIN}${asset}`} — {note}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                Product screenshots are not published yet; request them via the
                contact page.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-2">
            <div className="rounded-2xl border border-border-subtle bg-background p-6">
              <h2 className="text-lg font-bold tracking-tight">Quick Facts</h2>
              <dl className="mt-4 divide-y divide-border-subtle">
                {QUICK_FACTS.map(({ key, value, source }) => (
                  <div key={key} className="py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {key}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{value}</dd>
                    <dd className="text-xs text-muted">Source: {source}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 rounded-2xl border border-border-subtle bg-background p-6">
              <h2 className="text-lg font-bold tracking-tight">Interviews & Contact</h2>
              <p className="mt-3 text-sm text-secondary leading-relaxed">
                For press inquiries, interviews with the founder, or
                verification requests, reach out through the official contact
                page — mention “Press” in your message.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Contact for press
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted leading-relaxed">
              SpendWise is in active development. For the most current verified
              facts — including release dates carried by the public sitemap —
              also see{" "}
              <Link href="/docs" className="text-primary-600 underline">
                /docs
              </Link>{" "}
              and{" "}
              <Link href="/faq" className="text-primary-600 underline">
                /faq
              </Link>
              .
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}