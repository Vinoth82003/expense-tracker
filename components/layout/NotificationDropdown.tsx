"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  adminName: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/user/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read
      try {
        await fetch("/api/user/notifications/mark-read", { method: "POST" });
        setUnreadCount(0);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2.5 lg:p-3 rounded-xl bg-surface border border-border-subtle text-secondary hover:text-foreground transition-all active:scale-95 shadow-sm"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-4 right-4 top-20 sm:left-auto sm:absolute sm:-right-0 sm:top-auto sm:mt-2 origin-top-right w-auto sm:w-[24rem] bg-surface border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-variant/30">
              <h3 className="font-black text-foreground">Announcements</h3>
              <span className="text-xs font-bold text-secondary bg-surface border border-border-subtle px-2 py-1 rounded-lg">
                {notifications.length} Recent
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                  <Bell size={24} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm">No new announcements</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-surface-variant transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-black text-foreground">
                          {notif.subject}
                        </h4>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                          {new Date(notif.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-secondary font-medium leading-relaxed line-clamp-2 transition-all">
                        {notif.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-border-subtle bg-surface text-center">
                <a
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  View All Announcements
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
