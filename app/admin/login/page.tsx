"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface rounded-[3rem] p-10 shadow-2xl border border-border-subtle overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-600 to-primary-400" />
        
        <div className="text-center mb-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto text-primary-600">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter">Admin Portal</h1>
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Environment Restricted Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase pl-2">Admin Email</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant border border-border-subtle focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-sm"
                placeholder="admin@spendwise.app"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase pl-2">Security Key</label>
            <div className="relative">
              <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant border border-border-subtle focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-primary-600 text-white font-black text-lg shadow-xl shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
            {!loading && <ArrowRight size={20} strokeWidth={3} />}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black text-muted uppercase tracking-tighter">
          This panel is for authorized administrators only. <br /> All attempts are logged.
        </p>
      </motion.div>
    </main>
  );
}
