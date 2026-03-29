"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Activity, TrendingUp, FileText, Lock } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import ActivityRings from "./ActivityRings";
import EnergyChart from "./EnergyChart";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/contexts/SettingsContext";
import { CardSkeleton, KPIRowSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import type { SportSession, NutritionLog, WaterLog, FinanceTransaction, Note, CalendarEvent } from "@/lib/types";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-gray-100/50 animate-pulse" />
  ),
});

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3, duration: 0.5 } },
};

const TODAY = new Date().toISOString().split("T")[0];

export default function Dashboard() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [water, setWater] = useState<WaterLog[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [focusEvent, setFocusEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date().toISOString();
      const [s, m, w, t, n, focus] = await Promise.all([
        supabase.from("sport_sessions").select("*").order("date", { ascending: false }).limit(10),
        supabase.from("nutrition_logs").select("*").eq("date", TODAY),
        supabase.from("water_logs").select("*").eq("date", TODAY),
        supabase.from("finances_transactions").select("*").order("date", { ascending: false }).limit(20),
        supabase.from("notes").select("id, title, content, pinned, tags, created_at, updated_at").order("updated_at", { ascending: false }).limit(3),
        supabase.from("events").select("*").eq("type", "lockin").lte("start_at", now).gte("end_at", now).limit(1),
      ]);
      setSessions(s.data || []);
      setMeals(m.data || []);
      setWater(w.data || []);
      setTransactions(t.data || []);
      setRecentNotes((n.data as Note[]) || []);
      setFocusEvent(focus.data?.[0] ?? null);
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const caloriesToday = meals.reduce((s, m) => s + m.calories, 0);
  const waterMlToday = water.reduce((s, w) => s + w.amount_ml, 0);
  const thisMonthExpenses = transactions.filter(
    (t) => t.date?.startsWith(new Date().toISOString().slice(0, 7))
  ).reduce((s, t) => s + t.amount, 0);
  const lastSession = sessions[0];
  const thisMonthSessions = sessions.filter(
    (s) => s.date?.startsWith(new Date().toISOString().slice(0, 7))
  ).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 skeleton rounded-xl" />
        <KPIRowSkeleton cols={4} />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-3"><CardSkeleton /></div>
          <div className="col-span-5"><CardSkeleton /></div>
          <div className="col-span-4"><CardSkeleton /></div>
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

      {/* Focus Mode banner */}
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
          <Link href="/calendar" className="text-[12px] text-blue-500 font-medium hover:opacity-70">
            Voir <ArrowUpRight className="w-3.5 h-3.5 inline" />
          </Link>
        </motion.div>
      )}

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Sessions ce mois",
            value: thisMonthSessions.toString(),
            icon: "🏃",
            color: "#34D399",
            sub: `Objectif: ${settings.workout_sessions_per_week * 4}/mois`,
          },
          {
            label: "Dépenses ce mois",
            value: formatCurrency(thisMonthExpenses),
            icon: "💸",
            color: "#F472B6",
            sub: `Budget: ${formatCurrency(settings.monthly_budget_eur)}`,
          },
          {
            label: "Calories aujourd'hui",
            value: caloriesToday.toLocaleString("fr-FR"),
            icon: "🥗",
            color: "#FB923C",
            sub: `Objectif: ${settings.calorie_goal} kcal`,
          },
          {
            label: "Eau aujourd'hui",
            value: `${(waterMlToday / 1000).toFixed(1)}L`,
            icon: "💧",
            color: "#5B9CF6",
            sub: `Objectif: ${settings.water_goal_ml / 1000}L`,
          },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
            <span className="text-2xl mb-3 block">{kpi.icon}</span>
            <p className="text-[22px] font-semibold text-gray-900 leading-none">{kpi.value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
            <p className="text-[11px] mt-1" style={{ color: kpi.color }}>{kpi.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Activity Rings — objectifs dynamiques depuis Settings */}
        <motion.div variants={item} className="col-span-3">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[14px] font-semibold text-gray-800">Objectifs du jour</h2>
              <Link href="/settings" className="text-[11px] text-gray-400 hover:text-apple-blue transition-colors">
                Modifier
              </Link>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ActivityRings
                steps={0}
                caloriesToday={caloriesToday}
                waterMlToday={waterMlToday}
              />
            </div>
          </div>
        </motion.div>

        {/* Map */}
        <motion.div variants={item} className="col-span-5">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Mes Spots</h2>
              <Link href="/sport" className="flex items-center gap-1 text-[12px] text-apple-blue font-medium hover:opacity-70 transition-opacity">
                Voir tout <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden" style={{ minHeight: 260 }}>
              <MapComponent compact />
            </div>
          </div>
        </motion.div>

        {/* Energy + Sommeil */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[14px] font-semibold text-gray-800">Courbe d'énergie</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-apple-blue" />
                <span className="text-[11px] text-gray-400">Objectif: {settings.sleep_goal_hours}h</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Suivi journalier</p>
            <div className="flex-1">
              <EnergyChart />
            </div>
          </div>
        </motion.div>

        {/* Notes récentes */}
        <motion.div variants={item} className="col-span-12">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Notes récentes</h2>
              <Link href="/notes" className="flex items-center gap-1 text-[12px] text-apple-blue font-medium hover:opacity-70">
                Voir <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentNotes.length === 0 ? (
              <p className="text-[13px] text-gray-400 py-2">Aucune note — créez votre première note dans <Link href="/notes" className="text-apple-blue hover:opacity-70">Notes</Link>.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {recentNotes.map((note, i) => (
                  <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}>
                    <Link href={`/notes?id=${note.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-purple-50/50 transition-colors border border-transparent hover:border-purple-100 block">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-700 truncate">
                            {note.pinned && <span className="mr-1">📌</span>}{note.title || "Sans titre"}
                          </p>
                          {note.content && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                              {note.content.replace(/[#*`]/g, "").slice(0, 80)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Derniers repas */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Repas du jour</h2>
              <Link href="/nutrition" className="flex items-center gap-1 text-[12px] text-apple-blue font-medium hover:opacity-70">
                Voir <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-3xl mb-3">🥗</p>
                <p className="text-[13px] font-medium text-gray-600">Aucun repas enregistré</p>
                <p className="text-[11px] text-gray-400 mt-1">Ajoutez vos repas dans Nutrition</p>
              </div>
            ) : (
              <div className="space-y-2">
                {meals.slice(0, 4).map((meal, i) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl ${meal.completed ? "bg-green-50/50" : "hover:bg-black/3"} transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meal.completed ? "bg-apple-mint" : "bg-gray-200"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-700 truncate">{meal.meal_name}</p>
                      <p className="text-[11px] text-gray-400">{meal.time_of_day || "—"}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-500">{meal.calories} kcal</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Dernières transactions */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Dernières dépenses</h2>
              <Link href="/budget" className="flex items-center gap-1 text-[12px] text-apple-blue font-medium hover:opacity-70">
                Voir <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-3xl mb-3">💸</p>
                <p className="text-[13px] font-medium text-gray-600">Aucune dépense enregistrée</p>
                <p className="text-[11px] text-gray-400 mt-1">Ajoutez vos transactions dans Budget</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 5).map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-700 truncate">{t.label}</p>
                      <p className="text-[11px] text-gray-400">{t.category}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700">-{formatCurrency(t.amount)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Dernier entraînement */}
        <motion.div variants={item} className="col-span-4">
          <div
            className="card h-full relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(91,156,246,0.08) 100%)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-gray-800">Dernier entraînement</h2>
              <Link href="/sport" className="flex items-center gap-1 text-[12px] text-apple-mint font-medium hover:opacity-70">
                Sport <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {!lastSession ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-3xl mb-3">🏋️</p>
                <p className="text-[13px] font-medium text-gray-600">Aucune session enregistrée</p>
                <p className="text-[11px] text-gray-400 mt-1">Commencez à tracker vos entraînements</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-apple-mint/20 flex items-center justify-center text-2xl">
                    {({ Course: "🏃", Vélo: "🚴", Muscu: "🏋️", Escalade: "🧗", Skate: "🛹", Natation: "🏊", Yoga: "🧘", run: "🏃", bike: "🚴", gym: "🏋️", climb: "🧗", skate: "🛹" } as Record<string, string>)[lastSession.type] || "💪"}
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-gray-800">{lastSession.type}</p>
                    <p className="text-[12px] text-gray-500">{lastSession.date}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Durée", value: `${lastSession.duration_min}min`, icon: "⏱️" },
                    { label: "Calories", value: `${lastSession.calories ?? "—"} kcal`, icon: "🔥" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.5)" }}>
                      <p className="text-base mb-1">{stat.icon}</p>
                      <p className="text-[15px] font-semibold text-gray-800">{stat.value}</p>
                      <p className="text-[11px] text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Weekly progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] text-gray-500">Objectif hebdo</span>
                    <span className="text-[11px] font-semibold text-apple-mint">
                      {thisMonthSessions} / {settings.workout_sessions_per_week * 4}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-black/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-apple-mint"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((thisMonthSessions / (settings.workout_sessions_per_week * 4)) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
