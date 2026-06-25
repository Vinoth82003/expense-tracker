"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Clock,
  ArrowRight,
} from "lucide-react";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@spendwise.app";

// Phone parts are joined on the client to prevent static scraping.
// Parts: country code, first half, second half
const PHONE_PARTS = ["+91", " 93844", " 60843"];

function buildContactChannels(phone: string) {
  return [
    {
      icon: Mail,
      label: "Email Support",
      value: supportEmail,
      href: `mailto:${supportEmail}`,
      note: "Response within 24 hours",
    },
    {
      icon: Phone,
      label: "Indian Helpline",
      value: phone || "Loading...",
      href: phone ? `tel:${phone.replace(/\s/g, "")}` : null,
      note: "Available 10 AM – 6 PM IST",
    },
    {
      icon: Clock,
      label: "Response Time",
      value: "< 24 Hours",
      href: null,
      note: "On all business days",
    },
  ];
}

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [phone, setPhone] = useState("");

  // Assemble phone number on the client to avoid static scraping
  useEffect(() => {
    setPhone(PHONE_PARTS.join(""));
  }, []);

  const contactChannels = buildContactChannels(phone);

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

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-36 pb-20 px-5 md:px-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-600 text-[10px] font-black tracking-widest uppercase mb-6"
          >
            <Mail size={12} />
            Get In Touch
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4 text-foreground"
          >
            We're here to help
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="text-lg text-secondary font-medium max-w-xl mx-auto"
          >
            Have a question, found a bug, or just want to say hi? 
            Send us a message and we'll get back to you quickly.
          </motion.p>
        </section>

        {/* Contact Cards + Form */}
        <section className="pb-24 px-5 md:px-10 max-w-5xl mx-auto">
          {/* Info Cards Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
          >
            {contactChannels.map((ch, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-surface border border-border-subtle flex items-start gap-4 group hover:border-primary-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <ch.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{ch.label}</p>
                  {ch.href ? (
                    <a
                      href={ch.href}
                      className="text-sm font-black text-foreground hover:text-primary-600 transition-colors truncate block"
                    >
                      {ch.value}
                    </a>
                  ) : (
                    <p className="text-sm font-black text-foreground">{ch.value}</p>
                  )}
                  <p className="text-xs text-muted font-medium mt-0.5">{ch.note}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-surface border border-border-subtle rounded-3xl p-8 md:p-12 max-w-2xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center space-y-5"
                >
                  <div className="w-16 h-16 bg-success text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-success/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground mb-2">Message Sent!</h2>
                    <p className="text-secondary font-medium text-sm max-w-xs mx-auto">
                      We've received your message and will get back to you within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setStatus("idle")}
                    className="px-6 py-3 bg-surface-variant rounded-xl font-black text-sm text-foreground hover:bg-border-subtle transition-colors"
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
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black text-foreground mb-1">Send a Message</h2>
                    <p className="text-sm text-secondary font-medium">
                      Fill in the form below — we'll respond as soon as possible.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest" htmlFor="name">
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          required
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Your name"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all font-semibold text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest" htmlFor="email">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          required
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all font-semibold text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest" htmlFor="subject">
                      Subject
                    </label>
                    <input
                      required
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="What is this about?"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all font-semibold text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest" htmlFor="message">
                      Message
                    </label>
                    <div className="relative">
                      <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-muted" />
                      <textarea
                        required
                        id="message"
                        name="message"
                        rows={5}
                        placeholder="Tell us how we can help..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border-subtle focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all font-semibold text-sm resize-none"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {status === "error" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-bold"
                      >
                        <AlertCircle size={16} className="shrink-0" />
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    disabled={status === "loading"}
                    type="submit"
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-black text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] font-bold text-muted uppercase tracking-wider">
                    We respect your privacy. Your data is never shared.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Alternative CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-secondary font-medium">
              Looking for quick answers?{" "}
              <Link href="/faq" className="text-primary-600 font-black hover:underline inline-flex items-center gap-1">
                Browse our FAQ <ArrowRight size={14} />
              </Link>
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
