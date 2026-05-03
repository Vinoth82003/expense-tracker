"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Shield,
  CreditCard,
  Tag,
  Brain,
  BarChart2,
  Bell,
  Lock,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet
} from "lucide-react";

const MENU_ITEMS = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    section: "Users",
    items: [
      { name: "User management", href: "/admin/users", icon: Users },
      { name: "Sessions & auth", href: "/admin/sessions", icon: Shield },
    ]
  },
  {
    section: "Data",
    items: [
      { name: "All transactions", href: "/admin/transactions", icon: CreditCard },
      { name: "Global categories", href: "/admin/categories", icon: Tag },
      { name: "AI report logs", href: "/admin/reports", icon: Brain },
    ]
  },
  {
    section: "System",
    items: [
      { name: "App analytics", href: "/admin/analytics", icon: BarChart2 },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Security & 2FA", href: "/admin/security", icon: Lock },
      { name: "System settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export function AdminSidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Failed to logout admin", error);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      className="fixed left-0 top-0 z-40 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1117] flex flex-col transition-all duration-300"
    >
      <div className="flex h-[60px] items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white truncate">
            <Wallet className="h-6 w-6 text-teal-500" />
            <span>SpendWise Admin</span>
          </div>
        )}
        {isCollapsed && (
          <Wallet className="h-6 w-6 text-teal-500 mx-auto" />
        )}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {MENU_ITEMS.map((group, i) => (
          <div key={i} className="mb-6 px-3">
            {!isCollapsed && (
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {group.section}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 border-l-2 border-teal-500"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/50 border-l-2 border-transparent"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-teal-500 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="flex h-full w-full items-center justify-center bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 font-bold">
              A
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 flex-col truncate">
              <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                Administrator
              </span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-500/10 inline-block px-1.5 py-0.5 rounded w-fit mt-0.5">Admin Badge</span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`mt-4 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Log out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
