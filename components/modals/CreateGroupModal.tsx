"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Save, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Group name is required");

    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        toast.success("Group created successfully!");
        setName("");
        setDescription("");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create group");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-white/5 rounded-[3rem] shadow-2xl z-[101] overflow-hidden glass"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Create Group</h3>
                  <p className="text-xs text-secondary font-bold uppercase tracking-widest">Setup new split workspace</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-2xl hover:bg-white/5 text-secondary transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., European Summer Trip"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this group for?"
                  rows={3}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold resize-none"
                />
              </div>

              <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-2xl flex gap-3">
                <Info size={18} className="text-primary-500 shrink-0 mt-0.5" />
                <p className="text-xs text-secondary leading-relaxed font-medium">
                  As the creator, you will automatically be assigned as an **Admin**. You can invite members after creation.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-foreground text-background rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                Initialize Group
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
