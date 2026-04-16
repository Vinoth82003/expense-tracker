"use client";

import { useSession } from "next-auth/react";
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
  Moon
} from "lucide-react";

import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { UIProvider } from "@/context/UIContext";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: ReceiptIndianRupee },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user && !(session.user as any).onboarded) {
      router.push("/onboarding");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex bg-background text-foreground animate-pulse">
        {/* Skeleton Sidebar - Desktop */}
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

        {/* Skeleton Main Area */}
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
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {[1, 2].map((i) => (
                   <div key={i} className="h-64 w-full bg-surface-variant rounded-[2.5rem]"></div>
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
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp size={22} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">
            Spend<span className="text-primary-600">Wise</span>
          </span>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-surface-variant text-secondary hover:bg-surface hover:text-foreground transition-all"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
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
                <item.icon size={20} className={isActive ? "" : "group-hover:scale-110 transition-transform"} />
                <span className="font-bold">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active" 
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-60" 
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => router.push("/api/auth/signout")}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-secondary hover:bg-error/10 hover:text-error transition-all font-bold mt-auto"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
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
              {navItems.find(item => item.href === pathname)?.name || "Dashboard"}
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
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-border-subtle overflow-hidden bg-surface-variant flex items-center justify-center font-bold text-secondary">
              {session.user?.image ? (
                <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                session.user?.name?.charAt(0) || "U"
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8" id="main-content">
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={22} color="white" strokeWidth={2.5} />
                  </div>
                  <span className="font-extrabold text-2xl tracking-tight">Wise</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-secondary">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
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

              <button className="flex items-center gap-3 px-4 py-3 rounded-2xl text-secondary hover:bg-error/10 hover:text-error transition-all font-bold mt-auto">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Add Button for Mobile */}
      <button 
        onClick={() => setIsAddExpenseOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={28} />
      </button>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          // You could trigger a global re-fetch or event here. For now, a router.refresh() handles most Server Component updates.
          router.refresh();
        }}
      />
    </div>
  );

  return (
    <UIProvider>
      {content}
    </UIProvider>
  );
}
