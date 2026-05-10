"use client";

import React, { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  Settings, 
  ArrowLeft, 
  Clock, 
  IndianRupee,
  UserPlus,
  Receipt,
  PieChart,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupData, GroupExpenseData, MemberBalance } from "@/types/group";
import MemberCard from "@/components/groups/MemberCard";
import GroupExpenseModal from "@/components/groups/GroupExpenseModal";
import InviteModal from "@/components/modals/InviteModal";
import toast from "react-hot-toast";

export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  
  const [group, setGroup] = useState<GroupData | null>(null);
  const [balanceData, setBalanceData] = useState<{ memberBalances: MemberBalance[], totalGroupExpenses: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<GroupExpenseData | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupRes, balanceRes] = await Promise.all([
        fetch(`/api/groups/${id}`),
        fetch(`/api/groups/${id}/balance`)
      ]);

      if (groupRes.ok && balanceRes.ok) {
        const groupData = await groupRes.json();
        const balanceInfo = await balanceRes.json();
        setGroup(groupData);
        setBalanceData(balanceInfo);
      } else {
        toast.error("Failed to load group details");
        router.push("/groups");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 size={40} className="animate-spin text-primary-500" />
        <p className="text-secondary font-bold">Synchronizing group data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Navigation & Actions Bar */}
      <div className="flex items-center justify-between">
        <Link href="/groups" className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-bold group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Groups
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="p-3 rounded-xl bg-surface border border-white/5 text-secondary hover:text-primary-500 transition-all active:scale-95 glass"
            title="Invite Members"
          >
            <UserPlus size={20} />
          </button>
          <Link 
            href={`/groups/${id}/settings`}
            className="p-3 rounded-xl bg-surface border border-white/5 text-secondary hover:text-foreground transition-all active:scale-95 glass" 
            title="Settings"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-surface border border-white/5 p-10 md:p-14 glass">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-16 h-16 rounded-[1.5rem] bg-primary-500 text-white flex items-center justify-center shadow-2xl shadow-primary-500/40">
                 <Users size={32} />
               </div>
               <div className="flex -space-x-4">
                   {group.members.slice(0, 5).map((m) => (
                    <div key={m.id} className="w-10 h-10 rounded-full border-4 border-surface bg-surface-variant flex items-center justify-center overflow-hidden shadow-lg">
                       {m.user.avatar ? (
                         <img src={m.user.avatar} alt={m.user.name || "User"} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-xs font-bold">{(m.user.name || "U").charAt(0)}</span>
                       )}
                    </div>
                  ))}
                  {group.members.length > 5 && (
                    <div className="w-10 h-10 rounded-full border-4 border-surface bg-surface-variant flex items-center justify-center text-[10px] font-black">
                      +{group.members.length - 5}
                    </div>
                  )}
               </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">{group.name}</h1>
            <p className="text-lg text-secondary font-medium max-w-xl">{group.description || "Shared financial forensic workspace for group members."}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Total Group Spending</p>
              <p className="text-3xl font-black text-primary-500">₹{balanceData?.totalGroupExpenses.toLocaleString() || "0"}</p>
            </div>
            <button 
              onClick={() => {
                setSelectedExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-foreground text-background font-black text-lg shadow-xl hover:scale-105 transition-all active:scale-95"
            >
              <Plus size={24} />
              Add Shared Expense
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Member Balances */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black tracking-tight">Member Balances</h3>
             <p className="text-xs font-black uppercase tracking-widest text-secondary">{group.members.length} Members</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {balanceData?.memberBalances.map((balance) => (
               <MemberCard key={balance.userId} balance={balance} />
             ))}
           </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
             <button className="text-xs font-black uppercase tracking-widest text-primary-500 hover:text-primary-400 transition-colors">View All</button>
           </div>
           <div className="space-y-4">
             {group.expenses && group.expenses.length > 0 ? (
               group.expenses.slice(0, 8).map((expense: GroupExpenseData) => (
                 <motion.div
                   key={expense.id}
                   whileHover={{ x: 4 }}
                   className="p-5 bg-surface border border-white/5 rounded-3xl glass flex items-center justify-between group cursor-pointer"
                   onClick={() => {
                     setSelectedExpense(expense);
                     setIsExpenseModalOpen(true);
                   }}
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center text-secondary group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-all">
                       <Receipt size={22} />
                     </div>
                     <div>
                       <p className="font-bold text-sm truncate max-w-[120px]">{expense.description}</p>
                       <p className="text-[10px] text-secondary font-bold uppercase tracking-widest flex items-center gap-1">
                         <Clock size={10} />
                         {new Date(expense.date).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                    <div className="text-right">
                     <p className="font-black text-lg tracking-tight">₹{expense.amount.toLocaleString()}</p>
                     <p className="text-[9px] text-secondary font-black uppercase tracking-widest">Paid by {expense.paidBy?.name?.split(' ')[0] || "Unknown"}</p>
                   </div>
                 </motion.div>
               ))
             ) : (
               <div className="py-20 text-center bg-surface border border-white/5 rounded-3xl glass opacity-60">
                 <p className="text-sm font-bold text-secondary">No recent activity.</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Modals */}
      <GroupExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        groupId={id}
        members={group.members}
        onSuccess={fetchData}
        editExpense={selectedExpense}
      />

      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={id}
        groupName={group.name}
      />
    </div>
  );
}
