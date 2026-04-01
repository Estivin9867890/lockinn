"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import type { SportSession, NutritionLog, WaterLog, FinanceTransaction, CalendarEvent } from "@/lib/types";

const TODAY = new Date().toISOString().split("T")[0];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, bounce: 0.3, duration: 0.5 } },
};

interface BentoModule {
  href: string;
  emoji: string;
  label: string;
  color: string;
  gradient: string;
  info: string;
  sub?: string;
  span?: "wide" | "normal";
}

export default function Dashboard() {
  const router = useRouter();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [water, setWater] = useState<WaterLog[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [focusEvent, setFocusEvent] = useState<CalendarEvent | null>(null);
  const [todayPoints, setTodayPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date().toISOString();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthStr = startOfMonth.toISOString().split("T")[0];

      const [s, m, w, t, focus, pts, nc, ec, mc] = await Promise.all([
        supabase.from("sport_sessions").select("*").order("date", { ascending: false }).limit(20),
        supabase.from("nutrition_logs").select("*").eq("date", TODAY),
        supabase.from("water_logs").select("*").eq("date", TODAY),
        supabase.from("finances_transactions").select("*").gte("date", monthStr),
        supabase.from("events").select("*").eq("type", "lockin").lte("start_at", now).gte("end_at", now).limit(1),
        supabase.from("points_history").select("points").eq("date", TODAY),
        supabase.from("notes").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true })
          .lte("start_at", new Date().toISOString()).gte("end_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from("media_vault").select("id", { count: "exact", head: true }).eq("status", "watching"),
      ]);

      setSessions(s.data || []);
      setMeals(m.data || []);
      setWater(w.data || []);
      setTransactions(t.data || []);
      setFocusEvent(focus.data?.[0] ?? null);
      setTodayPoints(((pts.data || []) as { points: number }[]).reduce((acc, r) => acc + r.points, 0));
      setNoteCount(nc.count ?? 0);
      setEventCount(ec.count ?? 0);
      setMediaCount(mc.count ?? 0);

      // Compute streak (last 30 days from points_history)
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: history } = await supabase
        .from("points_history")
        .select("date, points")
        .gte("date", since.toISOString().split("T")[0]);
      const byDate: Record<string, number> = {};
      for (const r of history || []) byDate[r.date] = (byDate[r.date] || 0) + r.points;
      let currentStreak = 0;
      const goal = 100;
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if ((byDate[dateStr] || 0) >= goal) currentStreak++;
        else break;
      }
      setStreak(currentStreak);
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const caloriesToday = meals.reduce((s, m) => s + m.calories, 0);
  const waterLiters = (water.reduce((s, w) => s + w.amount_ml, 0) / 1000).toFixed(1);
  const monthExpenses = transactions.reduce((s, t) => s + t.amount, 0);
  const thisMonthSessions = sessions.filter((s) => s.date?.startsWith(new Date().toISOString().slice(0, 7))).length;
  const lastSession = sessions[0];
  const dailyGoal = 100;
  const scorePct = Math.min((todayPoints / dailyGoal) * 100, 100);

  const modules: BentoModule[] = [
    {
      href: "/sport",
      emoji: "🏃",
      label: "Sport",
      color: "#34D399",
      gradient: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.04))",
      info: `${thisMonthSessions} session${thisMonthSessions !== 1 ? "s" : ""} ce mois`,
      sub: lastSession ? `Dernier: ${lastSession.type}${lastSession.feeling ? ` · ${lastSession.feeling}/10` : ""}` : "Commencer à tracker",
    },
    {
      href: "/nutrition",
      emoji: "🥗",
      label: "Nutrition",
      color: "#FB923C",
      gradient: "linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))",
      info: `${caloriesToday.toLocaleString("fr-FR")} / ${settings.calorie_goal} kcal`,
      sub: `💧 ${waterLiters}L / ${settings.water_goal_ml / 1000}L`,
    },
    {
      href: "/budget",
      emoji: "💸",
      label: "Budget",
      color: "#F472B6",
      gradient: "linear-gradient(135deg, rgba(244,114,182,0.12), rgba(244,114,182,0.04))",
      info: `${formatCurrency(monthExpenses)} / ${formatCurrency(settings.monthly_budget_eur)}`,
      sub: `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`,
    },
    {
      href: "/calendar",
      emoji: "📅",
      label: "Calendrier",
      color: "#FB923C",
      gradient: "linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))",
      info: eventCount > 0 ? `${eventCount} événement${eventCount !== 1 ? "s" : ""} aujourd'hui` : "Aucun événement",
      sub: "Gérer mes sessions LockIn",
    },
    {
      href: "/notes",
      emoji: "📝",
      label: "Notes",
      color: "#A78BFA",
      gradient: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.04))",
      info: `${noteCount} note${noteCount !== 1 ? "s" : ""}`,
      sub: "Brain dump · CMD+K",
    },
    {
      href: "/media",
      emoji: "🎬",
      label: "Media Vault",
      color: "#A78BFA",
      gradient: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.04))",
      info: `${mediaCount} en cours`,
      sub: "Films, séries, livres",
    },
    {
      href: "/inventory",
      emoji: "📦",
      label: "Inventaire",
      color: "#FBBF24",
      gradient: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))",
      info: "Mes objets",
      sub: "Suivi d'usure",
    },
    {
      href: "/score",
      emoji: "⚡",
      label: "Score LockIn",
      color: "#5B9CF6",
      gradient: "linear-gradient(135deg, rgba(91,156,246,0.15), rgba(91,156,246,0.04))",
      info: `${todayPoints} pts aujourd'hui`,
      sub: streak > 0 ? `🔥 ${streak} jour${streak !== 1 ? "s" : ""} de suite` : "Commence ta série !",
    },
  ];

  const handleModuleClick = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-gray-100 rounded-xl" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400 capitalize">{today}</p>
          <h1 className="text-[28px] font-semibold text-gray-900 mt-0.5 tracking-tight">
            Bonjour, {settings.display_name} 👋
          </h1>
        </div>
        <div className="glass-sm rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[12px] font-medium text-gray-600">Connecté à Supabase</span>
        </div>
      </motion.div>

      {/* LockIn Focus banner */}
      {focusEvent && (
        <motion.div variants={item}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(91,156,246,0.15), rgba(167,139,250,0.12))", border: "1px solid rgba(91,156,246,0.25)" }}>
          <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center">
            <Lock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-gray-800">🔒 LockIn actif — {focusEvent.title}</p>
            <p className="text-[11px] text-gray-500">
              Jusqu'à {new Date(focusEvent.end_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Score bar */}
      <motion.div variants={item}>
        <Link href="/score">
          <div className="card cursor-pointer hover:shadow-md transition-shadow"
            style={{ background: "linear-gradient(135deg, rgba(91,156,246,0.08), rgba(167,139,250,0.06))" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Score LockIn du jour</p>
                  <p className="text-[11px] text-gray-400">Objectif: {dailyGoal} pts · {streak > 0 ? `🔥 ${streak} jour${streak !== 1 ? "s" : ""} de suite` : "Pas de série en cours"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-bold" style={{ color: scorePct >= 100 ? "#34D399" : scorePct >= 60 ? "#5B9CF6" : "#FB923C" }}>
                  {todayPoints}
                </p>
                <p className="text-[11px] text-gray-400">/ {dailyGoal} pts</p>
              </div>
            </div>
            <div className="h-2 bg-black/6 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${scorePct}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                style={{
                  background: scorePct >= 100
                    ? "linear-gradient(90deg, #34D399, #10B981)"
                    : "linear-gradient(90deg, #5B9CF6, #A78BFA)",
                  boxShadow: `0 0 8px rgba(91,156,246,0.4)`,
                }}
              />
            </div>
            {scorePct >= 100 && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-green-600 font-semibold mt-1.5"
              >
                ✅ Journée complète !
              </motion.p>
            )}
          </div>
        </Link>
      </motion.div>

      {/* Bento Grid */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {modules.map((mod) => (
          <motion.button
            key={mod.href}
            onClick={() => handleModuleClick(mod.href)}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
            className="card text-left cursor-pointer group relative overflow-hidden"
            style={{ background: mod.gradient, minHeight: 160 }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
              style={{ background: mod.color }}
            />

            <div className="relative flex flex-col h-full">
              {/* Icon */}
              <span className="text-4xl mb-3 block">{mod.emoji}</span>

              {/* Label */}
              <p className="text-[13px] font-semibold text-gray-700 mb-1">{mod.label}</p>

              {/* Info bubble */}
              <p className="text-[14px] font-bold text-gray-900 leading-tight">{mod.info}</p>

              {/* Sub */}
              {mod.sub && (
                <p className="text-[11px] mt-1.5" style={{ color: mod.color }}>
                  {mod.sub}
                </p>
              )}

              {/* Arrow on hover */}
              <motion.div
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${mod.color}20` }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
              >
                <span className="text-[10px]" style={{ color: mod.color }}>→</span>
              </motion.div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
