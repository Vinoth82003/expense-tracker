import type { Metadata } from "next";
import Link from "next/link";
import {
  Percent,
  Wallet,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SiteBreadcrumbs } from "@/components/seo/SiteBreadcrumbs";
import { SITE_ORIGIN } from "@/lib/site-url";
import { breadcrumbJsonLd } from "@/components/seo/SiteBreadcrumbs";

export const metadata: Metadata = {
  title: "Free Financial Tools & Budget Calculators | SpendWise",
  description:
    "Free personal-finance calculators for India: the 50/30/20 budget split, a monthly salary budget, and an emergency fund planner — all in Indian Rupees (₹).",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "Free Financial Tools & Budget Calculators | SpendWise",
    description:
      "50/30/20 budget, salary budget, and emergency fund calculators — free for personal use, in Indian Rupees.",
    url: `${SITE_ORIGIN}/tools`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise free financial tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Financial Tools & Budget Calculators | SpendWise",
    description:
      "50/30/20 budget, salary budget, and emergency fund calculators — free for personal use, in Indian Rupees.",
    images: ["/og-images/og-home-dark.png"],
  },
};

const tools = [
  {
    href: "/tools/50-30-20-budget-calculator",
    icon: Percent,
    title: "50/30/20 Budget Calculator",
    description:
      "Split your monthly after-tax income into Needs, Wants, and Savings with adjustable percentages and Lakhs/Crores formatting.",
  },
  {
    href: "/tools/salary-budget-calculator",
    icon: Wallet,
    title: "Salary Budget Calculator",
    description:
      "Turn your take-home pay, fixed commitments, and savings goal into a daily spending allowance for the month.",
  },
  {
    href: "/tools/emergency-fund-calculator",
    icon: Shield,
    title: "Emergency Fund Calculator",
    description:
      "Estimate your safety-net corpus from essential monthly expenses and see the monthly saving needed to reach it.",
  },
];

const breadcrumbStructuredData = breadcrumbJsonLd(SITE_ORIGIN, [
  { name: "Home", path: "/" },
  { name: "Tools", path: "/tools" },
]);

const itemListStructuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SpendWise free financial tools",
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    url: `${SITE_ORIGIN}${tool.href}`,
  })),
};

export default function ToolsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListStructuredData) }}
      />
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        <section className="bg-surface-variant/40 py-10 md:py-16 px-5 md:px-10">
          <div className="max-w-[800px] mx-auto text-center space-y-5">
            <div className="flex justify-center">
              <SiteBreadcrumbs items={[{ label: "Tools" }]} />
            </div>
            <h1 className="text-[28px] md:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground">
              Free financial{" "}
              <span className="text-primary-600">tools.</span>
            </h1>
            <p className="text-[15px] md:text-[17px] text-secondary leading-relaxed max-w-xl mx-auto">
              Simple, deterministic calculators for Indian budgets — free for
              personal use, with every formula and limitation written down. No
              sign-up required.
            </p>
          </div>
        </section>

        <section className="bg-surface px-5 md:px-10 py-10 md:py-14">
          <div className="max-w-[800px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm hover:border-primary-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 mb-4">
                  <tool.icon size={18} />
                </div>
                <h2 className="text-[16px] font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-[14px] text-secondary leading-relaxed">
                  {tool.description}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-4 text-[14px] font-semibold text-primary-600">
                  Open calculator
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-surface-variant/40 px-5 md:px-10 py-10 md:py-14">
          <div className="max-w-[800px] mx-auto space-y-6">
            <h2 className="text-[24px] md:text-[30px] font-bold leading-tight text-foreground">
              Built to be checked, not trusted blindly.
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed">
              Every tool on this page uses a fixed formula documented in its
              methodology section, rounds results to whole rupees, and runs the
              same input to the same output every time. Inputs are processed in
              your browser — nothing you type is sent to a server or stored.
            </p>
            <p className="text-[15px] text-secondary leading-relaxed">
              Prefer tracking real spending over planning it?{" "}
              <Link
                href="/"
                className="text-primary-600 font-semibold hover:underline"
              >
                SpendWise
              </Link>{" "}
              records expenses, categorises them into Needs and Wants, and
              shows where your money actually went.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
