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

const loadingStages = [
  "Securing Environment...",
  "Analyzing Spending Patterns",
  "Evaluating Budget Efficiency",
  "Income vs Expense Gap Analysis",
  "Generating Longitudinal Advice"
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("Spending");
  const [canRunAnalysis, setCanRunAnalysis] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: { id: TabType; icon: any; label: string }[] = [
    { id: "Spending", icon: Wallet, label: "Spending Analysis" },
    { id: "Budget", icon: Target, label: "Budget Intelligence" },
    { id: "Income", icon: History, label: "Income Insights" },
    { id: "Advice", icon: ShieldCheck, label: "Finance Advice" },
  ];

  // Fetch latest report for today
  useEffect(() => {
    const fetchLatestReport = async () => {
      try {
        const res = await fetch("/api/analyze");
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
          setCanRunAnalysis(false);
        }
      } catch (err) {
        console.error("Failed to fetch latest report", err);
      } finally {
        setIsLoadingReport(false);
      }
    };
    fetchLatestReport();
  }, []);

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
            {/* Header with New Analysis Button when report is displayed */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border-subtle p-6 rounded-[2rem] shadow-sm mb-4">
              <div>
                <h2 className="text-xl font-black text-foreground">Your Financial Report</h2>
                <p className="text-xs font-black text-muted uppercase tracking-widest mt-1">Generated today • Forensic Analysis</p>
              </div>
              <button
                onClick={() => {
                  setReport(null);
                  setError(null);
                }}
                disabled={!canRunAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                {canRunAnalysis ? "New Analysis" : "Daily Limit Reached"}
              </button>
            </div>

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
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-h-[90vh] max-w-lg bg-surface border border-border-subtle rounded-[3rem] p-10 sm:p-12 shadow-2xl text-center space-y-8"
            >
              <div className="relative w-20 h-20 mx-auto mb-10">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-dashed border-primary-500/30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-xl animate-pulse">
                    <Brain size={32} />
                  </div>
                </div>
              </div>

              <div className="space-y-4  flex flex-col items-center justify-center">
                <h2 className="text-xl font-black tracking-tighter">AI Analysis in Progress</h2>
                <div className="space-y-6">
                  {loadingStages.map((text, i) => (
                    <div key={i} className="flex items-center justify-left gap-4">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${stage > i ? "bg-success text-white" :
                          stage === i ? "bg-primary-500 text-white animate-spin" :
                            "bg-surface-variant text-transparent"
                        }`}>
                        {stage > i ? <CheckCircle2 size={10} strokeWidth={3} /> : <Loader2 size={10} />}
                      </div>
                      <span className={`text-xs font-black transition-all ${stage > i ? "text-secondary line-through opacity-50" :
                          stage === i ? "text-foreground scale-105" :
                            "text-muted opacity-30"
                        }`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs font-black text-muted uppercase bg-surface-variant py-3 px-6 rounded-2xl inline-block mt-4">
                Processing Forensic Data Points
              </p>
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
