"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface OTPActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
  actionButtonText: string;
}

export function OTPActionModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  actionButtonText,
}: OTPActionModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"send" | "verify">("send");

  const sendOTP = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/2fa/send", { method: "POST" });
      if (res.ok) {
        setStep("verify");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const verifyAndExecute = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: fullOtp }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid verification code.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep("send");
      setOtp(["", "", "", "", "", ""]);
      setError("");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-error/10 text-error flex items-center justify-center shadow-inner">
                <Shield size={40} />
              </div>

              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">{title}</h3>
                <p className="text-sm text-secondary font-medium mt-2 leading-relaxed">
                  {description}
                </p>
              </div>

              {step === "send" ? (
                <div className="w-full space-y-4">
                  <div className="p-4 bg-surface-variant/50 rounded-2xl border border-border-subtle flex items-start gap-3 text-left">
                    <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-secondary">
                      For your security, this action requires a one-time verification code sent to your email address.
                    </p>
                  </div>
                  <button
                    onClick={sendOTP}
                    disabled={sending}
                    className="w-full py-4 bg-foreground text-background font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : "Request Verification Code"}
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-8">
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-surface-variant/30 border-2 border-border-subtle rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-error text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-error/10 py-3 rounded-xl border border-error/20"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={verifyAndExecute}
                      disabled={loading || otp.some((d) => !d)}
                      className="w-full py-4 bg-error text-white font-black rounded-2xl shadow-xl shadow-error/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={20} className="animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        actionButtonText
                      )}
                    </button>

                    <button
                      onClick={sendOTP}
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-2 text-xs font-black text-muted hover:text-primary-500 transition-colors uppercase tracking-widest"
                    >
                      <RefreshCw size={14} className={sending ? "animate-spin" : ""} />
                      Resend Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Background pattern */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-error/5 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
