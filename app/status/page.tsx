"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, AlertCircle, RefreshCw, Database, Server, Globe } from "lucide-react";

interface HealthStatus {
  status: string;
  services: {
    database: string;
    api: string;
    server: string;
  };
  timestamp: string;
}

export default function StatusPage() {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Status check failed", error);
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 60000); // Auto refresh every minute
    return () => clearInterval(timer);
  }, []);

  const isOperational = data?.status === "operational";

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen">
        <section className="px-5 md:px-10 max-w-4xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-10"
          >
            <div className="flex justify-center">
              <div className={`px-6 py-3 rounded-full flex items-center gap-3 border-2 ${loading ? 'border-border-subtle bg-surface-variant animate-pulse' : isOperational ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600' : 'border-rose-500/20 bg-rose-500/10 text-rose-600'}`}>
                {loading ? (
                   <RefreshCw size={24} className="animate-spin text-muted" />
                ) : isOperational ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <AlertCircle size={24} />
                )}
                <span className="text-xl font-black uppercase tracking-widest">
                  {loading ? "Checking..." : isOperational ? "All Systems Operational" : "Service Degraded"}
                </span>
              </div>
            </div>

            <p className="text-xl text-secondary max-w-2xl mx-auto font-medium">
              Real-time monitoring of SpendWise infrastructure and critical services. Last checked at: <span className="text-foreground font-black">{lastChecked}</span>
            </p>
          </motion.div>
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Database", service: data?.services.database, icon: Database },
            { name: "API Endpoint", service: data?.services.api, icon: Server },
            { name: "Application", service: data?.services.server, icon: Globe },
          ].map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle flex flex-col items-center justify-center text-center space-y-6 shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center text-secondary">
                <item.icon size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground mb-1">{item.name}</h3>
                <div className={`text-xs font-black uppercase tracking-widest ${item.service === 'connected' || item.service === 'healthy' || item.service === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {loading ? "..." : item.service || "Offline"}
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto mt-24">
          <div className="bg-surface border border-border-subtle rounded-[3rem] p-10 space-y-8">
            <h3 className="text-2xl font-black text-foreground tracking-tight">Incident History</h3>
            <div className="space-y-6 opacity-60">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex justify-between items-center py-4 border-b border-border-subtle last:border-none">
                    <span className="text-sm font-bold text-secondary">April {19 - i}, 2026</span>
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">No incidents reported</span>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
