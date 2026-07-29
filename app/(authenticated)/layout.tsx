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
  Users,
  MessageSquare,
} from "lucide-react";

import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DashboardProvider } from "@/context/DashboardContext";

import { useTheme } from "@/components/providers/ThemeProvider";
import { ActivityTracker } from "@/components/activity/ActivityTracker";
import { SystemStatusChecker } from "@/components/layout/SystemStatusChecker";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { SuspendedOverlay } from "@/components/layout/SuspendedOverlay";
import { useModal } from "@/components/providers/ModalProvider";
import { DataProvider } from "@/context/DataContext";

const navGroups = [
  {
    title: "Intelligence",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        name: "Forensic Analysis",
        href: "/analyze",
        icon: BrainCog,
        premium: true,
      },
      { name: "Visual Reports", href: "/reports", icon: PieChart },
    ],
  },
  {
    title: "Transactions",
    items: [
      { name: "Expenses", href: "/expenses", icon: ReceiptIndianRupee },
      { name: "Income", href: "/income", icon: Banknote },
      { name: "Category Map", href: "/settings/categories", icon: LayoutGrid },
    ],
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
    ],
  },
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<any>({ aiAnalysis: true });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch("/api/system/status")
      .then((res) => res.json())
      .then((data) => {
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

    const handleOpenAddExpense = () => setIsAddExpenseOpen(true);
    window.addEventListener("open-add-expense", handleOpenAddExpense);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-add-expense", handleOpenAddExpense);
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
    if (
      status === "authenticated" &&
      (session?.user as any)?.twoFactorEnabled
    ) {
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
      message:
        "Are you sure you want to end your session? You'll need to log in again to access your forensic insights.",
      confirmText: "Logout",
      danger: true,
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
              <div
                key={i}
                className="h-12 w-full bg-surface-variant rounded-2xl"
              ></div>
            ))}
          </div>
          <div className="mt-auto h-12 w-full bg-surface-variant rounded-2xl"></div>
        </aside>

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <header className="flex items-center justify-between p-4 lg:p-6 border-b border-border-subtle lg:border-none">
            <div className="h-8 w-40 lg:w-48 bg-surface-variant rounded-lg"></div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block h-10 w-32 bg-surface-variant rounded-xl"></div>
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-surface-variant"></div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <div className="space-y-8">
              <div className="h-16 w-3/4 max-w-md bg-surface-variant rounded-xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 w-full bg-surface-variant rounded-[2rem]"
                  ></div>
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
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border-subtle sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border-subtle">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group/logo"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm group-hover/logo:shadow-indigo-500/20 transition-shadow">
              <TrendingUp size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Spend<span className="text-primary-500">Wise</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {group.title}
              </h3>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary-500/10 text-primary-600 font-semibold"
                        : "text-secondary hover:bg-surface-variant hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-full" />
                    )}
                    <item.icon size={17} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-sm">{item.name}</span>
                    {item.premium && (
                      <div className="ml-auto w-4 h-4 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                        <Sparkles size={9} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border-subtle space-y-2">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/profile"
                ? "bg-surface-variant"
                : "hover:bg-surface-variant"
            }`}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-500/10 flex items-center justify-center flex-shrink-0">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={13} className="text-primary-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">
                {session.user?.name || "Profile"}
              </p>
              <p className="text-[10px] text-muted truncate">
                {session.user?.email}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted hover:text-error hover:bg-error/5 transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Top Header - Sticky */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-2.5 bg-background/80 backdrop-blur-md border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              className="lg:hidden p-2 rounded-lg bg-surface border border-border-subtle text-secondary hover:text-foreground hover:bg-surface-variant transition-colors"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-[15px] lg:text-lg font-bold tracking-tight text-foreground">
                {navGroups
                  .flatMap((g) => g.items)
                  .find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
              <p className="text-[10px] text-muted hidden sm:block">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors active:scale-[0.97] shadow-sm shadow-primary-500/20"
            >
              <Plus size={15} />
              Add
            </button>

            <div className="flex items-center gap-0.5 bg-surface border border-border-subtle rounded-lg p-0.5">
              <NotificationDropdown />
              <div className="w-px h-5 bg-border-subtle" />
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-variant transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            <Link
              href="/profile"
              className="relative ml-0.5"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-border-subtle hover:ring-primary-500/30 transition-all flex items-center justify-center">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-px -right-px w-2.5 h-2.5 bg-success border-2 border-background rounded-full" />
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
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-surface border-r border-border-subtle flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-border-subtle">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                    <TrendingUp size={20} color="white" strokeWidth={2.5} />
                  </div>
                  <span className="font-extrabold text-xl tracking-tight">
                    Spend<span className="text-primary-500">Wise</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-muted hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <h3 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {group.title}
                    </h3>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActive
                              ? "bg-primary-500/10 text-primary-600 font-semibold"
                              : "text-secondary hover:bg-surface-variant hover:text-foreground"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-full" />
                          )}
                          <item.icon size={17} strokeWidth={isActive ? 2.5 : 1.5} />
                          <span className="text-sm">{item.name}</span>
                          {item.premium && (
                            <div className="ml-auto w-4 h-4 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                              <Sparkles size={9} />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="px-3 py-4 border-t border-border-subtle">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted hover:text-error hover:bg-error/5 transition-all"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) for Chat */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all chat-fab-ring"
        aria-label="Open Sage Assistant"
      >
        <Sparkles size={22} className="animate-pulse" />
      </button>

      {/* Mobile Add Expense Button (shifted to the left slightly or stacked with FAB) */}
      <button
        onClick={() => setIsAddExpenseOpen(true)}
        className="sm:hidden fixed bottom-6 right-24 w-14 h-14 rounded-2xl bg-primary-500 text-white shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={32} />
      </button>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          // DashboardContext handles the 'expenseAdded' custom event triggered inside AddExpenseModal
        }}
      />
    </div>
  );

  return (
    <DataProvider>
      <DashboardProvider>
        <SystemStatusChecker />
        <ActivityTracker />
        {(session?.user as any)?.isSuspended ? <SuspendedOverlay /> : content}
      </DashboardProvider>
    </DataProvider>
  );
}
