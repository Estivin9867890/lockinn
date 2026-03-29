"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, CheckCircle, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addInventoryItem, updateUsage, deleteInventoryItem } from "@/lib/actions/inventory";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/ui/Modal";
import type { InventoryItem } from "@/lib/types";
import { calcProgress, getProgressColor } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

const STATUS = (pct: number) =>
  pct >= 85 ? { label: "À remplacer", Icon: AlertTriangle, color: "#F87171", bg: "rgba(248,113,113,0.1)" }
  : pct >= 60 ? { label: "À surveiller", Icon: AlertTriangle, color: "#FBBF24", bg: "rgba(251,191,36,0.1)" }
  : { label: "Bon état", Icon: CheckCircle, color: "#34D399", bg: "rgba(52,211,153,0.1)" };

const USAGE_UNITS = ["km", "sessions", "mois", "ans", "heures"];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editUsageId, setEditUsageId] = useState<string | null>(null);
  const [usageInput, setUsageInput] = useState("");
  const [pending, setPending] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [usageUnit, setUsageUnit] = useState("km");
  const [currentUsage, setCurrentUsage] = useState("0");
  const [maxUsage, setMaxUsage] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#5B9CF6");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("inventory").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name || !maxUsage) return;
    setPending(true);
    try {
      const newItem = await addInventoryItem({
        name, category: category || "Autre",
        purchase_date: purchaseDate || undefined,
        usage_unit: usageUnit, current_usage: parseFloat(currentUsage) || 0,
        max_usage: parseFloat(maxUsage), icon, color,
        notes: notes || undefined,
      });
      setItems((prev) => [newItem, ...prev]);
      toast.success("📦 Équipement ajouté !");
      setModal(false);
      setName(""); setCategory(""); setPurchaseDate(""); setCurrentUsage("0"); setMaxUsage(""); setNotes("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleUpdateUsage = async (id: string) => {
    const val = parseFloat(usageInput);
    if (isNaN(val)) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, current_usage: val } : i));
    try { await updateUsage(id, val); toast.success("Usure mise à jour"); }
    catch { load(); }
    setEditUsageId(null);
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try { await deleteInventoryItem(id); toast.success("Équipement supprimé"); }
    catch { load(); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <div className="grid grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  const goodCount = items.filter((i) => calcProgress(i.current_usage, i.max_usage) < 60).length;
  const warnCount = items.filter((i) => { const p = calcProgress(i.current_usage, i.max_usage); return p >= 60 && p < 85; }).length;
  const critCount = items.filter((i) => calcProgress(i.current_usage, i.max_usage) >= 85).length;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Inventaire 📦</h1>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
          style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)", boxShadow: "0 4px 16px rgba(251,191,36,0.35)" }}>
          <Plus className="w-4 h-4" /> Ajouter un équipement
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Équipements suivis", value: items.length, icon: "📦", color: "#5B9CF6" },
          { label: "Bon état", value: goodCount, icon: "✅", color: "#34D399" },
          { label: "À surveiller", value: warnCount, icon: "⚠️", color: "#FBBF24" },
          { label: "À remplacer", value: critCount, icon: "🔴", color: "#F87171" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
            <span className="text-2xl mb-3 block">{kpi.icon}</span>
            <p className="text-[28px] font-semibold text-gray-900">{kpi.value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Items */}
      {items.length === 0 ? (
        <EmptyState icon={Package} title="Aucun équipement suivi"
          description="Ajoutez votre matériel de sport pour suivre son usure et anticiper les remplacements."
          color="#FBBF24" action={{ label: "+ Ajouter un équipement", onClick: () => setModal(true) }} />
      ) : (
        <motion.div variants={item} className="grid grid-cols-2 gap-5">
          {items.map((it, i) => {
            const pct = calcProgress(it.current_usage, it.max_usage);
            const barColor = getProgressColor(pct);
            const status = STATUS(pct);
            const StatusIcon = status.Icon;
            const isEditing = editUsageId === it.id;

            return (
              <motion.div key={it.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }} whileHover={{ y: -3 }}
                className="card group cursor-pointer">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `${it.color}15` }}>
                    {it.icon}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-[15px] font-semibold text-gray-800">{it.name}</p>
                        <p className="text-[12px] text-gray-400">{it.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                          style={{ background: status.bg, color: status.color }}>
                          <StatusIcon className="w-3 h-3" />{status.label}
                        </span>
                        <button onClick={() => handleDelete(it.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-red-400 hover:text-red-600 w-5 h-5 flex items-center justify-center">
                          ×
                        </button>
                      </div>
                    </div>

                    {it.purchase_date && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] text-gray-500">
                          Acheté le {new Date(it.purchase_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-gray-500">Usure</span>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input value={usageInput} onChange={(e) => setUsageInput(e.target.value)}
                              type="number" min={0} max={it.max_usage}
                              className="w-20 text-right px-2 py-0.5 rounded-lg text-[12px] border border-apple-blue/40 outline-none"
                              onKeyDown={(e) => { if (e.key === "Enter") handleUpdateUsage(it.id); if (e.key === "Escape") setEditUsageId(null); }}
                              autoFocus />
                            <button onClick={() => handleUpdateUsage(it.id)} className="text-[10px] text-apple-blue font-semibold">OK</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditUsageId(it.id); setUsageInput(it.current_usage.toString()); }}
                            className="text-[11px] font-semibold hover:text-apple-blue transition-colors" style={{ color: barColor }}>
                            {it.current_usage} / {it.max_usage} {it.usage_unit} ({pct}%)
                          </button>
                        )}
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.4 + i * 0.07 }}
                          className="h-full rounded-full"
                          style={{ background: barColor, boxShadow: `0 0 8px ${barColor}60` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {pct >= 85 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-[12px] text-red-600">Durée de vie atteinte — remplacement recommandé.</p>
                  </motion.div>
                )}
                {pct >= 60 && pct < 85 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <p className="text-[12px] text-yellow-700">Approche de la limite — à surveiller prochainement.</p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel équipement" accentColor="#FBBF24">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nom" required>
              <FormInput placeholder="Nike Pegasus 40" value={name} onChange={setName} />
            </FormField>
            <FormField label="Catégorie">
              <FormInput placeholder="Chaussures de course" value={category} onChange={setCategory} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Emoji / icône">
              <FormInput placeholder="👟" value={icon} onChange={setIcon} />
            </FormField>
            <FormField label="Date d'achat">
              <FormInput value={purchaseDate} onChange={setPurchaseDate} type="date" />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Usage actuel">
              <FormInput placeholder="0" value={currentUsage} onChange={setCurrentUsage} type="number" min={0} />
            </FormField>
            <FormField label="Max (limite)" required>
              <FormInput placeholder="800" value={maxUsage} onChange={setMaxUsage} type="number" min={1} />
            </FormField>
            <FormField label="Unité">
              <FormSelect value={usageUnit} onChange={setUsageUnit}
                options={USAGE_UNITS.map((u) => ({ value: u, label: u }))} />
            </FormField>
          </div>
          <FormField label="Notes">
            <FormTextarea placeholder="Informations complémentaires…" value={notes} onChange={setNotes} rows={2} />
          </FormField>
          <SubmitButton label="Ajouter l'équipement" loading={pending} color="#FBBF24" onClick={handleAdd} />
        </div>
      </Modal>
    </motion.div>
  );
}
