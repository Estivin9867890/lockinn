"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addTransaction, deleteTransaction, addSubscription, deleteSubscription } from "@/lib/actions/finances";
import { useSettings } from "@/contexts/SettingsContext";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, FormSelect, SubmitButton } from "@/components/ui/Modal";
import type { FinanceTransaction, FinanceSubscription } from "@/lib/types";
import { EXPENSE_CATEGORIES, CATEGORY_EMOJIS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

const THIS_MONTH = new Date().toISOString().slice(0, 7);

export default function BudgetPage() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [subs, setSubs] = useState<FinanceSubscription[]>([]);
  const [txModal, setTxModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [pending, setPending] = useState(false);

  // Tx form
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txLabel, setTxLabel] = useState("");
  const [txCat, setTxCat] = useState("Alimentation");
  const [txAmount, setTxAmount] = useState("");
  const [txRecurring, setTxRecurring] = useState(false);

  // Sub form
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subIcon, setSubIcon] = useState("💳");
  const [subColor, setSubColor] = useState("#5B9CF6");

  const load = async () => {
    const [t, s] = await Promise.all([
      supabase.from("finances_transactions").select("*").order("date", { ascending: false }).limit(50),
      supabase.from("finances_subscriptions").select("*").eq("active", true).order("amount", { ascending: false }),
    ]);
    setTransactions(t.data || []);
    setSubs(s.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const monthTx = transactions.filter((t) => t.date?.startsWith(THIS_MONTH));
  const totalSpent = monthTx.reduce((s, t) => s + t.amount, 0);
  const totalSubs = subs.reduce((s, sub) => s + sub.amount, 0);
  const remaining = settings.monthly_budget_eur - totalSpent;

  // Category totals for this month
  const catTotals: Record<string, number> = {};
  monthTx.forEach((t) => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  // 6-month rolling spending data
  const months6: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const total = transactions.filter((t) => t.date?.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    months6.push({ month: label, total });
  }

  const handleAddTx = async () => {
    if (!txLabel || !txAmount) return;
    setPending(true);
    try {
      const newTx = await addTransaction({ date: txDate, label: txLabel, category: txCat, amount: parseFloat(txAmount), recurring: txRecurring });
      setTransactions((prev) => [newTx, ...prev]);
      toast.success("💸 Dépense enregistrée !");
      setTxModal(false);
      setTxLabel(""); setTxAmount(""); setTxRecurring(false);
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleAddSub = async () => {
    if (!subName || !subAmount) return;
    setPending(true);
    try {
      const newSub = await addSubscription({ name: subName, amount: parseFloat(subAmount), color: subColor, icon: subIcon, billing_period: "mensuel", active: true });
      setSubs((prev) => [newSub, ...prev]);
      toast.success("🔄 Abonnement ajouté !");
      setSubModal(false);
      setSubName(""); setSubAmount("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleDeleteTx = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try { await deleteTransaction(id); toast.success("Transaction supprimée"); }
    catch { load(); }
  };

  const handleDeleteSub = async (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    try { await deleteSubscription(id); toast.success("Abonnement supprimé"); }
    catch { load(); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7"><CardSkeleton /></div>
        <div className="col-span-5"><CardSkeleton /></div>
        <div className="col-span-5"><CardSkeleton /></div>
        <div className="col-span-7"><CardSkeleton /></div>
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Budget & Finance 💰</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSubModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
            style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)", boxShadow: "0 4px 16px rgba(167,139,250,0.35)" }}>
            <Plus className="w-4 h-4" /> Abonnement
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setTxModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
            style={{ background: "linear-gradient(135deg, #F472B6, #EC4899)", boxShadow: "0 4px 16px rgba(244,114,182,0.35)" }}>
            <Plus className="w-4 h-4" /> Dépense
          </motion.button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Dépensé ce mois", value: formatCurrency(totalSpent), icon: "💸", color: "#F472B6", sub: `Budget: ${formatCurrency(settings.monthly_budget_eur)}` },
          { label: "Abonnements/mois", value: formatCurrency(totalSubs), icon: "🔄", color: "#A78BFA", sub: `${subs.length} actifs` },
          { label: "Restant budget", value: formatCurrency(Math.max(remaining, 0)), icon: remaining >= 0 ? "✅" : "⚠️", color: remaining >= 0 ? "#34D399" : "#F87171", sub: remaining >= 0 ? "Dans le budget" : "Dépassement !" },
          { label: "Transactions", value: monthTx.length.toString(), icon: "📊", color: "#5B9CF6", sub: "Ce mois" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
            <span className="text-2xl mb-3 block">{kpi.icon}</span>
            <p className="text-[20px] font-semibold text-gray-900 leading-none">{kpi.value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
            <p className="text-[11px] mt-1" style={{ color: kpi.color }}>{kpi.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        {/* Spending trend */}
        <motion.div variants={item} className="col-span-7">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[14px] font-semibold text-gray-800">Dépenses — 6 derniers mois</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">vs budget {formatCurrency(settings.monthly_budget_eur)}/mois</p>
              </div>
              <div className="flex items-center gap-1.5 text-apple-rose">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[13px] font-semibold">{formatCurrency(totalSpent)}</span>
              </div>
            </div>
            {transactions.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucune transaction" description="Ajoutez vos premières dépenses pour voir l'évolution de votre budget." color="#F472B6" />
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                    <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }}
                      formatter={(v: any) => [formatCurrency(v), "Dépenses"]} />
                    <Bar dataKey="total" fill="#F472B6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div variants={item} className="col-span-5">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Par catégorie ce mois</h2>
            {Object.keys(catTotals).length === 0 ? (
              <EmptyState icon={Wallet} title="Aucune dépense" description="Ajoutez vos premières dépenses." color="#F472B6" />
            ) : (
              <div className="space-y-3">
                {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
                  const pct = Math.round((total / totalSpent) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                          {CATEGORY_EMOJIS[cat] || "💰"} {cat}
                        </span>
                        <span className="text-[12px] font-semibold text-gray-700">{formatCurrency(total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-apple-rose to-apple-purple" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Subscriptions */}
        <motion.div variants={item} className="col-span-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Abonnements actifs</h2>
              <span className="text-[12px] font-semibold text-apple-purple">{formatCurrency(totalSubs)}/mois</span>
            </div>
            {subs.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucun abonnement" description="Ajoutez vos abonnements récurrents." color="#A78BFA"
                action={{ label: "+ Abonnement", onClick: () => setSubModal(true) }} />
            ) : (
              <div className="space-y-2">
                {subs.map((sub, i) => (
                  <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/3 transition-colors group">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${sub.color}18` }}>{sub.icon}</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-700">{sub.name}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{sub.billing_period}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-gray-700">{formatCurrency(sub.amount)}</span>
                    <button onClick={() => handleDeleteSub(sub.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-red-400 hover:text-red-600 ml-1 px-1.5 py-0.5 rounded-lg hover:bg-red-50">
                      Résilier
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Transactions list */}
        <motion.div variants={item} className="col-span-7">
          <div className="card">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Transactions récentes</h2>
            {transactions.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucune transaction enregistrée"
                description='Cliquez sur "+ Dépense" ou utilisez ⌘K pour commencer.'
                color="#F472B6" action={{ label: "+ Ajouter une dépense", onClick: () => setTxModal(true) }} />
            ) : (
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {transactions.slice(0, 20).map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/3 transition-colors group cursor-pointer">
                    <span className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center text-sm flex-shrink-0">
                      {CATEGORY_EMOJIS[t.category] || "💰"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-700 truncate">{t.label}</p>
                      <p className="text-[11px] text-gray-400">{t.category} · {formatDate(t.date)}</p>
                    </div>
                    {t.recurring && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 font-medium">Récurrent</span>
                    )}
                    <span className="text-[13px] font-semibold text-gray-800">-{formatCurrency(t.amount)}</span>
                    <button onClick={() => handleDeleteTx(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-red-400 hover:text-red-600 ml-1">
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add transaction modal */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Nouvelle dépense" accentColor="#F472B6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Libellé" required>
              <FormInput placeholder="Monoprix" value={txLabel} onChange={setTxLabel} />
            </FormField>
            <FormField label="Montant (€)" required>
              <FormInput placeholder="42.50" value={txAmount} onChange={setTxAmount} type="number" min={0} step={0.01} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Catégorie">
              <FormSelect value={txCat} onChange={setTxCat}
                options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: `${CATEGORY_EMOJIS[c] || ""} ${c}` }))} />
            </FormField>
            <FormField label="Date">
              <FormInput value={txDate} onChange={setTxDate} type="date" />
            </FormField>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={txRecurring} onChange={(e) => setTxRecurring(e.target.checked)}
              className="w-4 h-4 rounded accent-apple-blue" />
            <span className="text-[13px] text-gray-700">Dépense récurrente</span>
          </label>
          <SubmitButton label="Enregistrer la dépense" loading={pending} color="#F472B6" onClick={handleAddTx} />
        </div>
      </Modal>

      {/* Add subscription modal */}
      <Modal open={subModal} onClose={() => setSubModal(false)} title="Nouvel abonnement" accentColor="#A78BFA">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nom" required>
              <FormInput placeholder="Netflix" value={subName} onChange={setSubName} />
            </FormField>
            <FormField label="Montant/mois (€)" required>
              <FormInput placeholder="15.49" value={subAmount} onChange={setSubAmount} type="number" min={0} step={0.01} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Emoji / icône">
              <FormInput placeholder="📺" value={subIcon} onChange={setSubIcon} />
            </FormField>
            <FormField label="Couleur (hex)">
              <FormInput placeholder="#5B9CF6" value={subColor} onChange={setSubColor} />
            </FormField>
          </div>
          <SubmitButton label="Ajouter l'abonnement" loading={pending} color="#A78BFA" onClick={handleAddSub} />
        </div>
      </Modal>
    </motion.div>
  );
}
