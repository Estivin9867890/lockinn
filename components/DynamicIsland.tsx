"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PointNotif {
  id: string;
  label: string;
  points: number;
}

export default function DynamicIsland() {
  const [score, setScore] = useState(0);
  const [lockIn, setLockIn] = useState<{ title: string; end_at: string } | null>(null);
  const [timerSecs, setTimerSecs] = useState(0);
  const [notifs, setNotifs] = useState<PointNotif[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();
      const [pts, ev] = await Promise.all([
        supabase.from("points_history").select("points").eq("date", today),
        supabase.from("events").select("title,end_at").eq("type", "lockin")
          .lte("start_at", now).gte("end_at", now).limit(1),
      ]);
      const total = ((pts.data || []) as { points: number }[]).reduce((a, r) => a + r.points, 0);
      setScore(total);
      setLockIn((ev.data || [])[0] ?? null);
    };
    load();
  }, []);

  useEffect(() => {
    const ch = supabase.channel("dynamic-island")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "points_history" }, (p) => {
        const r = p.new as { points: number; label: string };
        setScore(s => s + r.points);
        const notif: PointNotif = { id: `${Date.now()}`, label: r.label, points: r.points };
        setNotifs(prev => [...prev.slice(-2), notif]);
        setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== notif.id)), 3500);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "points_history" }, (p) => {
        const r = p.old as { points: number };
        setScore(s => Math.max(0, s - (r.points || 0)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!lockIn) return;
    const tick = () => {
      const rem = Math.max(0, Math.floor((new Date(lockIn.end_at).getTime() - Date.now()) / 1000));
      setTimerSecs(rem);
      if (rem === 0) setLockIn(null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lockIn]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const pct = Math.min((score / 100) * 100, 100);
  const activeNotif = notifs[notifs.length - 1];
  const circumference = 2 * Math.PI * 8;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
      <motion.div
        layout
        className="pointer-events-auto cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        style={{
          background: "rgba(6,6,14,0.82)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
      >
        {/* Main pill content */}
        <AnimatePresence mode="wait">
          {activeNotif ? (
            <motion.div key={`n-${activeNotif.id}`}
              initial={{ opacity: 0, y: -8, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.88 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.35 }}
              className="flex items-center gap-2.5 px-5 py-2.5">
              <span className="text-[15px]">{activeNotif.points > 0 ? "⚡" : "⚠️"}</span>
              <span className="text-[12px] font-medium text-white/75 max-w-[140px] truncate">{activeNotif.label}</span>
              <span className={`text-[13px] font-bold tabular-nums ${activeNotif.points > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {activeNotif.points > 0 ? "+" : ""}{activeNotif.points} pts
              </span>
            </motion.div>
          ) : (
            <motion.div key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-5 py-2.5">
              {lockIn && (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                  <Lock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-[11px] text-white/55 font-medium max-w-[90px] truncate">{lockIn.title}</span>
                  <span className="text-[12px] font-mono font-bold text-blue-300 tabular-nums">{fmt(timerSecs)}</span>
                  <div className="w-px h-3.5 bg-white/10" />
                </>
              )}
              <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <span className="text-[14px] font-bold text-white tabular-nums">{score}</span>
              <span className="text-[10px] text-white/30 font-medium">pts</span>
              {/* Circular progress */}
              <div className="relative w-5 h-5 flex-shrink-0">
                <svg viewBox="0 0 20 20" className="w-full h-full -rotate-90">
                  <circle cx="10" cy="10" r="8" fill="none"
                    stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <motion.circle cx="10" cy="10" r="8" fill="none"
                    stroke={pct >= 100 ? "#34D399" : "#5B9CF6"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${(circumference * pct) / 100} ${circumference}` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="px-5 py-3 flex items-center gap-5">
                <div className="text-center">
                  <p className="text-[20px] font-black text-white tabular-nums">{score}</p>
                  <p className="text-[9px] text-white/35 uppercase tracking-widest">pts auj.</p>
                </div>
                <div className="w-px h-8 bg-white/8" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: pct >= 100 ? "#34D399" : "linear-gradient(90deg, #5B9CF6, #A78BFA)" }}
                    />
                  </div>
                  <p className="text-[9px] text-white/25">
                    {Math.round(pct)}% — objectif 100 pts{pct >= 100 ? " ✅" : ""}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
