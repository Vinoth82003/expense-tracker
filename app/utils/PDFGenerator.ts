// // ============================================================
// //  handleExportPDF — SpendWise AI Analysis Report  v3
// //  Drop-in replacement. Requires jsPDF already imported.
// //
// //  KEY FIXES vs previous version:
// //  1. No Unicode symbols — helvetica only supports Latin-1.
// //     Bullets use "-", status icons use plain ASCII [OK]/etc.
// //  2. Rs. used instead of the Rupee sign (which renders as
// //     garbage in helvetica / WinAnsi encoding).
// //  3. Cover background: solid setFillColor rects, no alpha hacks.
// //  4. Text wrapping: splitTextToSize BEFORE every draw call so
// //     nothing overflows the page or gets cut mid-sentence.
// //  5. Savings bars: two plain pdf.rect() calls (track + fill),
// //     no roundedRect clipping artifacts on the fill.
// // ============================================================

// const handleExportPDF = async () => {
//     if (!report) return;
//     setIsExporting(true);

//     try {
//         const pdf = new jsPDF("p", "mm", "a4");
//         const PW = pdf.internal.pageSize.getWidth();  // 210 mm
//         const PH = pdf.internal.pageSize.getHeight(); // 297 mm
//         const ML = 18;           // left margin
//         const MR = 18;           // right margin
//         const CW = PW - ML - MR; // usable content width ~174 mm
//         let y = 22;
//         let pageNum = 1;

//         // ── Palette ────────────────────────────────────────────────
//         type RGB = [number, number, number];
//         const C: Record<string, RGB> = {
//             indigo: [99, 102, 241],
//             indigoDark: [67, 56, 202],
//             violet: [139, 92, 246],
//             green: [16, 185, 129],
//             orange: [234, 88, 12],
//             dark: [17, 24, 39],
//             dark2: [31, 41, 55],
//             white: [255, 255, 255],
//             gray100: [243, 244, 246],
//             gray200: [229, 231, 235],
//             gray400: [156, 163, 175],
//             gray500: [107, 114, 128],
//             gray700: [55, 65, 81],
//             success: [22, 163, 74],
//             successBg: [240, 253, 244],
//             danger: [220, 38, 38],
//             dangerBg: [254, 242, 242],
//             warning: [217, 119, 6],
//             warningBg: [255, 251, 235],
//             indigoBg: [238, 242, 255],
//             neutralBg: [248, 248, 255],
//             indigo300: [165, 180, 252],
//             indigo200: [199, 210, 254],
//             slate400: [148, 163, 184],
//             slate500: [100, 116, 139],
//             slate600: [71, 85, 105],
//             slate700: [51, 65, 85],
//         };

//         const sf = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
//         const sc = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
//         const sd = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

//         // ── Sanitise text: remove unsupported Unicode + markdown ──
//         // jsPDF helvetica = WinAnsi — no Rupee glyph, no special symbols.
//         const safe = (t: string): string =>
//             (t || "")
//                 .replace(/[\u20B9\u00B9]/g, "Rs.")   // ₹ / ¹ -> Rs.
//                 .replace(/\*\*(.*?)\*\*/g, "$1")
//                 .replace(/\*(.*?)\*/g, "$1")
//                 .replace(/__(.*?)__/g, "$1")
//                 .replace(/_(.*?)_/g, "$1")
//                 .replace(/^#+\s*/gm, "")
//                 .replace(/\[(.*?)\]\(.*?\)/g, "$1")
//                 .replace(/`(.*?)`/g, "$1")
//                 .replace(/[^\x00-\xFF]/g, "?")       // strip anything above Latin-1
//                 .trim();

//         // ── Footer ─────────────────────────────────────────────────
//         const drawFooter = () => {
//             sf(C.indigo);
//             pdf.rect(0, PH - 6, PW, 6, "F");
//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(7.5);
//             sc(C.gray500);
//             pdf.text("SpendWise  |  AI Analysis Report  |  Confidential", ML, PH - 9);
//             const pt = `Page ${pageNum}`;
//             pdf.text(pt, PW - MR - pdf.getTextWidth(pt), PH - 9);
//             pageNum++;
//         };

//         const addPage = () => {
//             drawFooter();
//             pdf.addPage();
//             y = 22;
//         };

//         // Ensure `mm` fits before the footer zone (bottom 18 mm reserved)
//         const need = (mm: number) => {
//             if (y + mm > PH - 18) addPage();
//         };

//         const gap = (mm = 5) => { y += mm; };

//         // ── Typography ─────────────────────────────────────────────

//         const h2 = (txt: string) => {
//             need(14);
//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(13);
//             sc(C.gray700);
//             pdf.text(safe(txt), ML, y);
//             y += 5;
//             sd(C.gray200);
//             pdf.setLineWidth(0.3);
//             pdf.line(ML, y, ML + CW, y);
//             y += 5;
//         };

//         const para = (txt: string, indent = 0) => {
//             if (!txt) return;
//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(10);
//             sc(C.gray700);
//             const lines = pdf.splitTextToSize(safe(txt), CW - indent);
//             const lh = 5.5;
//             need(lines.length * lh + 3);
//             pdf.text(lines, ML + indent, y);
//             y += lines.length * lh + 3;
//         };

//         // Bullet — plain dash (no Unicode arrows)
//         const bul = (txt: string) => {
//             const indent = 8;
//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(10);
//             sc(C.indigo);
//             need(8);
//             pdf.text("-", ML + 2, y);
//             sc(C.gray700);
//             const lines = pdf.splitTextToSize(safe(txt), CW - indent - 4);
//             const lh = 5.5;
//             need(lines.length * lh + 2);
//             pdf.text(lines, ML + indent, y);
//             y += lines.length * lh + 3;
//         };

//         // ── Coloured info box with left accent bar ────────────────
//         type BoxType = "primary" | "success" | "danger" | "warning";
//         const BOX_BG: Record<BoxType, string> = {
//             primary: "indigoBg", success: "successBg",
//             danger: "dangerBg", warning: "warningBg",
//         };
//         const BOX_BAR: Record<BoxType, string> = {
//             primary: "indigo", success: "success",
//             danger: "danger", warning: "warning",
//         };

//         const box = (label: string, content: string, type: BoxType = "primary") => {
//             const maxW = CW - 14;
//             const lines = pdf.splitTextToSize(safe(content), maxW);
//             const lh = 5.5;
//             const bh = lines.length * lh + 17;
//             need(bh + 5);

//             sf(C[BOX_BG[type]]);
//             sd(C[BOX_BAR[type]]);
//             pdf.setLineWidth(0.5);
//             pdf.roundedRect(ML, y, CW, bh, 2, 2, "FD");

//             sf(C[BOX_BAR[type]]);
//             pdf.rect(ML, y, 3, bh, "F");

//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(8.5);
//             sc(C[BOX_BAR[type]]);
//             pdf.text(safe(label).toUpperCase(), ML + 7, y + 8);

//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(10);
//             sc(C.gray700);
//             pdf.text(lines, ML + 7, y + 14);

//             y += bh + 6;
//         };

//         // ── Status chip ───────────────────────────────────────────
//         const chip = (label: string, value: string, type: BoxType = "primary") => {
//             need(12);
//             sf(C[BOX_BG[type]]);
//             sd(C[BOX_BAR[type]]);
//             pdf.setLineWidth(0.4);
//             pdf.roundedRect(ML, y - 3, CW, 10, 2, 2, "FD");
//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(9.5);
//             sc(C[BOX_BAR[type]]);
//             pdf.text(`${safe(label)}:`, ML + 5, y + 4);
//             pdf.setFont("helvetica", "normal");
//             sc(C.gray700);
//             const lx = ML + 5 + pdf.getTextWidth(`${safe(label)}: `);
//             pdf.text(safe(value), lx, y + 4);
//             y += 12;
//         };

//         // ── Metric cards ──────────────────────────────────────────
//         const metricRow = (
//             metrics: Array<{ label: string; value: string; type: "danger" | "success" | "neutral" }>
//         ) => {
//             const cols = Math.min(metrics.length, 4);
//             const gutter = 3;
//             const cardW = (CW - (cols - 1) * gutter) / cols;
//             const cardH = 24;
//             need(cardH + 8);

//             const pal: Record<string, { bg: string; border: string; val: string }> = {
//                 danger: { bg: "dangerBg", border: "danger", val: "danger" },
//                 success: { bg: "successBg", border: "success", val: "success" },
//                 neutral: { bg: "indigoBg", border: "indigo", val: "indigo" },
//             };

//             metrics.forEach((m, i) => {
//                 const cx = ML + i * (cardW + gutter);
//                 const cy = y;
//                 const p = pal[m.type] ?? pal.neutral;

//                 sf(C[p.bg]);
//                 sd(C[p.border]);
//                 pdf.setLineWidth(0.5);
//                 pdf.roundedRect(cx, cy, cardW, cardH, 2.5, 2.5, "FD");

//                 // Label
//                 pdf.setFont("helvetica", "normal");
//                 pdf.setFontSize(7);
//                 sc(C.gray500);
//                 const lbl = pdf.splitTextToSize(safe(m.label).toUpperCase(), cardW - 6);
//                 pdf.text(lbl[0] || "", cx + 4, cy + 8);

//                 // Value
//                 pdf.setFont("helvetica", "bold");
//                 pdf.setFontSize(11);
//                 sc(C[p.val]);
//                 const val = pdf.splitTextToSize(safe(m.value), cardW - 6);
//                 pdf.text(val[0] || "", cx + 4, cy + 18);
//             });

//             y += cardH + 8;
//         };

//         // ── Savings progress bar ──────────────────────────────────
//         // Uses two plain pdf.rect() calls — no roundedRect clipping on fill.
//         const savingsBar = (month: string, rate: string) => {
//             need(16);
//             const pct = Math.min(Math.max(parseFloat(rate) / 100, 0), 1);
//             const barX = ML + 52;
//             const barW = CW - 68;
//             const barH = 7;
//             const barY = y;

//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(9.5);
//             sc(C.gray700);
//             pdf.text(safe(month), ML, barY + 6);

//             // Track
//             sf(C.gray200);
//             pdf.rect(barX, barY, barW, barH, "F");

//             // Fill — only draw if pct > 0
//             if (pct > 0.001) {
//                 sf(C.success);
//                 pdf.rect(barX, barY, Math.max(pct * barW, 4), barH, "F");
//             }

//             // Rate label
//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(9.5);
//             sc(C.success);
//             pdf.text(safe(rate), barX + barW + 3, barY + 6);

//             y += 14;
//         };

//         // ── Full-width section band ───────────────────────────────
//         const sectionBand = (
//             num: string,
//             title: string,
//             subtitle: string,
//             accent: RGB = C.indigo
//         ) => {
//             addPage();

//             // Main band
//             sf(accent);
//             pdf.rect(0, 0, PW, 52, "F");

//             // Darker accent at band bottom
//             sf([
//                 Math.max(accent[0] - 25, 0),
//                 Math.max(accent[1] - 25, 0),
//                 Math.max(accent[2] - 25, 0),
//             ] as RGB);
//             pdf.rect(0, 48, PW, 4, "F");

//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(8);
//             sc(C.indigo200);
//             pdf.text(`SECTION  ${num}`, ML, 16);

//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(26);
//             sc(C.white);
//             pdf.text(title, ML, 34);

//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(10);
//             sc(C.indigo200);
//             pdf.text(subtitle, ML, 45);

//             y = 64;
//         };

//         // ══════════════════════════════════════════════════════════
//         //  PAGE 1 — COVER (solid colours, no alpha)
//         // ══════════════════════════════════════════════════════════

//         // Full dark background
//         sf(C.dark);
//         pdf.rect(0, 0, PW, PH, "F");

//         // Top strip
//         sf(C.indigo);
//         pdf.rect(0, 0, PW, 5, "F");

//         // Bottom strip
//         sf(C.indigo);
//         pdf.rect(0, PH - 5, PW, 5, "F");

//         // Right decorative panel
//         sf(C.dark2);
//         pdf.rect(PW - 56, 0, 56, PH, "F");

//         // Vertical accent divider
//         sf(C.indigo);
//         pdf.rect(PW - 57, 0, 2, PH, "F");

//         // Brand pill
//         sf(C.indigo);
//         pdf.roundedRect(ML, 20, 38, 10, 2, 2, "F");
//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(8.5);
//         sc(C.white);
//         pdf.text("SPENDWISE", ML + 4, 27);

//         // Main heading
//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(36);
//         sc(C.white);
//         pdf.text("AI Analysis", ML, 72);

//         pdf.setFontSize(36);
//         sc(C.indigo300);
//         pdf.text("Report", ML, 86);

//         // Underline accent
//         sf(C.indigo);
//         pdf.rect(ML, 92, 44, 1.5, "F");

//         // Tagline
//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(10.5);
//         sc(C.slate400);
//         pdf.text("Deep-tissue financial intelligence", ML, 102);
//         pdf.text("Powered by Forensic AI", ML, 109);

//         // Date
//         const dt = new Date();
//         const dateStr = dt.toLocaleDateString("en-IN", {
//             weekday: "long",
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//         });
//         const timeStr = dt.toLocaleTimeString("en-IN", {
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//         });
//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(9);
//         sc(C.slate500);
//         pdf.text(`Generated: ${dateStr}`, ML, 122);
//         pdf.text(`Time: ${timeStr}`, ML, 129);

//         // TOC heading
//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(9);
//         sc(C.indigo300);
//         pdf.text("CONTENTS", ML, 148);

//         sd(C.slate700);
//         pdf.setLineWidth(0.3);
//         pdf.line(ML, 151, ML + 92, 151);

//         const tocItems = [
//             { num: "01", title: "Spending Analysis", sub: "Summary  |  Metrics  |  Anomalies" },
//             { num: "02", title: "Budget Intelligence", sub: "Limits  |  Burn Rate  |  Reallocation" },
//             { num: "03", title: "Income Insights", sub: "Savings Trend  |  Gap Analysis" },
//             { num: "04", title: "Finance Advice", sub: "Long-Term  |  Emergency  |  Scenarios" },
//         ];

//         tocItems.forEach((item, i) => {
//             const ty = 157 + i * 20;
//             sf(C.dark2);
//             pdf.roundedRect(ML, ty, PW - ML - MR - 60, 16, 2, 2, "F");

//             sf(C.indigo);
//             pdf.roundedRect(ML + 3, ty + 3.5, 13, 9, 1.5, 1.5, "F");
//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(8);
//             sc(C.white);
//             pdf.text(item.num, ML + 5.2, ty + 10);

//             pdf.setFont("helvetica", "bold");
//             pdf.setFontSize(10);
//             sc(C.white);
//             pdf.text(item.title, ML + 20, ty + 9);

//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(8);
//             sc(C.slate400);
//             pdf.text(item.sub, ML + 20, ty + 14);
//         });

//         // Confidential note
//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(8);
//         sc(C.slate600);
//         const confText = "CONFIDENTIAL  |  FOR INTERNAL USE ONLY";
//         pdf.text(confText, (PW - pdf.getTextWidth(confText)) / 2, PH - 10);

//         // ══════════════════════════════════════════════════════════
//         //  SECTION 01 — SPENDING ANALYSIS
//         // ══════════════════════════════════════════════════════════
//         sectionBand("01", "Spending Analysis",
//             "Monthly breakdown  |  Anomaly detection  |  Key metrics",
//             C.indigo);

//         h2("Key Metrics");
//         metricRow(report.spendingAnalysis.metrics);
//         gap(2);

//         h2("AI Forensic Summary");
//         box("Forensic AI Insight", report.spendingAnalysis.summary, "primary");
//         gap(2);

//         h2("Anomaly Detection");
//         if (report.spendingAnalysis.anomalies.length > 0) {
//             report.spendingAnalysis.anomalies.forEach((a) => {
//                 const maxW = CW - 18;
//                 const lines = pdf.splitTextToSize(safe(a), maxW);
//                 const lh = 5.5;
//                 const bh = lines.length * lh + 12;
//                 need(bh + 5);

//                 sf(C.dangerBg);
//                 sd(C.danger);
//                 pdf.setLineWidth(0.5);
//                 pdf.roundedRect(ML, y, CW, bh, 2, 2, "FD");
//                 sf(C.danger);
//                 pdf.rect(ML, y, 3, bh, "F");

//                 pdf.setFont("helvetica", "bold");
//                 pdf.setFontSize(9.5);
//                 sc(C.danger);
//                 pdf.text("[!]", ML + 5, y + 8);

//                 pdf.setFont("helvetica", "normal");
//                 pdf.setFontSize(10);
//                 sc(C.gray700);
//                 pdf.text(lines, ML + 16, y + 8);
//                 y += bh + 5;
//             });
//         } else {
//             box(
//                 "No Anomalies Detected",
//                 "All expenses appear routine. Continue monitoring discretionary categories.",
//                 "success"
//             );
//         }

//         // ══════════════════════════════════════════════════════════
//         //  SECTION 02 — BUDGET INTELLIGENCE
//         // ══════════════════════════════════════════════════════════
//         sectionBand("02", "Budget Intelligence",
//             "Limit advice  |  Burn-rate status  |  Reallocation tips",
//             C.violet);

//         h2("Smart Limit Advisor");
//         box("Budget Recommendation", report.budgetIntelligence.limitAdvice, "primary");
//         gap(3);

//         h2("Burn Rate Status");
//         const isWarn = report.budgetIntelligence.burnRate.status === "warning";
//         const brType: BoxType = isWarn ? "danger" : "success";
//         chip(
//             `Status  ${isWarn ? "[WARNING]" : "[OK]"}`,
//             report.budgetIntelligence.burnRate.status.toUpperCase(),
//             brType
//         );
//         gap(2);
//         box("Burn Rate Analysis", report.budgetIntelligence.burnRate.message, brType);
//         gap(3);

//         if (report.budgetIntelligence.reallocationTips.length > 0) {
//             h2("Smart Reallocation Tips");
//             report.budgetIntelligence.reallocationTips.forEach((tip) => bul(tip));
//         }

//         // ══════════════════════════════════════════════════════════
//         //  SECTION 03 — INCOME INSIGHTS
//         // ══════════════════════════════════════════════════════════
//         sectionBand("03", "Income Insights",
//             "Savings trend  |  Income vs expense gap analysis",
//             C.green);

//         h2("Savings Rate Trend");
//         gap(3);
//         if (report.incomeInsights.savingsRateTrend.length > 0) {
//             report.incomeInsights.savingsRateTrend.forEach((t) =>
//                 savingsBar(t.month, t.rate)
//             );
//         } else {
//             para("No savings trend data available yet.");
//         }
//         gap(6);

//         h2("Income vs Expense Gap Analysis");
//         box("Gap Intelligence", report.incomeInsights.gapAnalysis, "success");

//         // ══════════════════════════════════════════════════════════
//         //  SECTION 04 — FINANCE ADVICE
//         // ══════════════════════════════════════════════════════════
//         sectionBand("04", "Finance Advice",
//             "Long-term strategy  |  Emergency fund  |  Hypothetical scenarios",
//             C.orange);

//         h2("Strategic Long-Term Advice");
//         box("Long-Term Strategy", report.financeAdvice.longTermAdvice, "primary");
//         gap(4);

//         h2("Emergency Fund Status");
//         box("Emergency Fund Intelligence",
//             report.financeAdvice.emergencyFundStatus, "warning");
//         gap(4);

//         h2("Hypothetical Scenario");
//         chip(
//             "Stress-Test Scenario",
//             report.financeAdvice.hypotheticalScenario.title,
//             "primary"
//         );
//         gap(2);
//         box("AI Stress-Test Response",
//             report.financeAdvice.hypotheticalScenario.advice, "primary");

//         // Final page footer
//         drawFooter();

//         // ── Save ──────────────────────────────────────────────────
//         const safeDateStr = new Date(reportDate || "")
//             .toLocaleDateString("en-IN")
//             .replace(/\//g, "-");
//         pdf.save(`AI_Analysis_Report_${safeDateStr}.pdf`);

//     } catch (err) {
//         console.error("Failed to export PDF", err);
//     } finally {
//         setIsExporting(false);
//     }
// };