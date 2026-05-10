"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  Shield, 
  CreditCard, 
  Tag, 
  Brain, 
  BarChart2, 
  Bell, 
  Lock, 
  Terminal, 
  Settings, 
  MessageSquare,
  ArrowRight,
  Command
} from "lucide-react";
import { useRouter } from "next/navigation";

const SEARCH_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, category: "Navigation", description: "Platform overview and stats" },
  { name: "User Management", href: "/admin/users", icon: Users, category: "Users", description: "Manage platform users and roles" },
  { name: "Sessions & Auth", href: "/admin/sessions", icon: Shield, category: "Users", description: "Track active user sessions" },
  { name: "User Feedbacks", href: "/admin/reviews", icon: MessageSquare, category: "Users", description: "Moderate user reviews" },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard, category: "Data", description: "Audit all platform expenses" },
  { name: "Categories", href: "/admin/categories", icon: Tag, category: "Data", description: "Manage global expense categories" },
  { name: "AI Reports", href: "/admin/reports", icon: Brain, category: "Data", description: "AI usage logs and insights" },
  { name: "App Analytics", href: "/admin/analytics", icon: BarChart2, category: "System", description: "Detailed growth metrics" },
  { name: "Notifications", href: "/admin/notifications", icon: Bell, category: "System", description: "Broadcast announcements" },
  { name: "Security", href: "/admin/security", icon: Lock, category: "System", description: "2FA and system lockouts" },
  { name: "System Logs", href: "/admin/logs", icon: Terminal, category: "System", description: "Debug API events and errors" },
  { name: "Settings", href: "/admin/settings", icon: Settings, category: "System", description: "Global app configuration" },
];

export function AdminSearchPalette() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = query 
    ? SEARCH_ITEMS.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      if (filteredItems[selectedIndex]) {
        handleNavigate(filteredItems[selectedIndex].href);
      }
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 max-w-md" ref={dropdownRef}>
      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className={`h-4 w-4 transition-colors ${isOpen ? 'text-teal-500' : 'text-slate-400 group-focus-within:text-teal-500'}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full rounded-full border border-[var(--admin-border)] bg-slate-50 py-2.5 pl-11 pr-12 text-sm font-medium placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-[#161B27] dark:text-white dark:placeholder:text-slate-500 transition-all"
          placeholder="Search admin (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute inset-y-0 right-4 flex items-center gap-1">
          <kbd className="hidden sm:flex h-5 items-center gap-1 rounded border border-[var(--admin-border)] bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            <Command size={10} /> K
          </kbd>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && query && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-card)] shadow-2xl z-[60] overflow-hidden"
          >
            {filteredItems.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Found {filteredItems.length} results
                </div>
                <div className="space-y-1">
                  {filteredItems.map((item, index) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        index === selectedIndex 
                          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" 
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${index === selectedIndex ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                        <item.icon size={18} className={index === selectedIndex ? "text-white" : "text-slate-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold truncate">{item.name}</p>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            index === selectedIndex ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${index === selectedIndex ? "text-white/80" : "text-slate-500"}`}>
                          {item.description}
                        </p>
                      </div>
                      {index === selectedIndex && (
                        <ArrowRight size={16} className="shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <Search size={20} />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">No results found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Try searching for navigation or system tools.</p>
              </div>
            )}
            
            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <div className="flex gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-[var(--admin-border)] dark:border-slate-700 bg-white dark:bg-slate-800 text-[8px]">↑↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-[var(--admin-border)] dark:border-slate-700 bg-white dark:bg-slate-800 text-[8px]">Enter</kbd> to select</span>
              </div>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-[var(--admin-border)] dark:border-slate-700 bg-white dark:bg-slate-800 text-[8px]">Esc</kbd> to close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
