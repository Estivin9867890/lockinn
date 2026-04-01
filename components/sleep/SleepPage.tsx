"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Plus, Trash2, TrendingUp } from "lucide-react";
import { getSleepLogs, addSleepLog, deleteSleepLog } from "@/lib/actions/sleep";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import type { SleepLog } from "@/lib/types";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

const QUALITY_LABELS = ["", "😵 Nul", "😴 Très mauvais", "😩 Mauvais", "😪 Médiocre",
  "😐 Passable", "🙂 Correct", "😊 Bien", "😌 Très bien", "🤩 Excellent", "⚡ Parfait"];

// ─── Circular Sleep Clock (SVG) ───────────────────────────────────────────────

function SleepClock({ bedtime, wakeTime }: { bedtime: string; wakeTime: string }) {
  const CX = 120; const CY = 120; const R = 88; const SW = 20;

  const toAngle = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return ((h * 60 + m) / (24 * 60)) * 360 - 90;
  };

  const toXY = (angleDeg: number, r = R) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };

  const bedAngle = toAngle(bedtime);
  const wakeAngle = toAngle(wakeTime);

  let sweep = wakeAngle - bedAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  const { x: x1, y: y1 } = toXY(bedAngle);
  const { x: x2, y: y2 } = toXY(wakeAngle);

  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  const totalMins = wakeMins - bedMins;
  const dh = Math.floor(totalMins / 60);
  const dm = totalMins % 60;

  return (
    <div className="flex flex-col items-center">
      <svg width={240} height={240} viewBox="0 0 240 240">
        <defs>
          <linearGradient id="sleepArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B9CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(0,0,0,0.06)" strokeWidth={SW} />

        {/* Hour ticks */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = (h / 24) * 360 - 90;
          const inner = toXY(a, R - SW / 2 - 4);
          const outer = toXY(a, R - SW / 2 - (h % 6 === 0 ? 12 : 7));
          return (
            <line key={h}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={h % 6 === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.06)"}
              strokeWidth={h % 6 === 0 ? 2 : 1} />
          );
        })}

        {/* Hour labels */}
        {[0, 6, 12, 18].map(h => {
          const { x, y } = toXY((h / 24) * 360 - 90, R + 18);
          return (
            <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill="#9CA3AF" fontWeight="600">
              {h}h
            </text>
          );
        })}

        {/* Sleep arc */}
        {sweep > 0 && (
          <path
            d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke="url(#sleepArcGrad)"
            strokeWidth={SW}
            strokeLinecap="round"
          />
        )}

        {/* Bedtime dot */}
        <circle cx={x1} cy={y1} r={9} fill="#5B9CF6" stroke="white" strokeWidth={3} />
        <text x={x1} y={y1} textAnchor="middle" dominantBaseline="middle" fontSize="8">🌙</text>

        {/* Wake dot */}
        <circle cx={x2} cy={y2} r={9} fill="#FBBF24" stroke="white" strokeWidth={3} />
        <text x={x2} y={y2} textAnchor="middle" dominantBaseline="middle" fontSize="8">☀️</text>

        {/* Center */}
        <text x={CX} y={CY - 10} textAnchor="middle" fontSize="26" fontWeight="800" fill="#111827">
          {dh}h{dm > 0 ? String(dm).padStart(2, "0") : ""}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="11" fill="#6B7280">
          de sommeil
        </text>
      </svg>

      <div className="flex items-center gap-4 text-[12px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span>Coucher {bedtime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>Réveil {wakeTime}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#34D399" : score >= 60 ? "#5B9CF6" : score >= 40 ? "#FB923C" : "#F87171";

  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <svg width={96} height={96} viewBox="0 0 96 96" className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8} />
        <motion.circle cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${(circ * score) / 100} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${(circ * score) / 100} ${circ}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-400 font-medium">/100</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SleepPage() {
  const { settings } = useSettings();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [bedtime, setBedtime] = useState(settings.sleep_target_time ?? "23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(7);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSleepLogs().then(data => { setLogs(data); setLoading(false); });
  }, []);

  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  const previewDuration = wakeMins - bedMins;
  const previewHours = (previewDuration / 60).toFixed(1);
  const goalHours = settings.sleep_goal_hours ?? 8;

  const previewScore = Math.round(
    Math.min((previewDuration / (goalHours * 60)) * 60, 60) + (quality / 10) * 40
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const log = await addSleepLog({ date, bedtime, wake_time: wakeTime, quality, notes, goal_hours: goalHours });
      setLogs(prev => [log, ...prev.filter(l => l.date !== log.date)]);
      setShowForm(false);
      setNotes("");
      toast.success(`😴 Sommeil enregistré — score ${log.score}/100`);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    await deleteSleepLog(id);
    toast.success("Supprimé");
  };

  const avgScore = logs.length > 0
    ? Math.round(logs.slice(0, 7).reduce((a, l) => a + l.score, 0) / Math.min(logs.length, 7))
    : 0;

  const avgDuration = logs.length > 0
    ? Math.round(logs.slice(0, 7).reduce((a, l) => a + l.duration_min, 0) / Math.min(logs.length, 7))
    : 0;

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Récupération & Bien-être</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Sommeil 😴</h1>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #5B9CF6, #A78BFA)", boxShadow: "0 4px 16px rgba(91,156,246,0.35)" }}>
          <Plus className="w-4 h-4" /> Logger le sommeil
        </motion.button>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        {[
          { label: "Score moy. 7j", value: `${avgScore}/100`, icon: "⚡", color: "#5B9CF6" },
          { label: "Durée moy. 7j", value: `${Math.floor(avgDuration / 60)}h${avgDuration % 60 > 0 ? String(avgDuration % 60).padStart(2, "0") : ""}`, icon: "⏱️", color: "#A78BFA" },
          { label: "Objectif", value: `${goalHours}h`, icon: "🎯", color: "#34D399" },
        ].map(s => (
          <div key={s.label} className="card text-center"
            style={{ background: `linear-gradient(135deg, ${s.color}10, ${s.color}04)` }}>
            <p className="text-[22px] mb-1">{s.icon}</p>
            <p className="text-[20px] font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Logger form */}
      <AnimatePresence>
        {showForm && (
          <motion.div variants={item}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(91,156,246,0.06), rgba(167,139,250,0.04))" }}>
            <h2 className="text-[15px] font-bold text-gray-900 mb-5">Enregistrer une nuit</h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Left: clock */}
              <SleepClock bedtime={bedtime} wakeTime={wakeTime} />

              {/* Right: inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                    style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Moon className="w-3 h-3" /> Coucher
                    </label>
                    <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(91,156,246,0.08)", border: "1px solid rgba(91,156,246,0.15)" }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Sun className="w-3 h-3" /> Réveil
                    </label>
                    <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                      style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }} />
                  </div>
                </div>

                {/* Quality slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Qualité ressentie</label>
                    <span className="text-[12px] font-bold text-gray-700">{QUALITY_LABELS[quality]}</span>
                  </div>
                  <input type="range" min={1} max={10} value={quality} onChange={e => setQuality(+e.target.value)}
                    className="w-full accent-blue-500 cursor-pointer" />
                  <div className="flex justify-between text-[9px] text-gray-300 mt-0.5">
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                </div>

                {/* Preview score */}
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.04)" }}>
                  <ScoreRing score={previewScore} />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">Score prévu</p>
                    <p className="text-[11px] text-gray-400">{previewHours}h · qualité {quality}/10</p>
                    {previewScore >= 80 && <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">+20 pts ⚡</p>}
                    {previewScore >= 60 && previewScore < 80 && <p className="text-[11px] text-blue-500 font-semibold mt-0.5">+10 pts ⚡</p>}
                  </div>
                </div>

                <textarea placeholder="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-gray-700 outline-none resize-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }} />

                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #5B9CF6, #A78BFA)", boxShadow: "0 4px 16px rgba(91,156,246,0.3)" }}>
                    {saving ? "Enregistrement..." : "Enregistrer la nuit"}
                  </motion.button>
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:bg-black/5 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <motion.div variants={item} className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-gray-800">Historique</h3>
          <TrendingUp className="w-4 h-4 text-gray-400" />
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-[40px]">😴</span>
            <p className="text-[14px] font-semibold text-gray-600 mt-3">Aucune nuit enregistrée</p>
            <p className="text-[12px] text-gray-400 mt-1">Commence à tracker ton sommeil</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const dh = Math.floor(log.duration_min / 60);
              const dm = log.duration_min % 60;
              const color = log.score >= 80 ? "#34D399" : log.score >= 60 ? "#5B9CF6" : log.score >= 40 ? "#FB923C" : "#F87171";
              const date = new Date(log.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
              return (
                <motion.div key={log.id} layout
                  className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-black/3 transition-colors">
                  <ScoreRing score={log.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-gray-800 capitalize">{date}</p>
                      {log.score >= 80 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-emerald-600" style={{ background: "rgba(52,211,153,0.12)" }}>TOP</span>}
                    </div>
                    <p className="text-[12px] text-gray-500">
                      🌙 {log.bedtime} → ☀️ {log.wake_time} · {dh}h{dm > 0 ? String(dm).padStart(2, "0") : "00"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${log.score}%`, background: color }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{QUALITY_LABELS[log.quality]}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(log.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
