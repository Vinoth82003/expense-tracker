"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please add a comment");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Feedback submitted! Thank you.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black tracking-tight">Share Your Experience</h1>
        <p className="text-secondary font-medium mt-1">
          Your feedback helps us make SpendWise better for everyone.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface border border-border-subtle rounded-[2rem] shadow-xl overflow-hidden"
      >
        <div className="p-8 space-y-8">
          {!submitted ? (
            <>
              {/* Rating */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-secondary">
                  How would you rate SpendWise?
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-all hover:scale-110 active:scale-95 p-2 rounded-2xl hover:bg-surface-variant"
                    >
                      <Star
                        size={44}
                        className={star <= rating ? "fill-warning text-warning" : "text-border-subtle"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                  <MessageSquare size={14} />
                  Your Thoughts
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you love, what you'd change, or what features you'd like to see next..."
                  className="w-full h-40 p-5 bg-surface-variant border border-border-subtle rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none font-medium"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-5 bg-primary-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 text-lg"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={22} />
                    Submit Feedback
                  </>
                )}
              </button>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-16 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-black mb-2">Thank You!</h2>
                <p className="text-secondary font-medium text-lg">
                  Your feedback has been submitted and will be reviewed by our team shortly.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
