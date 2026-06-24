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
  Download
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sitemap | SpendWise",
  description: "Navigate through the full page directory, help guides, documentation articles, and user dashboard paths of SpendWise.",
  robots: "index, follow",
};

export default async function SitemapPage() {
  let dbDocs: any[] = [];
  try {
    dbDocs = await prisma.doc.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
      }
    });
  } catch (error) {
    console.error("Failed to load database docs for sitemap page:", error);
  }

  // Define static public routes
  const publicRoutes = [
    { label: "Home Page", href: "/", desc: "Main landing page and overview of SpendWise.", icon: Home },
    { label: "Features", href: "/features", desc: "Deep dive into budget limits, categories, and tracking.", icon: Compass },
    { label: "How It Works", href: "/how-it-works", desc: "Tutorial on onboarding, PWA setup, and syncing.", icon: Info },
    { label: "FAQs", href: "/faq", desc: "Answers to pricing, security, data export, and PWA questions.", icon: HelpCircle },
    { label: "Download App", href: "/download", desc: "Install the SpendWise PWA on your Android, iOS, or desktop device.", icon: Download },
    { label: "Contact Us", href: "/contact", desc: "Get in touch with support or submit user feedback.", icon: Mail },
    { label: "System Status", href: "/status", desc: "Real-time health indicator of database, API, and app servers.", icon: Activity },
  ];

  // Define legal and compliance routes
  const legalRoutes = [
    { label: "Privacy Policy", href: "/privacy", desc: "Detailed terms on how your personal data is handled and encrypted.", icon: Shield },
    { label: "Terms of Service", href: "/terms", desc: "Governing rules and usage conditions for using SpendWise.", icon: FileText },
  ];

  // Define portal / authenticated routes (indicated as secure/locked)
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

      <main className="pt-32 pb-24 min-h-screen bg-background relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full" />
        </div>

        {/* Hero Section */}
        <section className="px-5 md:px-10 max-w-5xl mx-auto mb-16 text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/5 text-primary-600 text-[10px] font-black tracking-widest uppercase border border-primary-500/10 backdrop-blur-sm">
              Site Index
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-none">
              Sitemap <br />
              <span className="text-primary-600">Directory</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              Browse through all sections, active user guides, and application tools available on the SpendWise platform.
            </p>
          </div>
        </section>

        {/* Sitemap Grid */}
        <section className="px-5 md:px-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. Public Pages */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                  <Compass size={20} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Public Website</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
                      <h3 className="font-bold text-foreground group-hover:text-primary-600 transition-colors text-sm">
                        {route.label}
                      </h3>
                      <p className="text-xs text-secondary font-medium mt-1 leading-normal">
                        {route.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2. App Portal Paths */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                  <Lock size={20} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">App Portal & Tools</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {portalRoutes.map((route) => (
                  <Link 
                    key={route.href} 
                    href={route.href}
                    className="group flex gap-4 p-4 rounded-2xl hover:bg-surface-variant/40 border border-transparent hover:border-border-subtle transition-all duration-300"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-variant/80 group-hover:bg-violet-500 group-hover:text-white flex items-center justify-center text-secondary transition-all">
                      <route.icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground group-hover:text-violet-600 transition-colors text-sm">
                          {route.label}
                        </h3>
                        {route.href !== "/login" && route.href !== "/onboarding" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-wider">
                            Secure
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary font-medium mt-1 leading-normal">
                        {route.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Documentation & Guides */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight font-outfit">Product Documentation & Help Guides</h2>
              </div>
              
              {dbDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dbDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/docs/${doc.slug}`}
                      className="group p-5 rounded-2xl bg-surface-variant/20 border border-border-subtle hover:border-emerald-500/30 hover:bg-surface-variant/40 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                          {doc.category || "General"}
                        </span>
                        <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors text-sm pt-1">
                          {doc.title}
                        </h3>
                      </div>
                      <div className="text-xs font-black text-secondary group-hover:text-emerald-600 flex items-center gap-1 mt-4 transition-colors">
                        Read Guide <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-surface-variant/20 border border-dashed border-border-subtle text-center text-secondary font-medium">
                  No active guides are currently published. Browse our general features page for guidelines.
                </div>
              )}
            </div>

            {/* 4. Legal Compliance */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600">
                  <Shield size={20} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Legal & Compliance</h2>
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
                      <h3 className="font-bold text-foreground group-hover:text-slate-700 transition-colors text-sm">
                        {route.label}
                      </h3>
                      <p className="text-xs text-secondary font-medium mt-1 leading-normal">
                        {route.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
