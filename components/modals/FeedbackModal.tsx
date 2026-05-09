"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
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
        toast.success("Feedback submitted! Admin will review it soon.");
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setComment("");
          setRating(5);
        }, 2000);
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-surface border border-border-subtle rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black">Share Your Feedback</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {!submitted ? (
                <>
                  <p className="text-secondary font-medium">
                    How would you rate your experience with SpendWise? Your feedback helps us improve!
                  </p>

                  {/* Rating */}
                  <div className="flex justify-center gap-3 py-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-all hover:scale-110 active:scale-95"
                      >
                        <Star
                          size={36}
                          className={star <= rating ? "fill-warning text-warning" : "text-border-subtle"}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                      <MessageSquare size={14} />
                      Your Review
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us what you think..."
                      className="w-full h-32 p-4 bg-surface-variant border border-border-subtle rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none font-medium"
                    />
                  </div>

                  {/* Footer */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-2xl font-black">Thank You!</h4>
                  <p className="text-secondary font-medium">
                    Your feedback has been received and will be reviewed by our team.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
