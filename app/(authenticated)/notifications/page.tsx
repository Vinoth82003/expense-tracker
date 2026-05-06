"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, MailOpen, Calendar, Info } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";

interface Notification {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  adminName: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/user/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Mark as read when page is visited
    fetch("/api/user/notifications/mark-read", { method: "POST" }).catch(console.error);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center shadow-lg">
          <Bell size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Announcements</h1>
          <p className="text-secondary font-medium mt-1">Updates and alerts from the SpendWise team</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-surface border border-border-subtle rounded-[2rem] p-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center mb-6">
            <MailOpen size={32} className="text-secondary opacity-50" />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">You're all caught up!</h3>
          <p className="text-secondary">There are no new announcements at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id}
              className="bg-surface border border-border-subtle rounded-3xl p-6 hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-black text-foreground group-hover:text-primary-500 transition-colors">
                  {notif.subject}
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface-variant/50 px-3 py-1.5 rounded-lg w-fit">
                  <Calendar size={14} />
                  {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-secondary font-medium leading-relaxed whitespace-pre-wrap">
                  {notif.body}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-2 text-xs font-bold text-muted">
                <Info size={14} />
                Sent by {notif.adminName}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
