"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GroupData } from "@/types/group";
import CreateGroupModal from "@/components/modals/CreateGroupModal";

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8">
      {/* Groups Sidebar - Hidden on smaller screens for cleaner look, but could be adapted */}
      <aside className="hidden lg:flex flex-col w-80 bg-surface border border-white/5 rounded-[2.5rem] overflow-hidden glass shadow-xl shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary-500" />
            <h3 className="text-xl font-black tracking-tight">Forensic Groups</h3>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 rounded-xl bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-all shadow-sm active:scale-95"
            title="Create New Group"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-10 space-y-2">
               <Loader2 size={24} className="animate-spin text-primary-500" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted">Syncing...</p>
             </div>
          ) : groups.length > 0 ? (
            groups.map((group) => {
              const isActive = pathname === `/groups/${group.id}`;
              return (
                <Link 
                  key={group.id} 
                  href={`/groups/${group.id}`}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all group ${
                    isActive ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "hover:bg-white/5 text-secondary hover:text-foreground"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? "bg-white/20" : "bg-surface-variant group-hover:bg-white/10"
                  }`}>
                    <Users size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{group.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-white/70" : "text-muted"}`}>
                      {group.members.length} Members
                    </p>
                  </div>
                  <ChevronRight size={14} className={`transition-transform group-hover:translate-x-1 ${isActive ? "text-white/50" : "text-muted"}`} />
                </Link>
              );
            })
          ) : (
            <div className="py-10 text-center px-4">
              <p className="text-xs font-bold text-secondary leading-relaxed">
                No active forensic groups found. Create one to begin.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5">
           <div className="flex items-center gap-3 text-secondary">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Users size={14} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                Quickly switch between <span className="text-foreground">split workspaces</span>.
              </p>
           </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </main>

      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchGroups}
      />
    </div>
  );
}
