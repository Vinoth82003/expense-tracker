"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  adminName: string;
  isRead?: boolean;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
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

  const markAsRead = async (id?: string) => {
    try {
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
      
      await fetch("/api/user/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { allIds: notifications.map(n => n.id) })
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find(n => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      await fetch(`/api/user/notifications/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "read") return n.isRead;
    if (filter === "unread") return !n.isRead;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
            <div className="p-4 border-b border-border-subtle flex flex-col gap-3 bg-surface-variant/30">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-foreground flex items-center gap-2">
                  Announcements 
                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">{unreadCount} new</span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAsRead()}
                    className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="flex bg-surface rounded-lg p-1 border border-border-subtle">
                {["all", "unread", "read"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md capitalize transition-all ${
                      filter === f 
                        ? "bg-surface-variant text-foreground shadow-sm" 
                        : "text-secondary hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                  <Bell size={24} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm">No {filter !== "all" ? filter : ""} announcements</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-surface-variant transition-colors group relative ${!notif.isRead ? "bg-primary-500/5" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <h4 className={`text-sm ${!notif.isRead ? "font-black text-foreground" : "font-bold text-secondary"}`}>
                          {!notif.isRead && <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mr-2 mb-0.5"></span>}
                          {notif.subject}
                        </h4>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className={`text-sm font-medium leading-relaxed line-clamp-2 transition-all ${!notif.isRead ? "text-secondary" : "text-muted"}`}>
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-3 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end">
                        {!notif.isRead && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                          >
                            <Check size={14} /> Mark Read
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notif.id)}
                          className="text-xs font-bold text-error hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
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
