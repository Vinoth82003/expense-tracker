"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Printer,
  Zap,
  Target,
  Wallet,
  ArrowRightLeft,
  History,
  ShieldCheck,
  Briefcase,
  Lightbulb
} from "lucide-react";
import { useSession } from "next-auth/react";
import ThemedMarkdown from "@/components/markdown/ThemedMarkdown";
import { useDashboard } from "@/context/DashboardContext";
import { generatePDF } from "@/app/utils/PDFGenerator";

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
  suggestions: Array<{
    category: string;
    suggestion: string;
    potentialSavings: string;
  }>;
}

type TabType = "Spending" | "Budget" | "Income" | "Advice" | "Suggestions";

export default function AnalyzePage() {
  const { data: session } = useSession();
  const { expenses, incomes, stats, monthlyLimit } = useDashboard();
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
    { id: "Suggestions", icon: Lightbulb, label: "AI Suggestions" },
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
      await generatePDF(report, expenses, incomes, monthlyLimit, reportDate || new Date().toISOString());
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
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* Hero — no report */}
      {!report && !isAnalyzing && (
        <section className="bg-surface border border-border-subtle rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
              <Brain size={20} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">SpendWise Forensic AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Financial Forensics &amp; Intelligence
          </h1>
          <p className="text-sm text-secondary max-w-xl mb-6">
            Deep-tissue analysis of your spending, income, and budget health with actionable AI-driven recommendations.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !canRunAnalysis}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40"
            >
              <Sparkles size={16} />
              {canRunAnalysis ? "Run Analysis" : "Daily Limit Reached"}
            </button>
            {!canRunAnalysis && (
              <span className="text-xs text-muted">Next analysis available tomorrow</span>
            )}
          </div>
        </section>
      )}

      {/* Feature cards — no report, no loading */}
      {!report && !isAnalyzing && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, title: "Pattern Recognition", desc: "Identifies spending habits before they drain your savings." },
            { icon: ShieldCheck, title: "Stress-Testing", desc: "Foresees how your finances handle income dips or sudden expenses." },
            { icon: Zap, title: "Dynamic Budgeting", desc: "Real-time limit suggestions based on actual burn rate." },
          ].map((f, i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Analysis failed</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Report View */}
      {report && (
        <>
          {/* Tab bar */}
          <div className="sticky top-[57px] z-40 bg-background pb-2">
            <div className="flex gap-1 bg-surface border border-border-subtle rounded-lg p-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => { tabRefs.current[index] = el; }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all shrink-0 ${
                      isActive ? "bg-primary-500 text-white shadow-sm" : "text-secondary hover:text-foreground"
                    }`}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 bg-surface border border-border-subtle rounded-xl p-4">
            <div className="flex items-center gap-2">
              <select
                value={selectedReportId}
                onChange={fetchHistoricalReport}
                className="bg-surface-variant border border-border-subtle text-foreground text-xs font-medium rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select past report...</option>
                {history.map(h => (
                  <option key={h.id} value={h.id}>
                    {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </option>
                ))}
              </select>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md ${
                report.spendingAnalysis.metrics.some(m => m.type === 'danger')
                  ? 'bg-error/10 text-error'
                  : report.spendingAnalysis.metrics.some(m => m.type === 'neutral')
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}>
                {report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? <AlertCircle size={12} /> :
                 report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? <TrendingUp size={12} /> :
                 <CheckCircle2 size={12} />}
                {report.spendingAnalysis.metrics.some(m => m.type === 'danger') ? 'Needs Attention' :
                 report.spendingAnalysis.metrics.some(m => m.type === 'neutral') ? 'Fair' : 'Healthy'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-variant text-secondary hover:text-foreground text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                Export PDF
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !canRunAnalysis}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors disabled:opacity-40"
              >
                <Sparkles size={14} />
                {isAnalyzing ? "Analyzing..." : canRunAnalysis ? "Analyze Now" : "Limit Reached"}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div ref={reportRef} className="space-y-4">

                {/* Spending */}
                {activeTab === "Spending" && (
                  <>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-4 pb-3 border-b border-border-subtle">Monthly Summary</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        {report.spendingAnalysis.metrics.map((metric, i) => (
                          <div key={i} className="p-4 bg-surface-variant/50 rounded-lg border border-border-subtle">
                            <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1.5">{metric.label}</p>
                            <p className={`text-lg font-bold ${
                              metric.type === 'danger' ? 'text-error' :
                              metric.type === 'success' ? 'text-success' : 'text-foreground'
                            }`}>{metric.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-primary-500/5 border border-primary-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2 text-primary-600">
                          <Sparkles size={15} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">AI Insight</span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <ThemedMarkdown content={report.spendingAnalysis.summary} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                        <AlertCircle size={16} className="text-error" />
                        Anomalies
                      </h3>
                      <div className="space-y-2">
                        {report.spendingAnalysis.anomalies.map((anomaly, i) => (
                          <div key={i} className="flex gap-2.5 text-xs text-secondary bg-error/5 p-3 rounded-lg border border-error/10">
                            <span className="w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[8px] shrink-0 mt-0.5 font-bold">!</span>
                            {anomaly}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Budget */}
                {activeTab === "Budget" && (
                  <>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                        <Target size={16} className="text-primary-500" />
                        Limit Advisor
                      </h3>
                      <div className="bg-primary-500/5 border border-primary-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2 text-primary-600">
                          <Brain size={15} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Recommendation</span>
                        </div>
                        <p className="text-sm text-secondary">{report.budgetIntelligence.limitAdvice}</p>
                      </div>
                    </div>
                    <div className={`rounded-xl p-5 border ${
                      report.budgetIntelligence.burnRate.status === 'warning'
                        ? 'bg-error/5 border-error/20' : 'bg-success/5 border-success/20'
                    }`}>
                      <h3 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${
                        report.budgetIntelligence.burnRate.status === 'warning' ? 'text-error' : 'text-success'
                      }`}>
                        <Zap size={16} />
                        Burn Rate
                      </h3>
                      <p className="text-sm text-foreground">{report.budgetIntelligence.burnRate.message}</p>
                    </div>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                        <ArrowRightLeft size={16} className="text-primary-500" />
                        Reallocation Tips
                      </h3>
                      <ul className="space-y-2">
                        {report.budgetIntelligence.reallocationTips.map((tip, i) => (
                          <li key={i} className="flex gap-3 items-start bg-surface-variant/50 p-3.5 rounded-lg border border-border-subtle">
                            <div className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-600 flex items-center justify-center shrink-0">
                              <Zap size={14} />
                            </div>
                            <p className="text-xs text-secondary">{tip}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Income */}
                {activeTab === "Income" && (
                  <>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-5 flex items-center gap-2">
                        <History size={16} className="text-success" />
                        Savings Trend
                      </h3>
                      <div className="space-y-4">
                        {report.incomeInsights.savingsRateTrend.map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-medium text-muted">{item.month}</span>
                              <span className="text-xs font-semibold text-success">{item.rate}</span>
                            </div>
                            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: item.rate }}
                                className="h-full rounded-full bg-success"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-primary-500" />
                        Income vs Expense Gap
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ThemedMarkdown content={report.incomeInsights.gapAnalysis} />
                      </div>
                    </div>
                  </>
                )}

                {/* Advice */}
                {activeTab === "Advice" && (
                  <>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary-500" />
                        Strategic Advice
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm mb-5">
                        <ThemedMarkdown content={report.financeAdvice.longTermAdvice} />
                      </div>
                      <div className="bg-primary-500/5 border border-primary-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2 text-primary-600">
                          <ShieldCheck size={15} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Emergency Fund</span>
                        </div>
                        <p className="text-sm text-secondary">{report.financeAdvice.emergencyFundStatus}</p>
                      </div>
                    </div>
                    <div className="bg-surface border border-border-subtle rounded-xl p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-1 flex items-center gap-2">
                        <Briefcase size={16} className="text-warning" />
                        Stress Test: {report.financeAdvice.hypotheticalScenario.title}
                      </h3>
                      <p className="text-[10px] text-muted mb-4">Hypothetical scenario analysis</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ThemedMarkdown content={report.financeAdvice.hypotheticalScenario.advice} />
                      </div>
                    </div>
                  </>
                )}

                {/* Suggestions */}
                {activeTab === "Suggestions" && (
                  <div className="bg-surface border border-border-subtle rounded-xl p-5">
                    <h3 className="font-semibold text-sm text-foreground mb-5 flex items-center gap-2">
                      <Lightbulb size={16} className="text-warning" />
                      AI Suggestions
                    </h3>
                    {report.suggestions?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.suggestions.map((suggestion, i) => (
                          <div key={i} className="bg-surface-variant/50 border border-border-subtle rounded-lg p-4">
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="text-[10px] font-semibold bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded uppercase tracking-wider">{suggestion.category}</span>
                              <span className="text-[10px] font-semibold text-success">{suggestion.potentialSavings}</span>
                            </div>
                            <p className="text-xs text-foreground leading-relaxed">{suggestion.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">No actionable suggestions for this report.</p>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Loading overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-surface border border-border-subtle rounded-xl shadow-lg w-full max-w-sm mx-4 overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-1 bg-surface-variant">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${((stage + 1) / loadingStages.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 shrink-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-primary-500/20 border-t-primary-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain size={18} className="text-primary-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Running Analysis</p>
                    <p className="text-xs text-muted">
                      Step {stage + 1} of {loadingStages.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {loadingStages.map((text, i) => {
                    const isComplete = i < stage;
                    const isCurrent = i === stage;
                    return (
                      <motion.div
                        key={i}
                        initial={isCurrent ? { opacity: 0, x: -8 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          isComplete
                            ? "text-success"
                            : isCurrent
                              ? "bg-primary-500/5 text-foreground font-medium"
                              : "text-muted"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 size={16} className="shrink-0" />
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="w-4 h-4 shrink-0"
                          >
                            <Loader2 size={16} className="animate-spin text-primary-500" />
                          </motion.div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border-subtle shrink-0" />
                        )}
                        <span className={isComplete ? "line-through opacity-70" : ""}>{text}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
