"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCcw,
  User,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  Send,
  Mail
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useModal } from "@/components/providers/ModalProvider";

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    name: string;
    email: string;
    avatar: string | null;
  };
}


export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "APPROVED" | "PENDING" | "REJECTED">("all");
  const { confirm } = useModal();

  const [mounted, setMounted] = useState(false);

  // Request Feedback Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientType, setRecipientType] = useState<"all" | "filter" | "specific">("all");
  const [specificEmail, setSpecificEmail] = useState("");
  const [filterSegment, setFilterSegment] = useState({
    twoFactorEnabled: false,
    limitMode: false,
    active30d: false,
    newUsers: false,
    incomeNoExpenses: false,
    noIncomeNoExpenses: false,
    inactive2d: false,
    inactive7d: false,
    onboarded: undefined as boolean | undefined,
    noPWA: undefined as boolean | undefined,
  });

  useEffect(() => {
    setMounted(true);
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
        toast.success(`Review ${newStatus.toLowerCase()}!`);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };


  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Review",
      message: "Are you sure you want to delete this review? This action cannot be undone.",
      confirmText: "Delete",
      danger: true
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
        toast.success("Review deleted");
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.user.name.toLowerCase().includes(search.toLowerCase()) || 
                         r.comment.toLowerCase().includes(search.toLowerCase()) ||
                         r.user.email.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    return matchesSearch && r.status === filter;
  });


  const handleRequestFeedback = async () => {
    let finalFilter: any = null;

    if (recipientType === "filter") {
      finalFilter = { ...filterSegment };
    } else if (recipientType === "specific") {
      if (!specificEmail) {
        toast.error("Please enter an email");
        return;
      }
      finalFilter = { specificEmail };
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/reviews/request-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientFilter: finalFilter }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Feedback requests sent!");
        setIsModalOpen(false);
      } else {
        toast.error(data.error || "Failed to send requests");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };


  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-[var(--admin-bg-surface-variant)] rounded-xl transition-colors text-[var(--admin-text-primary)]">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Feedbacks</h1>
            <p className="text-[var(--admin-text-secondary)] font-medium">Review and approve platform testimonials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 transition-all font-bold text-sm"
          >
            <Mail size={18} /> Request Feedback
          </button>
          <button 
            onClick={fetchReviews}
            className="p-3 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-secondary)] rounded-xl hover:bg-[var(--admin-border-subtle)] transition-colors"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-[var(--admin-bg-card)] rounded-3xl border border-[var(--admin-border)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest mb-1">Total Reviews</p>
          <h2 className="text-3xl font-bold text-[var(--admin-text-primary)]">{reviews.length}</h2>
        </div>
        <div className="p-6 bg-[var(--admin-bg-card)] rounded-3xl border border-[var(--admin-border)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest mb-1">Pending Approval</p>
          <h2 className="text-3xl font-bold text-amber-500">{reviews.filter(r => r.status === "PENDING").length}</h2>
        </div>

        <div className="p-6 bg-[var(--admin-bg-card)] rounded-3xl border border-[var(--admin-border)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest mb-1">Average Rating</p>
          <h2 className="text-3xl font-bold text-primary-500">
            {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
            <span className="text-sm text-[var(--admin-text-muted)] ml-1">/ 5.0</span>
          </h2>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" size={18} />
          <input 
            type="text"
            placeholder="Search reviews, users or comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-[var(--admin-text-primary)]"
          />
        </div>
        <div className="flex items-center bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-2xl p-1">
          {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                ${filter === f ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"}`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>

      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCcw size={40} className="animate-spin text-primary-500" />
            <p className="text-[var(--admin-text-muted)] font-bold uppercase tracking-widest text-xs">Loading feedbacks...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <motion.div
              layout
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-[var(--admin-bg-card)] rounded-3xl border border-[var(--admin-border)] shadow-sm group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* User Info */}
                <div className="md:w-64 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[var(--admin-bg-surface-variant)] flex items-center justify-center shrink-0">
                    {review.user.avatar ? (
                      <img src={review.user.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-[var(--admin-text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate text-[var(--admin-text-primary)]">{review.user.name}</p>
                    <p className="text-xs text-[var(--admin-text-secondary)] truncate">{review.user.email}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-[var(--admin-text-muted)] uppercase">
                      <Clock size={10} />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < review.rating ? "fill-warning text-warning" : "text-[var(--admin-bg-surface-variant)]"} 
                      />
                    ))}
                  </div>
                  <p className="text-[var(--admin-text-secondary)] font-medium leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                  {review.status !== "APPROVED" && (
                    <button
                      onClick={() => handleUpdateStatus(review.id, "APPROVED")}
                      className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-2xl font-bold text-xs transition-all"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                  )}
                  {review.status !== "REJECTED" && (
                    <button
                      onClick={() => handleUpdateStatus(review.id, "REJECTED")}
                      className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-2xl font-bold text-xs transition-all"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-[var(--admin-bg-surface-variant)] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-[var(--admin-text-muted)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--admin-text-primary)]">No reviews found</h3>
            <p className="text-[var(--admin-text-secondary)]">Adjust your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Request Feedback Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-[var(--admin-bg-card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--admin-border)]"
            >
              <div className="p-6 border-b border-[var(--admin-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-xl">
                    <Mail size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--admin-text-primary)]">Request Feedback</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] rounded-xl transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Recipient Type */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Recipients</label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as any)}
                    className="w-full p-4 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-[var(--admin-text-primary)]"
                  >
                    <option value="all">All Users</option>
                    <option value="filter">Filtered Segment</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>

                {/* Specific Email */}
                {recipientType === "specific" && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={specificEmail}
                      onChange={(e) => setSpecificEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full p-4 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-[var(--admin-text-primary)]"
                    />
                  </div>
                )}

                {/* Filters */}
                {recipientType === "filter" && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Target Audience</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(filterSegment).map(([key, value]) => {
                        const labelMap: Record<string, string> = {
                          twoFactorEnabled: "2FA Enabled",
                          limitMode: "Limit Mode Users",
                          active30d: "Active Last 30d",
                          newUsers: "Joined Last 7d",
                          incomeNoExpenses: "Has Income, No Expenses",
                          noIncomeNoExpenses: "No Income or Expenses",
                          inactive2d: "Inactive > 2 days",
                          inactive7d: "Inactive > 7 days",
                        };

                        if (!labelMap[key]) return null;

                        return (
                          <label key={key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--admin-bg-surface-variant)] cursor-pointer transition-colors border border-[var(--admin-border-subtle)]">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={value as boolean}
                                onChange={(e) => setFilterSegment({ ...filterSegment, [key]: e.target.checked })}
                                className="peer sr-only"
                              />
                              <div className="w-5 h-5 border-2 border-[var(--admin-border-subtle)] rounded-md peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-colors flex items-center justify-center">
                                <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                              </div>
                            </div>
                            <span className="text-sm font-medium text-[var(--admin-text-secondary)]">{labelMap[key]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--admin-border-subtle)] flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold text-[var(--admin-text-muted)] hover:bg-[var(--admin-bg-surface-variant)] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestFeedback}
                  disabled={sending}
                  className="flex-1 py-4 bg-primary-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCcw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} /> Send Requests
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
