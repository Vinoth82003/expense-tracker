"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  ReceiptIndianRupee, 
  PieChart, 
  Settings, 
  User, 
  LogOut,
  Plus,
  TrendingUp,
  Menu,
  X,
  Sun,
  Moon,
  Banknote,
  LayoutGrid,
  Bell,
  BrainCog,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Users
} from "lucide-react";

import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { DashboardProvider } from "@/context/DashboardContext";

import { useTheme } from "@/components/providers/ThemeProvider";
import { ActivityTracker } from "@/components/activity/ActivityTracker";
import { SystemStatusChecker } from "@/components/layout/SystemStatusChecker";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { SuspendedOverlay } from "@/components/layout/SuspendedOverlay";
import { useModal } from "@/components/providers/ModalProvider";

const navGroups = [
  {
    title: "Intelligence",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Forensic Analysis", href: "/analyze", icon: BrainCog, premium: true },
      { name: "Visual Reports", href: "/reports", icon: PieChart },
    ]
  },
  {
    title: "Transactions",
    items: [
      { name: "Expenses", href: "/expenses", icon: ReceiptIndianRupee },
      { name: "Income", href: "/income", icon: Banknote },
      { name: "Category Map", href: "/settings/categories", icon: LayoutGrid },
    ]
  },
  // {
  //   title: "Community",
  //   items: [
  //     { name: "Expense Groups", href: "/groups", icon: Users },
  //   ]
  // },
  {
    title: "Preferences",
    items: [
      { name: "Announcements", href: "/notifications", icon: Bell },
      { name: "System Settings", href: "/settings", icon: Settings },
    ]
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { confirm } = useModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<any>({ aiAnalysis: true });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch("/api/system/status")
      .then(res => res.json())
      .then(data => {
        if (data?.featureFlags) {
          setFeatureFlags(data.featureFlags);
        }
      })
      .catch(console.error);

    const handleAppInstalled = () => {
      fetch("/api/user/pwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installed: true }),
      }).catch(console.error);
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      handleAppInstalled();
    }

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user && !(session.user as any).onboarded) {
      router.push("/onboarding");
      return;
    }
    if (status === "authenticated" && (session?.user as any)?.twoFactorEnabled) {
      const cookies = document.cookie.split(";").map((c) => c.trim());
      const is2faVerified = cookies.some((c) => c.startsWith("2fa_verified="));
      if (!is2faVerified) {
        router.push(`/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`);
      }
    }
  }, [session, status, router, pathname]);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: "Logout?",
      message: "Are you sure you want to end your session? You'll need to log in again to access your forensic insights.",
      confirmText: "Logout",
      danger: true
    });

    if (isConfirmed) {
      signOut({ callbackUrl: "/login" });
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex bg-background text-foreground animate-pulse">
        <aside className="hidden lg:flex flex-col w-72 bg-surface/50 border-r border-border-subtle p-6 h-screen">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-surface-variant rounded-xl"></div>
            <div className="h-6 w-32 bg-surface-variant rounded-lg"></div>
          </div>
          <div className="space-y-4 flex-1 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full bg-surface-variant rounded-2xl"></div>
            ))}
          </div>
          <div className="mt-auto h-12 w-full bg-surface-variant rounded-2xl"></div>
        </aside>

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <header className="flex items-center justify-between p-4 lg:p-6 border-b border-border-subtle lg:border-none">
            <div className="h-8 w-40 lg:w-48 bg-surface-variant rounded-lg"></div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block h-10 w-32 bg-surface-variant rounded-xl"></div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-surface-variant"></div>
            </div>
          </header>
          
          <main className="flex-1 p-4 lg:p-8">
             <div className="space-y-8">
               <div className="h-16 w-3/4 max-w-md bg-surface-variant rounded-xl"></div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="h-32 w-full bg-surface-variant rounded-[2rem]"></div>
                 ))}
               </div>
             </div>
          </main>
        </div>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-surface border-r border-border-subtle p-6 sticky top-0 h-screen">
        <Link href="/dashboard" className="flex items-center gap-3 mb-10 px-2 group/logo hover:scale-[1.02] transition-all active:scale-95">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover/logo:shadow-indigo-500/30 transition-all">
            <TrendingUp size={22} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">
            Spend<span className="text-primary-600">Wise</span>
          </span>
        </Link>

        <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pr-2">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">{group.title}</h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                        isActive 
                          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" 
                          : "text-secondary hover:bg-surface-variant hover:text-foreground"
                      }`}
                    >
                      <item.icon size={18} className={isActive ? "" : "group-hover:scale-110 transition-transform"} />
                      <span className="font-bold text-sm">{item.name}</span>
                      {item.premium && !isActive && (
                        <div className="ml-auto w-4 h-4 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                          <Sparkles size={10} />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle space-y-4">
          <Link href="/profile" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            pathname === "/profile" ? "bg-surface-variant text-foreground shadow-sm" : "text-secondary hover:text-foreground"
          }`}>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              {session.user?.image ? (
                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-primary-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{session.user?.name || "Profile"}</p>
              <p className="text-[10px] text-muted font-bold truncate">{session.user?.email}</p>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </Link>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-secondary hover:bg-error/10 hover:text-error transition-all font-bold group"
          >
            <div className="w-8 h-8 rounded-xl bg-error/5 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
              <LogOut size={18} />
            </div>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Top Header - Sticky */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 lg:p-6 bg-background/80 backdrop-blur-md border-b border-border-subtle lg:border-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-surface border border-border-subtle text-secondary"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl lg:text-3xl font-black tracking-tight">
              {navGroups.flatMap(g => g.items).find(item => item.href === pathname)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsAddExpenseOpen(true)}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform active:scale-95"
            >
              <Plus size={20} />
              Add Expense
            </button>
            
            <NotificationDropdown />
            
            <button
              onClick={toggleTheme}
              className="p-2.5 lg:p-3 rounded-xl bg-surface border border-border-subtle text-secondary hover:text-foreground transition-all active:scale-95 shadow-sm"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link 
              href="/profile"
              className="relative group active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full overflow-hidden border-2 border-background shadow-md flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-primary-500/50">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white font-black text-lg">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-background rounded-full shadow-sm"></div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8" id="main-content">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-surface border-r border-border-subtle p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10 px-2">
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 group/logo">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={22} color="white" strokeWidth={2.5} />
                  </div>
                  <span className="font-extrabold text-2xl tracking-tight">Spend<span className="text-primary-600">Wise</span></span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-secondary">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto pr-2">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-muted">{group.title}</h3>
                    <nav className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                              isActive 
                                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" 
                                : "text-secondary hover:bg-surface-variant hover:text-foreground"
                            }`}
                          >
                            <item.icon size={20} />
                            <span className="font-bold">{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-border-subtle">
                 <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-secondary hover:bg-error/10 hover:text-error transition-all font-bold group"
                >
                  <div className="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center">
                    <LogOut size={20} />
                  </div>
                  <span>Sign Out Session</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsAddExpenseOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-primary-500 text-white shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={32} />
      </button>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );

  return (
      <DashboardProvider>
        <SystemStatusChecker />
        <ActivityTracker />
        {(session?.user as any)?.isSuspended ? (
          <SuspendedOverlay />
        ) : (
          content
        )}
      </DashboardProvider>

  );
}
