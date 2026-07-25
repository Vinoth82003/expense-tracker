"use client";

import { motion } from "framer-motion";
import { Tag, Zap, CheckCircle } from "lucide-react";
import { fadeUp } from "./animations";

export function BentoHighlights() {
  return (
    <section className="py-20 px-5 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Wide card — Tagging */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative rounded-3xl overflow-hidden border border-border-subtle min-h-[340px] flex flex-col p-8 group"
          style={{
            background:
              "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
          }}
        >
          {/* Visual mockup inside bento */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(99,102,241,0.25) 0%, transparent 70%)",
            }}
          />

          {/* Mock chart area */}
          <div className="flex-1 flex items-center justify-center mb-6 relative z-10">
            <div className="w-full max-w-xs">
              <div className="flex items-end gap-3 h-28 px-4">
                {[55, 80, 45, 95, 65, 75, 50, 85, 60, 90].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + i * 0.05,
                      ease: "easeOut",
                    }}
                    viewport={{ once: true }}
                    className="flex-1 rounded-t-md"
                    style={{
                      background:
                        i % 3 === 0
                          ? "rgba(99,102,241,0.6)"
                          : i % 3 === 1
                            ? "rgba(99,102,241,0.3)"
                            : "rgba(99,102,241,0.15)",
                    }}
                  />
                ))}
              </div>
              {/* Fake labels */}
              <div className="flex justify-between px-4 mt-2">
                {["Needs", "Wants", "Invest"].map((l) => (
                  <span
                    key={l}
                    className="text-[9px] font-black text-muted uppercase tracking-widest"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
              style={{
                background: "rgba(99,102,241,0.08)",
                borderColor: "rgba(99,102,241,0.2)",
                color: "#6366f1",
              }}
            >
              <Tag size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">
              Granular Tagging Systems
            </h3>
            <p className="text-sm text-secondary font-medium leading-relaxed max-w-md">
              Categorize every expense with custom forensic labels and
              multi-level tagging hierarchies.
            </p>
          </div>
        </motion.div>

        {/* Narrow accent card — Instant Insights */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden border min-h-[340px] flex flex-col p-8"
          style={{
            background:
              "linear-gradient(145deg, #6366f1 0%, #4f46e5 100%)",
            borderColor: "rgba(99,102,241,0.4)",
          }}
        >
          <div className="flex-1 flex items-center justify-center">
            {/* Animated pulse icon */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.15)" }}
              >
                <Zap size={36} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-40" />
              <div className="absolute inset-[-12px] rounded-full border border-white/15 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-white/80" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                AI Powered
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">
              Instant Insight Generation
            </h3>
            <p className="text-sm font-medium text-white/90 leading-relaxed">
              Get a forensic overview of your monthly health in under 2 seconds
              with our optimised edge engine.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
