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
  CheckCircle2,
  Inbox,
  Sparkles,
  ChevronDown,
  Mail,
  User,
  Trash
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleReadStatus = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      if (!currentStatus) {
        // Mark as read
        const res = await fetch("/api/user/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id })
        });
        if (res.ok) {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Mark as unread
        const res = await fetch(`/api/user/notifications/${id}/unread`, {
          method: "PATCH",
        });
        if (res.ok) {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Failed to toggle read status:", error);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/user/notifications/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        if (expandedId === id) setExpandedId(null);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-32 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-500/20">
              <Bell size={28} className="sm:w-8 sm:h-8" />
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
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">Announcements</h1>
            <p className="text-secondary font-medium text-sm sm:text-base mt-0.5">Manage your system updates</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border-subtle hover:bg-surface-variant rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-secondary hover:text-foreground w-full sm:w-auto"
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
            <div className="w-20 h-20 rounded-full bg-surface-variant/50 flex items-center justify-center mb-8 relative">
              <Inbox size={32} className="text-muted" />
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-primary-500/10 rounded-full"
              />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">All Clear!</h3>
            <p className="text-secondary font-medium max-w-sm">
              No announcements for you right now. Check back later for updates.
            </p>
          </motion.div>
        ) : (
          Object.entries(groupedNotifications).map(([groupName, items]) => (
            items.length > 0 && (
              <div key={groupName} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{groupName}</h3>
                  <div className="h-px flex-1 bg-border-subtle/50" />
                </div>

                <div className="bg-surface border border-border-subtle rounded-[2rem] overflow-hidden divide-y divide-border-subtle/50">
                  {items.map((notif) => (
                    <div key={notif.id} className="group flex flex-col">
                      <div 
                        onClick={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                        className={`flex items-center gap-4 p-4 sm:p-6 cursor-pointer hover:bg-surface-variant/30 transition-all ${!notif.isRead ? "bg-primary-500/5" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          notif.isRead ? "bg-surface-variant text-muted" : "bg-primary-500 text-white"
                        }`}>
                          {notif.isRead ? <MailOpen size={18} /> : <Mail size={18} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm sm:text-base truncate transition-colors ${
                            !notif.isRead ? "font-black text-foreground" : "font-bold text-secondary group-hover:text-foreground"
                          }`}>
                            {notif.subject}
                          </h4>
                          <p className="text-[10px] font-black text-muted uppercase tracking-wider mt-0.5">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {notif.adminName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={(e) => toggleReadStatus(e, notif.id, notif.isRead)}
                            className={`p-2 rounded-lg transition-all ${
                              notif.isRead 
                                ? "text-muted hover:text-primary-500 hover:bg-primary-500/10" 
                                : "text-primary-500 hover:bg-primary-500/10"
                            }`}
                            title={notif.isRead ? "Mark as unread" : "Mark as read"}
                          >
                            {notif.isRead ? <Mail size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button
                            onClick={(e) => deleteNotification(e, notif.id)}
                            className="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className={`p-1.5 transition-transform duration-300 ${expandedId === notif.id ? "rotate-180" : ""}`}>
                            <ChevronDown size={16} className="text-muted" />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === notif.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-surface-variant/20"
                          >
                            <div className="p-6 sm:p-8 sm:pl-20 space-y-4">
                              <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="text-secondary font-bold leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                                  {notif.body}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border-subtle/30">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest">
                                  <User size={12} />
                                  From: {notif.adminName}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest">
                                  <Clock size={12} />
                                  Sent: {new Date(notif.createdAt).toLocaleString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
        <div className="p-6 bg-surface-variant/30 rounded-3xl border border-border-subtle flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center shrink-0">
            <Info size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground mb-1">Intelligence Alerts</p>
            <p className="text-[10px] font-medium text-secondary">Get real-time insights on your spending habits and system updates.</p>
          </div>
        </div>
        <div className="p-6 bg-surface-variant/30 rounded-3xl border border-border-subtle flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground mb-1">Stay Organized</p>
            <p className="text-[10px] font-medium text-secondary">Archive old announcements to keep your financial pulse clean.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
