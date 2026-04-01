"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pin, Clock, Check, Calendar } from "lucide-react";
import { getMemos, addMemo, deleteMemo, toggleMemo, togglePinMemo } from "@/lib/actions/memos";
import type { Memo } from "@/lib/types";
import { toast } from "sonner";

const MEMO_COLORS = ["#FEFCE8", "#F0FDF4", "#EFF6FF", "#FAF5FF", "#FFF7ED", "#FFF1F2"];
const COLOR_LABELS = ["Jaune", "Vert", "Bleu", "Violet", "Orange", "Rose"];

function detectIcon(content: string): string {
  const t = content.toLowerCase();
  if (/appel|téléphone|call|phone/.test(t)) return "📞";
  if (/course|achat|acheter|supermarché|marché/.test(t)) return "🛒";
  if (/sport|gym|entraîn|muscul|run|courir/.test(t)) return "🏋️";
  if (/repas|manger|déjeuner|dîner|restau/.test(t)) return "🍽️";
  if (/réunion|meeting|rdv|entretien/.test(t)) return "🤝";
  if (/lire|livre|lecture/.test(t)) return "📚";
  if (/film|série|cinéma/.test(t)) return "🎬";
  if (/musique|écouter|spotify/.test(t)) return "🎵";
  if (/voyage|avion|vacances/.test(t)) return "✈️";
  if (/médite|yoga|respir/.test(t)) return "🧘";
  if (/idée|créer|construire/.test(t)) return "💡";
  if (/argent|payer|facture/.test(t)) return "💰";
  if (/médecin|docteur|santé/.test(t)) return "🏥";
  if (/code|dev|programme/.test(t)) return "💻";
  if (/email|mail|envoyer/.test(t)) return "📧";
  return "📝";
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemAnim = { hidden: { opacity: 0, scale: 0.92, y: 12 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, bounce: 0.35 } } };

export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(MEMO_COLORS[0]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getMemos().then((data) => { setMemos(data); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setPending(true);
    try {
      const icon = detectIcon(content);
      const scheduled_at = scheduleDate
        ? `${scheduleDate}T${scheduleTime || "09:00"}:00`
        : null;
      const memo = await addMemo({ content: content.trim(), icon, color: selectedColor, scheduled_at });
      setMemos((prev) => [memo, ...prev]);
      if (scheduled_at) toast.success("📅 Mémo ajouté au calendrier !");
      else toast.success("📝 Mémo créé !");
      setContent(""); setScheduleDate(""); setScheduleTime("");
      setSelectedColor(MEMO_COLORS[0]); setModalOpen(false);
    } catch { toast.error("Erreur lors de la création"); }
    setPending(false);
  };

  const handleDelete = async (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
    await deleteMemo(id);
    toast.success("Mémo supprimé");
  };

  const handleToggle = async (memo: Memo) => {
    setMemos((prev) => prev.map((m) => m.id === memo.id ? { ...m, completed: !m.completed } : m));
    await toggleMemo(memo.id, !memo.completed);
  };

  const handlePin = async (memo: Memo) => {
    const newPin = !memo.pinned;
    setMemos((prev) =>
      prev.map((m) => m.id === memo.id ? { ...m, pinned: newPin } : m)
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    );
    await togglePinMemo(memo.id, newPin);
  };

  const previewIcon = detectIcon(content);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-32 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Organisation</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Mémo 📝</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{memos.length} mémo{memos.length !== 1 ? "s" : ""} · {memos.filter((m) => m.pinned).length} épinglé{memos.filter((m) => m.pinned).length !== 1 ? "s" : ""}</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)", boxShadow: "0 4px 16px rgba(167,139,250,0.4)" }}>
          <Plus className="w-4 h-4" /> Nouveau mémo
        </motion.button>
      </motion.div>

      {/* Memos grid */}
      {memos.length === 0 ? (
        <motion.div variants={itemAnim} className="flex flex-col items-center justify-center py-24">
          <p className="text-[56px] mb-4">📝</p>
          <p className="text-[16px] font-semibold text-gray-700">Aucun mémo</p>
          <p className="text-[13px] text-gray-400 mt-1">Capture tes idées avec le bouton ci-dessus</p>
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {memos.map((memo) => (
              <motion.div key={memo.id} layout variants={itemAnim}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                whileHover={{ y: -5, rotate: 0.4, transition: { duration: 0.2 } }}
                className="group relative flex flex-col gap-3 p-4 rounded-2xl"
                style={{
                  background: memo.color,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                  opacity: memo.completed ? 0.65 : 1,
                }}>
                {/* Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handlePin(memo); }}
                    className="w-6 h-6 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    title={memo.pinned ? "Désépingler" : "Épingler"}>
                    <Pin className={`w-3 h-3 ${memo.pinned ? "fill-current text-amber-500" : "text-gray-400"}`} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(memo.id); }}
                    className="w-6 h-6 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm">
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>

                {/* Pin indicator */}
                {memo.pinned && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                    <Pin className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                )}

                {/* Icon */}
                <span className="text-[30px] leading-none">{memo.icon}</span>

                {/* Content */}
                <p className={`text-[13px] font-medium text-gray-800 leading-relaxed flex-1 ${memo.completed ? "line-through opacity-50" : ""}`}>
                  {memo.content}
                </p>

                {/* Schedule badge */}
                {memo.scheduled_at && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/60 backdrop-blur-sm w-fit">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-semibold text-blue-600">
                      {new Date(memo.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(memo.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}

                {/* Done button */}
                <button onClick={(e) => { e.stopPropagation(); handleToggle(memo); }}
                  className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    memo.completed
                      ? "bg-green-500 text-white"
                      : "bg-white/60 backdrop-blur-sm text-gray-500 hover:bg-white/90"
                  }`}>
                  <Check className="w-3 h-3" />
                  {memo.completed ? "Fait !" : "Marquer fait"}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal création */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative z-10 w-full max-w-[400px]"
              onClick={(e) => e.stopPropagation()}>
              {/* Post-it preview */}
              <div className="rounded-3xl p-5 mb-3"
                style={{
                  background: selectedColor,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[36px]">{previewIcon}</span>
                  <button onClick={() => setModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-black/8 flex items-center justify-center hover:bg-black/15 transition-colors">
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
                <textarea
                  autoFocus
                  placeholder="Quoi noter ? (ex: Appeler grand-parents, Acheter riz…)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
                  rows={3}
                  className="w-full bg-transparent text-[14px] text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed font-medium"
                />
                {/* Color picker */}
                <div className="flex items-center gap-2 mt-4">
                  {MEMO_COLORS.map((color, i) => (
                    <button key={color} onClick={() => setSelectedColor(color)} title={COLOR_LABELS[i]}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: color,
                        borderColor: selectedColor === color ? "#374151" : "rgba(0,0,0,0.1)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      }} />
                  ))}
                </div>
              </div>

              {/* Smart Schedule */}
              <div className="rounded-2xl p-4 mb-3"
                style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(0,0,0,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <p className="text-[12px] font-semibold text-gray-700">Smart Schedule</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                    Auto → Calendrier
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="px-3 py-2 rounded-xl text-[12px] text-gray-700 outline-none"
                    style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)" }} />
                  <input type="time" value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="px-3 py-2 rounded-xl text-[12px] text-gray-700 outline-none"
                    style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)" }} />
                </div>
                {scheduleDate && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-purple-600 font-medium mt-2">
                    📅 Sera ajouté au calendrier le{" "}
                    {new Date(scheduleDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </motion.p>
                )}
              </div>

              <button disabled={!content.trim() || pending} onClick={handleAdd}
                className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)", boxShadow: "0 4px 20px rgba(167,139,250,0.4)" }}>
                {pending ? "Création…" : scheduleDate ? "📅 Créer + ajouter au calendrier" : "📝 Créer le mémo"}
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-2">⌘+Entrée pour valider rapidement</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
