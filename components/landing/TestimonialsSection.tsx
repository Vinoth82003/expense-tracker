"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Quote } from "lucide-react";
import Image from "next/image";
import { fadeUp } from "./sections/animations";

interface ReviewUser {
  name: string | null;
  avatar: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: ReviewUser | null;
}

const AVATAR_COLORS = [
  "bg-purple-500/15 text-purple-600",
  "bg-pink-500/15 text-pink-600",
  "bg-blue-500/15 text-blue-600",
  "bg-amber-500/15 text-amber-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-red-500/15 text-red-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-border-subtle"
          }
        />
      ))}
    </div>
  );
}

function ReviewerAvatar({ user }: { user: ReviewUser | null }) {
  const name = user?.name || "Anonymous";

  if (user?.avatar) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden border border-border-subtle shrink-0">
        <Image
          src={user.avatar}
          alt={`${name}'s avatar`}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[15px] ${getAvatarColor(name)}`}
    >
      {getInitial(name)}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-7 animate-pulse">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-3.5 h-3.5 rounded bg-muted/20" />
        ))}
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-3.5 bg-muted/15 rounded w-full" />
        <div className="h-3.5 bg-muted/15 rounded w-full" />
        <div className="h-3.5 bg-muted/15 rounded w-3/4" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted/15" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-muted/15 rounded w-24" />
          <div className="h-2.5 bg-muted/10 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection({ limit = 3 }: { limit?: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setReviews(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (error) return null;

  return (
    <section className="py-24 md:py-32 px-5 md:px-10 bg-surface-variant/30">
      <div className="max-w-[1120px] mx-auto">
        {/* ── Headline block ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <MessageSquare size={12} className="text-primary-500" />
            Testimonials
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto">
            Loved by thousands.{" "}
            <span className="text-primary-600">Here&apos;s proof.</span>
          </h2>
        </motion.div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : reviews.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-5">
              <Star size={24} className="text-primary-500" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-2">
              Be one of our first reviewers
            </p>
            <p className="text-[13px] text-secondary max-w-[360px] mx-auto">
              Share your experience with SpendWise and help others discover
              smarter expense tracking.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.slice(0, limit).map((review, i) => (
              <motion.div
                key={review.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-md hover:border-primary-500/20 transition-all"
              >
                <StarRating rating={review.rating} />

                <div className="relative mb-5">
                  <Quote
                    size={20}
                    className="absolute -top-1 -left-0.5 text-primary-500/15"
                  />
                  <p className="text-[14px] text-secondary font-medium leading-relaxed pl-5">
                    {review.comment.length > 220
                      ? `"${review.comment.slice(0, 220)}…"`
                      : `"${review.comment}"`}
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border-subtle">
                  <ReviewerAvatar user={review.user} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {review.user?.name || "Anonymous"}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      SpendWise User
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
