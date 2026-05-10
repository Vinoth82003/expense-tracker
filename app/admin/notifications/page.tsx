"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  History,
  FileCode,
  UserX,
  Search,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Users,
  ChevronRight,
  Plus,
  Save,
  Zap,
  Layout,
  Code,
  Tag,
  ArrowRight,
  MoreVertical,
  ChevronLeft,
  X,
  Smartphone,
  Bell,
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  isSystem: boolean;
  updatedAt: string;
}

interface NotificationLog {
  id: string;
  subject: string;
  recipientCount: number;
  status: string;
  adminName: string;
  createdAt: string;
  body: string;
}

interface Unsubscribe {
  id: string;
  email: string;
  createdAt: string;
  reason: string | null;
  user: { name: string | null };
}

interface AdminAlert {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  read: boolean;
  model: string;
}

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminNotificationsPageContent />
    </Suspense>
  );
}

function AdminNotificationsPageContent() {
  const { alert, confirm } = useModal();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "send");
  const [loading, setLoading] = useState(false);

  // Send Announcement State
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [recipientType, setRecipientType] = useState("all"); // all, filtered, specific
  const [filters, setFilters] = useState<any>({
    twoFactorEnabled: false,
    limitMode: false,
    active30d: false,
    newUsers: false,
    incomeNoExpenses: false,
    noIncomeNoExpenses: false,
    inactive2d: false,
    inactive7d: false,
    onboarded: null,
    noPWA: false,
  });
  const [specificEmail, setSpecificEmail] = useState("");

  // History State
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);

  // Templates State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [isNewTemplateMode, setIsNewTemplateMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  // Viewing State
  const [viewingNotification, setViewingNotification] =
    useState<NotificationLog | null>(null);
  const [viewingRecipients, setViewingRecipients] = useState<
    { name: string | null; email: string }[]
  >([]);

  // Unsubscribes State
  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([]);

  // System Alerts State
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Settings State
  const [threshold, setThreshold] = useState(80);
  const [isAlertEnabled, setIsAlertEnabled] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/admin-alerts");
      if (res.ok) setAlerts(await res.json());
    } catch (error) {
      console.error("Alerts fetch failed");
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const dismissAlert = async (id?: string, all = false) => {
    try {
      const res = await fetch("/api/admin/notifications/admin-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, readAll: all }),
      });
      if (res.ok) fetchAlerts();
    } catch (error) {
      console.error("Failed to dismiss alert");
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/notifications/history?page=${historyPage}`,
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
        setTotalHistory(data.total);
      }
    } catch (error) {
      console.error("History fetch failed");
    }
  }, [historyPage]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        setSelectedTemplate((prev) => (!prev && data.length > 0) ? data[0] : prev);
      }
    } catch (error) {
      console.error("Templates fetch failed");
    }
  }, []);

  const fetchUnsubscribes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/unsubscribes");
      if (res.ok) setUnsubscribes(await res.json());
    } catch (error) {
      console.error("Unsubscribes fetch failed");
    }
  }, []);

  const resubscribeUser = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Confirm Re-subscribe",
      message: "Are you sure you want to remove this user from the unsubscribe list?",
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/notifications/unsubscribes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert({ title: "Success", message: "User re-subscribed!", type: "success" });
        fetchUnsubscribes();
      } else {
        const err = await res.json();
        alert({ title: "Error", message: err.error || "Failed to re-subscribe", type: "error" });
      }
    } catch (error) {
      alert({ title: "Error", message: "Network error", type: "error" });
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setThreshold(data.budgetAlertThreshold);
      }
    } catch (error) {
      console.error("Settings fetch failed");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    if (activeTab === "alerts") fetchAlerts();
    if (activeTab === "templates") {
      fetchTemplates();
      setIsNewTemplateMode(false);
      setSelectedTemplate(prev => prev?.id === "" ? null : prev);
    }
    if (activeTab === "unsubscribe") fetchUnsubscribes();
  }, [activeTab, fetchHistory, fetchTemplates, fetchUnsubscribes]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const sendAnnouncement = async () => {
    if (!subject || !body)
      return alert({
        title: "Validation Error",
        message: "Subject and body are required",
        type: "warning",
      });
    const isConfirmed = await confirm({
      title: "Confirm Send",
      message: "Send this announcement to the selected recipients?",
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          recipientFilter:
            recipientType === "all"
              ? {}
              : recipientType === "specific"
                ? { specificEmail }
                : filters,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await alert({
          title: "Success",
          message: data.message,
          type: "success",
        });
        setSubject("");
        setBody("");
        setActiveTab("history");
      } else {
        const err = await res.json();
        alert({
          title: "Error",
          message: err.error || "Failed to send",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Send announcement error:", error);
      alert({
        title: "Error",
        message:
          "Failed to send - " +
          (error instanceof Error ? error.message : "Unknown error"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (template?: Template) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?.id,
          subject: subject,
          body: body,
        }),
      });
      if (res.ok)
        alert({
          title: "Test Sent",
          message: "Test email sent to your inbox!",
          type: "success",
        });
      else {
        const err = await res.json();
        alert({
          title: "Test Failed",
          message: err.error || "Could not send test email.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      alert({
        title: "Test Failed",
        message:
          "Network error - " +
          (error instanceof Error ? error.message : "Unknown error"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (isNewTemplateMode) {
      if (!newTemplateName || !selectedTemplate?.subject || !selectedTemplate?.body) {
        return alert({
          title: "Validation Error",
          message: "Name, subject, and body are required.",
          type: "warning",
        });
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/notifications/templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newTemplateName,
            subject: selectedTemplate.subject,
            body: selectedTemplate.body,
          }),
        });
        if (res.ok) {
          await alert({
            title: "Success",
            message: "Template created successfully!",
            type: "success",
          });
          setIsNewTemplateMode(false);
          setNewTemplateName("");
          setSubject("");
          setBody("");
          setSelectedTemplate(null);
          fetchTemplates();
        } else {
          const err = await res.json();
          alert({
            title: "Error",
            message: err.error || "Failed to create template",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Template creation error:", error);
        alert({
          title: "Error",
          message:
            "Save failed - " +
            (error instanceof Error ? error.message : "Unknown error"),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedTemplate || !selectedTemplate.id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/notifications/templates/${selectedTemplate.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: selectedTemplate.subject,
              body: selectedTemplate.body,
            }),
          },
        );
        if (res.ok) {
          await alert({
            title: "Success",
            message: "Template saved!",
            type: "success",
          });
          fetchTemplates();
        } else {
          const err = await res.json();
          alert({
            title: "Error",
            message: err.error || "Failed to save template",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Template update error:", error);
        alert({
          title: "Error",
          message:
            "Save failed - " +
            (error instanceof Error ? error.message : "Unknown error"),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteTemplate = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Template",
      message:
        "Are you sure you want to delete this custom template? This action cannot be undone.",
      danger: true,
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/notifications/templates/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        await alert({
          title: "Deleted",
          message: "Template deleted.",
          type: "success",
        });
        fetchTemplates();
      } else {
        const err = await res.json();
        alert({
          title: "Error",
          message: err.error || "Failed to delete",
          type: "error",
        });
      }
    } catch (e) {
      console.error("Delete template error:", e);
      alert({
        title: "Error",
        message:
          "Failed to delete - " +
          (e instanceof Error ? e.message : "Unknown error"),
        type: "error",
      });
    }
  };

  const loadTemplateIntoComposer = (template: Template) => {
    setSubject(template.subject);
    setBody(template.body);
    setActiveTab("send");
  };

  const viewNotification = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setViewingNotification(data.notification);
        setViewingRecipients(data.recipients);
      } else {
        alert({
          title: "Error",
          message: "Failed to load notification details.",
          type: "error",
        });
      }
    } catch (e) {
      alert({
        title: "Error",
        message: "Failed to load notification details.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (val: number) => {
    setThreshold(val);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ budgetAlertThreshold: val }),
      });
    } catch (error) {
      console.error("Settings update failed");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] tracking-tight">
          Notifications
        </h1>
        <p className="text-[var(--admin-text-secondary)] font-medium">
          Send announcements, manage email templates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--admin-border)] overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { id: "send", label: "Send announcement", icon: Send },
          { id: "alerts", label: "System alerts", icon: Bell },
          { id: "history", label: "History", icon: History },
          { id: "templates", label: "Email templates", icon: FileCode },
          { id: "unsubscribe", label: "Unsubscribe log", icon: UserX },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 md:px-6 py-4 text-xs md:text-sm font-bold transition-all relative shrink-0 ${activeTab === t.id ? "text-teal-500" : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]"}`}
          >
            <t.icon size={16} className="md:w-[18px] md:h-[18px]" />
            {t.label}
            {activeTab === t.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "send" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {/* Compose Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[var(--admin-border-subtle)] bg-[var(--admin-bg-surface-variant)] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black uppercase text-[var(--admin-text-muted)] tracking-widest">
                      New Announcement
                    </span>
                    <select 
                      onChange={(e) => {
                        const t = templates.find(temp => temp.id === e.target.value);
                        if (t) loadTemplateIntoComposer(t);
                      }}
                      className="bg-transparent border border-[var(--admin-border-subtle)] rounded-lg px-3 py-1 text-[10px] font-bold text-[var(--admin-text-secondary)] outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Load Template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPreviewMode(false)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${!isPreviewMode ? "bg-teal-500 text-white" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-secondary)]"}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setIsPreviewMode(true)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isPreviewMode ? "bg-teal-500 text-white" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-secondary)]"}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <input
                    type="text"
                    placeholder="Subject line..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-[var(--admin-text-muted)] text-[var(--admin-text-primary)]"
                  />
                  <div className="h-px bg-[var(--admin-border-subtle)]" />

                  {isPreviewMode ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none min-h-[300px] p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl">
                      <h2 className="text-xl font-bold mb-4 text-[var(--admin-text-primary)]">
                        {subject || "No subject"}
                      </h2>
                      <div className="whitespace-pre-wrap text-[var(--admin-text-secondary)]">
                        {body || "No content..."}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      placeholder="Write your announcement here... Use {userName} for personalization."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full min-h-[300px] bg-transparent border-none outline-none resize-none placeholder:text-[var(--admin-text-muted)] text-[var(--admin-text-secondary)] font-medium leading-relaxed"
                    />
                  )}
                </div>

                <div className="p-6 bg-[var(--admin-bg-surface-variant)] border-t border-[var(--admin-border-subtle)] flex justify-between items-center">
                  <button
                    onClick={() => sendTestEmail()}
                    disabled={loading}
                    className="text-xs font-black uppercase text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors flex items-center gap-2"
                  >
                    <Mail size={14} /> Send test to me
                  </button>
                  <button
                    onClick={sendAnnouncement}
                    disabled={loading || !subject || !body}
                    className="px-8 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    Send Announcement
                  </button>
                </div>
              </div>
            </div>

            {/* Recipients Sidebar */}
            <div className="space-y-6">
              <div className="bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-5 md:p-8 space-y-6">
                <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest">
                  Recipients
                </h3>

                <div className="space-y-2">
                  {[
                    { id: "all", label: "All users", icon: Users },
                    { id: "filtered", label: "Filtered segment", icon: Tag },
                    { id: "specific", label: "Specific user", icon: Mail },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRecipientType(r.id)}
                      className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${recipientType === r.id ? "bg-teal-500/10 border-teal-500/20 text-teal-600" : "bg-[var(--admin-bg-surface-variant)] border-transparent text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)]"}`}
                    >
                      <r.icon size={18} />
                      <span className="text-sm font-bold">{r.label}</span>
                      {recipientType === r.id && (
                        <CheckCircle2 size={16} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {recipientType === "filtered" && (
                   <div className="space-y-3 pt-4 border-t border-[var(--admin-border-subtle)]">
                    {[
                      { id: "twoFactorEnabled", label: "2FA Enabled" },
                      { id: "limitMode", label: "Limit Mode Only" },
                      { id: "active30d", label: "Active last 30d" },
                      { id: "newUsers", label: "New users (<7d)" },
                      { id: "incomeNoExpenses", label: "Income but No Expenses" },
                      { id: "noIncomeNoExpenses", label: "No Income & Expenses" },
                      { id: "inactive2d", label: "Inactive 2+ Days" },
                      { id: "inactive7d", label: "Inactive 1+ Week" },
                      { id: "noPWA", label: "PWA Not Installed" },
                    ].map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={filters[f.id]}
                          onChange={(e) =>
                            setFilters({ ...filters, [f.id]: e.target.checked })
                          }
                          className="w-5 h-5 rounded-lg border-2 border-[var(--admin-border-subtle)] checked:bg-teal-500 transition-all cursor-pointer"
                        />
                        <span className="text-xs font-bold text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)]">
                          {f.label}
                        </span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.onboarded === false}
                        onChange={(e) =>
                          setFilters({ ...filters, onboarded: e.target.checked ? false : null })
                        }
                        className="w-5 h-5 rounded-lg border-2 border-[var(--admin-border-subtle)] checked:bg-teal-500 transition-all cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)]">
                        Not Onboarded Only
                      </span>
                    </label>
                  </div>
                )}

                {recipientType === "specific" && (
                  <div className="pt-4 border-t border-[var(--admin-border-subtle)]">
                    <input
                      type="email"
                      placeholder="User email address..."
                      value={specificEmail}
                      onChange={(e) => setSpecificEmail(e.target.value)}
                      className="w-full p-3 bg-[var(--admin-bg-surface-variant)] rounded-xl text-xs font-bold outline-none border border-[var(--admin-border-subtle)] text-[var(--admin-text-primary)] focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-dashed border-[var(--admin-border-subtle)] text-center">
                  <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] mb-1">
                    Impact Preview
                  </p>
                  <p className="text-xl font-black text-[var(--admin-text-primary)]">
                    ~847 users
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "alerts" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest flex items-center gap-2">
                <Bell size={16} /> Active System Alerts
              </h3>
              <button 
                onClick={() => dismissAlert(undefined, true)}
                className="text-xs font-bold text-[var(--admin-text-muted)] hover:text-red-500 transition-colors"
              >
                Clear all alerts
              </button>
            </div>

            {alertsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm">
                <RefreshCw size={32} className="animate-spin text-teal-500" />
                <p className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Fetching alerts...</p>
              </div>
            ) : alerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert) => (
                  <motion.div
                    layout
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-[var(--admin-bg-card)] rounded-3xl border border-[var(--admin-border)] shadow-sm group hover:border-teal-500/30 transition-all flex gap-4"
                  >
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      alert.type === 'error' ? 'bg-red-500/10 text-red-500' : 
                      alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                      'bg-teal-500/10 text-teal-500'
                    }`}>
                      {alert.type === 'error' ? <XCircle size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-[var(--admin-text-primary)] truncate">
                          {alert.title}
                        </h4>
                        <span className="text-[10px] font-medium text-[var(--admin-text-muted)] whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed mb-3 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--admin-text-muted)] bg-[var(--admin-bg-surface-variant)] px-2 py-0.5 rounded">
                          {alert.model}
                        </span>
                        <button 
                          onClick={() => dismissAlert(alert.id)}
                          className="text-[10px] font-bold text-teal-600 hover:text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm">
                <div className="h-16 w-16 bg-[var(--admin-bg-surface-variant)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-[var(--admin-text-primary)] mb-1">System Healthy</h4>
                <p className="text-sm text-[var(--admin-text-secondary)]">No active alerts at this time.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest border-b border-[var(--admin-border-subtle)]">
                  <th className="py-5 px-8">Subject</th>
                  <th className="py-5 px-8">Recipients</th>
                  <th className="py-5 px-8">Sent At</th>
                  <th className="py-5 px-8">Status</th>
                  <th className="py-5 px-8">Admin</th>
                  <th className="py-5 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                {history.map((log) => (
                  <tr
                    key={log.id}
                    className="group hover:bg-[var(--admin-bg-surface-variant)] transition-colors"
                  >
                    <td className="py-4 px-8">
                      <span className="text-sm font-bold text-[var(--admin-text-primary)] truncate max-w-[200px] block">
                        {log.subject}
                      </span>
                    </td>
                    <td className="py-4 px-8 text-sm font-bold text-[var(--admin-text-secondary)]">
                      {log.recipientCount} users
                    </td>
                    <td className="py-4 px-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--admin-text-primary)]">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-[var(--admin-text-muted)]">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : log.status === "PROCESSING"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              : "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        }`}
                      >
                        {log.status === "SUCCESS"
                          ? "✓ Success"
                          : log.status === "PROCESSING"
                            ? "⋯ Processing"
                            : "✗ Failed"}
                      </span>
                    </td>
                    <td className="py-4 px-8 text-xs font-bold text-[var(--admin-text-secondary)]">
                      {log.adminName}
                    </td>
                    <td className="py-4 px-8 text-right">
                      <button
                        onClick={() => viewNotification(log.id)}
                        className="p-2 text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === "templates" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Template List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">
                    Templates
                  </h3>
                  <button
                    onClick={() => {
                      setIsNewTemplateMode(true);
                      setNewTemplateName("");
                      setSelectedTemplate({
                        id: "",
                        name: "",
                        subject: "",
                        body: "",
                        isSystem: false,
                        updatedAt: "",
                      });
                      setSubject("");
                      setBody("");
                    }}
                    className="p-1 text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-1">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center group w-full text-left px-4 py-3 rounded-xl transition-all ${selectedTemplate?.id === t.id && !isNewTemplateMode ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)]"}`}
                    >
                      <button
                        onClick={() => {
                          setSelectedTemplate(t);
                          setIsNewTemplateMode(false);
                          setSubject(t.subject);
                          setBody(t.body);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="text-xs font-black truncate">
                          {t.name}
                        </div>
                        <div
                          className={`text-[9px] font-bold ${selectedTemplate?.id === t.id && !isNewTemplateMode ? "text-white/70" : "text-[var(--admin-text-muted)]"}`}
                        >
                          {t.isSystem ? "System Template" : "Custom Template"}
                        </div>
                      </button>
                      {!t.isSystem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(t.id);
                          }}
                          className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedTemplate?.id === t.id && !isNewTemplateMode ? "text-white hover:text-red-200" : "text-red-400 hover:text-red-600"}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Editor */}
            {selectedTemplate && (
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[var(--admin-border-subtle)] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <FileCode size={20} />
                      </div>
                      <div className="flex-1">
                        {isNewTemplateMode ? (
                          <input
                            type="text"
                            placeholder="Template Name..."
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className="bg-transparent border-b border-[var(--admin-border-subtle)] outline-none font-black text-[var(--admin-text-primary)]"
                          />
                        ) : (
                          <>
                            <h3 className="font-black text-[var(--admin-text-primary)]">
                              {selectedTemplate.name}
                            </h3>
                            <p className="text-[10px] text-[var(--admin-text-muted)]">
                              Edit content and variables
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {!isNewTemplateMode && (
                        <button
                          onClick={() =>
                            loadTemplateIntoComposer(selectedTemplate)
                          }
                          className="px-4 py-2 text-[10px] font-black uppercase text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors border border-[var(--admin-border-subtle)] rounded-lg flex items-center gap-2"
                        >
                          <Send size={14} /> Use Template
                        </button>
                      )}
                      <button
                        onClick={() => sendTestEmail(selectedTemplate)}
                        className="px-4 py-2 text-[10px] font-black uppercase text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors border border-[var(--admin-border-subtle)] rounded-lg"
                      >
                        Send Test
                      </button>
                      <button
                        onClick={saveTemplate}
                        disabled={loading}
                        className="px-6 py-2 bg-teal-500 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all"
                      >
                        {loading ? "Saving..." : "Save Template"}
                      </button>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Variables */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">
                        Available Variables
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "{userName}",
                          "{code}",
                          "{amount}",
                          "{limit}",
                          "{date}",
                          "{reason}",
                        ].map((v) => (
                          <button
                            key={v}
                            onClick={() =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                body: selectedTemplate.body + v,
                              })
                            }
                            className="px-3 py-1 bg-[var(--admin-bg-surface-variant)] rounded-lg text-[10px] font-black text-[var(--admin-text-secondary)] hover:text-teal-500 transition-colors border border-[var(--admin-border-subtle)]"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[var(--admin-text-muted)]">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={selectedTemplate.subject}
                          onChange={(e) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              subject: e.target.value,
                            })
                          }
                          className="w-full p-4 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] rounded-2xl text-sm font-bold outline-none text-[var(--admin-text-primary)] focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[var(--admin-text-muted)]">
                          Email Body
                        </label>
                        <textarea
                          value={selectedTemplate.body}
                          onChange={(e) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              body: e.target.value,
                            })
                          }
                          className="w-full min-h-[250px] p-4 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] rounded-2xl text-sm font-medium outline-none text-[var(--admin-text-secondary)] focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "unsubscribe" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest border-b border-[var(--admin-border-subtle)]">
                  <th className="py-5 px-8">User Name</th>
                  <th className="py-5 px-8">Email</th>
                  <th className="py-5 px-8">Unsubscribed At</th>
                  <th className="py-5 px-8">Reason</th>
                  <th className="py-5 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                {unsubscribes.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-[var(--admin-bg-surface-variant)] transition-colors"
                  >
                    <td className="py-4 px-8 text-sm font-bold text-[var(--admin-text-primary)]">
                      {u.user?.name || "Anonymous"}
                    </td>
                    <td className="py-4 px-8 text-sm font-medium text-[var(--admin-text-secondary)]">
                      {u.email}
                    </td>
                    <td className="py-4 px-8 text-xs font-bold text-[var(--admin-text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-8 text-xs italic text-[var(--admin-text-muted)]">
                      {u.reason || "Not specified"}
                    </td>
                    <td className="py-4 px-8 text-right">
                      <button 
                        onClick={() => resubscribeUser(u.id)}
                        className="text-[10px] font-black uppercase text-teal-500 hover:text-teal-600 transition-colors px-3 py-1 bg-teal-500/10 rounded-lg"
                      >
                        Re-subscribe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Budget Alert Config Footer */}
      <div className="bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-[2rem] p-8 flex flex-wrap items-center justify-between gap-8 text-[var(--admin-text-primary)] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">
              Budget Threshold Alerts
            </h3>
            <p className="text-sm text-[var(--admin-text-muted)]">
              Automated emails when users hit spend milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 bg-[var(--admin-bg-surface-variant)] p-2 rounded-2xl border border-[var(--admin-border-subtle)]">
            <span className="text-xs font-black uppercase text-[var(--admin-text-muted)] pl-4">
              Trigger at
            </span>
            <input
              type="number"
              value={threshold}
              onChange={(e) => updateSettings(parseInt(e.target.value))}
              min="50"
              max="100"
              className="w-16 p-2 bg-[var(--admin-bg-card)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-lg font-black pr-4">%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase text-[var(--admin-text-muted)]">
              Status:
            </span>
            <button
              onClick={() => setIsAlertEnabled(!isAlertEnabled)}
              className={`w-14 h-8 rounded-full transition-all relative ${isAlertEnabled ? "bg-teal-500" : "bg-[var(--admin-border)]"}`}
            >
              <motion.div
                animate={{ x: isAlertEnabled ? 28 : 4 }}
                className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </div>
      </div>
      {/* View Notification Modal */}
      <AnimatePresence>
        {viewingNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--admin-bg-card)] rounded-3xl w-full max-w-2xl shadow-2xl border border-[var(--admin-border)] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--admin-border-subtle)] flex justify-between items-center bg-[var(--admin-bg-surface-variant)]">
                <div>
                  <h3 className="text-xl font-black text-[var(--admin-text-primary)]">
                    Announcement Details
                  </h3>
                  <p className="text-sm font-medium text-[var(--admin-text-secondary)]">
                    Sent by {viewingNotification.adminName} on{" "}
                    {new Date(
                      viewingNotification.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewingNotification(null)}
                  className="p-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest mb-2 block">
                    Subject
                  </label>
                  <div className="text-lg font-bold text-[var(--admin-text-primary)]">
                    {viewingNotification.subject}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest mb-2 block">
                    Message Body
                  </label>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-sm font-medium whitespace-pre-wrap p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)] text-[var(--admin-text-secondary)]">
                    {viewingNotification.body}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">
                      Recipients ({viewingRecipients.length})
                    </label>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-[var(--admin-border-subtle)] rounded-xl divide-y divide-[var(--admin-border-subtle)]">
                    {viewingRecipients.map((r, i) => (
                      <div key={i} className="p-3 text-sm flex justify-between bg-[var(--admin-bg-card)]">
                        <span className="font-bold text-[var(--admin-text-primary)]">
                          {r.name || "Unknown"}
                        </span>
                        <span className="text-[var(--admin-text-secondary)]">{r.email}</span>
                      </div>
                    ))}
                    {viewingRecipients.length === 0 && (
                      <div className="p-4 text-sm text-center text-[var(--admin-text-muted)] italic">
                        No specific recipients found for this filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
