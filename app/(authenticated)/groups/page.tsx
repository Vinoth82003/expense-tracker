"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, ChevronRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { GroupData } from "@/types/group";
import toast from "react-hot-toast";
import CreateGroupModal from "@/components/modals/CreateGroupModal";
import { useGroups } from "@/context/DataContext";

export default function GroupsPage() {
  const { data: groups, loading, refetch } = useGroups();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredGroups = (groups || []).filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Expense Groups</h2>
          <p className="text-secondary font-medium">Manage shared expenses and split bills with friends.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-white font-black shadow-lg shadow-primary-500/20 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New Group
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-surface border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold glass"
          />
        </div>
        <div className="bg-surface border border-white/5 rounded-2xl p-4 flex items-center justify-between glass">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Total Groups</p>
            <p className="text-2xl font-black">{(groups || []).length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
             <Users size={24} />
          </div>
        </div>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 size={40} className="animate-spin text-primary-500" />
          <p className="text-secondary font-bold">Loading your groups...</p>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/groups/${group.id}`} className="block group">
                <div className="bg-surface border border-white/5 rounded-[2.5rem] p-8 glass hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/5 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                      <Users size={28} />
                    </div>
                    <div className="flex -space-x-3">
                      {group.members.slice(0, 3).map((member) => (
                        <div key={member.id} className="w-10 h-10 rounded-full border-4 border-surface bg-surface-variant flex items-center justify-center overflow-hidden">
                          {member.user.avatar ? (
                            <img src={member.user.avatar} alt={member.user.name || "User"} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold">{(member.user.name || "U").charAt(0)}</span>
                          )}
                        </div>
                      ))}
                      {group.members.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-4 border-surface bg-surface-variant flex items-center justify-center text-[10px] font-black">
                          +{group.members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-black mb-2 group-hover:text-primary-500 transition-colors">{group.name}</h3>
                  <p className="text-sm text-secondary font-medium line-clamp-2 mb-6 h-10">
                    {group.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                      {group.expenses?.length || 0} Expenses
                    </div>
                    <div className="p-2 rounded-full bg-surface-variant text-secondary group-hover:bg-primary-500 group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-surface border border-white/5 rounded-[3rem] glass">
          <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-secondary" />
          </div>
          <h3 className="text-2xl font-black mb-2">No groups found</h3>
          <p className="text-secondary font-medium mb-8 max-w-sm mx-auto">
            {searchQuery ? "No groups match your search." : "You haven't joined any expense groups yet. Create one to start splitting bills!"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-black shadow-lg shadow-primary-500/20 hover:scale-105 transition-all active:scale-95"
            >
              <Plus size={20} />
              Create Your First Group
            </button>
          )}
        </div>
      )}

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
