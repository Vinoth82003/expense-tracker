"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  ShieldCheck,
  User,
  Loader2,
  Tag,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { useCategories, useMutations } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";

interface Category {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
  userId: string | null;
}

const TYPE_ICONS: Record<string, typeof ShoppingCart> = {
  Needs: ShoppingCart,
  Wants: Sparkles,
};

export default function MyCategoriesPage() {
  const { confirm } = useModal();
  const { toast } = useUI();
  const { data: catData, loading, error, refetch } = useCategories();
  const mutations = useMutations();

  const globalCategories = ((catData as any)?.globalCategories || []) as Category[];
  const userCategories = ((catData as any)?.userCategories || []) as Category[];
  const allCategories = [...globalCategories, ...userCategories] as Category[];

  const myCategories = userCategories;
  const [typeFilter, setTypeFilter] = useState<"all" | "Needs" | "Wants">("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", type: "Needs" });
  const [saving, setSaving] = useState(false);
  const [errorProp, setErrorProp] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setFormData({ name: "", type: "Needs" });
    setErrorProp(null);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setFormData({ name: cat.name, type: cat.type });
    setErrorProp(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    setErrorProp(null);
  }

  async function handleSave() {
    const name = formData.name.trim();
    if (!name) { setErrorProp("Category name is required"); return; }
    setErrorProp(null);
    setSaving(true);

    try {
      if (editingId) {
        await mutations.updateCategory(editingId, { name, type: formData.type });
      } else {
        await mutations.createCategory({ name, type: formData.type });
      }
      toast.success(editingId ? "Category updated" : "Category created");
      closeForm();
    } catch (e: any) {
      setErrorProp(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Delete Category",
      message: "Are you sure you want to delete this custom category?",
      danger: true,
    });
    if (!ok) return;

    try {
      await mutations.deleteCategory(id);
      toast.success("Category deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filteredMyCategories =
    typeFilter === "all" ? myCategories : myCategories.filter((c) => c.type === typeFilter);

  const filteredGlobalCategories =
    typeFilter === "all" ? globalCategories : globalCategories.filter((c) => c.type === typeFilter);

  return (
    <div className="px-4 mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="-mx-4 px-4 pt-2 pb-1">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-foreground">Categories</div>
            <div className="text-[11px] text-muted">
              {myCategories.length} custom &middot; {globalCategories.length}{" "}
              system
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border-subtle rounded-xl w-fit">
          {(["all", "Needs", "Wants"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === t
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Form Bottom Sheet */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border-subtle"
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-surface z-10">
                <div className="w-10 h-1 rounded-full bg-border-subtle" />
              </div>

              <div className="px-5 pt-2 pb-8 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                      {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {editingId ? "Edit Category" : "New Category"}
                    </h2>
                  </div>
                  <button
                    onClick={closeForm}
                    className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center text-muted hover:text-foreground transition-colors active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>

                {errorProp && (
                  <div className="mb-4 p-3 rounded-xl bg-error/10 text-error text-sm font-medium">
                    {errorProp}
                  </div>
                )}

                {/* Name */}
                <div className="mb-5">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">
                    Name
                  </label>
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="text"
                      autoFocus
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Gym, Spotify, Coffee"
                      className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors placeholder:text-muted"
                    />
                  </div>
                </div>

                {/* Type toggle */}
                <div className="mb-6">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-surface-variant rounded-xl">
                    {["Needs", "Wants"].map((t) => {
                      const Icon = TYPE_ICONS[t];
                      return (
                        <button
                          key={t}
                          onClick={() => setFormData({ ...formData, type: t })}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            formData.type === t
                              ? "bg-primary-500 text-white shadow-sm"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          <Icon size={14} />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Create Category"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="animate-spin mb-3" size={24} />
          <span className="text-xs font-medium">Loading...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Custom Categories */}
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <User size={14} className="text-primary-500" />
              <h2 className="text-sm font-bold text-foreground">
                Custom Categories
              </h2>
              <span className="text-xs text-muted">
                ({myCategories.length})
              </span>
            </div>
            {filteredMyCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-dashed border-border-subtle rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center mb-2">
                  <Tag size={18} className="text-muted" />
                </div>
                <p className="text-sm text-muted mb-1">
                  {typeFilter !== "all"
                    ? `No ${typeFilter} custom categories`
                    : "No custom categories yet"}
                </p>
                <p className="text-xs text-muted mb-4">
                  Create one to track specific spending
                </p>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl"
                >
                  <Plus size={14} /> Add Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMyCategories.map((cat) => {
                  const Icon = TYPE_ICONS[cat.type] || Tag;
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-subtle hover:border-border-hover transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          cat.type === "Needs"
                            ? "bg-primary-500/10 text-primary-500"
                            : "bg-tertiary-500/10 text-tertiary-500"
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {cat.name}
                        </div>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                            cat.type === "Needs"
                              ? "bg-primary-500/10 text-primary-500"
                              : "bg-tertiary-500/10 text-tertiary-500"
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* System Categories */}
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <ShieldCheck size={14} className="text-tertiary-500" />
              <h2 className="text-sm font-bold text-foreground">
                System Categories
              </h2>
              <span className="text-xs text-muted">
                ({globalCategories.length})
              </span>
            </div>
            {filteredGlobalCategories.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted bg-surface border border-dashed border-border-subtle rounded-2xl">
                No system categories for this type
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredGlobalCategories.map((cat) => {
                  const Icon = TYPE_ICONS[cat.type] || Tag;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-variant/50 border border-border-subtle"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          cat.type === "Needs"
                            ? "bg-primary-500/10 text-primary-500"
                            : "bg-tertiary-500/10 text-tertiary-500"
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {cat.name}
                        </div>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                            cat.type === "Needs"
                              ? "bg-primary-500/10 text-primary-500"
                              : "bg-tertiary-500/10 text-tertiary-500"
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>
                      <ShieldCheck
                        size={14}
                        className="text-muted flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* FAB for mobile */}
      <button
        onClick={openAdd}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
