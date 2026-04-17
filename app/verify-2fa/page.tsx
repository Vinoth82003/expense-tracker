"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, RefreshCw, ArrowRight, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

function Verify2FAContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasRequestedOTP = useRef(false);

  // Auto-send OTP on mount
  useEffect(() => {
    if (status === "authenticated" && !hasRequestedOTP.current) {
      hasRequestedOTP.current = true;
      handleSendOTP();
    }
    if (status === "unauthenticated") {
      router.push("/login");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSendOTP = async () => {
    setIsSending(true);
    setError("");
    try {
      const res = await fetch("/api/2fa/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsSent(true);
      } else {
        setError(data.error || "Failed to send OTP.");
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all 6 digits are filled
    if (index === 5 && digit) {
      const fullCode = [...newCode.slice(0, 5), digit].join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      setError("");
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr: string) => {
    setIsVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: codeStr }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(callbackUrl), 1000);
      } else {
        setError(data.error || "Invalid code. Please try again.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp size={22} color="white" strokeWidth={2.5} />
        </div>
        <span className="font-extrabold text-2xl tracking-tight">
          Spend<span className="text-primary-600">Wise</span>
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-surface border border-border-subtle rounded-3xl p-8 shadow-xl"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center">
            {success ? (
              <CheckCircle size={32} className="text-success" />
            ) : (
              <Shield size={32} className="text-primary-500" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-black text-center mb-2">Two-Factor Verification</h1>
        <p className="text-secondary text-center text-sm mb-8">
          {isSent
            ? `We sent a 6-digit code to ${session?.user?.email}`
            : "Sending your verification code..."}
        </p>

        {/* OTP Inputs */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <motion.input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isVerifying || success}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-surface-variant outline-none transition-all
                ${digit ? "border-primary-500 text-foreground" : "border-border-subtle text-secondary"}
                ${error ? "border-error" : ""}
                ${success ? "border-success text-success" : ""}
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-error text-sm justify-center mb-4"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-success text-sm justify-center mb-4 font-bold"
          >
            <CheckCircle size={14} />
            <span>Verified! Redirecting...</span>
          </motion.div>
        )}

        {/* Verify Button */}
        {!success && (
          <button
            onClick={() => handleVerify(code.join(""))}
            disabled={code.join("").length !== 6 || isVerifying || !isSent}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Verify Code
                <ArrowRight size={18} />
              </>
            )}
          </button>
        )}

        {/* Resend */}
        <div className="text-center">
          <p className="text-secondary text-sm">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={handleSendOTP}
              disabled={isSending || isVerifying}
              className="text-primary-500 font-bold hover:underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {isSending ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Resend
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Verify2FAContent />
    </Suspense>
  );
}
