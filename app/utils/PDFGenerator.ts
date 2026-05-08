import { jsPDF } from "jspdf";

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

export const generatePDF = async (report: any, expenses: any[], incomes: any[], monthlyLimit: number, reportDate: string) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const PW = pdf.internal.pageSize.getWidth();
  const PH = pdf.internal.pageSize.getHeight();
  const ML = 16;
  const MR = 16;
  const CW = PW - ML - MR;
  let y = 22;
  let pageNum = 1;

  const sf = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
  const sc = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
  const sd = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

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

  const metricRow = (
    metrics: Array<{ label: string; value: string; type: "danger" | "success" | "neutral" }>
  ) => {
    // FIX: Responsive column count based on available space and number of metrics
    const maxColsPerRow = 3;
    const numMetrics = metrics.length;
    const cols = Math.min(Math.max(1, Math.ceil(numMetrics / Math.ceil(numMetrics / maxColsPerRow))), maxColsPerRow);
    const gutter = 4;
    const cardW = (CW - (cols - 1) * gutter) / cols;
    const cardH = 32;

    // FIX: Calculate number of rows needed
    const numRows = Math.ceil(numMetrics / cols);
    const totalHeight = numRows * (cardH + gutter) + gutter;
    need(totalHeight + 5);

    const pal: Record<string, { bg: string; border: string; val: string }> = {
      danger: { bg: "dangerBg", border: "danger", val: "danger" },
      success: { bg: "successBg", border: "success", val: "success" },
      neutral: { bg: "indigoBg", border: "indigo", val: "indigo" },
    };

    let currentY = y;
    let rowStart = 0;

    // FIX: Render metrics in rows
    for (let row = 0; row < numRows; row++) {
      const rowEnd = Math.min(rowStart + cols, numMetrics);

      for (let i = rowStart; i < rowEnd; i++) {
        const m = metrics[i];
        const colIndex = i - rowStart;
        const cx = ML + colIndex * (cardW + gutter);
        const cy = currentY;
        const p = pal[m.type] ?? pal.neutral;

        sf(C[p.bg]);
        sd(C[p.border]);
        pdf.setLineWidth(0.6);
        pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        sc(C.gray500);
        // FIX: Wrap long labels
        const lbl = pdf.splitTextToSize(safe(m.label).toUpperCase(), cardW - 6);
        pdf.text(lbl[0] || "", cx + 4, cy + 7);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        sc(C[p.val]);
        // FIX: Wrap long values
        const val = pdf.splitTextToSize(safe(m.value), cardW - 6);
        pdf.text(val[0] || "", cx + 4, cy + 22);
      }

      currentY += cardH + gutter;
      rowStart = rowEnd;
    }

    y += totalHeight;
  };

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
    // FIX: Safely truncate month if needed
    const monthText = safe(month).substring(0, 15);
    pdf.text(monthText, ML, barY + 6);

    sf(C.gray200);
    pdf.rect(barX, barY, barW, barH, "F");

    if (pct > 0.001) {
      sf(C.success);
      pdf.rect(barX, barY, Math.max(pct * barW, 4), barH, "F");
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    sc(C.success);
    // FIX: Format rate with proper spacing and truncation
    const rateText = `${parseFloat(rate).toFixed(1)}%`;
    pdf.text(rateText, barX + barW + 3, barY + 6);

    y += 14;
  };

  type ChartData = { label: string; value: number; color?: RGB };
  const barChart = (title: string, data: ChartData[], maxValue?: number) => {
    need(6 + data.length * 14);
    const max = maxValue || Math.max(...data.map(d => d.value));

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    sc(C.gray700);
    pdf.text(safe(title), ML, y);
    y += 6;

    data.forEach((d, i) => {
      const barHeight = 10;
      const barY = y + i * 13;
      const ratio = d.value / max;
      const barW = ratio * (CW - 80);
      const color = d.color || C.indigo;

      // FIX: Truncate long labels
      const labelText = safe(d.label).substring(0, 20);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      sc(C.gray700);
      pdf.text(labelText, ML, barY + 8);

      sf(C.gray200);
      pdf.rect(ML + 70, barY + 2, CW - 80, barHeight, "F");

      sf(color);
      pdf.rect(ML + 70, barY + 2, barW, barHeight, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      sc(C.gray700);
      const val = `Rs.${d.value.toLocaleString()}`;
      pdf.text(val, ML + 72 + barW + 3, barY + 8);
    });

    y += data.length * 13 + 2;
  };

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

    sf(C.indigo);
    pdf.rect(ML, y, CW, headerHeight, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    sc(C.white);
    let xPos = ML;
    headers.forEach((h, i) => {
      // FIX: Truncate header text if too long
      const headerText = safe(h).substring(0, 20);
      pdf.text(headerText, xPos + 2, y + 6);
      xPos += widths[i];
    });

    y += headerHeight;

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
        // FIX: Truncate cell content if too long
        const displayText = cellText.substring(0, 25);
        pdf.text(displayText, xPos + 2, y + 5);
        xPos += widths[i];
      });

      sd(C.gray300);
      pdf.setLineWidth(0.2);
      pdf.line(ML, y + rowHeight, ML + CW, y + rowHeight);

      y += rowHeight;
      rowBg = !rowBg;
    });

    y += 4;
  };

  const budgetBar = (label: string, spent: number, limit: number) => {
    need(12);
    const pct = Math.min(spent / limit, 1);
    const barW = CW - 80;
    const barH = 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    sc(C.gray700);
    // FIX: Truncate label text
    const labelText = safe(label).substring(0, 20);
    pdf.text(labelText, ML, y + 6);

    sf(C.gray200);
    pdf.rect(ML + 60, y + 1, barW, barH, "F");

    const fillColor = pct > 0.8 ? C.danger : pct > 0.6 ? C.warning : C.success;
    sf(fillColor);
    pdf.rect(ML + 60, y + 1, pct * barW, barH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    sc(fillColor);
    const pctText = `${(pct * 100).toFixed(1)}%`;
    pdf.text(pctText, ML + 62 + barW, y + 6);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    sc(C.gray700);
    pdf.text(`Rs.${spent.toLocaleString()} / Rs.${limit.toLocaleString()}`, ML, y + 10);

    y += 12;
  };

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

  // COVER PAGE
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
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const timeStr = dt.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });
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
    { num: "06", title: "Actionable Suggestions", sub: "Potential Savings  |  Category Advice" },
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

  // SECTION 01
  sectionBand("01", "Spending Analysis", "Monthly breakdown  |  Anomaly detection  |  Key metrics", C.indigo);
  h2("Key Metrics");
  metricRow(report.spendingAnalysis.metrics);
  gap(2);
  h2("AI Forensic Summary");
  box("Forensic AI Insight", report.spendingAnalysis.summary, "primary");
  gap(3);
  h2("Anomaly Detection");
  if (report.spendingAnalysis.anomalies.length > 0) {
    report.spendingAnalysis.anomalies.forEach((a: string) => {
      const maxW = CW - 18;
      const lines = pdf.splitTextToSize(safe(a), maxW);
      const lh = 5.5;
      const bh = lines.length * lh + 12;
      need(bh + 5);
      sf(C.dangerBg); sd(C.danger); pdf.setLineWidth(0.5);
      pdf.roundedRect(ML, y, CW, bh, 2, 2, "FD");
      sf(C.danger); pdf.rect(ML, y, 3, bh, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9.5); sc(C.danger);
      pdf.text("[!]", ML + 5, y + 8);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); sc(C.gray700);
      pdf.text(lines, ML + 16, y + 8);
      y += bh + 5;
    });
  } else {
    box("No Anomalies Detected", "All expenses appear routine.", "success");
  }

  // SECTION 02
  sectionBand("02", "Budget Intelligence", "Limit advice  |  Burn-rate status", C.violet);
  h2("Smart Limit Advisor");
  box("Budget Recommendation", report.budgetIntelligence.limitAdvice, "primary");
  gap(3);
  h2("Budget Utilization");
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  budgetBar("Current Spend vs Budget", totalSpent, monthlyLimit || 50000);
  gap(3);
  h2("Burn Rate Status");
  const isWarn = report.budgetIntelligence.burnRate.status === "warning";
  chip(`Status  ${isWarn ? "[WARNING]" : "[OK]"}`, report.budgetIntelligence.burnRate.status.toUpperCase(), isWarn ? "danger" : "success");
  gap(2);
  box("Burn Rate Analysis", report.budgetIntelligence.burnRate.message, isWarn ? "danger" : "success");
  if (report.budgetIntelligence.reallocationTips.length > 0) {
    h2("Smart Reallocation Tips");
    report.budgetIntelligence.reallocationTips.forEach((tip: string) => bul(tip));
  }

  // SECTION 03
  sectionBand("03", "Income Insights", "Savings trend  |  Gap analysis", C.green);
  h2("Savings Rate Trend");
  if (report.incomeInsights.savingsRateTrend.length > 0) {
    report.incomeInsights.savingsRateTrend.forEach((t: any) => savingsBar(t.month, t.rate));
  } else {
    para("No savings trend data available yet.");
  }
  gap(4);
  h2("Gap Intelligence");
  box("Gap Analysis", report.incomeInsights.gapAnalysis, "success");
  gap(3);
  h2("Monthly Comparison");
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalSavings = Math.max(0, totalIncome - totalSpent);
  const compData = [
    { label: "Income", value: totalIncome, color: C.success },
    { label: "Expenses", value: totalSpent, color: C.danger },
    { label: "Savings", value: totalSavings, color: C.indigo },
  ];
  barChart("Income vs Expenses vs Savings", compData);

  // SECTION 04
  sectionBand("04", "Detailed Breakdown", "Category-wise spending", C.orange);
  h2("Spending by Category");
  const subMap = new Map<string, number>();
  expenses.forEach(e => subMap.set(e.subcategory, (subMap.get(e.subcategory) || 0) + e.amount));
  const catRows = Array.from(subMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, amt, `${((amt / (totalSpent || 1)) * 100).toFixed(1)}%`]);

  table(["Category", "Amount (Rs.)", "% of Total"], catRows, [CW * 0.5, CW * 0.25, CW * 0.25]);
  gap(3);
  h2("Top Spending Distribution");
  const topCats = Array.from(subMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
  barChart("Top 5 Categories", topCats);

  // SECTION 05
  sectionBand("05", "Finance Advice", "Long-term strategy", C.orange);
  h2("Strategic Advice");
  box("Long-Term Strategy", report.financeAdvice.longTermAdvice, "primary");
  gap(4);
  h2("Emergency Fund Status");
  box("Emergency Fund Intelligence", report.financeAdvice.emergencyFundStatus, "warning");
  gap(4);
  h2("Hypothetical Scenario");
  chip("Stress-Test Scenario - ", report.financeAdvice.hypotheticalScenario.title, "primary");
  gap(2);
  box("AI Stress-Test Response", report.financeAdvice.hypotheticalScenario.advice, "primary");

  // SECTION 06
  if (report.suggestions && report.suggestions.length > 0) {
    sectionBand("06", "Actionable Suggestions", "Personalized advice  |  Potential savings", C.indigo);
    h2("Personalized Savings Opportunities");

    report.suggestions.forEach((s: any) => {
      const label = `${s.category} Advice`;
      const content = `${s.suggestion}\n\nPotential Savings: ${s.potentialSavings}`;
      box(label, content, "success");
      gap(2);
    });
  }

  drawFooter();
  const safeDateStr = new Date(reportDate || "").toLocaleDateString("en-IN").replace(/\//g, "-");
  pdf.save(`AI_Analysis_Report_${safeDateStr}.pdf`);
};