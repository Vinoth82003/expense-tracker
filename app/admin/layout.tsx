"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  HelpCircle,
  FileText,
  Users,
  LogOut,
  Settings,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      // Don't check for login page
      if (pathname === "/admin/login") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/check-auth");
        if (res.ok) {
          setAuthorized(true);
        } else {
          router.push("/admin/login");
        }
      } catch (error) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
      />
    </div>
  );

  if (pathname === "/admin/login") return <>{children}</>;

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Manage FAQ", href: "/admin/faq", icon: HelpCircle },
    { name: "Documentation", href: "/admin/docs", icon: FileText },
    { name: "Category Management", href: "/admin/categories", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex transition-colors">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border-subtle transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <Link href="/" className="flex items-center gap-3 no-underline mb-12 px-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
              <TrendingUp size={20} strokeWidth={3} />
            </div>
            <span className="font-black text-2xl tracking-tighter">Admin.</span>
          </Link>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${pathname === item.href ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-secondary hover:bg-surface-variant'}`}
              >
                <item.icon size={18} />
                {item.name}
                {pathname === item.href && (
                  <motion.div layoutId="active" className="ml-auto">
                    <ChevronRight size={14} />
                  </motion.div>
                )}
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-border-subtle">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-sm text-rose-500 hover:bg-surface-variant transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="h-20 lg:h-16 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md border-b border-border-subtle sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-surface-variant text-secondary"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-black text-foreground">System Administrator</div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Environment: {process.env.NODE_ENV}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xs border-2 border-surface">
              AD
            </div>
          </div>

          {/* Use theme toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 lg:p-3 rounded-xl bg-surface border border-border-subtle text-secondary hover:text-foreground transition-all active:scale-95 shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
