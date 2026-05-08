"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ToggleLeft, 
  Bot, 
  Wrench, 
  Mail, 
  Database, 
  Users, 
  Info,
  ShieldAlert,
  Save,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Code,
  Zap,
  UserX,
  Unlock,
  ShieldCheck
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("flags");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error' } | null>(null);

  const [featureFlags, setFeatureFlags] = useState<any>({});
  const [aiSettings, setAiSettings] = useState<any>({});
  const [maintenance, setMaintenance] = useState<any>({});
  const [smtp, setSmtp] = useState<any>({});
  const [systemTemplates, setSystemTemplates] = useState<any>({
    maintenanceAnnouncement: "",
    twoFactorOverride: "",
    accountLockout: "",
    accountUnlock: "",
    accountSuspension: "",
    accountReactivation: ""
  });
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("SUPER");

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setFeatureFlags(data.featureFlags);
        setAiSettings(data.aiSettings);
        setMaintenance(data.maintenance);
        setSmtp(data.smtp);
        setSystemTemplates(data.systemTemplates || {
          maintenanceAnnouncement: "",
          twoFactorOverride: "",
          accountLockout: "",
          accountUnlock: "",
          accountSuspension: "",
          accountReactivation: ""
        });
      }

      const templatesRes = await fetch("/api/admin/notifications/templates");
      if (templatesRes.ok) {
        setAllTemplates(await templatesRes.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    const res = await fetch("/api/admin/roles");
    if (res.ok) {
      setAdmins(await res.json());
    }
  };

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFlag = async (key: string, enabled: boolean) => {
    if (key === "aiAnalysis" && !enabled) {
      if (!confirm("This will prevent all users from generating AI reports. Are you sure?")) return;
    }

    setFeatureFlags((prev: any) => ({ ...prev, [key]: enabled }));
    
    try {
      const res = await fetch(`/api/admin/settings/feature-flags/${key}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        showToast("Feature flag updated");
      } else {
        throw new Error("Failed");
      }
    } catch {
      setFeatureFlags((prev: any) => ({ ...prev, [key]: !enabled })); // revert
      showToast("Failed to update feature flag", "error");
    }
  };

  const saveAiSettings = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings/ai", {
      method: "PATCH",
      body: JSON.stringify(aiSettings)
    });
    setSaving(false);
    if (res.ok) showToast("AI settings saved");
    else showToast("Failed to save AI settings", "error");
  };

  const saveSystemTemplates = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ systemTemplates })
    });
    setSaving(false);
    if (res.ok) showToast("Automation settings saved");
    else showToast("Failed to save automation settings", "error");
  };

  const toggleMaintenance = async (enabled: boolean) => {
    if (enabled && !confirm("This will block all non-admin users from accessing SpendWise. Continue?")) return;
    
    const newSettings = { ...maintenance, enabled };
    setMaintenance(newSettings);
    
    const res = await fetch("/api/admin/settings/maintenance", {
      method: "PATCH",
      body: JSON.stringify(newSettings)
    });
    if (res.ok) showToast(`Maintenance mode turned ${enabled ? 'ON' : 'OFF'}`);
  };

  const saveSmtp = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings/email", {
      method: "PATCH",
      body: JSON.stringify(smtp)
    });
    setSaving(false);
    if (res.ok) {
      showToast("SMTP settings saved");
      const data = await res.json();
      setSmtp(data.smtp); // Update with masked pass
    } else showToast("Failed to save SMTP", "error");
  };

  const testSmtp = async () => {
    setSaving(true);
    showToast("Testing connection...");
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        body: JSON.stringify(smtp)
      });
      const data = await res.json();
      if (res.ok) {
        showToast("SMTP connection successful!");
      } else {
        showToast(`Test failed: ${data.error || 'Check credentials'}`, "error");
      }
    } catch (err: any) {
      showToast("Network error during test", "error");
    } finally {
      setSaving(false);
    }
  };

  const invalidateCache = async (tag: string) => {
    const res = await fetch("/api/admin/cache/invalidate", {
      method: "POST",
      body: JSON.stringify({ tag })
    });
    if (res.ok) showToast(`${tag} cache invalidated`);
  };

  const grantAdmin = async () => {
    if (!newAdminEmail) return;
    // Find user by email first (simplified for demo, usually we'd pass email directly or do a lookup)
    const res = await fetch(`/api/admin/users?search=${newAdminEmail}`);
    const users = await res.json();
    const user = users[0];
    if (!user) {
      showToast("User not found", "error");
      return;
    }
    
    const updateRes = await fetch(`/api/admin/roles/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newAdminRole })
    });
    
    if (updateRes.ok) {
      showToast("Admin role granted");
      setNewAdminEmail("");
      fetchAdmins();
    }
  };

  const revokeAdmin = async (userId: string) => {
    if (!confirm("Revoke admin access for this user?")) return;
    const res = await fetch(`/api/admin/roles/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ revoke: true })
    });
    if (res.ok) {
      showToast("Admin access revoked");
      fetchAdmins();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading system settings...</div>;
  }

  const TABS = [
    { id: "flags", label: "Feature flags", icon: ToggleLeft },
    { id: "ai", label: "AI & rate limits", icon: Bot },
    { id: "automation", label: "Automation", icon: Zap },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "smtp", label: "Email (SMTP)", icon: Mail },
    { id: "cache", label: "Cache", icon: Database },
    { id: "roles", label: "Admin roles", icon: Users },
    { id: "info", label: "App info", icon: Info }
  ];

  const FLAG_DEFS = [
    { key: "aiAnalysis", name: "AI analysis", desc: "Enables /analyze page and /api/analyze endpoint for all users", affects: "All Users" },
    { key: "pdfExport", name: "PDF export", desc: "Allows users to export AI reports as PDF", affects: "All Users" },
    { key: "twoFactorAuth", name: "Two-factor auth", desc: "Allows users to enable 2FA. Existing 2FA sessions remain active.", affects: "All Users" },
    { key: "pwaPrompt", name: "PWA install prompt", desc: "Shows 'Add to home screen' prompt", affects: "Mobile Users" },
    { key: "budgetAlerts", name: "Budget alerts email", desc: "Sends email when user hits budget threshold", affects: "All Users" },
    { key: "customSubcategories", name: "Custom subcategories", desc: "Allows users to create their own subcategories", affects: "All Users" }
  ];

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={`fixed bottom-10 left-1/2 px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Global configuration, feature flags, maintenance</p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded max-w-fit">
          <ShieldAlert size={14} /> Handle with care: Changes here affect all users immediately.
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Nav */}
        <div className="w-full lg:w-[200px] flex-shrink-0 lg:sticky lg:top-8 bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap lg:whitespace-normal ${activeTab === tab.id ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-teal-500' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm min-h-[500px]">
          
          {activeTab === "flags" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold dark:text-white mb-6">Feature Flags</h2>
              {FLAG_DEFS.map(flag => {
                const isEnabled = featureFlags[flag.key];
                return (
                  <div key={flag.key} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold dark:text-white">{flag.name}</h3>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 rounded">
                          {flag.affects}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{flag.desc}</p>
                    </div>
                    <button 
                      onClick={() => toggleFlag(flag.key, !isEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-8 max-w-2xl">
              <h2 className="text-xl font-bold dark:text-white">AI & Rate Limits</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Max AI reports per user per day</label>
                  <input type="number" value={aiSettings.maxReports} onChange={e => setAiSettings({...aiSettings, maxReports: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Max tokens per report</label>
                  <input type="number" value={aiSettings.maxTokens} onChange={e => setAiSettings({...aiSettings, maxTokens: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Gemini model</label>
                  <select value={aiSettings.model} onChange={e => setAiSettings({...aiSettings, model: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (High Accuracy)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                    Daily token quota alert threshold
                    <span className="text-teal-500">{aiSettings.quotaAlertThreshold}%</span>
                  </label>
                  <input type="range" min="50" max="100" value={aiSettings.quotaAlertThreshold} onChange={e => setAiSettings({...aiSettings, quotaAlertThreshold: parseInt(e.target.value)})} className="w-full accent-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cost per 1K tokens (₹)</label>
                  <input type="number" step="0.01" value={aiSettings.costPer1k} onChange={e => setAiSettings({...aiSettings, costPer1k: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <button onClick={saveAiSettings} disabled={saving} className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Save AI Settings
              </button>
            </div>
          )}

          {activeTab === "automation" && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold dark:text-white">Automation & Workflows</h2>
                <p className="text-xs text-slate-500 mt-1">Assign notification templates to automatic system actions.</p>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold dark:text-white">Maintenance Announcement</h3>
                      <p className="text-[10px] text-slate-500">Template used when sending bulk maintenance notifications.</p>
                    </div>
                  </div>
                  <select 
                    value={systemTemplates.maintenanceAnnouncement} 
                    onChange={e => setSystemTemplates({...systemTemplates, maintenanceAnnouncement: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    <option value="">Select a template...</option>
                    {allTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold dark:text-white">2FA Admin Override</h3>
                      <p className="text-[10px] text-slate-500">Email sent when an admin force-disables user's 2FA.</p>
                    </div>
                  </div>
                  <select 
                    value={systemTemplates.twoFactorOverride} 
                    onChange={e => setSystemTemplates({...systemTemplates, twoFactorOverride: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    <option value="">Select a template...</option>
                    {allTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                      <UserX size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold dark:text-white">Account Lockout</h3>
                      <p className="text-[10px] text-slate-500">Email sent when an admin locks a user's account.</p>
                    </div>
                  </div>
                  <select 
                    value={systemTemplates.accountLockout} 
                    onChange={e => setSystemTemplates({...systemTemplates, accountLockout: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
                  >
                    <option value="">Select a template...</option>
                    {allTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Unlock size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold dark:text-white">Account Unlock</h3>
                      <p className="text-[10px] text-slate-500">Email sent when an admin unlocks a user account.</p>
                    </div>
                  </div>
                  <select 
                    value={systemTemplates.accountUnlock} 
                    onChange={e => setSystemTemplates({...systemTemplates, accountUnlock: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="">Select a template...</option>
                    {allTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold dark:text-white">Account Suspension</h3>
                      <p className="text-[10px] text-slate-500">Email sent when a user account is suspended.</p>
                    </div>
                  </div>
                  <select 
                    value={systemTemplates.accountSuspension} 
                    onChange={e => setSystemTemplates({...systemTemplates, accountSuspension: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
                  >
                    <option value="">Select a template...</option>
                    {allTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold dark:text-white">Account Reactivation</h3>
                      <p className="text-[10px] text-slate-500">Email sent when an admin reactivates a user.</p>
                    </div>
                  </div>
                  <select 
                    value={systemTemplates.accountReactivation} 
                    onChange={e => setSystemTemplates({...systemTemplates, accountReactivation: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="">Select a template...</option>
                    {allTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={saveSystemTemplates} disabled={saving} className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Save Automation Config
              </button>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-8 max-w-2xl">
              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-black dark:text-white">Maintenance Mode</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {maintenance.enabled ? <span className="text-rose-500 font-bold">Currently ON — site is locked down.</span> : <span className="text-emerald-500 font-bold">Currently OFF — site is live.</span>}
                  </p>
                </div>
                <button 
                  onClick={() => toggleMaintenance(!maintenance.enabled)}
                  className={`px-8 py-3 rounded-full text-xs font-black uppercase transition-all shadow-xl ${maintenance.enabled ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'}`}
                >
                  {maintenance.enabled ? 'Turn OFF' : 'Enable Maintenance'}
                </button>
              </div>

              <div className={`transition-opacity duration-300 ${maintenance.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Message to users</label>
                    <textarea value={maintenance.message} onChange={e => setMaintenance({...maintenance, message: e.target.value})} className="w-full h-24 p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">ETA (Optional)</label>
                      <input type="datetime-local" value={maintenance.eta || ""} onChange={e => setMaintenance({...maintenance, eta: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <input type="checkbox" checked={maintenance.adminBypass} onChange={e => setMaintenance({...maintenance, adminBypass: e.target.checked})} className="w-5 h-5 accent-rose-500 rounded" />
                      <label className="text-sm font-bold dark:text-white">Admin bypass: ON</label>
                    </div>
                  </div>
                  <button onClick={() => toggleMaintenance(true)} className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold">Update Message</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "smtp" && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold dark:text-white">Email (SMTP) Configuration</h2>
                <p className="text-xs text-slate-500 mt-1">Warning: Password is stored encrypted. Leave blank to keep current password.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">SMTP Host</label>
                  <input type="text" value={smtp.host} onChange={e => setSmtp({...smtp, host: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Port</label>
                  <input type="number" value={smtp.port} onChange={e => setSmtp({...smtp, port: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" placeholder="465" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Username</label>
                  <input type="text" value={smtp.user} onChange={e => setSmtp({...smtp, user: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Password</label>
                  <input type="password" placeholder={smtp.pass ? "********" : "Enter password"} onChange={e => setSmtp({...smtp, pass: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">From Name</label>
                  <input type="text" value={smtp.fromName} onChange={e => setSmtp({...smtp, fromName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" placeholder="SpendWise" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">From Address</label>
                  <input type="email" value={smtp.fromEmail} onChange={e => setSmtp({...smtp, fromEmail: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" placeholder="noreply@spendwise.com" />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={saveSmtp} disabled={saving} className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center gap-2">
                  {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Save Config
                </button>
                <button onClick={testSmtp} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Test Connection
                </button>
              </div>

              {/* SMTP Diagnostics Advisory */}
              <div className="p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <Info size={18} />
                  SMTP Diagnostic Advisory
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500/80 leading-relaxed">
                  If you are hosting on <strong>Render, Vercel, or DigitalOcean</strong>, outbound SMTP traffic on ports <strong>25, 465, and 587</strong> is often blocked by default to prevent spam.
                </p>
                <ul className="text-[10px] space-y-1 text-amber-700 dark:text-amber-500/70 list-disc pl-4 font-medium">
                  <li><strong>Connection Timeout:</strong> Usually means the port is blocked by the host's firewall.</li>
                  <li><strong>Self-Signed Certificate:</strong> Try changing the port or toggling the secure option.</li>
                  <li><strong>Gmail Tip:</strong> Use an "App Password" if you have 2FA enabled.</li>
                </ul>
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400">Recommendation:</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500/80">Use an HTTP-based mail provider or a service that supports port <strong>2525</strong> if standard ports are timed out.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cache" && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold dark:text-white">System Caches</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage Next.js data caches and hit rates.</p>
                </div>
                <button 
                  onClick={() => invalidateCache('global_categories')}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-teal-500/20 transition-all"
                >
                  Force refresh global categories
                </button>
              </div>

              {/* Mock Hit Rate */}
              <div className="p-4 bg-teal-50 dark:bg-teal-500/5 rounded-2xl border border-teal-100 dark:border-teal-500/20 flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500 text-white rounded-xl flex items-center justify-center font-black text-lg">94%</div>
                <div>
                  <h3 className="text-sm font-bold text-teal-800 dark:text-teal-400">Categories cache hit rate</h3>
                  <p className="text-xs text-teal-600 dark:text-teal-500">Extremely efficient. Database load is minimal.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="text-[10px] font-black uppercase text-slate-400">
                      <th className="p-4">Cache Key / Tag</th>
                      <th className="p-4">Last Set</th>
                      <th className="p-4">TTL</th>
                      <th className="p-4">Hits</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="dark:text-slate-300">
                      <td className="p-4 font-mono text-xs">global_categories</td>
                      <td className="p-4 text-xs">2 hours ago</td>
                      <td className="p-4 text-xs">Forever</td>
                      <td className="p-4 text-xs">1,402</td>
                      <td className="p-4 text-right"><button onClick={() => invalidateCache('global_categories')} className="text-rose-500 text-xs font-bold hover:underline">Clear</button></td>
                    </tr>
                    <tr className="dark:text-slate-300">
                      <td className="p-4 font-mono text-xs">analytics_dashboard</td>
                      <td className="p-4 text-xs">10 mins ago</td>
                      <td className="p-4 text-xs">1 hour</td>
                      <td className="p-4 text-xs">42</td>
                      <td className="p-4 text-right"><button onClick={() => invalidateCache('analytics_dashboard')} className="text-rose-500 text-xs font-bold hover:underline">Clear</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <button onClick={() => {if(confirm('Clear all system caches?')) invalidateCache('all')}} className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl text-xs font-black uppercase hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all w-full">
                Clear All Caches (Danger)
              </button>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold dark:text-white">Admin Roles</h2>
                <p className="text-xs text-slate-500 mt-1">Super admins have full access. Read-only admins cannot edit settings.</p>
              </div>

              {/* Grant access */}
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Search user by email</label>
                  <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="user@example.com" className="w-full p-3 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="w-48 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Role</label>
                  <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value)} className="w-full p-3 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="SUPER">Super Admin</option>
                    <option value="READONLY">Read-only</option>
                  </select>
                </div>
                <button onClick={grantAdmin} className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-all">Grant</button>
              </div>

              {/* Admins Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="text-[10px] font-black uppercase text-slate-400">
                      <th className="p-4">Admin</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Granted At</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {admins.map(admin => (
                      <tr key={admin.id} className="dark:text-slate-300">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                              {admin.name?.[0] || 'A'}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{admin.name || 'Admin User'}</p>
                              <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${admin.adminRole === 'SUPER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {admin.adminRole}
                          </span>
                        </td>
                        <td className="p-4 text-xs">{new Date(admin.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => revokeAdmin(admin.id)} className="text-rose-500 text-xs font-bold hover:underline">Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-xl font-bold dark:text-white">Application Info</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400">App Version</p>
                  <p className="text-lg font-bold dark:text-white mt-1">1.0.0</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400">Deployment</p>
                  <p className="text-sm font-bold dark:text-white mt-1 flex items-center gap-2"><Server size={14}/> Vercel (Production)</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400">Framework</p>
                  <p className="text-sm font-bold dark:text-white mt-1">Next.js 16.x</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 col-span-2 md:col-span-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Database</p>
                  <p className="text-sm font-bold dark:text-white mt-1">MongoDB Atlas</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 col-span-2 md:col-span-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">Repository</p>
                  <a href="https://github.com/Vinoth82003/expense-tracker.git" target="_blank" className="text-sm font-bold text-teal-500 hover:underline mt-1 flex items-center gap-2"><Code size={14}/> github.com/Vinoth82003/expense-tracker</a>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 col-span-2 md:col-span-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">Author & Maintainer</p>
                  <a href="https://vinoths.vercel.app/" target="_blank" className="text-lg font-bold text-teal-500 hover:underline mt-1 block">Vinoth S</a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
