"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Plus, Trash2, Send, CheckCircle2, UserPlus } from "lucide-react";
import { useUI } from "@/context/UIContext";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export default function InviteModal({ isOpen, onClose, groupId, groupName }: InviteModalProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useUI();

  const handleAddEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    } else {
      setEmails([""]);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async () => {
    const validEmails = emails.filter((email) => email.trim() && email.includes("@"));
    
    if (validEmails.length === 0) {
      toast.error("Please enter at least one valid email");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, emails: validEmails }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Invitations sent successfully!");
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setEmails([""]);
        }, 2500);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send invitations");
      }
    } catch (error) {
      toast.error("An error occurred while sending invitations");
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-surface border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden glass"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Invite Members</h3>
                  <p className="text-xs text-secondary font-bold uppercase tracking-widest">{groupName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {!submitted ? (
                <>
                  <p className="text-secondary font-medium">
                    Enter the email addresses of the people you'd like to invite to this group.
                  </p>

                  <div className="space-y-3">
                    {emails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            placeholder="friend@example.com"
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveEmail(index)}
                          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all active:scale-95"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddEmail}
                    className="flex items-center gap-2 text-sm font-black text-primary-500 hover:text-primary-400 transition-colors"
                  >
                    <Plus size={16} />
                    Add Another Email
                  </button>

                  {/* Footer */}
                  <div className="pt-4">
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
                          Send Invitations
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-2xl font-black">Invitations Sent!</h4>
                  <p className="text-secondary font-medium">
                    Your friends will receive an email with a link to join your group.
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
