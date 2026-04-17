"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  // Name edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [showConfirm2FA, setShowConfirm2FA] = useState(false);
  const [pendingTwoFA, setPendingTwoFA] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setNameValue(user.name || "");
      setTwoFAEnabled(user.twoFactorEnabled ?? false);
    }
  }, [user]);

  if (!session?.user) return null;

  // --- Name Save ---
  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setNameError("Name cannot be empty.");
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
        setNameSuccess(true);
        setIsEditingName(false);
        await updateSession({ name: nameValue.trim() });
        setTimeout(() => setNameSuccess(false), 3000);
      } else {
        const data = await res.json();
        setNameError(data.error || "Failed to save name.");
      }
    } catch {
      setNameError("Network error. Please try again.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNameValue(user?.name || "");
    setNameError("");
    setIsEditingName(false);
  };

  // --- 2FA Toggle ---
  const handleTwoFAToggle = () => {
    setPendingTwoFA(!twoFAEnabled);
    setShowConfirm2FA(true);
  };

  const confirmTwoFAToggle = async () => {
    if (pendingTwoFA === null) return;
    setTwoFALoading(true);
    setTwoFAError("");
    setShowConfirm2FA(false);
    try {
      const res = await fetch("/api/2fa/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: pendingTwoFA }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFAEnabled(data.enabled);
        await updateSession({ twoFactorEnabled: data.enabled });
      } else {
        setTwoFAError(data.error || "Failed to update 2FA.");
      }
    } catch {
      setTwoFAError("Network error. Please try again.");
    } finally {
      setTwoFALoading(false);
      setPendingTwoFA(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/login" });
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsDeletingAccount(false);
      setShowConfirmDelete(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "N/A";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  } as const;
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-8 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- Profile Header --- */}
      <motion.section
        variants={itemVariants}
        className="relative bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm"
      >
        {/* Gradient bar */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent" />

        <div className="relative p-6 sm:p-12 flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 text-center sm:text-left">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-primary-500/30 p-1 shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-variant flex items-center justify-center">
                {user?.image ? (
                  <img src={user.image} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-secondary sm:w-14 sm:h-14" />
                )}
              </div>
            </div>
          </div>

          {/* Name + Email */}
          <div className="flex flex-col items-center sm:items-start gap-2 flex-1 min-w-0 w-full">
            {/* Editable Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => { setNameValue(e.target.value); setNameError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") handleCancelEdit(); }}
                  className="flex-1 text-2xl font-black bg-surface-variant border-2 border-primary-500 rounded-xl px-4 py-2 outline-none text-foreground"
                  placeholder="Your name"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="p-2.5 rounded-xl bg-primary-500 text-white shadow hover:scale-105 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {nameSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={20} />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2.5 rounded-xl bg-surface-variant border border-border-subtle text-secondary hover:scale-105 active:scale-95 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{user?.name || "Your Name"}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 rounded-xl text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all"
                  title="Edit name"
                >
                  <Pencil size={18} />
                </button>
                {nameSuccess && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-success text-sm font-bold"
                  >
                    <Check size={14} /> Saved!
                  </motion.span>
                )}
              </div>
            )}

            {nameError && (
              <p className="flex items-center gap-1.5 text-error text-sm">
                <AlertCircle size={13} /> {nameError}
              </p>
            )}

            <div className="flex items-center gap-2 text-secondary font-semibold">
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 w-full">
              <span className="flex items-center gap-1.5 bg-success/10 text-success border border-success/20 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                <ShieldCheck size={13} /> Verified Account
              </span>
              <span className="flex items-center gap-1.5 bg-primary-500/10 text-primary-600 border border-primary-500/20 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                Google OAuth
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- Main Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-8">
          {/* Account Info */}
          <motion.div
            variants={itemVariants}
            className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm"
          >
            <div className="px-8 py-6 border-b border-border-subtle">
              <h3 className="text-xl font-black flex items-center gap-2">
                <User size={20} className="text-primary-500" />
                Account Information
              </h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {[
                { label: "Full Name", value: user?.name || "—", icon: User, editable: true, onClick: () => setIsEditingName(true) },
                { label: "Email Address", value: user?.email || "—", icon: Mail, editable: false },
                { label: "Auth Provider", value: "Google OAuth", icon: ShieldCheck, editable: false },
                { label: "Expense Mode", value: user?.expenseMode === "limit" ? `Budget Mode (₹${user?.monthlyLimit?.toLocaleString("en-IN") || "0"}/mo)` : "No Limit Mode", icon: CreditCard, editable: true, onClick: () => router.push("/settings") },
                { label: "Member Since", value: memberSince, icon: Calendar, editable: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`px-6 sm:px-8 py-5 flex items-start sm:items-center justify-between gap-4 ${item.editable ? "cursor-pointer hover:bg-surface-variant/50 transition-colors" : ""}`}
                  onClick={item.onClick}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <item.icon size={16} className="text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">{item.label}</span>
                      <span className="font-bold text-sm sm:text-base break-words line-clamp-2 sm:line-clamp-none leading-tight">{item.value}</span>
                    </div>
                  </div>
                  {item.editable && (
                    <Pencil size={15} className="text-muted shrink-0 mt-1 sm:mt-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* 2FA Card */}
          <motion.div variants={itemVariants} className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-border-subtle">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Shield size={20} className="text-primary-500" />
                Two-Factor Authentication
              </h3>
            </div>
            <div className="px-8 py-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 w-full">
                  <p className="font-bold mb-1">
                    {twoFAEnabled ? "2FA is Enabled" : "2FA is Disabled"}
                  </p>
                  <p className="text-sm text-secondary leading-relaxed">
                    {twoFAEnabled
                      ? "Every login will require a 6-digit code sent to your email for extra security."
                      : "Enable 2FA to require a one-time code each time you log in, adding an extra layer of protection."}
                  </p>

                  {twoFAError && (
                    <p className="flex items-center gap-1.5 text-error text-sm mt-3">
                      <AlertCircle size={13} /> {twoFAError}
                    </p>
                  )}
                </div>

                {/* Toggle */}
                <button
                  onClick={handleTwoFAToggle}
                  disabled={twoFALoading}
                  className={`shrink-0 relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed
                    ${twoFAEnabled ? "bg-primary-500" : "bg-border-subtle"}`}
                  aria-label="Toggle 2FA"
                  role="switch"
                  aria-checked={twoFAEnabled}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300
                      ${twoFAEnabled ? "translate-x-7" : "translate-x-0"}`}
                  />
                  {twoFALoading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </span>
                  )}
                </button>
              </div>

              <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold
                ${twoFAEnabled
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-surface-variant text-secondary border border-border-subtle"}`}
              >
                {twoFAEnabled ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                {twoFAEnabled
                  ? "Your account is protected with 2FA"
                  : "Your account is not fully protected"}
              </div>
            </div>
          </motion.div>

          {/* Resources */}
          <motion.div variants={itemVariants} className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-black mb-6">Resources</h3>
            <div className="space-y-2">
              {[
                { label: "Terms of Service", icon: ShieldCheck },
                { label: "Privacy Policy", icon: Shield },
                { label: "Help Center", icon: ExternalLink },
              ].map((link) => (
                <button
                  key={link.label}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-variant/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <link.icon size={18} className="text-secondary" />
                    <span className="font-bold">{link.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants} className="bg-error/5 border border-error/20 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black text-error mb-6">Danger Zone</h3>
            <div className="space-y-3">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-surface text-error border border-error/20 hover:bg-error/5 transition-all group font-bold"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  Logout Session
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-error text-white font-bold hover:shadow-lg hover:shadow-error/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={18} />
                  Delete Account
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2FA Confirm Dialog */}
      <AnimatePresence>
        {showConfirm2FA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl max-w-sm w-full"
            >
              <div className="flex justify-center mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${pendingTwoFA ? "bg-primary-500/10" : "bg-error/10"}`}>
                  {pendingTwoFA ? (
                    <Shield size={28} className="text-primary-500" />
                  ) : (
                    <ShieldOff size={28} className="text-error" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-black text-center mb-2">
                {pendingTwoFA ? "Enable 2FA?" : "Disable 2FA?"}
              </h3>
              <p className="text-secondary text-center text-sm mb-8">
                {pendingTwoFA
                  ? "Future logins will require a 6-digit email code. A confirmation email will be sent to you."
                  : "This will remove the extra layer of protection from your account. A confirmation email will be sent to you."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm2FA(false); setPendingTwoFA(null); }}
                  className="flex-1 py-3 rounded-xl bg-surface-variant font-bold text-secondary hover:bg-surface-variant/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTwoFAToggle}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors
                    ${pendingTwoFA ? "bg-primary-500 hover:bg-primary-600" : "bg-error hover:bg-error/80"}`}
                >
                  {pendingTwoFA ? "Enable" : "Disable"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirm Dialog */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl max-w-sm w-full"
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
                  <Trash2 size={28} className="text-error" />
                </div>
              </div>
              <h3 className="text-xl font-black text-center mb-2">Delete Account?</h3>
              <p className="text-secondary text-center text-sm mb-8 leading-relaxed">
                This action is <span className="text-error font-black uppercase">permanent</span>. All your data, including expenses, incomes, and settings, will be erased forever.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-3 rounded-xl bg-surface-variant font-bold text-secondary hover:bg-surface-variant/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-3 rounded-xl bg-error hover:bg-error/80 font-bold text-white transition-colors disabled:opacity-50"
                >
                  {isDeletingAccount ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
