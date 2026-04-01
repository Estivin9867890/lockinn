"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

export interface WeeklyStats {
  totalPoints: number;
  bestDay: { date: string; points: number };
  workouts: number;
  successRate: number;
  streak: number;
  waterDays: number;
}

interface Props {
  stats: WeeklyStats;
  onClose: () => void;
}

const SLIDES = ["intro", "points", "bestDay", "workouts", "streak", "recap"] as const;
type Slide = typeof SLIDES[number];

export default function WeeklyWrapped({ stats, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const current = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const fmtDay = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    } catch { return d; }
  };

  const slideData: Record<Slide, { bg: string; node: React.ReactNode }> = {
    intro: {
      bg: "linear-gradient(160deg, #0A0A1A 0%, #1A0A2E 50%, #0A1A2E 100%)",
      node: (
        <div className="text-center text-white space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className="text-[72px]">⚡</motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-[28px] font-black tracking-tight">LockIn</p>
            <p className="text-[15px] font-semibold opacity-50 mt-1">Weekly Wrapped</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-[13px] opacity-40">
            Semaine du {new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1))
              .toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </motion.div>
        </div>
      ),
    },
    points: {
      bg: "linear-gradient(160deg, #1E3A8A 0%, #3730A3 50%, #5B21B6 100%)",
      node: (
        <div className="text-center text-white">
          <p className="text-[13px] font-semibold opacity-50 uppercase tracking-widest mb-4">Points totaux</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
            className="text-[88px] font-black leading-none tabular-nums"
          >{stats.totalPoints}</motion.p>
          <p className="text-[18px] font-semibold opacity-70 mt-2">points LockIn</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-6 inline-block px-4 py-2 rounded-full text-[13px] font-bold"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            {stats.totalPoints >= 700 ? "🏆 Semaine légendaire !" :
              stats.totalPoints >= 400 ? "🔥 Excellente semaine !" :
              stats.totalPoints >= 200 ? "⚡ Bonne semaine !" :
              "💪 La semaine prochaine sera meilleure"}
          </motion.div>
        </div>
      ),
    },
    bestDay: {
      bg: "linear-gradient(160deg, #92400E 0%, #B45309 50%, #D97706 100%)",
      node: (
        <div className="text-center text-white">
          <p className="text-[13px] font-semibold opacity-50 uppercase tracking-widest mb-4">Meilleur jour</p>
          <div className="text-[48px] mb-3">🔥</div>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-[18px] font-bold capitalize opacity-80"
          >{fmtDay(stats.bestDay.date)}</motion.p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4, delay: 0.3 }}
            className="text-[72px] font-black leading-none tabular-nums mt-2"
          >{stats.bestDay.points}</motion.p>
          <p className="text-[16px] opacity-60 mt-1">points en une journée</p>
        </div>
      ),
    },
    workouts: {
      bg: "linear-gradient(160deg, #064E3B 0%, #065F46 50%, #047857 100%)",
      node: (
        <div className="text-center text-white">
          <p className="text-[13px] font-semibold opacity-50 uppercase tracking-widest mb-4">Séances sport</p>
          <div className="text-[48px] mb-3">🏋️</div>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
            className="text-[80px] font-black leading-none"
          >{stats.workouts}</motion.p>
          <p className="text-[18px] opacity-70 mt-2">
            séance{stats.workouts !== 1 ? "s" : ""} validée{stats.workouts !== 1 ? "s" : ""}
          </p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-6 text-[13px] opacity-60">
            {stats.workouts >= 5 ? "Machine absolue 💪" :
              stats.workouts >= 3 ? "Bel investissement dans ta santé 🎯" :
              stats.workouts === 0 ? "On repart à fond la semaine prochaine 🚀" :
              "Chaque séance compte 🔥"}
          </motion.div>
        </div>
      ),
    },
    streak: {
      bg: "linear-gradient(160deg, #7C1D6F 0%, #9D174D 50%, #BE185D 100%)",
      node: (
        <div className="text-center text-white">
          <p className="text-[13px] font-semibold opacity-50 uppercase tracking-widest mb-4">Série en cours</p>
          <div className="text-[48px] mb-3">🔥</div>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
            className="text-[80px] font-black leading-none"
          >{stats.streak}</motion.p>
          <p className="text-[18px] opacity-70 mt-2">
            jour{stats.streak !== 1 ? "s" : ""} de suite
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {Array.from({ length: Math.min(stats.streak, 7) }).map((_, i) => (
              <motion.div key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.4 + i * 0.06 }}
                className="w-3 h-3 rounded-full bg-white/60" />
            ))}
          </div>
          <p className="text-[12px] opacity-40 mt-3">Règle des 33h active — continue !</p>
        </div>
      ),
    },
    recap: {
      bg: "linear-gradient(160deg, #0F0F1A 0%, #1A1A2E 100%)",
      node: (
        <div className="text-center text-white space-y-5 w-full">
          <p className="text-[13px] font-semibold opacity-40 uppercase tracking-widest">Récap de la semaine</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Points", value: stats.totalPoints, icon: "⚡" },
              { label: "Séances", value: stats.workouts, icon: "🏋️" },
              { label: "Série", value: `${stats.streak}🔥`, icon: "" },
              { label: "Succès", value: `${stats.successRate}%`, icon: "🎯" },
            ].map(({ label, value, icon }) => (
              <motion.div key={label}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.3, delay: 0.1 }}
                className="rounded-2xl p-4 text-left"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] opacity-40 uppercase tracking-wide">{label}</p>
                <p className="text-[26px] font-black mt-1 tabular-nums">{icon} {value}</p>
              </motion.div>
            ))}
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-[12px] opacity-30 pt-2">
            Prêt à dominer la semaine prochaine ? 🚀
          </motion.p>
        </div>
      ),
    },
  };

  const { bg, node } = slideData[current];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 40 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="relative z-10 w-full max-w-[360px] rounded-3xl overflow-hidden"
        style={{ height: "min(640px, 85vh)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
            style={{ background: bg }}
          >
            {node}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="absolute top-5 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {SLIDES.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === idx ? 22 : 5, opacity: i <= idx ? 1 : 0.3 }}
              className="h-1 rounded-full bg-white" />
          ))}
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.25)" }}>
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Next / Finish */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          {idx > 0 && (
            <button onClick={() => setIdx(i => i - 1)}
              className="px-4 py-2.5 rounded-full text-[12px] font-semibold text-white/50"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              ← Retour
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setIdx(i => i + 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold text-white"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}>
            {isLast ? "Terminer" : "Suivant"}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
