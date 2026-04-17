"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Brain, 
  ChevronRight, 
  Download, 
  Loader2, 
  CheckCircle2, 
  TrendingUp,
  AlertCircle,
  FileText,
  Printer,
  Zap,
  Star
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";

const loadingStages = [
  "Analyze your Income",
  "Analyze your Expense",
  "Analyze your Budget",
  "Generating Final Report."
];

interface AIReport {
  summary: string;
  warnings: string[];
  suggestions: string[];
  savingsPlan: string;
}

export default function AnalyzePage() {
  const { data: session } = useSession();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [report, setReport] = useState<AIReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loading sequence effect
  useEffect(() => {
    if (isAnalyzing && stage < loadingStages.length - 1) {
      const timer = setTimeout(() => {
        setStage(prev => prev + 1);
      }, 2500); // 2.5 seconds per stage for dramatic effect
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, stage]);

  const handleAnalyze = async () => {
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

      // Ensure we stay on the final stage for at least a second even if API is fast
      if (stage < loadingStages.length - 1) {
        setTimeout(() => {
            setReport(data);
            setIsAnalyzing(false);
          }, (loadingStages.length - stage) * 1500);
      } else {
        setReport(data);
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30">
              <Brain className="text-white" size={24} />
            </div>
            <span className="font-black text-xs uppercase tracking-[0.2em] text-white/80">Premium AI Insights</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight mb-6"
          >
            Smarter Money <br />
            <span className="text-indigo-200">With Gemini AI.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-indigo-50/80 font-medium mb-10 max-w-xl"
          >
            Get a deep forensic analysis of your spending patterns, income streams, and budget efficiency. Our AI provides actionable advice to help you reach your goals faster.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="group relative flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
            Analyze with AI
            <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-10 bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
        <Zap className="absolute right-12 top-12 text-white/10 w-32 h-32 rotate-12" />
      </section>

      {/* Feature highlight */}
      {!report && !isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { icon: TrendingUp, title: "Pattern Recognition", desc: "Identify recurring expenses that are draining your wallet." },
                { icon: Star, title: "Actionable Advice", desc: "Get specific, personalized steps to improve your savings." },
                { icon: AlertCircle, title: "Budget Alerts", desc: "Know exactly where and why you're overspending." }
            ].map((f, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-6 bg-surface border border-border-subtle rounded-3xl"
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-4">
                        <f.icon size={24} />
                    </div>
                    <h3 className="font-black text-lg mb-2">{f.title}</h3>
                    <p className="text-secondary text-sm font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
            ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-error/10 border border-error/20 rounded-3xl flex items-center gap-4 text-error"
        >
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
        </motion.div>
      )}

      {/* Report Content */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between p-6 sm:p-8 bg-surface border border-border-subtle rounded-[2.5rem] print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-lg">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl">Financial Analysis Report</h2>
                        <p className="text-xs text-muted font-bold uppercase tracking-widest">Generated by SpendWise AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint}
                        className="p-3 rounded-xl bg-surface border border-border-subtle text-secondary hover:text-foreground transition-all shadow-sm active:scale-95"
                        title="Print Report"
                    >
                        <Printer size={20} />
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download size={18} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 sm:p-12 shadow-sm">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                    <Sparkles className="text-primary-500" />
                    Forensic Summary
                </h3>
                <div className="prose prose-indigo max-w-none dark:prose-invert prose-p:text-secondary prose-p:font-medium">
                    <ReactMarkdown>{report.summary}</ReactMarkdown>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Warnings Section */}
                <div className="bg-error/5 border border-error/20 rounded-[2.5rem] p-8">
                    <h3 className="text-xl font-black text-error mb-6 flex items-center gap-2">
                        <AlertCircle size={24} />
                        Red Flags & Warnings
                    </h3>
                    <ul className="space-y-4">
                        {report.warnings.map((warning, i) => (
                            <li key={i} className="flex gap-3 text-error/80 font-bold text-sm bg-white/50 p-4 rounded-2xl border border-error/10">
                                <div className="w-5 h-5 rounded-full bg-error text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">!</div>
                                {warning}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Suggestions Section */}
                <div className="bg-primary-500/5 border border-primary-500/20 rounded-[2.5rem] p-8">
                    <h3 className="text-xl font-black text-primary-600 mb-6 flex items-center gap-2">
                        <Zap size={24} />
                        Actionable Suggestions
                    </h3>
                    <ul className="space-y-4">
                        {report.suggestions.map((suggestion, i) => (
                            <li key={i} className="flex gap-3 text-primary-900/70 font-bold text-sm bg-white/50 p-4 rounded-2xl border border-primary-500/10">
                                <CheckCircle2 size={18} className="text-primary-500 shrink-0 mt-0.5" />
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Savings Plan */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 text-indigo-200/50 group-hover:scale-110 transition-transform">
                    <TrendingUp size={120} />
                </div>
                <h3 className="text-2xl font-black text-indigo-950 mb-6 flex items-center gap-2 relative z-10">
                    <Star className="text-indigo-500" />
                    Personalized Savings Plan
                </h3>
                <div className="prose prose-indigo max-w-none dark:prose-invert prose-p:text-indigo-900/80 prose-p:font-bold relative z-10">
                    <ReactMarkdown>{report.savingsPlan}</ReactMarkdown>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block p-8 border-b-2 border-primary-500 mb-8">
                <h1 className="text-4xl font-black mb-2">SpendWise AI Financial Report</h1>
                <p className="text-lg font-bold text-secondary">Analysis for {session?.user?.name || "Premium User"}</p>
                <p className="text-sm text-muted">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/40 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-surface border border-border-subtle rounded-[3rem] p-10 sm:p-12 shadow-2xl text-center space-y-8"
            >
              <div className="relative w-24 h-24 mx-auto mb-10">
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-dashed border-primary-500/30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-xl animate-pulse">
                      <Brain size={32} />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tight">AI Intelligence at Work</h2>
                <div className="space-y-6">
                  {loadingStages.map((text, i) => (
                    <div key={i} className="flex items-center justify-center gap-4 group">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                        stage > i ? "bg-success text-white" : 
                        stage === i ? "bg-primary-500 text-white animate-spin ring-4 ring-primary-500/20" : 
                        "bg-surface-variant text-transparent"
                      }`}>
                        {stage > i ? <CheckCircle2 size={14} strokeWidth={3} /> : <Loader2 size={14} />}
                      </div>
                      <span className={`text-xl font-black transition-all duration-500 ${
                        stage > i ? "text-secondary line-through opacity-50" : 
                        stage === i ? "text-foreground scale-110" : 
                        "text-muted opacity-30"
                      }`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-muted font-bold text-sm bg-surface-variant/50 py-3 px-6 rounded-2xl inline-block mt-8 italic">
                Scanning thousands of data points...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #main-content, #main-content * {
            visibility: visible;
          }
          aside, header, nav, button {
            display: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
