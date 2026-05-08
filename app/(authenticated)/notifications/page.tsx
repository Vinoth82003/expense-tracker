"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  MailOpen, 
  Calendar, 
  Info, 
  Trash2, 
  CheckCircle, 
  Clock, 
  MoreVertical,
  CheckCircle2,
  Inbox,
  Sparkles
} from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";
import { toast } from "react-hot-toast";

interface Notification {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  adminName: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const res = await fetch("/api/user/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allIds: unreadIds })
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All marked as read");
      }
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/user/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/user/notifications/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success("Notification removed");
      }
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        groups.Today.push(n);
      } else if (date.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  }, [notifications]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-500/20">
              <Bell size={32} />
            </div>
            {unreadCount > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-primary-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background shadow-lg"
              >
                {unreadCount}
              </motion.div>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">Announcements</h1>
            <p className="text-secondary font-medium mt-0.5">Stay updated with SpendWise intelligence</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-subtle hover:bg-surface-variant rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-secondary hover:text-foreground"
          >
            <CheckCircle2 size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Main List */}
      <div className="space-y-12">
        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border-subtle rounded-[3rem] p-16 sm:p-24 flex flex-col items-center text-center shadow-sm"
          >
            <div className="w-24 h-24 rounded-full bg-surface-variant/50 flex items-center justify-center mb-8 relative">
              <Inbox size={40} className="text-muted" />
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-primary-500/10 rounded-full"
              />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">All Caught Up!</h3>
            <p className="text-secondary font-medium max-w-sm">
              Your inbox is clear. We'll notify you here when there's a new update or important alert.
            </p>
          </motion.div>
        ) : (
          Object.entries(groupedNotifications).map(([groupName, items]) => (
            items.length > 0 && (
              <div key={groupName} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">{groupName}</h3>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((notif, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={notif.id}
                        onMouseEnter={() => !notif.isRead && markAsRead(notif.id)}
                        className={`group relative bg-surface border rounded-[2rem] p-6 sm:p-8 transition-all hover:shadow-xl ${
                          notif.isRead 
                            ? "border-border-subtle opacity-70 grayscale-[0.5]" 
                            : "border-primary-500/30 shadow-lg shadow-primary-500/5 ring-1 ring-primary-500/10"
                        }`}
                      >
                        <div className="flex gap-6">
                          {/* Left Icon Area */}
                          <div className={`hidden sm:flex w-12 h-12 shrink-0 rounded-2xl items-center justify-center ${
                            notif.isRead ? "bg-surface-variant text-muted" : "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                          }`}>
                            {notif.isRead ? <MailOpen size={20} /> : <Sparkles size={20} />}
                          </div>

                          {/* Content Area */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div className="space-y-1">
                                <h2 className="text-xl font-black text-foreground group-hover:text-primary-600 transition-colors tracking-tight">
                                  {notif.subject}
                                </h2>
                                <div className="flex items-center gap-3 text-[10px] font-black text-muted uppercase tracking-wider">
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="w-1 h-1 bg-muted rounded-full" />
                                  <span>{notif.adminName}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => deleteNotification(notif.id)}
                                  className="p-2.5 rounded-xl bg-surface-variant/50 text-secondary hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                                  title="Delete announcement"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              <p className="text-secondary font-bold leading-relaxed whitespace-pre-wrap text-sm sm:text-md">
                                {notif.body}
                              </p>
                            </div>

                            {!notif.isRead && (
                              <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                                New Announcement
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          ))
        )}
      </div>

      {/* Quick Tips */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
          <div className="p-6 bg-surface-variant/30 rounded-3xl border border-border-subtle flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground mb-1">Stay Notified</p>
              <p className="text-[10px] font-medium text-secondary">Check back often for important system updates and financial tips.</p>
            </div>
          </div>
          <div className="p-6 bg-surface-variant/30 rounded-3xl border border-border-subtle flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground mb-1">Clear Inbox</p>
              <p className="text-[10px] font-medium text-secondary">Keep your announcements tidy by deleting old updates you no longer need.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
