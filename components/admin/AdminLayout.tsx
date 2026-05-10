"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    // Auto-collapse on small screens
    const handleResize = () => {
      if (window.innerWidth < 1024) { // Increased threshold for collapse
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    
    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (!mounted) {
    return null; // Prevent hydration flash
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-[var(--admin-bg-primary)] flex font-sans text-[var(--admin-text-primary)] overflow-hidden">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
          />
        )}
      </AnimatePresence>

      <AdminSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen} 
        onMobileClose={() => setIsMobileOpen(false)} 
      />
      
      <motion.main
        initial={false}
        animate={{ 
          marginLeft: (mounted && window.innerWidth >= 768) ? (isCollapsed ? 64 : 240) : 0 
        }}
        className="flex-1 flex flex-col h-screen transition-all duration-300 w-full min-w-0"
      >
        <AdminTopbar onMenuClick={() => setIsMobileOpen(true)} />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </motion.main>
    </div>
  );
}
