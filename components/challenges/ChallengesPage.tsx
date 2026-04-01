"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getChallenges, updateChallengeProgress, manualCompleteChallenge } from "@/lib/actions/challenges";
import type { Challenge } from "@/lib/types";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now); monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const daysLeft = Math.ceil((sunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { label: `${fmt(monday)} – ${fmt(sunday)}`, daysLeft };
}

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<Challenge[]>([]);
  const [easterEggs, setEasterEggs] = useState<Challenge[]>([]);
  const { label: weekLabel, daysLeft } = getWeekBounds();

  useEffect(() => {
    getChallenges().then((data) => {
      setWeekly(data.weekly);
      setEasterEggs(data.easterEggs);
      setLoading(false);
    });
  }, []);

  const handleProgress = async (challenge: Challenge) => {
    if (challenge.completed) return;
    const newCurrent = Math.min(challenge.current + 1, challenge.target);
    const completed = newCurrent >= challenge.target;
    setWeekly((prev) => prev.map((c) => c.id === challenge.id ? { ...c, current: newCurrent, completed } : c));
    await updateChallengeProgress(challenge.id, 1);
    if (completed) toast.success(`🎯 Défi complété — +${challenge.points_reward} pts !`);
  };

  const handleUnlock = async (egg: Challenge) => {
    if (egg.completed) return;
    await manualCompleteChallenge(egg.id);
    setEasterEggs((prev) => prev.map((e) => e.id === egg.id ? { ...e, completed: true, current: e.target } : e));
    toast.success(`🥚 Easter Egg débloqué — +${egg.points_reward} pts !`);
  };

  const completedWeekly = weekly.filter((c) => c.completed).length;
  const weeklyPts = weekly.filter((c) => c.completed).reduce((s, c) => s + c.points_reward, 0);
  const eggPts = easterEggs.filter((c) => c.completed).reduce((s, c) => s + c.points_reward, 0);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-44 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Gamification</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Défis & Quêtes 🎯</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-sm rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] text-gray-400">Points quêtes</p>
            <p className="text-[16px] font-bold text-amber-600">+{weeklyPts + eggPts} pts</p>
          </div>
        </div>
      </motion.div>

      {/* Week banner */}
      <motion.div variants={itemAnim}
        className="flex items-center gap-4 px-5 py-4 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(91,156,246,0.1), rgba(167,139,250,0.07))", border: "1px solid rgba(91,156,246,0.2)" }}>
        <span className="text-[28px]">📅</span>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-gray-800">Semaine du {weekLabel}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {daysLeft <= 0 ? "Dernier jour !" : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
            {" · "}
            {completedWeekly}/{weekly.length} défis complétés
          </p>
        </div>
        <div className="text-right">
          <div className="h-2 w-28 bg-black/8 rounded-full overflow-hidden mb-1">
            <motion.div className="h-full rounded-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${weekly.length > 0 ? (completedWeekly / weekly.length) * 100 : 0}%` }}
              transition={{ duration: 0.8 }} />
          </div>
          <p className="text-[10px] text-gray-400">
            {weekly.length > 0 ? Math.round((completedWeekly / weekly.length) * 100) : 0}% accompli
          </p>
        </div>
      </motion.div>

      {/* Weekly challenges */}
      <motion.div variants={itemAnim}>
        <h2 className="text-[14px] font-semibold text-gray-700 mb-3">⚡ Quêtes de la semaine</h2>
        <div className="grid grid-cols-3 gap-4">
          {weekly.map((ch) => {
            const pct = Math.min((ch.current / ch.target) * 100, 100);
            const color = ch.completed ? "#34D399" : "#5B9CF6";
            return (
              <motion.div key={ch.id}
                whileHover={!ch.completed ? { y: -3, transition: { duration: 0.2 } } : {}}
                className="card relative overflow-hidden"
                style={{ border: ch.completed ? "1.5px solid rgba(52,211,153,0.3)" : undefined }}>
                {ch.completed && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                    <span className="text-white text-[12px]">✓</span>
                  </div>
                )}
                <span className="text-[32px] mb-3 block">{ch.emoji}</span>
                <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{ch.title}</p>
                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">{ch.description}</p>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{ch.current} / {ch.target}</span>
                    <span className="text-[10px] font-semibold" style={{ color }}>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 bg-black/6 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      style={{ background: color }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-600">+{ch.points_reward} pts</span>
                  {!ch.completed && (
                    <button onClick={() => handleProgress(ch)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-all"
                      style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)" }}>
                      +1 progrès
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Easter eggs */}
      <motion.div variants={itemAnim}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-gray-700">🥚 Défis cachés</h2>
          <p className="text-[12px] text-gray-400">
            {easterEggs.filter((e) => e.completed).length}/{easterEggs.length} débloqués
          </p>
        </div>
        <p className="text-[12px] text-gray-400 mb-4">Adopte de bonnes habitudes pour débloquer des récompenses secrètes.</p>
        <div className="grid grid-cols-5 gap-3">
          {easterEggs.map((egg) => (
            <motion.div key={egg.id}
              whileHover={{ y: -2 }}
              onClick={() => !egg.completed && handleUnlock(egg)}
              className="card text-center cursor-pointer relative overflow-hidden"
              style={{
                border: egg.completed ? "1.5px solid rgba(52,211,153,0.3)" : "1px solid rgba(0,0,0,0.06)",
                background: egg.completed ? "rgba(52,211,153,0.05)" : undefined,
              }}>
              <div className={`text-[32px] mb-2 transition-all ${!egg.completed ? "grayscale opacity-50" : ""}`}>
                {egg.emoji}
              </div>
              <p className={`text-[11px] font-semibold ${egg.completed ? "text-gray-800" : "text-gray-400"}`}>
                {egg.completed ? egg.title : "???"}
              </p>
              {egg.completed ? (
                <>
                  <p className="text-[9px] text-gray-400 mt-1 leading-tight">{egg.description}</p>
                  <span className="text-[11px] font-bold text-green-600 mt-1.5 block">+{egg.points_reward} ✓</span>
                </>
              ) : (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-300">Caché</p>
                  <p className="text-[10px] text-amber-500 font-semibold mt-0.5">+{egg.points_reward} pts</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
