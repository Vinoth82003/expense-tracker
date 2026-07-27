"use client";

import { motion } from "framer-motion";
import { Check, Minus, Star } from "lucide-react";
import { fadeUp } from "./animations";

const features = [
  {
    label: "AI Financial Advisor",
    spendwise: "check",
    spreadsheet: "no",
    apps: "no",
  },
  {
    label: "Auto-Categorization",
    spendwise: "check",
    spreadsheet: "no",
    apps: "partial",
  },
  {
    label: "Real-time Analytics",
    spendwise: "check",
    spreadsheet: "no",
    apps: "partial",
  },
  {
    label: "Budget Alerts",
    spendwise: "check",
    spreadsheet: "no",
    apps: "no",
  },
  {
    label: "Multi-device Sync",
    spendwise: "check",
    spreadsheet: "partial",
    apps: "no",
  },
  {
    label: "Recurring Tracking",
    spendwise: "check",
    spreadsheet: "no",
    apps: "partial",
  },
  {
    label: "Setup Time",
    spendwise: "2 min",
    spreadsheet: "Hours",
    apps: "10 min",
    isText: true,
  },
  {
    label: "Price",
    spendwise: "Free",
    spreadsheet: "Free",
    apps: "₹500–1500/mo",
    isText: true,
  },
];

function CellIcon({ value }: { value: string }) {
  if (value === "check") {
    return (
      <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
        <Check size={14} className="text-success" strokeWidth={2.5} />
      </div>
    );
  }

  if (value === "no") {
    return <Minus size={16} className="text-muted/40" />;
  }

  if (value === "partial") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
        Partial
      </span>
    );
  }

  return null;
}

function TextCell({
  value,
  highlighted = false,
}: {
  value: string;
  highlighted?: boolean;
}) {
  return (
    <span
      className={[
        "whitespace-nowrap text-[13px] md:text-[14px]",
        highlighted
          ? "font-bold text-primary-600"
          : "font-medium text-secondary",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[960px] mx-auto">
        {/* ── Headline block ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <Star size={12} className="text-primary-500" />
            Comparison
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[620px] mx-auto">
            Why people choose{" "}
            <span className="text-primary-600">SpendWise</span>.
          </h2>
          <p className="mt-4 text-[14px] md:text-[15px] text-secondary leading-relaxed max-w-[520px] mx-auto">
            Everything you need to manage your money intelligently, without the
            manual work.
          </p>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <table className="w-full min-w-[600px]">
              {/* Header */}
              <thead>
                <tr className="border-b border-border-subtle">
                  <th
                    scope="col"
                    className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted px-6 py-4 w-[40%]"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="relative w-[20%] px-4 py-4 text-center"
                  >
                    <div className="absolute inset-0 bg-primary-500/[0.05]" />
                    <div className="relative flex items-center justify-center gap-1.5">
                      <Star
                        size={13}
                        className="fill-primary-500 text-primary-500"
                      />
                      <span className="text-[14px] font-bold text-primary-600">
                        SpendWise
                      </span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="w-[20%] px-4 py-4 text-center text-[13px] font-semibold text-secondary"
                  >
                    Spreadsheets
                  </th>
                  <th
                    scope="col"
                    className="w-[20%] px-4 py-4 text-center text-[13px] font-semibold text-secondary"
                  >
                    Basic Apps
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {features.map((row, i) => {
                  return (
                    <tr
                      key={row.label}
                      className={[
                        "group",
                        "transition-colors duration-150",
                        "hover:bg-primary-500/[0.03]",
                        i === features.findIndex((f) => f.isText)
                          ? "border-t-2 border-t-border-subtle"
                          : "",
                        i % 2 === 0 ? "bg-surface-variant/40" : "bg-surface-variant",
                      ].join(" ")} 
                    >
                      {/* Feature label */}
                      <th
                        scope="row"
                        className="px-6 py-4 text-left text-[13px] md:text-[14px] font-semibold text-foreground"
                      >
                        {row.label}
                      </th>

                      {/* SpendWise — highlighted column */}
                      <td className="relative px-4 py-4 text-center">
                        <div className="absolute inset-0 bg-primary-500/[0.05]" />
                        <div className="relative flex items-center justify-center">
                          {row.isText ? (
                            <TextCell value={row.spendwise} highlighted />
                          ) : (
                            <CellIcon value={row.spendwise} />
                          )}
                        </div>
                      </td>

                      {/* Spreadsheets */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {row.isText ? (
                            <TextCell value={row.spreadsheet} />
                          ) : (
                            <CellIcon value={row.spreadsheet} />
                          )}
                        </div>
                      </td>

                      {/* Basic Apps */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {row.isText ? (
                            <TextCell value={row.apps} />
                          ) : (
                            <CellIcon value={row.apps} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile scroll hint */}
          <div className="border-t border-border-subtle bg-surface-variant/40 px-4 py-2.5 text-center text-[10px] font-medium text-muted sm:hidden">
            Swipe horizontally to compare →
          </div>
        </motion.div>
      </div>
    </section>
  );
}
