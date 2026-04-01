"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayPoints, getMonthPoints, getStreakData, addPoints, deletePoints } from "@/lib/actions/points";
import type { PointRecord } from "@/lib/types";
import { DEFAULT_POINTS_CONFIG } from "@/lib/types";
import { toast } from "sonner";
import { Flame, Zap, Trophy, TrendingUp, Trash2, Tv } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/contexts/SettingsContext";
import WeeklyWrapped, { type WeeklyStats } from "./WeeklyWrapped";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

const DAILY_GOAL = 100;

const BASE_ACTIONS: Record<string, { label: string; emoji: string }> = {
  seance_validee:    { label: "Séance validée", emoji: "🏋️" },
  objectif_eau:      { label: "Objectif eau atteint", emoji: "💧" },
  repas_sain:        { label: "Repas enregistré", emoji: "🥗" },
  supplement_check:  { label: "Supplément pris", emoji: "💊" },
  uber_eats:         { label: "Uber Eats / Junk food", emoji: "🍔" },
  seance_manquee:    { label: "Séance manquée", emoji: "😴" },
  alcool:            { label: "Alcool", emoji: "🍺" },
};

export default function ScorePage() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayRecords, setTodayRecords] = useState<PointRecord[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [streak, setStreak] = useState({
    currentStreak: 0,
    bestStreak: 0,
    successRate: 0,
    last30Days: [] as { date: string; points: number; success: boolean }[],
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedStats, setWrappedStats] = useState<WeeklyStats | null>(null);

  // Dynamic config: user overrides + custom bad habits
  const effectiveConfig = { ...DEFAULT_POINTS_CONFIG, ...(settings.custom_points_config || {}) };
  const customBadHabits = settings.custom_bad_habits || [];

  const actionLabels: Record<string, { label: string; emoji: string; points: number }> = {};
  for (const [key, base] of Object.entries(BASE_ACTIONS)) {
    actionLabels[key] = { ...base, points: effectiveConfig[key] ?? 0 };
  }
  for (const habit of customBadHabits) {
    actionLabels[habit.id] = { label: habit.label, emoji: habit.emoji, points: habit.points };
  }

  const loadToday = useCallback(async () => {
    const today = await getTodayPoints();
    setTodayTotal(today.total);
    setTodayRecords(today.records);
  }, []);

  const load = async () => {
    setLoading(true);
    const [today, month, streakData] = await Promise.all([
      getTodayPoints(),
      getMonthPoints(),
      getStreakData(DAILY_GOAL),
    ]);
    setTodayTotal(today.total);
    setTodayRecords(today.records);
    setMonthTotal(month);
    setStreak(streakData);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Weekly Wrapped — show on Sundays after 18:00 (once per week)
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const isEvening = now.getHours() >= 18;
    if (isSunday && isEvening) {
      const weekKey = `wrapped_${now.toISOString().slice(0, 10)}`;
      if (!localStorage.getItem(weekKey)) {
        localStorage.setItem(weekKey, "1");
        // Build wrapped stats from streak data (computed after load)
        setTimeout(async () => {
          const [today, month, streakData] = await Promise.all([
            getTodayPoints(),
            getMonthPoints(),
            getStreakData(DAILY_GOAL),
          ]);
          const weekPts = streakData.last30Days.slice(0, 7).reduce((a, d) => a + d.points, 0);
          const bestDayObj = streakData.last30Days.slice(0, 7).reduce(
            (best, d) => d.points > best.points ? d : best,
            { date: now.toISOString().split("T")[0], points: 0 }
          );
          const successDays = streakData.last30Days.slice(0, 7).filter(d => d.success).length;
          setWrappedStats({
            totalPoints: weekPts,
            bestDay: bestDayObj,
            workouts: 0, // would need sport_sessions query
            successRate: Math.round((successDays / 7) * 100),
            streak: streakData.currentStreak,
            waterDays: 0,
          });
          setShowWrapped(true);
        }, 1200);
      }
    }
  }, []);

  // Realtime — sync score quand points ajoutés depuis d'autres pages (Nutrition, Sport…)
  useEffect(() => {
    const channel = supabase
      .channel("score-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "points_history" }, () => {
        loadToday();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadToday]);

  const handleManualAction = async (action: string) => {
    const conf = actionLabels[action];
    if (!conf) return;
    const rec = await addPoints(action, conf.label, conf.points);
    setTodayTotal((prev) => prev + conf.points);
    setTodayRecords((prev) => [rec, ...prev]);
    if (conf.points > 0) toast.success(`${conf.emoji} ${conf.label} — +${conf.points} pts`);
    else toast.error(`${conf.emoji} ${conf.label} — ${conf.points} pts`);
  };

  const handleDelete = async (rec: PointRecord) => {
    setDeletingId(rec.id);
    try {
      await deletePoints(rec.id);
      setTodayRecords((prev) => prev.filter((r) => r.id !== rec.id));
      setTodayTotal((prev) => prev - rec.points);
      toast.success("Action retirée du journal");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const scorePct = Math.min((todayTotal / DAILY_GOAL) * 100, 100);
  const scoreColor = scorePct >= 100 ? "#34D399" : scorePct >= 60 ? "#5B9CF6" : "#FB923C";

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Weekly Wrapped modal */}
      <AnimatePresence>
        {showWrapped && wrappedStats && (
          <WeeklyWrapped stats={wrappedStats} onClose={() => setShowWrapped(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Gamification</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Score LockIn ⚡</h1>
        </div>
        <button onClick={() => {
          const now = new Date();
          const weekPts = streak.last30Days.slice(0, 7).reduce((a, d) => a + d.points, 0);
          const bestDay = streak.last30Days.slice(0, 7).reduce(
            (best, d) => d.points > best.points ? d : best,
            { date: now.toISOString().split("T")[0], points: 0 }
          );
          setWrappedStats({
            totalPoints: weekPts,
            bestDay,
            workouts: 0,
            successRate: Math.round((streak.last30Days.slice(0, 7).filter(d => d.success).length / 7) * 100),
            streak: streak.currentStreak,
            waterDays: 0,
          });
          setShowWrapped(true);
        }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
          <Tv className="w-3.5 h-3.5" /> Weekly Wrapped
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { icon: Zap, label: "Score du jour", value: `${todayTotal} pts`, sub: `Objectif: ${DAILY_GOAL} pts`, color: scoreColor },
          { icon: Flame, label: "Série actuelle", value: `${streak.currentStreak} j`, sub: streak.currentStreak > 0 ? "🔥 Continue !" : "Commence aujourd'hui", color: "#F59E0B" },
          { icon: Trophy, label: "Meilleure série", value: `${streak.bestStreak} j`, sub: "30 derniers jours", color: "#A78BFA" },
          { icon: TrendingUp, label: "Taux de réussite", value: `${streak.successRate}%`, sub: "30 derniers jours", color: "#34D399" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${kpi.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <p className="text-[22px] font-semibold text-gray-900 leading-none">{kpi.value}</p>
              <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: kpi.color }}>{kpi.sub}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        {/* Today's score — ring */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full flex flex-col items-center justify-center py-6">
            <div className="relative mb-4" style={{ width: 180, height: 180 }}>
              <svg width={180} height={180} className="-rotate-90">
                <circle cx={90} cy={90} r={72} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={14} />
                <motion.circle cx={90} cy={90} r={72} fill="none" stroke={scoreColor} strokeWidth={14} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 72}
                  initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - scorePct / 100) }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                  style={{ filter: `drop-shadow(0 0 10px ${scoreColor}60)` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[32px] font-bold" style={{ color: scoreColor }}>{todayTotal}</p>
                <p className="text-[13px] text-gray-400">/ {DAILY_GOAL} pts</p>
                {streak.currentStreak > 0 && (
                  <p className="text-[13px] font-semibold mt-1">🔥 {streak.currentStreak}j</p>
                )}
              </div>
            </div>
            {scorePct >= 100 ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}>
                ✅ Journée Complète !
              </motion.div>
            ) : (
              <p className="text-[12px] text-gray-400">{DAILY_GOAL - todayTotal} pts pour compléter</p>
            )}
          </div>
        </motion.div>

        {/* 30-day calendar */}
        <motion.div variants={item} className="col-span-5">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">30 derniers jours</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {streak.last30Days.map((day, i) => {
                const date = new Date(day.date);
                const dayLabel = date.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 1).toUpperCase();
                const dayNum = date.getDate();
                const isToday = day.date === new Date().toISOString().split("T")[0];
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    {i < 7 && <p className="text-[9px] text-gray-300">{dayLabel}</p>}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.015 }}
                      title={`${day.date}: ${day.points} pts`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium"
                      style={{
                        background: day.success ? `${scoreColor}25` : "rgba(0,0,0,0.04)",
                        border: isToday ? `2px solid ${scoreColor}` : day.success ? `1px solid ${scoreColor}40` : "1px solid transparent",
                        color: day.success ? scoreColor : "#9CA3AF",
                      }}>
                      {day.success ? "🔥" : dayNum}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Manual actions */}
        <motion.div variants={item} className="col-span-3">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Actions manuelles</h2>
            <div className="space-y-1.5">
              {Object.entries(actionLabels).map(([action, conf]) => (
                <motion.button key={action} onClick={() => handleManualAction(action)}
                  whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-black/3">
                  <span className="text-lg">{conf.emoji}</span>
                  <span className="flex-1 text-[12px] text-gray-700 font-medium">{conf.label}</span>
                  <span className="text-[12px] font-semibold"
                    style={{ color: conf.points > 0 ? "#34D399" : "#F87171" }}>
                    {conf.points > 0 ? "+" : ""}{conf.points}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Today's log — with delete */}
        <motion.div variants={item} className="col-span-12">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Journal du jour</h2>
              <span className="text-[12px] text-gray-400">{todayTotal} pts total · {todayRecords.length} action{todayRecords.length !== 1 ? "s" : ""}</span>
            </div>
            {todayRecords.length === 0 ? (
              <p className="text-[13px] text-gray-400 py-4 text-center">Aucune action aujourd'hui — commence ta journée !</p>
            ) : (
              <div className="space-y-1">
                {todayRecords.map((rec, i) => {
                  const display = actionLabels[rec.action];
                  return (
                    <motion.div key={rec.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/3 transition-colors">
                      <span className="text-[18px]">{display?.emoji || "⚡"}</span>
                      <span className="flex-1 text-[13px] text-gray-700">{rec.label}</span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(rec.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[13px] font-semibold w-14 text-right"
                        style={{ color: rec.points > 0 ? "#34D399" : "#F87171" }}>
                        {rec.points > 0 ? "+" : ""}{rec.points} pts
                      </span>
                      <motion.button
                        onClick={() => handleDelete(rec)}
                        disabled={deletingId === rec.id}
                        whileTap={{ scale: 0.9 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Month total info */}
      <motion.div variants={item} className="flex justify-end">
        <p className="text-[12px] text-gray-400">Total du mois : <span className="font-semibold text-gray-600">{monthTotal} pts</span></p>
      </motion.div>
    </motion.div>
  );
}
