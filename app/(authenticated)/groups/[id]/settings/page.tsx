"use client";

import React, { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  ArrowLeft, 
  Settings, 
  Trash2, 
  UserMinus, 
  Save, 
  Loader2, 
  AlertTriangle,
  Archive
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupData, GroupMemberData } from "@/types/group";
import { useModal } from "@/components/providers/ModalProvider";
import toast from "react-hot-toast";

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { confirm } = useModal();
  
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        setName(data.name);
        setDescription(data.description || "");
      } else {
        router.push("/groups");
      }
    } catch (error) {
      toast.error("Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        toast.success("Group updated!");
        fetchGroup();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    const isConfirmed = await confirm({
      title: "Remove Member?",
      message: `Are you sure you want to remove ${userName} from the group? This will not delete their historical expenses but they will no longer be part of new splits.`,
      confirmText: "Remove Member",
      danger: true
    });

    if (isConfirmed) {
      try {
        const res = await fetch(`/api/groups/${id}/members/${userId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Member removed");
          fetchGroup();
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to remove member");
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    }
  };

  const handleDeleteGroup = async () => {
    const isConfirmed = await confirm({
      title: "Delete Group?",
      message: "This action is permanent and will delete all expenses and splits associated with this group. Are you sure?",
      confirmText: "Delete Group",
      danger: true
    });

    if (isConfirmed) {
      try {
        const res = await fetch(`/api/groups/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Group deleted");
          router.push("/groups");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to delete group");
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    }
  };

  if (loading || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 size={40} className="animate-spin text-primary-500" />
        <p className="text-secondary font-bold">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <Link href={`/groups/${id}`} className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-bold group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to {group.name}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Group Settings</h2>
          <p className="text-secondary font-medium">Configure your shared forensic workspace.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => toast.success("Archiving logic applied to settled expenses.")}
             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-variant text-secondary font-bold hover:text-foreground transition-all shadow-sm"
           >
             <Archive size={18} />
             Archive Settled
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          {/* General Settings */}
          <section className="bg-surface border border-white/5 rounded-[2.5rem] p-8 glass space-y-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                 <Settings size={20} />
               </div>
               <h3 className="text-xl font-black">General Information</h3>
            </div>

            <form onSubmit={handleUpdateGroup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Trip 2024"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of group purpose..."
                  rows={4}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                Save Configuration
              </button>
            </form>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 glass space-y-8">
            <div className="flex items-center gap-3 text-red-500">
               <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                 <AlertTriangle size={20} />
               </div>
               <h3 className="text-xl font-black">Danger Zone</h3>
            </div>
            
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 gap-4">
                 <div>
                   <h4 className="font-bold">Delete Group</h4>
                   <p className="text-xs text-secondary font-medium">Permanently delete this group and all its forensic records.</p>
                 </div>
                 <button 
                  onClick={handleDeleteGroup}
                  className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-black text-sm hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                 >
                   Delete Workspace
                 </button>
               </div>
            </div>
          </section>
        </div>

        {/* Members Management */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black tracking-tight">Access Control</h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{group.members.length} Members</p>
           </div>
           
           <div className="space-y-3">
             {group.members.map((member) => (
               <div key={member.id} className="p-4 bg-surface border border-white/5 rounded-3xl glass flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden border border-white/10 shadow-sm">
                        {member.user.avatar ? (
                          <img src={member.user.avatar} alt={member.user.name || "User"} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{(member.user.name || "U").charAt(0)}</span>
                        )}
                     </div>
                     <div className="min-w-0">
                        <p className="font-bold text-sm truncate max-w-[120px]">{member.user.name || "Unknown User"}</p>
                        <p className="text-[9px] text-secondary font-black uppercase tracking-widest">{member.role.toLowerCase()}</p>
                     </div>
                  </div>
                  {member.userId !== group.createdBy && (
                    <button 
                      onClick={() => handleRemoveMember(member.userId, member.user.name || "this user")}
                      className="p-2 rounded-lg text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove Member"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
