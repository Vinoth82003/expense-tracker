"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Quote, Star, User as UserIcon } from "lucide-react";

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-secondary font-medium italic">"Exceptional tool for forensic financial tracking. Highly recommended!"</p>
        <p className="text-xs font-black uppercase tracking-widest mt-2 text-muted">— Early Adopter</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {reviews.slice(0, 6).map((review, i) => (
        <motion.div
          key={review.id}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-8 bg-surface border border-border-subtle rounded-[2rem] shadow-sm relative group hover:border-primary-500/30 transition-all"
        >
          <Quote className="absolute top-6 right-8 text-primary-500/10 group-hover:text-primary-500/20 transition-colors" size={48} />
          
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, starI) => (
              <Star 
                key={starI} 
                size={14} 
                className={starI < review.rating ? "fill-warning text-warning" : "text-border-subtle"} 
              />
            ))}
          </div>

          <p className="text-secondary font-medium leading-relaxed mb-6 italic relative z-10">
            "{review.comment}"
          </p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center shrink-0 border border-border-subtle">
              {review.user?.avatar ? (
                <img src={review.user.avatar} alt={`${review.user.name}'s avatar`} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} className="text-muted" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{review.user?.name || "Anonymous User"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">SpendWise User</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
