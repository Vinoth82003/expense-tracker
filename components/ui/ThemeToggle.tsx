"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-surface-variant transition-colors text-foreground flex md:inline-flex items-center gap-2"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <>
          <Moon size={20} />
          <span className="md:hidden">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={20} />
          <span className="md:hidden">Light Mode</span>
        </>
      )}
    </button>
  );
}
