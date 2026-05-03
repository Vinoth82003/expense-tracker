"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  History, 
  FileCode, 
  UserX, 
  Search, 
  Eye, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Mail,
  Users,
  ChevronRight,
  Plus,
  Save,
  Zap,
  Layout,
  Code,
  Tag,
  ArrowRight,
  MoreVertical,
  ChevronLeft,
  X,
  Smartphone
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  isSystem: boolean;
  updatedAt: string;
}

interface NotificationLog {
  id: string;
  subject: string;
  recipientCount: number;
  status: string;
  adminName: string;
  createdAt: string;
  body: string;
}

interface Unsubscribe {
  id: string;
  email: string;
  createdAt: string;
  reason: string | null;
  user: { name: string | null };
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState("send");
  const [loading, setLoading] = useState(false);

  // Send Announcement State
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [recipientType, setRecipientType] = useState("all"); // all, filtered, specific
  const [filters, setFilters] = useState<any>({
    twoFactorEnabled: false,
    limitMode: false,
    active30d: false,
    newUsers: false
  });
  const [specificEmail, setSpecificEmail] = useState("");

  // History State
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);

  // Templates State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Unsubscribes State
  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([]);

  // Settings State
  const [threshold, setThreshold] = useState(80);
  const [isAlertEnabled, setIsAlertEnabled] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/notifications/history?page=${historyPage}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
        setTotalHistory(data.total);
      }
    } catch (error) {
      console.error("History fetch failed");
    }
  }, [historyPage]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplate) setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error("Templates fetch failed");
    }
  }, [selectedTemplate]);

  const fetchUnsubscribes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/unsubscribes");
      if (res.ok) setUnsubscribes(await res.json());
    } catch (error) {
      console.error("Unsubscribes fetch failed");
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setThreshold(data.budgetAlertThreshold);
      }
    } catch (error) {
      console.error("Settings fetch failed");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    if (activeTab === "templates") fetchTemplates();
    if (activeTab === "unsubscribe") fetchUnsubscribes();
  }, [activeTab, fetchHistory, fetchTemplates, fetchUnsubscribes]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const sendAnnouncement = async () => {
    if (!subject || !body) return alert("Subject and body are required");
    if (!confirm(`Send this announcement to recipients?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify({ 
          subject, 
          body, 
          recipientFilter: recipientType === 'all' ? {} : (recipientType === 'specific' ? { specificEmail } : filters)
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setSubject("");
        setBody("");
        setActiveTab("history");
      }
    } catch (error) {
      alert("Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (template?: Template) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        body: JSON.stringify({ 
          templateId: template?.id,
          subject: subject,
          body: body
        })
      });
      if (res.ok) alert("Test email sent to your inbox!");
    } catch (error) {
      alert("Test failed");
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/templates/${selectedTemplate.id}`, {
        method: "PATCH",
        body: JSON.stringify({ 
          subject: selectedTemplate.subject, 
          body: selectedTemplate.body 
        })
      });
      if (res.ok) {
        alert("Template saved!");
        fetchTemplates();
      }
    } catch (error) {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (val: number) => {
    setThreshold(val);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ budgetAlertThreshold: val })
      });
    } catch (error) {
      console.error("Settings update failed");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Send announcements, manage email templates</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "send", label: "Send announcement", icon: Send },
          { id: "history", label: "History", icon: History },
          { id: "templates", label: "Email templates", icon: FileCode },
          { id: "unsubscribe", label: "Unsubscribe log", icon: UserX }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === t.id ? 'text-teal-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <t.icon size={18} />
            {t.label}
            {activeTab === t.id && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "send" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Compose Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-widest">New Announcement</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsPreviewMode(false)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${!isPreviewMode ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setIsPreviewMode(true)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isPreviewMode ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                
                <div className="p-8 space-y-4">
                  <input 
                    type="text" 
                    placeholder="Subject line..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300"
                  />
                  <div className="h-px bg-slate-100 dark:bg-slate-800" />
                  
                  {isPreviewMode ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none min-h-[300px] p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                      <h2 className="text-xl font-bold mb-4">{subject || "No subject"}</h2>
                      <div className="whitespace-pre-wrap">{body || "No content..."}</div>
                    </div>
                  ) : (
                    <textarea 
                      placeholder="Write your announcement here... Use {userName} for personalization."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full min-h-[300px] bg-transparent border-none outline-none resize-none placeholder:text-slate-300 font-medium leading-relaxed"
                    />
                  )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <button 
                    onClick={() => sendTestEmail()}
                    disabled={loading}
                    className="text-xs font-black uppercase text-slate-400 hover:text-teal-500 transition-colors flex items-center gap-2"
                  >
                    <Mail size={14} /> Send test to me
                  </button>
                  <button 
                    onClick={sendAnnouncement}
                    disabled={loading || !subject || !body}
                    className="px-8 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    Send Announcement
                  </button>
                </div>
              </div>
            </div>

            {/* Recipients Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Recipients</h3>
                
                <div className="space-y-2">
                  {[
                    { id: 'all', label: 'All users', icon: Users },
                    { id: 'filtered', label: 'Filtered segment', icon: Tag },
                    { id: 'specific', label: 'Specific user', icon: Mail }
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRecipientType(r.id)}
                      className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${recipientType === r.id ? 'bg-teal-500/10 border-teal-500/20 text-teal-600' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                    >
                      <r.icon size={18} />
                      <span className="text-sm font-bold">{r.label}</span>
                      {recipientType === r.id && <CheckCircle2 size={16} className="ml-auto" />}
                    </button>
                  ))}
                </div>

                {recipientType === 'filtered' && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {[
                      { id: 'twoFactorEnabled', label: '2FA Enabled' },
                      { id: 'limitMode', label: 'Limit Mode Only' },
                      { id: 'active30d', label: 'Active last 30d' },
                      { id: 'newUsers', label: 'New users (<7d)' }
                    ].map(f => (
                      <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={filters[f.id]}
                          onChange={(e) => setFilters({...filters, [f.id]: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 checked:bg-teal-500 transition-all cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">{f.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {recipientType === 'specific' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <input 
                      type="email" 
                      placeholder="User email address..."
                      value={specificEmail}
                      onChange={(e) => setSpecificEmail(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Impact Preview</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">~847 users</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="py-5 px-8">Subject</th>
                  <th className="py-5 px-8">Recipients</th>
                  <th className="py-5 px-8">Sent At</th>
                  <th className="py-5 px-8">Status</th>
                  <th className="py-5 px-8">Admin</th>
                  <th className="py-5 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {history.map(log => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-8">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate max-w-[200px] block">{log.subject}</span>
                    </td>
                    <td className="py-4 px-8 text-sm font-bold text-slate-500">{log.recipientCount} users</td>
                    <td className="py-4 px-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.status === 'SENT' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                        {log.status === 'SENT' ? '✓ Sent' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="py-4 px-8 text-xs font-bold text-slate-500">{log.adminName}</td>
                    <td className="py-4 px-8 text-right">
                      <button className="p-2 text-slate-400 hover:text-teal-500 transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === "templates" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Template List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Templates</h3>
                <div className="space-y-1">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedTemplate?.id === t.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                    >
                      <div className="text-xs font-black truncate">{t.name}</div>
                      <div className={`text-[9px] font-bold ${selectedTemplate?.id === t.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {t.isSystem ? 'System Template' : 'Custom Template'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Editor */}
            {selectedTemplate && (
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <FileCode size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">{selectedTemplate.name}</h3>
                        <p className="text-[10px] text-slate-500">Edit content and variables</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => sendTestEmail(selectedTemplate)}
                        className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-teal-500 transition-colors border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        Send Test
                      </button>
                      <button 
                        onClick={saveTemplate}
                        disabled={loading}
                        className="px-6 py-2 bg-teal-500 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all"
                      >
                        {loading ? 'Saving...' : 'Save Template'}
                      </button>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Variables */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Variables</p>
                      <div className="flex flex-wrap gap-2">
                        {['{userName}', '{code}', '{amount}', '{limit}', '{date}'].map(v => (
                          <button 
                            key={v}
                            onClick={() => setSelectedTemplate({...selectedTemplate, body: selectedTemplate.body + v})}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 hover:text-teal-500 transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Subject Line</label>
                        <input 
                          type="text" 
                          value={selectedTemplate.subject}
                          onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                          className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Email Body</label>
                        <textarea 
                          value={selectedTemplate.body}
                          onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                          className="w-full min-h-[250px] p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "unsubscribe" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="py-5 px-8">User Name</th>
                  <th className="py-5 px-8">Email</th>
                  <th className="py-5 px-8">Unsubscribed At</th>
                  <th className="py-5 px-8">Reason</th>
                  <th className="py-5 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {unsubscribes.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-8 text-sm font-bold text-slate-900 dark:text-slate-200">{u.user?.name || "Anonymous"}</td>
                    <td className="py-4 px-8 text-sm font-medium text-slate-500">{u.email}</td>
                    <td className="py-4 px-8 text-xs font-bold text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-8 text-xs italic text-slate-400">{u.reason || "Not specified"}</td>
                    <td className="py-4 px-8 text-right">
                      <button className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors px-3 py-1 bg-red-500/10 rounded-lg">
                        Re-subscribe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Budget Alert Config Footer */}
      <div className="bg-slate-900 dark:bg-slate-800/50 rounded-[2rem] p-8 flex flex-wrap items-center justify-between gap-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Budget Threshold Alerts</h3>
            <p className="text-sm text-slate-400">Automated emails when users hit spend milestones</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
            <span className="text-xs font-black uppercase text-slate-400 pl-4">Trigger at</span>
            <input 
              type="number" 
              value={threshold}
              onChange={(e) => updateSettings(parseInt(e.target.value))}
              min="50" max="100"
              className="w-16 p-2 bg-white/10 rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-lg font-black pr-4">%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase text-slate-400">Status:</span>
            <button 
              onClick={() => setIsAlertEnabled(!isAlertEnabled)}
              className={`w-14 h-8 rounded-full transition-all relative ${isAlertEnabled ? 'bg-teal-500' : 'bg-slate-700'}`}
            >
              <motion.div 
                animate={{ x: isAlertEnabled ? 28 : 4 }}
                className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md" 
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
