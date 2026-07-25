"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, Lock, Zap } from "lucide-react";
import { fadeUp } from "./animations";

export function FinalCTA() {
  return (
    <section className="py-28 px-5 md:px-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative rounded-3xl overflow-hidden border border-border-subtle text-center p-12 md:p-20"
          style={{
            background:
              "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
          }}
        >
          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 blur-[100px] pointer-events-none -z-10"
            style={{ background: "rgba(99,102,241,0.1)" }}
          />

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-8"
            style={{
              borderColor: "rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.07)",
              color: "#6366f1",
            }}
          >
            <Zap size={12} /> Zero Cost, Maximum Clarity
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[0.95]">
            Your Wallet,{" "}
            <span className="italic text-indigo-600 dark:text-indigo-400">
              Redefined.
            </span>
          </h2>

          <p className="text-lg text-secondary font-medium max-w-xl mx-auto mb-10">
            Join 10,000+ Indians taking full control of their financial destiny.
            Free forever. No credit card. No surprises.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              id="cta-start-free"
              aria-label="Start free today with SpendWise"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base transition-all hover:-translate-y-1 active:scale-95 shadow-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Start Free Today
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/download"
              id="cta-install-app"
              aria-label="Install SpendWise progressive web app"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base border border-border-subtle text-secondary hover:text-foreground hover:border-indigo-600/40 dark:hover:border-indigo-400/40 transition-all"
            >
              <Download size={18} />
              Install App
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-muted text-[11px] font-black uppercase tracking-widest">
            <Lock size={12} />
            Bank-grade security · No credit card required
          </div>
        </motion.div>
      </div>
    </section>
  );
}
