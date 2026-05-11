"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Trophy
} from "lucide-react";
import { useUI } from "@/context/UIContext";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { toast } = useUI();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetch(`/api/invitations/${token}`)
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setInvitation(data);
          } else {
            setError(data.error || "Failed to load invitation");
          }
        })
        .catch((err) => {
          console.error("Error fetching invitation:", err);
          setError("An error occurred while loading the invitation.");
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleDecision = async (decision: "accept" | "decline") => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/groups/invite/${token}`);
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();

      if (res.ok) {
        if (decision === "accept") {
          toast.success("Welcome to the group!");
          router.push(`/groups/${data.groupId}`);
        } else {
          toast.info("Invitation declined");
          router.push("/dashboard");
        }
      } else {
        toast.error(data.error || "Failed to process invitation");
      }
    } catch (err) {
      console.error("Error processing invitation:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="font-black text-secondary uppercase tracking-widest text-xs">Authenticating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-border-subtle rounded-[2.5rem] p-8 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} />
          </div>
          <h1 className="text-3xl font-black mb-4">Invalid Link</h1>
          <p className="text-secondary mb-8 font-medium">
            {error}. This invitation might be expired or already used.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-xl transition-all active:scale-95"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-tertiary-500/5 blur-[120px] rounded-full -ml-64 -mb-64" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="bg-surface border border-border-subtle rounded-[3rem] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-primary-500 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/30"
            >
              <Users size={48} />
            </motion.div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-80">New Group Invitation</h2>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight">
              Join {invitation.groupName}
            </h1>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center gap-4 mb-10">
              <p className="text-xl font-medium text-secondary">
                <span className="font-black text-foreground">{invitation.creatorName}</span> invited you to join their group on SpendWise.
              </p>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-black">{invitation.memberCount}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Members</div>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-black text-primary-500">Free</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Access</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
              {[
                { icon: ShieldCheck, title: "Secure Splitting", desc: "Fair & transparent" },
                { icon: Trophy, title: "Shared Goals", desc: "Track common wins" },
                { icon: CheckCircle2, title: "Real-time sync", desc: "Instant updates" }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-surface-variant rounded-2xl border border-border-subtle/50">
                  <item.icon className="text-primary-500 mb-3" size={24} />
                  <h3 className="font-black text-xs uppercase tracking-widest mb-1">{item.title}</h3>
                  <p className="text-[11px] text-muted font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {authStatus === "unauthenticated" ? (
              <div className="space-y-4">
                <div className="p-6 bg-tertiary-50 border border-tertiary-100 rounded-2xl mb-6">
                  <p className="text-sm font-bold text-tertiary-700 leading-relaxed">
                    You need to be logged in to accept this invitation. We'll bring you right back here after you sign in.
                  </p>
                </div>
                <button 
                  onClick={() => router.push(`/login?callbackUrl=/groups/invite/${token}`)}
                  className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group"
                >
                  Login to Join Group
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  disabled={processing}
                  onClick={() => handleDecision("accept")}
                  className="flex-1 py-5 bg-primary-500 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-primary-500/20 hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                  Accept & Join
                </button>
                <button 
                  disabled={processing}
                  onClick={() => handleDecision("decline")}
                  className="flex-1 py-5 bg-surface-variant text-secondary hover:text-foreground rounded-2xl font-black text-lg border border-border-subtle transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            )}

            <p className="mt-8 text-xs font-bold text-muted uppercase tracking-widest">
              Join thousands of forensic financial detectives.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
