"use client";

import { useTheme } from "next-themes";
import { Search, Bell, Sun, Moon, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminNotificationDropdown } from "./AdminNotificationDropdown";
import { AdminSearchPalette } from "./AdminSearchPalette";

export function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-[40] flex h-[60px] items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-bg-sidebar)]/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="p-2 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)] rounded-lg md:hidden shrink-0"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg md:text-xl font-bold text-[var(--admin-text-primary)] hidden lg:block shrink-0">
          Admin Panel
        </h1>
        
        <div className="flex-1 max-w-md ml-0 md:ml-4">
          <AdminSearchPalette />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 ml-4 shrink-0">
        <AdminNotificationDropdown />

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)] transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        <div className="h-8 w-8 md:h-9 md:w-9 shrink-0 overflow-hidden rounded-full bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] ml-1 md:ml-2">
            <div className="flex h-full w-full items-center justify-center bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 font-bold text-xs md:text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
