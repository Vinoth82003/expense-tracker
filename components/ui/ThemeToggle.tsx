import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 rounded-full w-9 h-9 flex items-center justify-center">
        <div className="w-5 h-5" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-surface-variant transition-colors text-foreground flex md:inline-flex items-center gap-2"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <>
          <Moon size={20} />
        </>
      ) : (
        <>
          <Sun size={20} />
        </>
      )}
    </button>
  );
}
