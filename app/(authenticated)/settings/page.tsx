"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useUI } from "@/context/UIContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  ChevronRight,
  Loader2,
  Download,
  Trash2,
  Monitor,
  Moon as MoonIcon,
  Sun as SunIcon,
  LayoutGrid,
  Check,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useModal } from "@/components/providers/ModalProvider";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { confirm } = useModal();
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState({
    expenseMode: "limit",
    monthlyLimit: "0",
  });

  useEffect(() => {
    if (session?.user) {
      setForm({
        expenseMode: (session.user as any).expenseMode || "limit",
        monthlyLimit: ((session.user as any).monthlyLimit || 0).toString(),
      });
    }
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseMode: form.expenseMode,
          monthlyLimit: parseFloat(form.monthlyLimit),
        }),
      });

      if (res.ok) {
        toast.success("Settings saved");
        await update();
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/user/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spendwise_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Export started");
      } else {
        toast.error("Failed to export data");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDataLoading(false);
    }
  };

  const handleWipeClick = async () => {
    const ok = await confirm({
      title: "Wipe All Data?",
      message:
        "This will permanently delete all your expenses and incomes. This action cannot be undone.",
      confirmText: "Yes, Wipe Everything",
      cancelText: "Cancel",
      danger: true,
    });
    if (!ok) return;

    setDataLoading(true);
    try {
      const res = await fetch("/api/user/wipe", { method: "DELETE" });
      if (res.ok) {
        toast.success("All data wiped");
        setForm({ ...form, monthlyLimit: "0" });
        await update();
      } else {
        toast.error("Failed to wipe data");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDataLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "display", label: "Appearance" },
    { id: "data", label: "Data & Export" },
  ];

  return (
    <div className="mx-auto space-y-4 pb-24 px-4">
      {/* Header */}
      <div className="-mx-4 px-4 pt-2 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-[11px] text-muted">Manage your preferences</p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-1.5 p-1 bg-surface-variant rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-surface text-foreground shadow-sm border border-border-subtle"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "general" && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <form onSubmit={handleUpdate}>
              {/* Tracking Mode */}
              <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                    <SettingsIcon size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Tracking Preferences
                    </h2>
                    <p className="text-[11px] text-muted">
                      Choose how you track your spending
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "limit",
                      title: "Budget Limit",
                      desc: "Set a monthly budget and track remaining balance",
                    },
                    {
                      value: "no-limit",
                      title: "Free Mode",
                      desc: "Track expenses without a fixed budget",
                    },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, expenseMode: mode.value })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.expenseMode === mode.value
                          ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/20"
                          : "border-border-subtle bg-surface-variant/40 hover:border-border-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            form.expenseMode === mode.value
                              ? "border-primary-500 bg-primary-500"
                              : "border-muted"
                          }`}
                        >
                          {form.expenseMode === mode.value && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {mode.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted leading-relaxed pl-6">
                        {mode.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {form.expenseMode === "limit" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">
                          Monthly Limit
                        </span>
                        <div className="relative">
                          <IndianRupee
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <input
                            type="number"
                            value={form.monthlyLimit}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                monthlyLimit: e.target.value,
                              })
                            }
                            className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-lg font-bold text-foreground outline-none focus:border-primary-500 transition-colors"
                            placeholder="50000"
                          />
                        </div>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Categories Link */}
              <div className="bg-surface border border-border-subtle rounded-xl p-4 mt-4 mb-4">
                <Link
                  href="/settings/categories"
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-tertiary-500/10 text-tertiary-500 flex items-center justify-center shrink-0">
                      <LayoutGrid size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Categories
                      </h3>
                      <p className="text-[11px] text-muted">
                        Manage needs &amp; wants labels
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === "display" && (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Monitor size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Appearance
                  </h2>
                  <p className="text-[11px] text-muted">
                    Choose your theme preference
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "light", name: "Light", icon: SunIcon },
                  { id: "dark", name: "Dark", icon: MoonIcon },
                  { id: "system", name: "System", icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all ${
                      theme === t.id
                        ? "border-primary-500 bg-primary-500/5"
                        : "border-border-subtle bg-surface-variant/40 hover:border-border-hover"
                    }`}
                  >
                    <t.icon
                      size={22}
                      className={
                        theme === t.id ? "text-primary-500" : "text-muted"
                      }
                    />
                    <span
                      className={`text-[11px] font-semibold ${
                        theme === t.id
                          ? "text-primary-500"
                          : "text-secondary"
                      }`}
                    >
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account & Security Link */}
            <Link href="/profile">
              <div className="bg-surface border border-border-subtle rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Account & Security
                    </h3>
                    <p className="text-[11px] text-muted">
                      Profile, 2FA, password
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary-500">
                  Manage <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {activeTab === "data" && (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Data Export */}
            <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                  <Download size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Data & Export
                  </h2>
                  <p className="text-[11px] text-muted">
                    Download your financial history
                  </p>
                </div>
              </div>

              <p className="text-xs text-secondary leading-relaxed">
                Download a full CSV record of all your expenses and incomes.
              </p>

              <button
                onClick={handleExport}
                disabled={dataLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {dataLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {dataLoading ? "Exporting..." : "Export CSV"}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-error/5 border border-error/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-error">
                    Danger Zone
                  </h2>
                  <p className="text-[11px] text-error/70">
                    Irreversible actions
                  </p>
                </div>
              </div>

              <p className="text-xs text-error/70 leading-relaxed">
                Permanently delete all your expenses and incomes. This cannot
                be undone.
              </p>

              <button
                onClick={handleWipeClick}
                disabled={dataLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-error text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {dataLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {dataLoading ? "Wiping..." : "Wipe All Data"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
