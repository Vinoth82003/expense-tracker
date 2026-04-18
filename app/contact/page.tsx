"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Mail,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        throw new Error(result.error || "Something went wrong");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 min-h-screen">
        <section className="px-5 md:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Side: Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div className="space-y-6 text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-black tracking-widest uppercase border border-primary-100"
                >
                  Contact Us
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none">
                  Let's start a <br />
                  <span className="text-primary-600 italic">conversation.</span>
                </h1>
                <p className="text-xl text-secondary max-w-lg font-medium">
                  Have a feature request, found a bug, or just want to say hi? We'd love to hear from you.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-primary-600 shadow-sm group-hover:border-primary-500/30 transition-all">
                    <Mail size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Email Us</p>
                    <p className="text-xl font-black text-foreground">support@spendwise.app</p>
                    <p className="text-sm text-secondary font-medium">Expected response: within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-primary-600 shadow-sm group-hover:border-primary-500/30 transition-all">
                    <Phone size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Call Support</p>
                    <p className="text-xl font-black text-foreground">+91 93844 60843</p>
                    <p className="text-sm text-secondary font-medium">Available 10 AM - 6 PM IST</p>
                  </div>
                </div>
              </div>

              {/* Tag logic reminder for me - will be in admin email bottom */}
              <div className="p-6 bg-surface-variant/50 rounded-3xl border border-border-subtle inline-block">
                <p className="text-xs font-bold text-muted uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success" />
                  Premium Support Enabled
                </p>
              </div>
            </motion.div>

            {/* Right Side: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border-subtle rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 blur-[80px] rounded-full" />
              
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-20 text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-success text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-success/20">
                      <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-foreground tracking-tight">Message Received!</h2>
                      <p className="text-secondary font-medium px-8">We've sent your request to the team. You'll hear back from us shortly via email.</p>
                    </div>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-8 py-4 bg-surface-variant rounded-2xl font-black text-foreground hover:bg-border-subtle transition-colors"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 relative z-10 text-left"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1" htmlFor="name">Full Name</label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            required
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Vinoth S"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant/50 border border-border-subtle focus:border-primary-500 focus:bg-surface outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1" htmlFor="email">Email Address</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            required
                            id="email"
                            name="email"
                            type="email"
                            placeholder="vinoth@example.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant/50 border border-border-subtle focus:border-primary-500 focus:bg-surface outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1" htmlFor="subject">Subject</label>
                      <input
                        required
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="How can we help you?"
                        className="w-full px-4 py-4 rounded-2xl bg-surface-variant/50 border border-border-subtle focus:border-primary-500 focus:bg-surface outline-none transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1" htmlFor="message">Message</label>
                      <div className="relative">
                        <MessageSquare size={18} className="absolute left-4 top-4 text-muted" />
                        <textarea
                          required
                          id="message"
                          name="message"
                          rows={5}
                          placeholder="Type your message here..."
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant/50 border border-border-subtle focus:border-primary-500 focus:bg-surface outline-none transition-all font-bold resize-none"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {status === "error" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-sm font-bold flex items-center gap-3"
                        >
                          <AlertCircle size={18} />
                          {errorMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      disabled={status === "loading"}
                      type="submit"
                      className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send size={20} />
                        </>
                      )}
                    </button>
                    
                    <p className="text-center text-[10px] font-bold text-muted uppercase tracking-tighter">
                      By sending this message, you agree to our contact data policy.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
