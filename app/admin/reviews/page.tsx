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
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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

  const [mounted, setMounted] = useState(false);

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
    if (!confirm("Are you sure you want to delete this review?")) return;

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


  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Feedbacks</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Review and approve platform testimonials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReviews}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Reviews</p>
          <h2 className="text-3xl font-bold">{reviews.length}</h2>
        </div>
        <div className="p-6 bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approval</p>
          <h2 className="text-3xl font-bold text-amber-500">{reviews.filter(r => r.status === "PENDING").length}</h2>
        </div>

        <div className="p-6 bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average Rating</p>
          <h2 className="text-3xl font-bold text-primary-500">
            {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
            <span className="text-sm text-slate-400 ml-1">/ 5.0</span>
          </h2>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search reviews, users or comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="flex items-center bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
          {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                ${filter === f ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
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
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading feedbacks...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <motion.div
              layout
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* User Info */}
                <div className="md:w-64 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {review.user.avatar ? (
                      <img src={review.user.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{review.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{review.user.email}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 uppercase">
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
                        className={i < review.rating ? "fill-warning text-warning" : "text-slate-200 dark:text-slate-800"} 
                      />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
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
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold">No reviews found</h3>
            <p className="text-slate-500">Adjust your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
