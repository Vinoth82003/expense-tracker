"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Mail,
  MailOpen,
  Trash2,
  Clock,
  User,
  X,
  CheckCheck,
  Inbox,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNotifications, useMutations } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";

interface Notification {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  adminName: string;
  isRead: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatTime(iso);
}

export default function NotificationsPage() {
  const { data: notifData, loading, error, refetch } = useNotifications();
  const { toast } = useUI();
  const mutations = useMutations();

  const notifications = ((notifData as unknown as { notifications: Notification[]; unreadCount: number } | undefined)?.notifications || []) as Notification[];
  const unreadCount = (notifData as unknown as { notifications: Notification[]; unreadCount: number } | undefined)?.unreadCount || 0;

  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await mutations.markAllNotificationsRead(unreadIds);
      toast.success("Marked all as read");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const toggleRead = async (id: string, current: boolean) => {
    try {
      if (!current) {
        await mutations.markNotificationRead(id);
      } else {
        // Mark as unread — direct fetch since no mutation helper exists
        const res = await fetch(`/api/user/notifications/${id}/unread`, {
          method: "PATCH",
        });
        if (!res.ok) throw new Error("Failed to mark as unread");
      }
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await mutations.deleteNotification(id);
      toast.success("Notification removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((n) => {
      const d = new Date(n.createdAt);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) groups.Today.push(n);
      else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });
    return groups;
  }, [notifications]);

  const totalCount = notifications.length;

  return (
    <div className="mx-auto space-y-4 pb-24 px-4">
      {/* Header */}
      <div className="-mx-4 px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                <Bell size={20} />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Announcements
              </h1>
              <p className="text-[11px] text-muted">
                {totalCount} notification{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-semibold text-secondary hover:text-foreground hover:border-border-hover transition-all active:scale-95"
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="animate-spin mb-3" size={24} />
          <span className="text-xs font-medium">Loading...</span>
        </div>
      ) : totalCount === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mb-5">
            <Inbox size={28} className="text-muted" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">
            All Clear!
          </h3>
          <p className="text-sm text-muted max-w-[240px]">
            No announcements for you right now.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {(["Today", "Yesterday", "Earlier"] as const).map(
            (groupName) =>
              grouped[groupName].length > 0 && (
                <div key={groupName}>
                  <div className="flex items-center gap-3 px-1 py-2">
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
                      {groupName}
                    </span>
                    <div className="h-px flex-1 bg-border-subtle/50" />
                    <span className="text-[10px] font-medium text-muted">
                      {grouped[groupName].length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {grouped[groupName].map((notif) => (
                      <motion.button
                        key={notif.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedNotif(notif);
                          setShowDetail(true);
                        }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.98] ${
                          !notif.isRead
                            ? "bg-primary-500/[0.04] border-primary-500/10"
                            : "bg-surface border-border-subtle hover:border-border-hover hover:bg-surface-variant/30"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            notif.isRead
                              ? "bg-surface-variant text-muted"
                              : "bg-primary-500/10 text-primary-500"
                          }`}
                        >
                          {notif.isRead ? (
                            <MailOpen size={16} />
                          ) : (
                            <Mail size={16} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm truncate ${
                                !notif.isRead
                                  ? "font-bold text-foreground"
                                  : "font-semibold text-secondary"
                              }`}
                            >
                              {notif.subject}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-muted mt-0.5">
                            {timeAgo(notif.createdAt)} &middot;{" "}
                            {notif.adminName}
                          </p>
                        </div>

                        <ChevronRight
                          size={14}
                          className="text-muted flex-shrink-0"
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {/* Detail Bottom Sheet */}
      <AnimatePresence>
        {showDetail && selectedNotif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border-subtle max-h-[85vh] overflow-y-auto"
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-surface z-10">
                <div className="w-10 h-1 rounded-full bg-border-subtle" />
              </div>

              <div className="px-5 pt-2 pb-8 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedNotif.isRead
                          ? "bg-surface-variant text-muted"
                          : "bg-primary-500/10 text-primary-500"
                      }`}
                    >
                      {selectedNotif.isRead ? (
                        <MailOpen size={18} />
                      ) : (
                        <Mail size={18} />
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-foreground leading-snug">
                      {selectedNotif.subject}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center text-muted hover:text-foreground transition-colors active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                    <User size={12} />
                    {selectedNotif.adminName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                    <Clock size={12} />
                    {formatFullDate(selectedNotif.createdAt)}
                  </div>
                </div>

                {/* Body */}
                <div className="mb-8">
                  <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                    {selectedNotif.body}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      setSaving(true);
                      await toggleRead(
                        selectedNotif.id,
                        selectedNotif.isRead
                      );
                      setSaving(false);
                      setSelectedNotif((prev) =>
                        prev
                          ? { ...prev, isRead: !prev.isRead }
                          : prev
                      );
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {selectedNotif.isRead ? (
                      <>
                        <Mail size={16} />
                        Mark as Unread
                      </>
                    ) : (
                      <>
                        <CheckCheck size={16} />
                        Mark as Read
                      </>
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      setSaving(true);
                      await deleteOne(selectedNotif.id);
                      setSaving(false);
                      setShowDetail(false);
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-error font-medium text-sm hover:bg-error/5 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Delete Notification
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB for mobile — Mark all read */}
      {unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center active:scale-90 transition-transform z-20"
        >
          <CheckCheck size={24} />
        </button>
      )}
    </div>
  );
}
