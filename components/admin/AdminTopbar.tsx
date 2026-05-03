"use client";

import { useTheme } from "next-themes";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminTopbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#0F1117]/80">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white hidden sm:block">
          Admin Panel
        </h1>
        
        <div className="relative max-w-md w-full sm:ml-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-500 transition-colors"
            placeholder="Search admin..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-teal-500"></span>
        </button>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 ml-2">
          <div className="flex h-full w-full items-center justify-center bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 font-bold text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
