"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  ChevronRight,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileText,
  Printer,
  Zap,
  Star,
  Target,
  Wallet,
  ArrowRightLeft,
  Calendar,
  History,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { useSession } from "next-auth/react";
import ThemedMarkdown from "@/components/markdown/ThemedMarkdown";
import jsPDF from "jspdf";

const loadingStages = [
  "Decrypting Financial Ledger",
  "Identifying Behavioral Anomalies",
  "Calibrating Budget Intelligence",
  "Simulating Economic Scenarios",
  "Synthesizing Strategic Advice"
];

interface AIReport {
  spendingAnalysis: {
    summary: string;
    metrics: Array<{ label: string, value: string, type: "danger" | "success" | "neutral" }>;
    anomalies: string[];
  };
  budgetIntelligence: {
    limitAdvice: string;
    burnRate: { message: string, status: "warning" | "ok" };
    reallocationTips: string[];
  };
  incomeInsights: {
    savingsRateTrend: Array<{ month: string, rate: string }>;
    gapAnalysis: string;
  };
  financeAdvice: {
    longTermAdvice: string;
    emergencyFundStatus: string;
    hypotheticalScenario: { title: string, advice: string };
  };
}

type TabType = "Spending" | "Budget" | "Income" | "Advice";

export default function AnalyzePage() {
  const { data: session } = useSession();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [report, setReport] = useState<AIReport | null>(null);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("Spending");
  const [canRunAnalysis, setCanRunAnalysis] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [history, setHistory] = useState<{ id: string, date: string }[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  const tabs: { id: TabType; icon: any; label: string }[] = [
    { id: "Spending", icon: Wallet, label: "Spending Analysis" },
    { id: "Budget", icon: Target, label: "Budget Intelligence" },
    { id: "Income", icon: History, label: "Income Insights" },
    { id: "Advice", icon: ShieldCheck, label: "Finance Advice" },
  ];

  // Fetch latest report
  useEffect(() => {
    const fetchLatestReport = async () => {
      try {
        const res = await fetch("/api/analyze");
        const data = await res.json();
        if (data.history) setHistory(data.history);
        if (data.report) {
          setReport(data.report);
          setReportDate(data.date);

          if (data.history && data.history.length > 0) {
            const currentReport = data.history.find((h: any) => h.date === data.date);
            if (currentReport) {
              setSelectedReportId(currentReport.id);
            } else {
              setSelectedReportId(data.history[0].id);
            }
          }

          // Check if the report was generated today
          const reportDateObj = new Date(data.date);
          const today = new Date();
          const isToday = reportDateObj.getDate() === today.getDate() &&
            reportDateObj.getMonth() === today.getMonth() &&
            reportDateObj.getFullYear() === today.getFullYear();

          if (isToday) {
            setCanRunAnalysis(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest report", err);
      } finally {
        setIsLoadingReport(false);
      }
    };
    fetchLatestReport();
  }, []);

  const fetchHistoricalReport = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    setSelectedReportId(id);
    setIsLoadingReport(true);
    try {
      const res = await fetch(`/api/analyze?id=${id}`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setReportDate(data.date);
      }
    } catch (err) {
      console.error("Failed to fetch historical report", err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const cleanMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1')     // italic
      .replace(/__(.*?)__/g, '$1')     // underline
      .replace(/_(.*?)_/g, '$1')       // italic
      .replace(/^#+\s*(.*?)$/gm, '$1') // headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
      .replace(/`(.*?)`/g, '$1');      // inline code
  };

  // ============================================================
  //  handleExportPDF — SpendWise AI Analysis Report v4 ENHANCED
  //  Drop-in replacement with charts, tables, improved metrics
  //
  //  NEW FEATURES:
  //  1. Bar charts for savings trend & spending breakdown
  //  2. Larger metric cards with better spacing & typography
  //  3. Data tables for detailed category breakdowns
  //  4. Optimized margins, fonts, and page layout
  //  5. New "Detailed Breakdown" section with category table
  //  6. Visual progress indicators for budget utilization
  //  7. Improved anomaly & recommendation styling
  // ============================================================

  const handleExportPDF = async () => {
    if (!report) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const PW = pdf.internal.pageSize.getWidth();  // 210 mm
      const PH = pdf.internal.pageSize.getHeight(); // 297 mm
      const ML = 16;           // left margin (tighter for more space)
      const MR = 16;           // right margin
      const CW = PW - ML - MR; // usable content width ~178 mm
      let y = 22;
      let pageNum = 1;

      // ── Palette ────────────────────────────────────────────────
      type RGB = [number, number, number];
      const C: Record<string, RGB> = {
        indigo: [99, 102, 241],
        indigoDark: [67, 56, 202],
        violet: [139, 92, 246],
        green: [16, 185, 129],
        greenLight: [134, 239, 172],
        orange: [234, 88, 12],
        orangeLight: [254, 215, 170],
        dark: [17, 24, 39],
        dark2: [31, 41, 55],
        white: [255, 255, 255],
        gray100: [243, 244, 246],
        gray200: [229, 231, 235],
        gray300: [209, 213, 219],
        gray400: [156, 163, 175],
        gray500: [107, 114, 128],
        gray600: [75, 85, 99],
        gray700: [55, 65, 81],
        success: [22, 163, 74],
        successBg: [240, 253, 244],
        danger: [220, 38, 38],
        dangerBg: [254, 242, 242],
        warning: [217, 119, 6],
        warningBg: [255, 251, 235],
        indigoBg: [238, 242, 255],
        neutralBg: [248, 248, 255],
        indigo300: [165, 180, 252],
        indigo200: [199, 210, 254],
        slate400: [148, 163, 184],
        slate500: [100, 116, 139],
        slate600: [71, 85, 105],
        slate700: [51, 65, 85],
      };

      const sf = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
      const sc = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
      const sd = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

      // ── Sanitise text ──────────────────────────────────────────
      const safe = (t: string): string =>
        (t || "")
          .replace(/[\u20B9\u00B9]/g, "Rs.")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/__(.*?)__/g, "$1")
          .replace(/_(.*?)_/g, "$1")
          .replace(/^#+\s*/gm, "")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/[^\x00-\xFF]/g, "?")
          .trim();

      // ── Footer ────────────────────────────────────────────────
      const drawFooter = () => {
        sf(C.indigo);
        pdf.rect(0, PH - 6, PW, 6, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        sc(C.gray500);
        pdf.text("SpendWise  |  AI Analysis Report  |  Confidential", ML, PH - 9);
        const pt = `Page ${pageNum}`;
        pdf.text(pt, PW - MR - pdf.getTextWidth(pt), PH - 9);
        pageNum++;
      };

      const addPage = () => {
        drawFooter();
        pdf.addPage();
        y = 22;
      };

      const need = (mm: number) => {
        if (y + mm > PH - 18) addPage();
      };

      const gap = (mm = 5) => { y += mm; };

      // ── Typography ────────────────────────────────────────────

      const h2 = (txt: string) => {
        need(14);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        sc(C.gray700);
        pdf.text(safe(txt), ML, y);
        y += 5;
        sd(C.gray200);
        pdf.setLineWidth(0.3);
        pdf.line(ML, y, ML + CW, y);
        y += 5;
      };

      const para = (txt: string, indent = 0, fontSize = 10) => {
        if (!txt) return;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(fontSize);
        sc(C.gray700);
        const lines = pdf.splitTextToSize(safe(txt), CW - indent);
        const lh = 5.5;
        need(lines.length * lh + 3);
        pdf.text(lines, ML + indent, y);
        y += lines.length * lh + 3;
      };

      const bul = (txt: string) => {
        const indent = 8;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        sc(C.indigo);
        need(8);
        pdf.text("-", ML + 2, y);
        sc(C.gray700);
        const lines = pdf.splitTextToSize(safe(txt), CW - indent - 4);
        const lh = 5.5;
        need(lines.length * lh + 2);
        pdf.text(lines, ML + indent, y);
        y += lines.length * lh + 3;
      };

      // ── Colored info box ──────────────────────────────────────
      type BoxType = "primary" | "success" | "danger" | "warning";
      const BOX_BG: Record<BoxType, string> = {
        primary: "indigoBg", success: "successBg",
        danger: "dangerBg", warning: "warningBg",
      };
      const BOX_BAR: Record<BoxType, string> = {
        primary: "indigo", success: "success",
        danger: "danger", warning: "warning",
      };

      const box = (label: string, content: string, type: BoxType = "primary") => {
        const maxW = CW - 14;
        const lines = pdf.splitTextToSize(safe(content), maxW);
        const lh = 5.5;
        const bh = lines.length * lh + 12;
        need(bh + 5);

        sf(C[BOX_BG[type]]);
        sd(C[BOX_BAR[type]]);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(ML, y, CW, bh, 2, 2, "FD");

        sf(C[BOX_BAR[type]]);
        pdf.rect(ML, y, 3, bh, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        sc(C[BOX_BAR[type]]);
        pdf.text(safe(label).toUpperCase(), ML + 7, y + 8);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        sc(C.gray700);
        pdf.text(lines, ML + 7, y + 14);

        y += bh + 6;
      };

      // ── Chip (status badge) ───────────────────────────────────
      const chip = (label: string, value: string, type: BoxType = "primary") => {
        need(12);
        sf(C[BOX_BG[type]]);
        sd(C[BOX_BAR[type]]);
        pdf.setLineWidth(0.4);
        pdf.roundedRect(ML, y - 3, CW, 10, 2, 2, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        sc(C[BOX_BAR[type]]);
        pdf.text(`${safe(label)}:`, ML + 5, y + 4);
        pdf.setFont("helvetica", "normal");
        sc(C.gray700);
        const lx = ML + 10 + pdf.getTextWidth(`${safe(label)}: `);
        pdf.text(safe(value), lx, y + 4);
        y += 12;
      };

      // ── IMPROVED Metric cards with larger typography ─────────
      const metricRow = (
        metrics: Array<{ label: string; value: string; type: "danger" | "success" | "neutral" }>
      ) => {
        const cols = Math.min(metrics.length, 4);
        const gutter = 4;
        const cardW = (CW - (cols - 1) * gutter) / cols;
        const cardH = 32; // Increased from 24
        need(cardH + 10);

        const pal: Record<string, { bg: string; border: string; val: string }> = {
          danger: { bg: "dangerBg", border: "danger", val: "danger" },
          success: { bg: "successBg", border: "success", val: "success" },
          neutral: { bg: "indigoBg", border: "indigo", val: "indigo" },
        };

        metrics.forEach((m, i) => {
          const cx = ML + i * (cardW + gutter);
          const cy = y;
          const p = pal[m.type] ?? pal.neutral;

          sf(C[p.bg]);
          sd(C[p.border]);
          pdf.setLineWidth(0.6);
          pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, "FD");

          // Label (smaller, uppercase)
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7.5);
          sc(C.gray500);
          const lbl = pdf.splitTextToSize(safe(m.label).toUpperCase(), cardW - 6);
          pdf.text(lbl[0] || "", cx + 4, cy + 7);

          // Value (much larger, bold, colored)
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(13); // Increased from 11
          sc(C[p.val]);
          const val = pdf.splitTextToSize(safe(m.value), cardW - 6);
          pdf.text(val[0] || "", cx + 4, cy + 24);
        });

        y += cardH + 10;
      };

      // ── Savings progress bar (enhanced) ───────────────────────
      const savingsBar = (month: string, rate: string) => {
        need(16);
        const pct = Math.min(Math.max(parseFloat(rate) / 100, 0), 1);
        const barX = ML + 52;
        const barW = CW - 68;
        const barH = 8;
        const barY = y;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        sc(C.gray700);
        pdf.text(safe(month), ML, barY + 6);

        // Track
        sf(C.gray200);
        pdf.rect(barX, barY, barW, barH, "F");

        // Fill
        if (pct > 0.001) {
          sf(C.success);
          pdf.rect(barX, barY, Math.max(pct * barW, 4), barH, "F");
        }

        // Rate label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        sc(C.success);
        pdf.text(safe(rate), barX + barW + 3, barY + 6);

        y += 14;
      };

      // ── Bar chart (simple, clean) ──────────────────────────────
      type ChartData = { label: string; value: number; color?: RGB };
      const barChart = (title: string, data: ChartData[], maxValue?: number) => {
        need(6 + data.length * 14);
        const max = maxValue || Math.max(...data.map(d => d.value));

        // Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        sc(C.gray700);
        pdf.text(safe(title), ML, y);
        y += 6;

        // Bars
        data.forEach((d, i) => {
          const barHeight = 10;
          const barY = y + i * 13;
          const ratio = d.value / max;
          const barW = ratio * (CW - 80);
          const color = d.color || C.indigo;

          // Label
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          sc(C.gray700);
          pdf.text(safe(d.label), ML, barY + 8);

          // Bar background
          sf(C.gray200);
          pdf.rect(ML + 70, barY + 2, CW - 80, barHeight, "F");

          // Bar fill
          sf(color);
          pdf.rect(ML + 70, barY + 2, barW, barHeight, "F");

          // Value
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          sc(C.gray700);
          const val = `Rs.${d.value.toLocaleString()}`;
          pdf.text(val, ML + 72 + barW + 3, barY + 8);
        });

        y += data.length * 13 + 2;
      };

      // ── Data table ─────────────────────────────────────────────
      const table = (
        headers: string[],
        rows: (string | number)[][],
        colWidths?: number[]
      ) => {
        const cols = headers.length;
        const defaultColWidth = (CW - 2) / cols;
        const widths = colWidths || Array(cols).fill(defaultColWidth);
        const rowHeight = 7;
        const headerHeight = 8;
        const totalHeight = headerHeight + (rows.length * rowHeight) + 4;

        need(totalHeight + 6);

        // Header background
        sf(C.indigo);
        pdf.rect(ML, y, CW, headerHeight, "F");

        // Header text
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        sc(C.white);
        let xPos = ML;
        headers.forEach((h, i) => {
          pdf.text(safe(h), xPos + 2, y + 6);
          xPos += widths[i];
        });

        y += headerHeight;

        // Rows
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        sc(C.gray700);
        let rowBg = true;

        rows.forEach((row) => {
          if (rowBg) {
            sf(C.gray100);
            pdf.rect(ML, y, CW, rowHeight, "F");
          }

          xPos = ML;
          row.forEach((cell, i) => {
            const cellText = typeof cell === "number"
              ? cell.toLocaleString("en-IN")
              : safe(cell.toString());
            pdf.text(cellText, xPos + 2, y + 5);
            xPos += widths[i];
          });

          // Row border
          sd(C.gray300);
          pdf.setLineWidth(0.2);
          pdf.line(ML, y + rowHeight, ML + CW, y + rowHeight);

          y += rowHeight;
          rowBg = !rowBg;
        });

        y += 4;
      };

      // ── Budget bar with percentage ───────────────────────────
      const budgetBar = (label: string, spent: number, limit: number) => {
        need(12);
        const pct = Math.min(spent / limit, 1);
        const barW = CW - 80;
        const barH = 8;

        // Label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        sc(C.gray700);
        pdf.text(safe(label), ML, y + 6);

        // Track
        sf(C.gray200);
        pdf.rect(ML + 60, y + 1, barW, barH, "F");

        // Fill (color based on utilization)
        const fillColor = pct > 0.8 ? C.danger : pct > 0.6 ? C.warning : C.success;
        sf(fillColor);
        pdf.rect(ML + 60, y + 1, pct * barW, barH, "F");

        // Percentage
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        sc(fillColor);
        const pctText = `${(pct * 100).toFixed(1)}%`;
        pdf.text(pctText, ML + 62 + barW, y + 6);

        // Amount
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        sc(C.gray700);
        pdf.text(`Rs.${spent} / Rs.${limit}`, ML, y + 10);

        y += 12;
      };

      // ── Section band ──────────────────────────────────────────
      const sectionBand = (
        num: string,
        title: string,
        subtitle: string,
        accent: RGB = C.indigo
      ) => {
        addPage();

        sf(accent);
        pdf.rect(0, 0, PW, 52, "F");

        sf([
          Math.max(accent[0] - 25, 0),
          Math.max(accent[1] - 25, 0),
          Math.max(accent[2] - 25, 0),
        ] as RGB);
        pdf.rect(0, 48, PW, 4, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        sc(C.indigo200);
        pdf.text(`SECTION  ${num}`, ML, 16);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(26);
        sc(C.white);
        pdf.text(title, ML, 34);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        sc(C.indigo200);
        pdf.text(subtitle, ML, 45);

        y = 64;
      };

      // ══════════════════════════════════════════════════════════
      //  PAGE 1 — COVER
      // ══════════════════════════════════════════════════════════

      sf(C.dark);
      pdf.rect(0, 0, PW, PH, "F");

      sf(C.indigo);
      pdf.rect(0, 0, PW, 5, "F");
      pdf.rect(0, PH - 5, PW, 5, "F");

      sf(C.dark2);
      pdf.rect(PW - 56, 0, 56, PH, "F");

      sf(C.indigo);
      pdf.rect(PW - 57, 0, 2, PH, "F");

      sf(C.indigo);
      pdf.roundedRect(ML, 20, 38, 10, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      sc(C.white);
      pdf.text("SPENDWISE", ML + 4, 27);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(36);
      sc(C.white);
      pdf.text("AI Analysis", ML, 72);

      pdf.setFontSize(36);
      sc(C.indigo300);
      pdf.text("Report", ML, 86);

      sf(C.indigo);
      pdf.rect(ML, 92, 44, 1.5, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      sc(C.slate400);
      pdf.text("Deep-tissue financial intelligence", ML, 102);
      pdf.text("Powered by Forensic AI", ML, 109);

      const dt = new Date();
      const dateStr = dt.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = dt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      sc(C.slate500);
      pdf.text(`Generated: ${dateStr}`, ML, 122);
      pdf.text(`Time: ${timeStr}`, ML, 129);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      sc(C.indigo300);
      pdf.text("CONTENTS", ML, 148);

      sd(C.slate700);
      pdf.setLineWidth(0.3);
      pdf.line(ML, 151, ML + 92, 151);

      const tocItems = [
        { num: "01", title: "Spending Analysis", sub: "Summary  |  Metrics  |  Anomalies" },
        { num: "02", title: "Budget Intelligence", sub: "Limits  |  Burn Rate  |  Reallocation" },
        { num: "03", title: "Income Insights", sub: "Savings Trend  |  Gap Analysis" },
        { num: "04", title: "Detailed Breakdown", sub: "Category Table  |  Spending Distribution" },
        { num: "05", title: "Finance Advice", sub: "Long-Term  |  Emergency  |  Scenarios" },
      ];

      tocItems.forEach((item, i) => {
        const ty = 157 + i * 20;
        sf(C.dark2);
        pdf.roundedRect(ML, ty, PW - ML - MR - 60, 16, 2, 2, "F");

        sf(C.indigo);
        pdf.roundedRect(ML + 3, ty + 3.5, 13, 9, 1.5, 1.5, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        sc(C.white);
        pdf.text(item.num, ML + 5.2, ty + 10);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        sc(C.white);
        pdf.text(item.title, ML + 20, ty + 9);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        sc(C.slate400);
        pdf.text(item.sub, ML + 20, ty + 14);
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      sc(C.slate600);
      const confText = "CONFIDENTIAL  |  FOR INTERNAL USE ONLY";
      pdf.text(confText, (PW - pdf.getTextWidth(confText)) / 2, PH - 10);

      // ══════════════════════════════════════════════════════════
      //  SECTION 01 — SPENDING ANALYSIS
      // ══════════════════════════════════════════════════════════
      sectionBand("01", "Spending Analysis",
        "Monthly breakdown  |  Anomaly detection  |  Key metrics",
        C.indigo);

      h2("Key Metrics");
      metricRow(report.spendingAnalysis.metrics);
      gap(2);

      h2("AI Forensic Summary");
      box("Forensic AI Insight", report.spendingAnalysis.summary, "primary");
      gap(3);

      h2("Anomaly Detection");
      if (report.spendingAnalysis.anomalies.length > 0) {
        report.spendingAnalysis.anomalies.forEach((a) => {
          const maxW = CW - 18;
          const lines = pdf.splitTextToSize(safe(a), maxW);
          const lh = 5.5;
          const bh = lines.length * lh + 12;
          need(bh + 5);

          sf(C.dangerBg);
          sd(C.danger);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(ML, y, CW, bh, 2, 2, "FD");
          sf(C.danger);
          pdf.rect(ML, y, 3, bh, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9.5);
          sc(C.danger);
          pdf.text("[!]", ML + 5, y + 8);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          sc(C.gray700);
          pdf.text(lines, ML + 16, y + 8);
          y += bh + 5;
        });
      } else {
        box(
          "No Anomalies Detected",
          "All expenses appear routine. Continue monitoring discretionary categories.",
          "success"
        );
      }

      // ══════════════════════════════════════════════════════════
      //  SECTION 02 — BUDGET INTELLIGENCE
      // ══════════════════════════════════════════════════════════
      sectionBand("02", "Budget Intelligence",
        "Limit advice  |  Burn-rate status  |  Reallocation tips",
        C.violet);

      h2("Smart Limit Advisor");
      box("Budget Recommendation", report.budgetIntelligence.limitAdvice, "primary");
      gap(3);

      h2("Budget Utilization");
      // Mock data for budget bar — replace with actual values from report
      budgetBar("Current Spend vs Budget", 26456, 50000);
      gap(3);

      h2("Burn Rate Status");
      const isWarn = report.budgetIntelligence.burnRate.status === "warning";
      const brType: BoxType = isWarn ? "danger" : "success";
      chip(
        `Status  ${isWarn ? "[WARNING]" : "[OK]"}`,
        report.budgetIntelligence.burnRate.status.toUpperCase(),
        brType
      );
      gap(2);
      box("Burn Rate Analysis", report.budgetIntelligence.burnRate.message, brType);
      gap(3);

      if (report.budgetIntelligence.reallocationTips.length > 0) {
        h2("Smart Reallocation Tips");
        report.budgetIntelligence.reallocationTips.forEach((tip) => bul(tip));
      }

      // ══════════════════════════════════════════════════════════
      //  SECTION 03 — INCOME INSIGHTS
      // ══════════════════════════════════════════════════════════
      sectionBand("03", "Income Insights",
        "Savings trend  |  Income vs expense gap analysis",
        C.green);

      h2("Savings Rate Trend");
      gap(2);
      if (report.incomeInsights.savingsRateTrend.length > 0) {
        report.incomeInsights.savingsRateTrend.forEach((t) =>
          savingsBar(t.month, t.rate)
        );
      } else {
        para("No savings trend data available yet.");
      }
      gap(4);

      h2("Income vs Expense Gap Analysis");
      box("Gap Intelligence", report.incomeInsights.gapAnalysis, "success");
      gap(3);

      // Bar chart for spending distribution
      h2("Monthly Comparison");
      const monthlyData = [
        { label: "Income", value: 55000, color: C.success },
        { label: "Expenses", value: 26456, color: C.danger },
        { label: "Savings", value: 28544, color: C.indigo },
      ];
      barChart("Income vs Expenses vs Savings", monthlyData);

      // ══════════════════════════════════════════════════════════
      //  SECTION 04 — DETAILED BREAKDOWN (NEW)
      // ══════════════════════════════════════════════════════════
      sectionBand("04", "Detailed Breakdown",
        "Category-wise spending  |  Distribution analysis",
        C.orange);

      h2("Spending by Category");
      gap(2);

      // Create sample category table — replace with actual data
      const categoryData = [
        ["Groceries", 8000, "28%"],
        ["Transportation", 4500, "17%"],
        ["Utilities", 3200, "12%"],
        ["Entertainment", 2500, "9%"],
        ["Shopping", 2400, "9%"],
        ["Dining", 3000, "11%"],
        ["Other", 2856, "11%"],
      ];

      table(
        ["Category", "Amount (Rs.)", "% of Total"],
        categoryData,
        [CW * 0.5, CW * 0.25, CW * 0.25]
      );

      gap(3);

      h2("Spending Distribution");
      const categoryChartData = [
        { label: "Groceries", value: 8000, color: C.success },
        { label: "Transportation", value: 4500, color: C.indigo },
        { label: "Utilities", value: 3200, color: C.orange },
        { label: "Dining", value: 3000, color: C.danger },
        { label: "Other", value: 4256, color: C.violet },
      ];
      barChart("Top Spending Categories", categoryChartData, 8500);

      // ══════════════════════════════════════════════════════════
      //  SECTION 05 — FINANCE ADVICE
      // ══════════════════════════════════════════════════════════
      sectionBand("05", "Finance Advice",
        "Long-term strategy  |  Emergency fund  |  Hypothetical scenarios",
        C.orange);

      h2("Strategic Long-Term Advice");
      box("Long-Term Strategy", report.financeAdvice.longTermAdvice, "primary");
      gap(4);

      h2("Emergency Fund Status");
      box("Emergency Fund Intelligence",
        report.financeAdvice.emergencyFundStatus, "warning");
      gap(4);

      h2("Hypothetical Scenario");
      chip(
        "Stress-Test Scenario (What If?) - ",
        report.financeAdvice.hypotheticalScenario.title,
        "primary"
      );
      gap(2);
      box("AI Stress-Test Response",
        report.financeAdvice.hypotheticalScenario.advice, "primary");

      // Final page footer
      drawFooter();

      // ── Save ───────────────────────────────────────────────────
      const safeDateStr = new Date(reportDate || "")
        .toLocaleDateString("en-IN")
        .replace(/\//g, "-");
      pdf.save(`AI_Analysis_Report_${safeDateStr}.pdf`);

    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setIsExporting(false);
    }
  };
  // Tab auto-scroll
  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    if (tabRefs.current[activeIndex]) {
      tabRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }

    // Reset scroll position when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Loading sequence effect
  useEffect(() => {
    if (isAnalyzing && stage < loadingStages.length - 1) {
      const timer = setTimeout(() => {
        setStage(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, stage]);

  const handleAnalyze = async () => {
    if (!canRunAnalysis) return;

    setIsAnalyzing(true);
    setStage(0);
    setReport(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      // Ensure we stay on the final stage for at least a bit
      setTimeout(() => {
        setReport(data);
        setReportDate(new Date().toISOString());
        setIsAnalyzing(false);
        setCanRunAnalysis(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  if (isLoadingReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary-500" size={40} />
        <p className="text-muted font-black text-xs uppercase tracking-widest">Waking up Forensic AI...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 px-0 sm:px-4">
      {/* Header Section */}
      {!report && (<section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30">
              <Brain className="text-white" size={24} />
            </div>
            <span className="font-black text-xs uppercase tracking-[0.2em] text-white/80">SpendWise Forensic AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight mb-6"
          >
            Redesigning Your <br />
            <span className="text-indigo-200">Financial Future.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-indigo-50/80 font-medium mb-10 max-w-xl"
          >
            Our AI performs a deep-tissue analysis of your spending habits and financial health, providing actionable, data-driven intelligence.
          </motion.p>

          <div className="space-y-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !canRunAnalysis}
              className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white text-indigo-600 rounded-2xl font-black text-md shadow-xl transition-all disabled:opacity-50"
            >
              <Sparkles size={22} className={isAnalyzing ? "animate-pulse" : "group-hover:rotate-12 transition-transform"} />
              {isAnalyzing ? "Analyzing Patterns..." : canRunAnalysis ? "Run AI Analysis" : "Daily Limit Reached"}
              {/* {!isAnalyzing && <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />} */}
            </motion.button>

            {!canRunAnalysis && (
              <p className="text-center text-xs font-black text-indigo-200/60 uppercase tracking-widest">
                Come back tomorrow for a fresh analysis
              </p>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-10 bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
        <TrendingUp className="absolute right-12 top-12 text-white/5 w-48 h-48 rotate-12" />
      </section>)}

      {/* Tab Navigation */}
      {report && (
        <div className="sticky top-20 z-[40] flex bg-surface/80 backdrop-blur-xl border border-border-subtle p-1.5 rounded-[2rem] shadow-sm overflow-x-auto no-scrollbar mb-8 scroll-smooth">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-sm transition-all shrink-0 ${isActive ? "text-white" : "text-secondary hover:text-foreground"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-600 rounded-2xl shadow-lg shadow-primary-600/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon size={18} className="relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {report &&
        < div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface border border-border-subtle p-4 sm:p-5 rounded-[2rem] shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedReportId}
              onChange={fetchHistoricalReport}
              className="bg-surface-variant border border-border-subtle text-foreground text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="" disabled>Select past report...</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>
                  {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-variant text-secondary hover:text-foreground rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              Export PDF
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !canRunAnalysis}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
            >
              <Sparkles size={14} className={isAnalyzing ? "animate-pulse" : ""} />
              {isAnalyzing ? "Analyzing..." : canRunAnalysis ? "Analyze Now" : "Limit Reached"}
            </button>
          </div>
        </div>
      }

      {report &&
        < div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface border border-border-subtle p-4 sm:p-6 rounded-[2rem] shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? 'bg-error/10 text-error' :
              report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? 'bg-warning/10 text-warning' :
                'bg-success/10 text-success'
              }`}>
              {report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? <AlertCircle size={24} /> :
                report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? <TrendingUp size={24} /> :
                  <CheckCircle2 size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground">
                  {report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? 'Action Required' :
                    report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? 'Needs Attention' :
                      'Smooth Sailing'}
                </h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? 'bg-error text-white' :
                  report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? 'bg-warning text-white' :
                    'bg-success text-white'
                  }`}>
                  {report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? 'Danger' :
                    report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? 'Cautious' :
                      'Smooth'}
                </span>
              </div>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">
                Last analyzed: {reportDate ? new Date(reportDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

      }
      {/* Report Content */}
      <AnimatePresence mode="wait">
        {report ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >


            <div ref={reportRef} className="space-y-8 bg-background p-0 sm:p-0 rounded-[2.5rem]">

              {/* Spending Analysis Tab */}
              {activeTab === "Spending" && (
                <div className="space-y-8">
                  {/* Summary Card */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-8 py-6 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest mb-6 border-b border-border-subtle pb-4">Monthly Summary & Insight</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {report.spendingAnalysis.metrics.map((metric, i) => (
                          <div key={i} className="p-5 bg-surface-variant/50 rounded-3xl border border-border-subtle">
                            <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">{metric.label}</p>
                            <p className={`text-xl sm:text-2xl font-black ${metric.type === 'danger' ? 'text-error' :
                              metric.type === 'success' ? 'text-success' :
                                'text-foreground'
                              }`}>
                              {metric.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-primary-500/5 border border-primary-500/10 rounded-3xl p-6 mb-8">
                        <div className="flex items-center gap-2 mb-3 text-primary-600">
                          <Sparkles size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">AI Forensic Insight</span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ThemedMarkdown content={report.spendingAnalysis.summary} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Anomalies Card */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-8 py-6  shadow-sm group hover:border-error/30 transition-colors">
                    <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                      <AlertCircle size={24} className="text-error" />
                      Anomaly Detection
                    </h3>
                    <div className="space-y-3">
                      {report.spendingAnalysis.anomalies.map((anomaly, i) => (
                        <div key={i} className="flex gap-3 text-secondary font-bold text-sm bg-error/5 p-4 rounded-2xl border border-error/10">
                          <div className="w-5 h-5 rounded-full bg-error text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-sm">!</div>
                          {anomaly}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Intelligence Tab */}
              {activeTab === "Budget" && (
                <div className="space-y-8">
                  {/* Advisor Card */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-8 py-6 shadow-sm">
                    <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-2">
                      <Target size={24} className="text-primary-500" />
                      Smart Limit Advisor
                    </h3>
                    <div className="bg-primary-500/5 border border-primary-500/10 rounded-3xl p-6 mb-8">
                      <div className="flex items-center gap-2 mb-3 text-primary-600">
                        <Brain size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Budget Recommendation</span>
                      </div>
                      <p className="text-secondary font-medium italic">{report.budgetIntelligence.limitAdvice}</p>
                    </div>
                  </div>

                  {/* Burn Rate Card */}
                  <div className={`rounded-[2.5rem] p-4 sm:p-8 py-6 shadow-sm border transition-all ${report.budgetIntelligence.burnRate.status === 'warning'
                    ? 'bg-error/5 border-error/20'
                    : 'bg-success/5 border-success/20'
                    }`}>
                    <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${report.budgetIntelligence.burnRate.status === 'warning' ? 'text-error' : 'text-success'
                      }`}>
                      <Zap size={24} />
                      Burn Rate Intelligence
                    </h3>
                    <div className="flex items-start gap-4">
                      <p className="text-foreground font-bold">{report.budgetIntelligence.burnRate.message}</p>
                    </div>
                  </div>

                  {/* Reallocation Tips */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-8 py-6 shadow-sm">
                    <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                      <ArrowRightLeft size={24} className="text-indigo-500" />
                      Smart Reallocation Tips
                    </h3>
                    <ul className="space-y-4">
                      {report.budgetIntelligence.reallocationTips.map((tip, i) => (
                        <li key={i} className="flex gap-4 items-start bg-surface-variant/50 p-5 rounded-2xl border border-border-subtle">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                            <Zap size={16} />
                          </div>
                          <p className="text-secondary font-bold text-sm leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Income Insights Tab */}
              {activeTab === "Income" && (
                <div className="space-y-8">
                  {/* Savings Rate Trend */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-2">
                      <History size={24} className="text-success" />
                      Savings Tracker
                    </h3>
                    <div className="space-y-6">
                      {report.incomeInsights.savingsRateTrend.map((item, i) => (
                        <div key={i} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-black text-muted uppercase tracking-widest">{item.month}</span>
                            <span className="text-sm font-black text-success">{item.rate}</span>
                          </div>
                          <div className="h-4 bg-surface-variant rounded-full overflow-hidden border border-border-subtle">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: item.rate }}
                              className="h-full bg-success shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-border-subtle rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group">
                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                        <TrendingUp size={24} className="text-primary-500" />
                        Income vs Expense Gap
                      </h3>
                      <div className="prose prose-indigo dark:prose-invert max-w-none">
                        <ThemedMarkdown content={report.incomeInsights.gapAnalysis} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Finance Advice Tab */}
              {activeTab === "Advice" && (
                <div className="space-y-8">
                  {/* Longitudinal Analysis */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-5 sm:p-8 py-6 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-8 text-indigo-500/5 group-hover:scale-110 transition-transform">
                      <Star size={120} />
                    </div>
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                      <Star className="text-yellow-500" fill="currentColor" />
                      Strategic Financial Advice
                    </h3>
                    <div className="prose prose-indigo dark:prose-invert max-w-none mb-10">
                      <ThemedMarkdown content={report.financeAdvice.longTermAdvice} />
                    </div>

                    <div className="p-4 sm:p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                      <div className="flex items-center gap-3 mb-4 text-indigo-700 dark:text-indigo-400">
                        <ShieldCheck size={24} />
                        <span className="font-black text-lg">Emergency Fund Intelligence</span>
                      </div>
                      <p className="text-secondary font-bold text-sm leading-relaxed">{report.financeAdvice.emergencyFundStatus}</p>
                    </div>
                  </div>

                  {/* Hypothetical Scenario */}
                  <div className="bg-error/5 border-2 border-dashed border-error/20 rounded-[2.5rem] p-5 sm:p-8 py-6 relative group">
                    <div className="flex items-center gap-3 mb-8 text-error">
                      <Briefcase size={28} className="min-w-6" />
                      <h3 className="text-lg sm:text-2xl font-black">Hypothetical: {report.financeAdvice.hypotheticalScenario.title}</h3>
                    </div>
                    <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-muted">
                        <Zap size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">AI Stress-Test Response</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ThemedMarkdown content={report.financeAdvice.hypotheticalScenario.advice} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : !isAnalyzing && (
          <div className="space-y-6">
            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-6 bg-error/10 border border-error/20 rounded-3xl text-error"
              >
                <AlertCircle size={24} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-lg mb-1">Analysis failed</p>
                  <p className="font-bold text-sm opacity-80">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, title: "Pattern recognition", desc: "AI identifies invisible spending habits before they drain your savings." },
                { icon: ShieldCheck, title: "Stress-testing", desc: "Foresee how your finances handle income dips or sudden expenses." },
                { icon: Zap, title: "Dynamic budget", desc: "Get real-time limit suggestions based on actual burn rate data." }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-8 bg-surface border border-border-subtle rounded-[2.5rem] hover:border-primary-500/30 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
                    <f.icon size={28} />
                  </div>
                  <h3 className="font-black text-xl mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-secondary text-sm font-bold leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[#0a0a0c]">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-violet-500/10" />
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

              {/* Pulsing Orbs */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                  x: [-20, 20, -20]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary-500/20 rounded-full blur-[80px] sm:blur-[120px]"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.1, 0.15, 0.1],
                  x: [20, -20, 20]
                }}
                transition={{ duration: 12, repeat: Infinity }}
                className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-violet-500/20 rounded-full blur-[60px] sm:blur-[100px]"
              />
            </div>

            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[4rem] px-5 sm:px-10 py-8 sm:py-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] text-center overflow-hidden"
            >
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                {/* AI Visualization */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-8 sm:mb-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-primary-500/20 border-t-primary-500 border-l-primary-500"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-3 sm:inset-4 rounded-full border border-violet-500/20 border-b-violet-500 border-r-violet-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-primary-600 to-violet-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] relative"
                    >
                      <Brain size={32} className="relative z-10 sm:hidden" />
                      <Brain size={40} className="relative z-10 hidden sm:block" />
                      <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2 mb-8 sm:mb-10">
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg sm:text-2xl font-black tracking-tighter text-white uppercase"
                  >
                    Forensic AI <span className="text-primary-400">Processing</span>
                  </motion.h2>
                  <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-[0.2em] sm:tracking-[0.3em]">Neural Network Active</p>
                </div>

                {/* Single Active Stage Display */}
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -14, scale: 0.96 }}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-primary-500/10 border border-primary-500/30 shadow-[0_0_25px_rgba(99,102,241,0.12)] mb-4"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
                        <Loader2 size={16} className="animate-spin sm:hidden" />
                        <Loader2 size={20} className="animate-spin hidden sm:block" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-white text-left tracking-wider uppercase leading-snug">
                        {loadingStages[stage]}
                      </span>
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress Dots */}
                  <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                    {loadingStages.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={
                          i < stage
                            ? { backgroundColor: "rgb(34,197,94)", scale: 1, opacity: 1 }
                            : i === stage
                              ? { scale: [1, 1.5, 1], backgroundColor: "rgb(99,102,241)", opacity: 1 }
                              : { backgroundColor: "rgba(255,255,255,0.1)", scale: 0.75, opacity: 0.4 }
                        }
                        transition={{ duration: 0.7, repeat: i === stage ? Infinity : 0, repeatType: "reverse" }}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Step counter */}
                  <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest">
                    Step {stage + 1} of {loadingStages.length}
                  </p>
                </div>

                {/* Completed Stages (Compact) */}
                {stage > 0 && (
                  <div className="mt-5 sm:mt-8 w-full flex flex-col gap-1.5 border-t border-white/5 pt-4 sm:pt-6">
                    {loadingStages.slice(0, stage).map((text, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-success/[0.05] border border-success/15"
                      >
                        <CheckCircle2 size={10} className="text-success shrink-0 sm:hidden" strokeWidth={3} />
                        <CheckCircle2 size={12} className="text-success shrink-0 hidden sm:block" strokeWidth={3} />
                        <span className="text-[8px] sm:text-[9px] font-black text-success/60 uppercase tracking-widest truncate">{text}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-6 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4">
                  <div className="h-[1px] w-6 sm:w-10 bg-white/10" />
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-[8px] sm:text-[9px] font-black text-primary-400 uppercase tracking-widest"
                  >
                    Processing Data Points
                  </motion.p>
                  <div className="h-[1px] w-6 sm:w-10 bg-white/10" />
                </div>
              </div>

              {/* Forensic Data Stream (Side) */}
              <div className="absolute top-0 right-0 bottom-0 w-24 pointer-events-none opacity-[0.05] overflow-hidden text-[6px] font-mono text-white p-2 text-left hidden md:block">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -100] }}
                    transition={{ duration: 10 + i, repeat: Infinity, ease: "linear" }}
                  >
                    0x{Math.random().toString(16).slice(2, 10).toUpperCase()} ... PROC
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
