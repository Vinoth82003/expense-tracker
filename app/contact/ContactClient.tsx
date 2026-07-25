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
  HelpCircle,
  Check,
} from "lucide-react";
import { fadeUp } from "@/components/landing/sections/animations";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@spendwise.app";

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

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

export function ContactClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [phone, setPhone] = useState("");

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

  const trustSignals = [
    "24-hour response time",
    "No spam, ever",
    "We read every message",
  ];

  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">

        {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
        <section className="relative py-20 md:py-26 px-5 md:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            className="max-w-[720px] mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
              <Mail size={12} className="text-primary-500" />
              Get In Touch
            </div>
            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
              We&apos;re here{" "}
              <span className="text-primary-600">to help.</span>
            </h1>
            <p className="text-[16px] text-secondary leading-relaxed max-w-[520px] mx-auto">
              Have a question, found a bug, or just want to say hi?
              Send us a message and we&apos;ll get back to you quickly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {trustSignals.map((signal, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={14} className="text-success" strokeWidth={2.5} />
                  <span className="text-[12px] md:text-[13px] font-medium text-muted">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <Separator />

        {/* ═══════════════════════ CONTACT CHANNELS ═══════════════════════ */}
        <section className="py-24 md:py-32 px-5 md:px-10 bg-surface-variant">
          <div className="max-w-[1120px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
                <Phone size={12} className="text-primary-500" />
                Contact Options
              </div>
              <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground">
                Multiple ways{" "}
                <span className="text-primary-600">to reach us.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-[960px] mx-auto">
              {contactChannels.map((ch, i) => {
                const Icon = ch.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.45,
                      delay: Math.min(i * 0.06, 0.3),
                      ease: "easeOut",
                    }}
                    whileHover={{ y: -4 }}
                    className="group rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-lg hover:border-primary-500/20 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 mb-5">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      {ch.label}
                    </p>
                    {ch.href ? (
                      <a
                        href={ch.href}
                        className="text-[15px] font-bold text-foreground hover:text-primary-600 transition-colors block truncate"
                      >
                        {ch.value}
                      </a>
                    ) : (
                      <p className="text-[15px] font-bold text-foreground">
                        {ch.value}
                      </p>
                    )}
                    <p className="text-[12px] text-secondary font-medium mt-1">
                      {ch.note}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════════════════════ CONTACT FORM ═══════════════════════ */}
        <section className="py-24 md:py-32 px-5 md:px-10 bg-surface">
          <div className="max-w-[720px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
                <MessageSquare size={12} className="text-primary-500" />
                Send a Message
              </div>
              <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground">
                Let&apos;s{" "}
                <span className="text-primary-600">talk.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[500px] text-[15px] leading-relaxed text-secondary">
                Fill in the form below and we&apos;ll respond as soon as possible.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-20 px-8 text-center space-y-5"
                  >
                    <div className="w-16 h-16 bg-success/10 text-success rounded-2xl flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-bold text-foreground mb-2">
                        Message Sent!
                      </h3>
                      <p className="text-[14px] text-secondary font-medium max-w-xs mx-auto">
                        We&apos;ve received your message and will get back to you
                        within 24 hours.
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-6 py-3 bg-surface-variant rounded-2xl font-semibold text-[13px] text-foreground hover:bg-border-subtle transition-colors"
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
                    className="p-8 md:p-10 space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label
                          className="text-[12px] font-semibold text-secondary"
                          htmlFor="name"
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <User
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <input
                            required
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your name"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-variant border border-border-subtle focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold text-[14px] placeholder:text-muted/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          className="text-[12px] font-semibold text-secondary"
                          htmlFor="email"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <input
                            required
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-variant border border-border-subtle focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold text-[14px] placeholder:text-muted/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-[12px] font-semibold text-secondary"
                        htmlFor="subject"
                      >
                        Subject
                      </label>
                      <input
                        required
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="What is this about?"
                        className="w-full px-5 py-3 rounded-2xl bg-surface-variant border border-border-subtle focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold text-[14px] placeholder:text-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-[12px] font-semibold text-secondary"
                        htmlFor="message"
                      >
                        Message
                      </label>
                      <div className="relative">
                        <MessageSquare
                          size={16}
                          className="absolute left-4 top-4 text-muted"
                        />
                        <textarea
                          required
                          id="message"
                          name="message"
                          rows={5}
                          placeholder="Tell us how we can help..."
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-variant border border-border-subtle focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold text-[14px] resize-none placeholder:text-muted/50"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {status === "error" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-[13px] font-semibold"
                        >
                          <AlertCircle size={16} className="shrink-0" />
                          {errorMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      disabled={status === "loading"}
                      type="submit"
                      className="w-full py-4 bg-primary-600 text-white rounded-full font-bold text-[15px] shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
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

                    <p className="text-center text-[11px] font-medium text-muted">
                      We respect your privacy. Your data is never shared.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="mt-8 text-center">
              <p className="text-[14px] text-secondary font-medium">
                Looking for quick answers?{" "}
                <Link
                  href="/faq"
                  className="text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center gap-1"
                >
                  Browse our FAQ <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
