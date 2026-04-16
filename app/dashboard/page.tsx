"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowUpRight, 
  Wallet, 
  ShoppingCart, 
  Activity,
  CalendarDays,
  PieChart
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-widest uppercase mb-2">
              <Sparkles size={16} />
              Good to see you again
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-primary-500 to-tertiary-500 bg-clip-text text-transparent">{firstName}!</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-secondary font-medium bg-surface border border-border-subtle px-4 py-2 rounded-xl shadow-sm">
            <CalendarDays size={18} className="text-primary-500" />
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>
      </section>

      {/* Quick Stats Grid Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Spent", value: "₹0.00", icon: Wallet, color: "text-primary-500", bg: "bg-primary-50" },
          { label: "Remaining", value: "₹0.00", icon: Activity, color: "text-success", bg: "bg-success/10" },
          { label: "Daily Average", value: "₹0.00", icon: ShoppingCart, color: "text-tertiary-500", bg: "bg-tertiary-50" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <button className="text-muted hover:text-foreground">
                <ArrowUpRight size={20} />
              </button>
            </div>
            <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-3xl font-black text-foreground">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Placeholder Content for main area */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-6 text-muted">
            <Activity size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No activity recorded yet</h3>
          <p className="text-secondary mb-8">Start tracking your expenses to see detailed analytics here.</p>
          <button className="px-6 py-3 rounded-xl bg-primary-100 text-primary-600 font-bold hover:bg-primary-200 transition-colors">
            Learn how it works
          </button>
        </div>

        <div className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-6 text-muted">
            <PieChart size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Detailed Reports</h3>
          <p className="text-secondary mb-8">Visualize your spending patterns across categories.</p>
          <button className="px-6 py-3 rounded-xl bg-primary-100 text-primary-600 font-bold hover:bg-primary-200 transition-colors">
            View Sample Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}
