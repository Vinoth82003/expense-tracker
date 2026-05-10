"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShieldCheck, 
  Smartphone, 
  Download, 
  Mail,
  ChevronRight,
  ArrowUpRight,
  Target,
  Zap,
  Activity
} from "lucide-react";
import { subDays, format } from "date-fns";

const TEAL_COLORS = ["#00D4AA", "#00B28F", "#008F73", "#006D58", "#004B3D"];
const GRAY_COLOR = "#334155";

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("30"); // 7, 30, 90
  const [dauData, setDauData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [retention, setRetention] = useState([]);
  const [modes, setModes] = useState<any>(null);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    const from = subDays(new Date(), parseInt(range)).toISOString();
    const to = new Date().toISOString();

    try {
      const [dauRes, growthRes, featuresRes, retentionRes, modesRes, ratesRes] = await Promise.all([
        fetch(`/api/admin/analytics/dau?from=${from}&to=${to}`),
        fetch(`/api/admin/analytics/growth?from=${from}&to=${to}`),
        fetch(`/api/admin/analytics/features?from=${from}&to=${to}`),
        fetch(`/api/admin/analytics/retention`),
        fetch(`/api/admin/analytics/modes`),
        fetch(`/api/admin/analytics/2fa-rate`)
      ]);

      setDauData(await dauRes.json());
      setGrowthData(await growthRes.json());
      setFeatureUsage(await featuresRes.json());
      setRetention(await retentionRes.json());
      setModes(await modesRes.json());
      setRates(await ratesRes.json());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const dauMauRatio = useMemo(() => {
    if (dauData.length === 0) return 0;
    const last = dauData[dauData.length - 1] as any;
    return last.ratio;
  }, [dauData]);

  const exportCSV = () => {
    // Basic CSV export logic
    const data = [
      ["Date", "DAU", "MAU", "Ratio"],
      ...dauData.map((d: any) => [d.date, d.dau, d.mau, d.ratio])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spendwise_analytics_${range}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] tracking-tight">App analytics</h1>
          <p className="text-[var(--admin-text-secondary)] font-medium">Engagement, retention, and feature usage</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-[var(--admin-bg-surface-variant)] rounded-2xl w-fit">
            {["7", "30", "90"].map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === r ? 'bg-[var(--admin-bg-card)] text-teal-500 shadow-sm' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}
              >
                Last {r} Days
              </button>
            ))}
          </div>
          <button 
            onClick={exportCSV}
            className="p-3 bg-[var(--admin-bg-card)] rounded-2xl border border-[var(--admin-border)] hover:border-teal-500 transition-all group"
          >
            <Download size={20} className="text-[var(--admin-text-muted)] group-hover:text-teal-500" />
          </button>
        </div>
      </div>

      {/* Row 1: DAU/MAU & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DAU/MAU */}
        <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest mb-1">Stickiness (DAU/MAU)</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[var(--admin-text-primary)]">{dauMauRatio}%</span>
                <span className="text-emerald-500 flex items-center text-sm font-bold">
                  <TrendingUp size={16} /> 4.2%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500">
              <Activity size={24} />
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dauData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--admin-text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--admin-text-muted)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)', borderRadius: '12px', color: 'var(--admin-text-primary)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="dau" stroke="#00D4AA" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="DAU" />
                <Line type="monotone" dataKey="mau" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="MAU" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth */}
        <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest mb-1">User Growth</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[var(--admin-text-primary)]">
                  {growthData.length > 0 ? (growthData[growthData.length - 1] as any).users : 0}
                </span>
                <span className="text-[var(--admin-text-muted)] text-sm font-bold">Total registered</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={24} />
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--admin-text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--admin-text-muted)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)', borderRadius: '12px', color: 'var(--admin-text-primary)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#00D4AA" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Feature Usage */}
      <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-8 space-y-8">
        <div>
          <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest mb-1">Feature Usage</h3>
          <p className="text-2xl font-bold text-[var(--admin-text-primary)]">Engagement across platform modules</p>
        </div>
        
        <div className="space-y-5">
          {featureUsage.map((item: any, index: number) => {
            const maxCount = Math.max(...featureUsage.map((f: any) => f.count)) || 1;
            const percentage = (item.count / maxCount) * 100;
            const color = TEAL_COLORS[index % TEAL_COLORS.length];
            
            return (
              <div key={item.feature} className="flex items-center gap-4 group">
                <div className="w-24 text-right">
                  <span className="text-xs font-bold text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)] transition-colors">{item.feature}</span>
                </div>
                <div className="flex-1 h-6 bg-[var(--admin-bg-surface-variant)]/50 rounded-r-lg rounded-l-sm overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                    className="h-full rounded-r-lg relative overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                  </motion.div>
                </div>
                <div className="w-16">
                  <span className="text-sm font-black text-[var(--admin-text-primary)]">{item.count}</span>
                  <span className="text-[10px] text-[var(--admin-text-muted)] ml-1">hits</span>
                </div>
              </div>
            );
          })}
          
          {featureUsage.length === 0 && (
            <div className="py-10 text-center border-2 border-dashed border-[var(--admin-border)] rounded-2xl">
              <p className="text-sm font-bold text-[var(--admin-text-muted)]">Not enough data to calculate engagement yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Mode Split */}
        <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-8 flex flex-col items-center">
          <div className="w-full mb-8">
            <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest">Expense Mode Split</h3>
            <p className="text-xl font-bold text-[var(--admin-text-primary)]">User preference distribution</p>
          </div>
          <div className="relative h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Limit Mode", value: modes?.limit || 0 },
                    { name: "No Limit", value: modes?.noLimit || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#00D4AA" />
                  <Cell fill="#E2E8F0" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-[var(--admin-text-primary)]">{modes?.total || 0}</span>
              <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase">Users</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 w-full mt-8">
            <div className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10">
              <p className="text-[10px] font-black uppercase text-teal-600 mb-1">Limit Mode</p>
              <p className="text-2xl font-black">{modes?.limitPercent}%</p>
              <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                <ArrowUpRight size={12} /> +4% trend
              </p>
            </div>
            <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border)]">
              <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] mb-1">No Limit</p>
              <p className="text-2xl font-black text-[var(--admin-text-primary)]">{modes?.noLimitPercent}%</p>
              <p className="text-[10px] text-[var(--admin-text-muted)] font-bold flex items-center gap-1 mt-1">
                <TrendingDown size={12} /> Stable
              </p>
            </div>
          </div>
        </div>

        {/* 2FA & PWA Rates */}
        <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm p-8 space-y-8">
          <div>
            <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest">Adoption Rates</h3>
            <p className="text-xl font-bold text-[var(--admin-text-primary)]">Platform feature penetration</p>
          </div>
          
          <div className="space-y-12 py-4">
            {/* 2FA */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[var(--admin-text-primary)]">2FA Security</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">Users with OTP enabled</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[var(--admin-text-primary)]">{rates?.twoFactor.percent}%</span>
                  <span className="text-sm font-bold text-[var(--admin-text-muted)] block">{rates?.twoFactor.count} users</span>
                </div>
              </div>
              <div className="h-2 bg-[var(--admin-bg-surface-variant)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${rates?.twoFactor.percent}%` }}
                  className="h-full bg-teal-500 rounded-full"
                />
              </div>
              <button className="flex items-center gap-2 text-xs font-black uppercase text-teal-600 hover:text-teal-700 transition-colors">
                <Mail size={14} /> Send nudge email
              </button>
            </div>

            {/* PWA */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[var(--admin-text-primary)]">PWA Installs</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">App installed on home screen</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[var(--admin-text-primary)]">{rates?.pwa.percent}%</span>
                  <span className="text-sm font-bold text-[var(--admin-text-muted)] block">{rates?.pwa.count} installs</span>
                </div>
              </div>
              <div className="h-2 bg-[var(--admin-bg-surface-variant)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${rates?.pwa.percent}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-[var(--admin-text-muted)] font-bold flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" /> +12% this month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Retention Cohorts */}
      <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[var(--admin-border-subtle)]">
          <h3 className="text-sm font-black uppercase text-[var(--admin-text-muted)] tracking-widest mb-1">User Retention</h3>
          <p className="text-xl font-bold text-[var(--admin-text-primary)]">Signup cohort performance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">
                <th className="py-6 px-8 border-b border-[var(--admin-border-subtle)]">Cohort</th>
                <th className="py-6 px-8 border-b border-[var(--admin-border-subtle)]">Users</th>
                <th className="py-6 px-8 border-b border-[var(--admin-border-subtle)]">D1</th>
                <th className="py-6 px-8 border-b border-[var(--admin-border-subtle)]">D7</th>
                <th className="py-6 px-8 border-b border-[var(--admin-border-subtle)]">D14</th>
                <th className="py-6 px-8 border-b border-[var(--admin-border-subtle)]">D30</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border-subtle)]">
              {retention.map((row: any, i) => (
                <tr key={i} className="hover:bg-[var(--admin-bg-surface-variant)] transition-colors">
                  <td className="py-5 px-8 text-sm font-black text-[var(--admin-text-primary)]">{row.month}</td>
                  <td className="py-5 px-8 text-sm font-bold text-[var(--admin-text-muted)]">{row.users}</td>
                  <RetentionCell value={row.d1} />
                  <RetentionCell value={row.d7} />
                  <RetentionCell value={row.d14} />
                  <RetentionCell value={row.d30} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RetentionCell({ value }: { value: string | null }) {
  if (value === null) return <td className="py-5 px-8 text-xs text-[var(--admin-text-muted)] opacity-50 italic">-</td>;
  const num = parseFloat(value);
  const color = num >= 50 ? "bg-emerald-500/10 text-emerald-600" : num >= 25 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600";
  return (
    <td className="py-5 px-8">
      <div className={`px-3 py-1 rounded-lg text-xs font-black inline-block ${color}`}>
        {value}%
      </div>
    </td>
  );
}
