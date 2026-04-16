"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Trash2, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  LogOut,
  Camera
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 sm:p-12 shadow-sm text-center">
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-primary-100 p-1">
            <div className="w-full h-full rounded-full overflow-hidden bg-surface-variant flex items-center justify-center">
              {session.user.image ? (
                <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-secondary" />
              )}
            </div>
          </div>
          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-foreground text-background shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
             <Camera size={20} />
          </button>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
          {session.user.name}
        </h2>
        <div className="flex items-center justify-center gap-2 text-secondary font-bold text-lg mb-8">
           <Mail size={18} />
           {session.user.email}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
           <div className="bg-surface-variant/40 px-6 py-3 rounded-2xl border border-border-subtle flex items-center gap-2">
              <ShieldCheck size={18} className="text-success" />
              <span className="font-bold">Verified Account</span>
           </div>
           <div className="bg-surface-variant/40 px-6 py-3 rounded-2xl border border-border-subtle flex items-center gap-2">
              <span className="font-black text-primary-600">Pro</span>
              <span className="font-bold">Member</span>
           </div>
        </div>
      </section>

      {/* Account Settings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm">
           <div className="p-8 border-b border-border-subtle">
             <h3 className="text-xl font-black">Account Information</h3>
           </div>
           <div className="divide-y divide-border-subtle">
             {[
               { label: "Full Name", value: session.user.name },
               { label: "Email Address", value: session.user.email },
               { label: "Connected Provider", value: "Google OAuth" },
               { label: "Member Since", value: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
             ].map((item) => (
               <div key={item.label} className="p-6 flex justify-between items-center group">
                 <div>
                   <span className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">{item.label}</span>
                   <span className="text-lg font-bold">{item.value}</span>
                 </div>
                 <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-secondary">
                    <ExternalLink size={18} />
                 </button>
               </div>
             ))}
           </div>
        </div>

        <div className="space-y-8">
          {/* Support/Links */}
          <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm space-y-4">
            <h3 className="text-xl font-black mb-6">Resources</h3>
            {[
              { label: "Terms of Service", icon: ShieldCheck },
              { label: "Privacy Policy", icon: ShieldCheck },
              { label: "Help Center", icon: ExternalLink },
            ].map((link) => (
              <button key={link.label} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-variant/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <link.icon size={20} className="text-secondary" />
                  <span className="font-bold">{link.label}</span>
                </div>
                <ChevronRight size={18} className="text-muted group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="bg-error/5 border border-error/20 rounded-[2.5rem] p-8 shadow-sm">
             <h3 className="text-xl font-black text-error mb-6">Danger Zone</h3>
             <div className="space-y-4">
               <button 
                onClick={() => signOut()}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-white text-error border border-error/20 shadow-sm hover:bg-error/5 transition-all group"
               >
                 <div className="flex items-center gap-3 font-black">
                   <LogOut size={20} />
                   Logout Session
                 </div>
                 <ChevronRight size={18} />
               </button>
               <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-error text-white shadow-xl hover:shadow-error/20 shadow-error hover:scale-[1.02] transition-all font-black">
                 <div className="flex items-center gap-3">
                   <Trash2 size={20} />
                   Delete Account
                 </div>
                 <ChevronRight size={18} />
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
