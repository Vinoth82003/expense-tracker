"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, TrendingUp } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden bg-background">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-delay:2s]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-8 relative"
        >
          <Search size={48} color="white" strokeWidth={2.5} />
          
          {/* Custom animated question mark badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-surface border-4 border-background flex items-center justify-center shadow-lg"
          >
            <span className="text-foreground font-black text-xl">?</span>
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-8xl font-black text-foreground mb-4 tracking-tighter"
        >
          404
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-foreground mb-4 tracking-tight"
        >
          Page Not Found
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-secondary font-medium text-lg max-w-md mx-auto mb-10 leading-relaxed"
        >
          We couldn't track down the page you're looking for. It might have been moved or doesn't exist.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-foreground text-background font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <ArrowLeft size={20} className="text-background" />
              Back to Dashboard
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-surface-variant text-foreground font-bold text-lg hover:bg-surface-variant/80 border border-border-subtle transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

      </motion.div>
      
      {/* Subtle brand mark at bottom */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 flex items-center gap-2 text-muted font-bold text-sm tracking-widest uppercase"
      >
        <TrendingUp size={16} /> SpendWise
      </motion.div>
    </div>
  );
}
