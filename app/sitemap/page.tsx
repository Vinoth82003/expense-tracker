import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Metadata } from "next";
import {
  Home,
  Info,
  HelpCircle,
  BookOpen,
  Mail,
  Activity,
  Shield,
  FileText,
  LayoutDashboard,
  Coins,
  TrendingUp,
  Users,
  Brain,
  Settings,
  Bell,
  Lock,
  Compass,
  Download,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sitemap | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Navigate through the full page directory, help guides, documentation articles, and user dashboard paths of SpendWise.",
  robots: "index, follow",
};

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

export default async function SitemapPage() {
  let dbDocs: any[] = [];
  try {
    dbDocs = await prisma.doc.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { id: true, title: true, slug: true, category: true },
    });
  } catch (error) {
    console.error("Failed to load database docs for sitemap page:", error);
  }

  const publicRoutes = [
    { label: "Home Page", href: "/", desc: "Main landing page and overview of SpendWise.", icon: Home },
    { label: "Features", href: "/features", desc: "Deep dive into budget limits, categories, and tracking.", icon: Compass },
    { label: "How It Works", href: "/how-it-works", desc: "Tutorial on onboarding, PWA setup, and syncing.", icon: Info },
    { label: "FAQs", href: "/faq", desc: "Answers to pricing, security, data export, and PWA questions.", icon: HelpCircle },
    { label: "Download App", href: "/download", desc: "Install the SpendWise PWA on your Android, iOS, or desktop device.", icon: Download },
    { label: "Contact Us", href: "/contact", desc: "Get in touch with support or submit user feedback.", icon: Mail },
    { label: "System Status", href: "/status", desc: "Real-time health indicator of database, API, and app servers.", icon: Activity },
  ];

  const compareRoutes = [
    { label: "SpendWise vs Walnut", href: "/compare/spendwise-vs-walnut", desc: "Compare SpendWise with Walnut (axio) for UPI expense tracking.", icon: TrendingUp },
    { label: "SpendWise vs ET Money", href: "/compare/spendwise-vs-et-money", desc: "Compare SpendWise with ET Money for personal finance management.", icon: TrendingUp },
    { label: "50/30/20 Budget Calculator", href: "/tools/50-30-20-budget-calculator", desc: "Free calculator to split your income into Needs, Wants, and Savings.", icon: Coins },
  ];

  const legalRoutes = [
    { label: "Privacy Policy", href: "/privacy", desc: "Detailed terms on how your personal data is handled and encrypted.", icon: Shield },
    { label: "Terms of Service", href: "/terms", desc: "Governing rules and usage conditions for using SpendWise.", icon: FileText },
  ];

  const portalRoutes = [
    { label: "Sign In", href: "/login", desc: "Access your account via secure Google OAuth or credentials.", icon: Lock },
    { label: "User Onboarding", href: "/onboarding", desc: "Initial questionnaire to tailor monthly limits.", icon: HelpCircle },
    { label: "Dashboard", href: "/dashboard", desc: "Visual center for monthly spending, remaining balance, and limits.", icon: LayoutDashboard },
    { label: "Expenses Manager", href: "/expenses", desc: "Track, categorize, search, and upload receipts for expenses.", icon: Coins },
    { label: "Income Tracker", href: "/income", desc: "Log monthly income streams and track cash inflows.", icon: TrendingUp },
    { label: "Group Splitting", href: "/groups", desc: "Create groups, split shared bills, and track settlements.", icon: Users },
    { label: "AI Analysis & Reports", href: "/reports", desc: "AI-generated financial audits identifying wasteful spending.", icon: Brain },
    { label: "Notifications", href: "/notifications", desc: "Budget breach alerts, updates, and system activity logs.", icon: Bell },
    { label: "Settings", href: "/settings", desc: "Manage your email presets, custom categories, and profile details.", icon: Settings },
  ];

  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary">
              <Compass size={12} className="text-primary-500" />
              Site Index
            </div>

            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
              Sitemap <span className="text-primary-600">Directory</span>
            </h1>

            <p className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed">
              Browse through all sections, active user guides, and application
              tools available on the SpendWise platform.
            </p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ PUBLIC PAGES ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                <Compass size={20} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground">
                Public Website
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group flex gap-4 p-4 rounded-2xl hover:bg-surface-variant/40 border border-transparent hover:border-border-subtle transition-all duration-300"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-variant/80 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center text-secondary transition-all">
                    <route.icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary-600 transition-colors text-[14px]">
                      {route.label}
                    </h3>
                    <p className="text-[12px] text-secondary font-medium mt-1 leading-normal">
                      {route.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════════ APP PORTAL ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                <Lock size={20} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground">
                App Portal & Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portalRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group flex gap-4 p-4 rounded-2xl hover:bg-surface/60 border border-transparent hover:border-border-subtle transition-all duration-300"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-surface/80 group-hover:bg-violet-500 group-hover:text-white flex items-center justify-center text-secondary transition-all">
                    <route.icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground group-hover:text-violet-600 transition-colors text-[14px]">
                        {route.label}
                      </h3>
                      {route.href !== "/login" &&
                        route.href !== "/onboarding" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-warning/10 text-warning text-[9px] font-semibold uppercase tracking-wider">
                            Secure
                          </span>
                        )}
                    </div>
                    <p className="text-[12px] text-secondary font-medium mt-1 leading-normal">
                      {route.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════════ COMPARISONS & TOOLS ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground">
                Comparisons & Free Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {compareRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group p-5 rounded-2xl bg-surface-variant/20 border border-border-subtle hover:border-amber-500/30 hover:bg-surface-variant/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-semibold uppercase tracking-wider">
                      {route.href.includes("/tools/")
                        ? "Free Tool"
                        : "Comparison"}
                    </span>
                    <h3 className="font-bold text-foreground group-hover:text-amber-600 transition-colors text-[14px] pt-1">
                      {route.label}
                    </h3>
                    <p className="text-[12px] text-secondary font-medium leading-normal">
                      {route.desc}
                    </p>
                  </div>
                  <div className="text-[12px] font-semibold text-secondary group-hover:text-amber-600 flex items-center gap-1 mt-4 transition-colors">
                    View{" "}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════════ DOCUMENTATION ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <BookOpen size={20} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground">
                Product Documentation
              </h2>
            </div>

            {dbDocs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/docs/${doc.slug}`}
                    className="group p-5 rounded-2xl bg-surface/40 border border-border-subtle hover:border-emerald-500/30 hover:bg-surface/60 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold uppercase tracking-wider">
                        {doc.category || "General"}
                      </span>
                      <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors text-[14px] pt-1">
                        {doc.title}
                      </h3>
                    </div>
                    <div className="text-[12px] font-semibold text-secondary group-hover:text-emerald-600 flex items-center gap-1 mt-4 transition-colors">
                      Read Guide{" "}
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-surface/40 border border-dashed border-border-subtle text-center text-secondary font-medium text-[14px]">
                No active guides are currently published. Browse our general
                features page for guidelines.
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* ═══════════ LEGAL ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600">
                <Shield size={20} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground">
                Legal & Compliance
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {legalRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group flex gap-4 p-4 rounded-2xl hover:bg-surface-variant/40 border border-transparent hover:border-border-subtle transition-all duration-300"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-variant/80 group-hover:bg-slate-700 group-hover:text-white flex items-center justify-center text-secondary transition-all">
                    <route.icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-slate-700 transition-colors text-[14px]">
                      {route.label}
                    </h3>
                    <p className="text-[12px] text-secondary font-medium mt-1 leading-normal">
                      {route.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
