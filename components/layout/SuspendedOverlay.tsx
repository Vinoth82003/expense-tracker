import { motion } from "framer-motion";
import { ShieldAlert, Mail } from "lucide-react";
import { signOut } from "next-auth/react";

export function SuspendedOverlay() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl text-white p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-[#161B27] rounded-[2.5rem] shadow-2xl border border-rose-500/30 overflow-hidden"
      >
        <div className="p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <ShieldAlert size={48} strokeWidth={1.5} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Account Suspended</h1>
            <p className="text-slate-400 font-medium">
              Your access to SpendWise has been restricted due to a violation of our security policies or suspicious activity.
            </p>
          </div>

          <div className="w-full bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-left space-y-4">
            <div className="flex items-start gap-4">
              <Mail className="text-rose-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="text-sm font-bold text-slate-200">What happens now?</h3>
                <p className="text-xs text-slate-400 mt-1">Please check your registered email address for a detailed explanation and instructions on how to appeal this decision.</p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3 pt-4">
            <a 
              href="/contact"
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-sm flex items-center justify-center transition-all shadow-lg shadow-rose-500/20"
            >
              Contact Support
            </a>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-sm transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
