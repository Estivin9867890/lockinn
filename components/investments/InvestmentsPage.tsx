"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Trash2, RefreshCw } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getInvestments, addInvestment, deleteInvestment, addTransaction, updateCurrentPrice } from "@/lib/actions/investments";
import type { Investment } from "@/lib/types";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

const CATEGORIES = ["action", "crypto", "immobilier", "autre"] as const;
const CAT_LABELS: Record<string, string> = { action: "Actions", crypto: "Crypto", immobilier: "Immobilier", autre: "Autre" };
const CAT_COLORS: Record<string, string> = { action: "#5B9CF6", crypto: "#F59E0B", immobilier: "#34D399", autre: "#A78BFA" };
const CAT_EMOJIS: Record<string, string> = { action: "📈", crypto: "₿", immobilier: "🏠", autre: "💼" };

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

function DonutChart({ investments }: { investments: Investment[] }) {
  const byCategory = CATEGORIES.map(cat => ({
    name: CAT_LABELS[cat],
    category: cat,
    value: investments.filter(i => i.category === cat).reduce((s, i) => s + i.amount_eur, 0),
  })).filter(d => d.value > 0);

  const total = byCategory.reduce((s, d) => s + d.value, 0);

  if (byCategory.length === 0) return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
      <span className="text-[32px] mb-2">📊</span>
      <p className="text-[12px]">Aucun investissement</p>
    </div>
  );

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
            dataKey="value" paddingAngle={3} strokeWidth={0}>
            {byCategory.map((entry) => (
              <Cell key={entry.category} fill={CAT_COLORS[entry.category]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }}
            formatter={(v: unknown) => [fmt(v as number), ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[11px] text-gray-400">Total</p>
        <p className="text-[18px] font-bold text-gray-900">{fmt(total)}</p>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {byCategory.map(d => (
          <div key={d.category} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[d.category] }} />
            <span className="text-[11px] text-gray-500">{d.name} {Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [saving, setSaving] = useState(false);

  // Add investment form
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("action");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Add transaction form
  const [txType, setTxType] = useState<"buy" | "sell">("buy");
  const [txQty, setTxQty] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  // Update current price
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    getInvestments().then(data => { setInvestments(data); setLoading(false); });
  }, []);

  const totalInvested = investments.reduce((s, i) => s + i.amount_eur, 0);
  const totalValue = investments.reduce((s, i) => {
    const qty = i.quantity || 0;
    const price = i.current_price || i.buy_price || 0;
    return s + (qty > 0 ? qty * price : i.amount_eur);
  }, 0);
  const pnl = totalValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  // Performance area chart data (by month from transactions)
  const monthlyData = (() => {
    const byMonth: Record<string, number> = {};
    for (const inv of investments) {
      for (const tx of inv.transactions || []) {
        const m = tx.date.slice(0, 7);
        byMonth[m] = (byMonth[m] || 0) + (tx.type === "buy" ? tx.total_eur : -tx.total_eur);
      }
    }
    const months = Object.keys(byMonth).sort();
    let cumul = 0;
    return months.map(m => {
      cumul += byMonth[m];
      return {
        month: new Date(m + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        investi: Math.round(cumul),
      };
    });
  })();

  const handleAddInvestment = async () => {
    if (!name || !buyPrice || !quantity) return;
    setSaving(true);
    try {
      const qty = parseFloat(quantity);
      const price = parseFloat(buyPrice);
      const inv = await addInvestment({
        name, ticker: ticker || undefined, category,
        amount_eur: qty * price, quantity: qty, buy_price: price, current_price: price, date, notes,
      });
      setInvestments(prev => [{ ...inv, transactions: [] }, ...prev]);
      setShowAddModal(false);
      setName(""); setTicker(""); setQuantity(""); setBuyPrice(""); setNotes("");
      toast.success(`📈 ${name} ajouté au portefeuille !`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  const handleAddTransaction = async () => {
    if (!selectedInv || !txQty || !txPrice) return;
    setSaving(true);
    try {
      const tx = await addTransaction({
        investment_id: selectedInv.id,
        type: txType, quantity: parseFloat(txQty),
        price_eur: parseFloat(txPrice), date: txDate,
      });
      // Refresh
      getInvestments().then(setInvestments);
      setShowTxModal(false);
      setTxQty(""); setTxPrice("");
      toast.success(`${txType === "buy" ? "📈 Achat" : "📉 Vente"} enregistré — ${parseFloat(txQty)} × ${parseFloat(txPrice)}€`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  const handleUpdatePrice = async (id: string) => {
    if (!newPrice) return;
    await updateCurrentPrice(id, parseFloat(newPrice));
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, current_price: parseFloat(newPrice) } : i));
    setEditPriceId(null);
    setNewPrice("");
    toast.success("Prix mis à jour");
  };

  const handleDelete = async (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
    await deleteInvestment(id);
    toast.success("Investissement supprimé");
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-56 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Portefeuille</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Investissements 📈</h1>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 4px 16px rgba(91,156,246,0.4)" }}>
          <Plus className="w-4 h-4" /> Nouvel actif
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        {[
          { label: "Investi total", value: fmt(totalInvested), icon: "💰", color: "#5B9CF6" },
          { label: "Valeur actuelle", value: fmt(totalValue), icon: "📊", color: pnl >= 0 ? "#34D399" : "#F87171" },
          {
            label: "P&L total",
            value: `${pnl >= 0 ? "+" : ""}${fmt(pnl)}`,
            icon: pnl >= 0 ? "📈" : "📉",
            color: pnl >= 0 ? "#34D399" : "#F87171",
            sub: `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`,
          },
        ].map(kpi => (
          <div key={kpi.label} className="card"
            style={{ background: `linear-gradient(135deg, ${kpi.color}10, ${kpi.color}04)` }}>
            <span className="text-[22px] mb-2 block">{kpi.icon}</span>
            <p className="text-[20px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpi.label}</p>
            {kpi.sub && <p className="text-[11px] font-semibold mt-1" style={{ color: kpi.color }}>{kpi.sub}</p>}
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        {/* Donut chart */}
        <motion.div variants={item} className="col-span-5 card">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Répartition du portefeuille</h2>
          <DonutChart investments={investments} />
        </motion.div>

        {/* Performance curve */}
        <motion.div variants={item} className="col-span-7 card">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Capital investi dans le temps</h2>
          {monthlyData.length < 2 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-[13px]">
              Ajoute plusieurs investissements pour voir la courbe
            </div>
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B9CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5B9CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }}
                    formatter={(v: unknown) => [fmt(v as number), "Investi"]} />
                  <Area type="monotone" dataKey="investi" stroke="#5B9CF6" fill="url(#invGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Investments list */}
        <motion.div variants={item} className="col-span-12 card">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-4">
            Actifs ({investments.length})
          </h2>

          {investments.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-[40px]">📈</span>
              <p className="text-[14px] font-semibold text-gray-600 mt-3">Aucun actif enregistré</p>
              <p className="text-[12px] text-gray-400 mt-1">Commence à construire ton portefeuille</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 pb-2 border-b border-black/4">
                {["Actif", "Catégorie", "Quantité", "Prix achat", "Prix actuel", "Valeur", "P&L", "Actions"].map(h => (
                  <span key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide
                    col-span-1 first:col-span-3 last:col-span-2">{h}</span>
                ))}
              </div>

              {investments.map(inv => {
                const qty = inv.quantity || 0;
                const buyP = inv.buy_price || 0;
                const currP = inv.current_price || buyP;
                const currentValue = qty > 0 ? qty * currP : inv.amount_eur;
                const invested = qty > 0 ? qty * buyP : inv.amount_eur;
                const gain = currentValue - invested;
                const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

                return (
                  <motion.div key={inv.id} layout
                    className="group grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-xl hover:bg-black/3 transition-colors">
                    {/* Name */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0"
                        style={{ background: `${CAT_COLORS[inv.category]}15` }}>
                        {CAT_EMOJIS[inv.category]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{inv.name}</p>
                        {inv.ticker && <p className="text-[10px] text-gray-400">{inv.ticker}</p>}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${CAT_COLORS[inv.category]}15`, color: CAT_COLORS[inv.category] }}>
                        {CAT_LABELS[inv.category]}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <p className="text-[12px] text-gray-700 tabular-nums">{qty > 0 ? qty.toFixed(4).replace(/\.?0+$/, "") : "—"}</p>
                    </div>

                    {/* Buy price */}
                    <div className="col-span-1">
                      <p className="text-[12px] text-gray-500 tabular-nums">{buyP > 0 ? fmt(buyP) : "—"}</p>
                    </div>

                    {/* Current price (editable) */}
                    <div className="col-span-1">
                      {editPriceId === inv.id ? (
                        <div className="flex items-center gap-1">
                          <input autoFocus type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleUpdatePrice(inv.id); if (e.key === "Escape") setEditPriceId(null); }}
                            className="w-16 px-1.5 py-1 rounded-lg text-[11px] outline-none border border-blue-300"
                            placeholder={String(currP)} />
                          <button onClick={() => handleUpdatePrice(inv.id)}
                            className="text-[10px] text-blue-500 font-semibold">✓</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditPriceId(inv.id); setNewPrice(String(currP)); }}
                          className="text-[12px] text-gray-700 tabular-nums hover:text-blue-500 transition-colors flex items-center gap-1">
                          {currP > 0 ? fmt(currP) : "—"}
                          <RefreshCw className="w-2.5 h-2.5 opacity-0 group-hover:opacity-50" />
                        </button>
                      )}
                    </div>

                    {/* Current value */}
                    <div className="col-span-1">
                      <p className="text-[12px] font-semibold text-gray-800 tabular-nums">{fmt(currentValue)}</p>
                    </div>

                    {/* P&L */}
                    <div className="col-span-1">
                      <p className={`text-[12px] font-bold tabular-nums ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {gain >= 0 ? "+" : ""}{fmt(gain)}
                      </p>
                      <p className={`text-[10px] ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedInv(inv); setTxType("buy"); setShowTxModal(true); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-emerald-600"
                        style={{ background: "rgba(52,211,153,0.1)" }}>
                        <TrendingUp className="w-3 h-3" /> Acheter
                      </button>
                      <button onClick={() => { setSelectedInv(inv); setTxType("sell"); setShowTxModal(true); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-red-500"
                        style={{ background: "rgba(248,113,113,0.1)" }}>
                        <TrendingDown className="w-3 h-3" /> Vendre
                      </button>
                      <button onClick={() => handleDelete(inv.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add investment modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", bounce: 0.3 }}
              className="relative z-10 w-full max-w-[440px] rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.98)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-[16px] font-bold text-gray-900 mb-5">Nouvel actif 📈</h2>
              <div className="space-y-3">
                {/* Category pills */}
                <div className="flex gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: category === cat ? `${CAT_COLORS[cat]}15` : "rgba(0,0,0,0.04)",
                        border: category === cat ? `1.5px solid ${CAT_COLORS[cat]}40` : "1.5px solid transparent",
                        color: category === cat ? CAT_COLORS[cat] : "#9CA3AF",
                      }}>
                      {CAT_EMOJIS[cat]} {CAT_LABELS[cat]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Nom *</label>
                    <input autoFocus type="text" placeholder="Apple Inc." value={name} onChange={e => setName(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Ticker (opt.)</label>
                    <input type="text" placeholder="AAPL" value={ticker} onChange={e => setTicker(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Quantité *</label>
                    <input type="number" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value)} step="any"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Prix achat (€) *</label>
                    <input type="number" placeholder="182.50" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} step="any"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                </div>
                {quantity && buyPrice && (
                  <div className="px-3 py-2 rounded-xl text-[12px] font-semibold text-blue-600"
                    style={{ background: "rgba(91,156,246,0.08)" }}>
                    Total investi : {fmt(parseFloat(quantity || "0") * parseFloat(buyPrice || "0"))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddInvestment} disabled={!name || !quantity || !buyPrice || saving}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)" }}>
                    {saving ? "Ajout…" : "Ajouter au portefeuille"}
                  </button>
                  <button onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:bg-black/5">
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction modal */}
      <AnimatePresence>
        {showTxModal && selectedInv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTxModal(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", bounce: 0.3 }}
              className="relative z-10 w-full max-w-[360px] rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.98)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-[16px] font-bold text-gray-900 mb-1">
                {selectedInv.name}
              </h2>
              <p className="text-[12px] text-gray-400 mb-5">Nouvelle transaction</p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["buy", "sell"] as const).map(t => (
                    <button key={t} onClick={() => setTxType(t)}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: txType === t ? (t === "buy" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)") : "rgba(0,0,0,0.04)",
                        border: txType === t ? `1.5px solid ${t === "buy" ? "#34D399" : "#F87171"}40` : "1.5px solid transparent",
                        color: txType === t ? (t === "buy" ? "#34D399" : "#F87171") : "#9CA3AF",
                      }}>
                      {t === "buy" ? "📈 Acheter" : "📉 Vendre"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Quantité</label>
                    <input autoFocus type="number" placeholder="5" value={txQty} onChange={e => setTxQty(e.target.value)} step="any"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Prix unitaire (€)</label>
                    <input type="number" placeholder={String(selectedInv.current_price || "")} value={txPrice}
                      onChange={e => setTxPrice(e.target.value)} step="any"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                </div>
                {txQty && txPrice && (
                  <div className="px-3 py-2 rounded-xl text-[12px] font-semibold"
                    style={{
                      background: txType === "buy" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                      color: txType === "buy" ? "#34D399" : "#F87171",
                    }}>
                    {txType === "buy" ? "Montant investi" : "Montant récupéré"} : {fmt(parseFloat(txQty) * parseFloat(txPrice))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddTransaction} disabled={!txQty || !txPrice || saving}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                    style={{
                      background: txType === "buy"
                        ? "linear-gradient(135deg, #34D399, #10B981)"
                        : "linear-gradient(135deg, #F87171, #EF4444)",
                    }}>
                    {saving ? "…" : txType === "buy" ? "Confirmer l'achat" : "Confirmer la vente"}
                  </button>
                  <button onClick={() => setShowTxModal(false)}
                    className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:bg-black/5">
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
