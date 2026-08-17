"use client";

import { motion } from "framer-motion";
import { Zap, Clock, AlertTriangle, Brain } from "lucide-react";
import { fadeUp } from "./animations";

const problems = [
  {
    icon: Clock,
    stat: "Hours wasted",
    title: "Manual tracking burns time",
    description:
      "Sorting through UPI SMS alerts, entering transactions by hand, and reconciling across PhonePe, GPay, and bank apps eats into time you could spend actually living.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    icon: AlertTriangle,
    stat: "Budget blind spots",
    title: "Overspend without realizing",
    description:
      "Without real-time alerts, most people discover they blew their budget when the credit card bill arrives — by then it is already too late to course-correct.",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
  },
  {
    icon: Brain,
    stat: "Constant worry",
    title: "Financial anxiety is constant",
    description:
      "Not knowing where your money went creates a low-grade stress that follows you everywhere — from small daily guilt to dread at the end of every month.",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1080px] mx-auto">
        {/* Headline block */}
        <div className="text-center mb-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6"
          >
            <Zap size={12} className="text-primary-500" />
            The Problem
          </motion.div>

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[700px] mx-auto mb-5"
          >
            Managing money{" "}
            <span className="text-primary-600">
              shouldn&apos;t feel like a second job.
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-[15px] text-secondary leading-relaxed max-w-[550px] mx-auto"
          >
            Most Indians know they should track spending — but existing tools
            are too manual, too generic, or give insights only after the damage
            is done.
          </motion.p>
        </div>

        {/* 3-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((card, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group p-3 md:p-6 rounded-2xl border border-border-subtle bg-surface hover:shadow-lg hover:border-primary-500/20 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${card.iconBg}`}
              >
                <card.icon size={20} className={card.iconColor} />
              </div>
              <p className="text-[22px] md:text-[24px] font-bold text-foreground mb-1 tracking-tight">
                {card.stat}
              </p>
              <h3 className="text-[15px] font-bold text-foreground mb-2">
                {card.title}
              </h3>
              <p className="text-[13px] text-secondary leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
