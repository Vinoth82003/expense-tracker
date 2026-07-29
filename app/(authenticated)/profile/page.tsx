"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldOff,
  LogOut,
  Check,
  X,
  Pencil,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Calendar,
  Star,
  Loader2,
  Settings,
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { useUI } from "@/context/UIContext";
import FeedbackModal from "@/components/modals/FeedbackModal";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { confirm } = useModal();
  const { toast } = useUI();
  const user = session?.user as any;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setNameValue(user.name || "");
      setTwoFAEnabled(user.twoFactorEnabled ?? false);
    }
  }, [user]);

  if (!session?.user) return null;

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    setNameSaving(true);
    setNameError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (res.ok) {
        setIsEditingName(false);
        await updateSession({ name: nameValue.trim() });
        toast.success("Name updated");
      } else {
        const data = await res.json();
        setNameError(data.error || "Failed to save name");
      }
    } catch {
      setNameError("Network error");
    } finally {
      setNameSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNameValue(user?.name || "");
    setNameError("");
    setIsEditingName(false);
  };

  const handleTwoFAToggle = async () => {
    const nextState = !twoFAEnabled;
    const ok = await confirm({
      title: nextState ? "Enable 2FA?" : "Disable 2FA?",
      message: nextState
        ? "Future logins will require a 6-digit email code. A confirmation email will be sent to you."
        : "This will remove the extra layer of protection from your account.",
      danger: !nextState,
    });

    if (!ok) return;

    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await fetch("/api/2fa/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFAEnabled(data.enabled);
        await updateSession({ twoFactorEnabled: data.enabled });
        toast.success(data.enabled ? "2FA enabled" : "2FA disabled");
      } else {
        setTwoFAError(data.error || "Failed to update 2FA");
      }
    } catch {
      setTwoFAError("Network error");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: "Delete Account?",
      message:
        "This action is permanent and cannot be undone. All your data will be erased forever.",
      confirmText: "Yes, Delete My Account",
      cancelText: "Cancel",
      danger: true,
    });
    if (!ok) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted");
        signOut({ callbackUrl: "/login" });
      } else {
        toast.error("Failed to delete account");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Logout?",
      message:
        "Are you sure you want to end your session?",
      confirmText: "Logout",
      danger: true,
    });

    if (ok) {
      signOut({ callbackUrl: "/login" });
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="mx-auto space-y-3 pb-24 px-4">
      {/* Profile Header */}
      <div className="-mx-4 px-4 pt-2 pb-1">
        <div className="bg-surface border border-border-subtle rounded-xl p-4 flex items-center gap-4">
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full border-2 border-primary-500/30 overflow-hidden bg-surface-variant flex items-center justify-center">
              {user?.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={28} className="text-secondary" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => {
                    setNameValue(e.target.value);
                    setNameError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="min-w-0 flex-1 text-lg font-bold bg-background border border-border-subtle rounded-lg px-3 py-1.5 outline-none focus:border-primary-500 text-foreground transition-colors"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="p-1.5 rounded-lg bg-primary-500 text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {nameSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-lg bg-surface-variant border border-border-subtle text-muted hover:text-foreground active:scale-95 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground truncate">
                  {user?.name || "Your Name"}
                </h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded-md text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all shrink-0"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            {nameError && (
              <p className="flex items-center gap-1 text-xs text-error mt-0.5">
                <AlertCircle size={11} /> {nameError}
              </p>
            )}

            <p className="text-xs text-muted mt-0.5">{user?.email}</p>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="flex items-center gap-1 bg-success/10 text-success border border-success/20 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                <ShieldCheck size={10} /> Verified
              </span>
              <span className="flex items-center gap-1 bg-primary-500/10 text-primary-500 border border-primary-500/20 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                <Mail size={10} /> Google OAuth
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle">
        {[
          {
            label: "Full Name",
            value: user?.name || "\u2014",
            icon: User,
            onClick: () => setIsEditingName(true),
          },
          {
            label: "Email",
            value: user?.email || "\u2014",
            icon: Mail,
          },
          {
            label: "Auth Provider",
            value: "Google OAuth",
            icon: ShieldCheck,
          },
          {
            label: "Expense Mode",
            value:
              user?.expenseMode === "limit"
                ? `Budget (${"\u20B9"}${(
                    user?.monthlyLimit || 0
                  ).toLocaleString("en-IN")}/mo)`
                : "Free Mode",
            icon: CreditCard,
            onClick: () => router.push("/settings"),
          },
          {
            label: "Member Since",
            value: memberSince,
            icon: Calendar,
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            disabled={!item.onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-variant/30 disabled:hover:bg-transparent"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
              <item.icon size={14} className="text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-semibold text-muted uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-sm font-medium text-foreground truncate block">
                {item.value}
              </span>
            </div>
            {item.onClick && (
              <ChevronRight size={14} className="text-muted shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* 2FA */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            twoFAEnabled ? "bg-success/10 text-success" : "bg-surface-variant text-muted"
          }`}>
            {twoFAEnabled ? <ShieldCheck size={16} /> : <Shield size={16} />}
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">
              Two-Factor Authentication
            </h2>
            <p className="text-[11px] text-muted">
              {twoFAEnabled
                ? "Extra protection is active"
                : "Add an extra layer of security"}
            </p>
          </div>
          <button
            onClick={handleTwoFAToggle}
            disabled={twoFALoading}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              twoFAEnabled ? "bg-success" : "bg-border-subtle"
            }`}
            role="switch"
            aria-checked={twoFAEnabled}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                twoFAEnabled ? "translate-x-[1.375rem]" : "translate-x-0.5"
              }`}
            />
            {twoFALoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={10} className="animate-spin text-white" />
              </span>
            )}
          </button>
        </div>

        {twoFAError && (
          <p className="flex items-center gap-1 text-xs text-error">
            <AlertCircle size={11} /> {twoFAError}
          </p>
        )}

        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium ${
            twoFAEnabled
              ? "bg-success/5 text-success border border-success/10"
              : "bg-surface-variant text-muted border border-border-subtle"
          }`}
        >
          {twoFAEnabled ? (
            <ShieldCheck size={13} />
          ) : (
            <ShieldOff size={13} />
          )}
          {twoFAEnabled
            ? "Your account is protected with 2FA"
            : "Your account is not fully protected"}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-foreground mb-2">Resources</h2>
        {[
          { label: "Terms of Service", icon: ShieldCheck, href: "/terms" },
          { label: "Privacy Policy", icon: Shield, href: "/privacy" },
          { label: "Help Center", icon: ExternalLink, href: "/contact" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface-variant/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <link.icon size={14} className="text-muted" />
              <span className="text-sm font-medium text-foreground">
                {link.label}
              </span>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </Link>
        ))}
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/10 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Star size={14} className="text-primary-500" />
            <span className="text-sm font-medium text-primary-500">
              Share Feedback
            </span>
          </div>
          <ChevronRight size={14} className="text-primary-500" />
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-error/5 border border-error/20 rounded-xl overflow-hidden">
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
              <Trash2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-error">Danger Zone</h2>
              <p className="text-[11px] text-error/70">Irreversible actions</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-error/10 border-t border-error/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3.5 text-error font-medium text-sm hover:bg-error/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={15} />
              Logout Session
            </div>
            <ChevronRight size={14} className="opacity-50" />
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="w-full flex items-center justify-between px-4 py-3.5 text-error font-medium text-sm hover:bg-error/5 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              {isDeletingAccount ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </div>
            <ChevronRight size={14} className="opacity-50" />
          </button>
        </div>
      </div>

      {/* Settings link */}
      <Link
        href="/settings"
        className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-muted hover:text-foreground transition-colors"
      >
        <Settings size={14} />
        System Settings
        <ChevronRight size={14} />
      </Link>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}
