"use client";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Droplets, Apple } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addMeal, toggleMealCompleted, addWater, deleteWater } from "@/lib/actions/nutrition";
import { useSettings } from "@/contexts/SettingsContext";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, FormTextarea, SubmitButton } from "@/components/ui/Modal";
import type { NutritionLog, WaterLog } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TODAY = new Date().toISOString().split("T")[0];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

function MacroBar({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[13px] font-medium text-gray-700">{label}</span>
        <span className="text-[12px] text-gray-500">
          <span className="font-semibold" style={{ color }}>{Math.round(current)}</span> / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}50` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">{Math.round(pct)}%</p>
    </div>
  );
}

export default function NutritionPage() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [water, setWater] = useState<WaterLog[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [mealModal, setMealModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Meal form
  const [mealName, setMealName] = useState("");
  const [mealItems, setMealItems] = useState("");
  const [mealCal, setMealCal] = useState("");
  const [mealProt, setMealProt] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFat, setMealFat] = useState("");
  const [mealTime, setMealTime] = useState("");

  const load = async () => {
    const [m, w, week] = await Promise.all([
      supabase.from("nutrition_logs").select("*").eq("date", TODAY).order("created_at"),
      supabase.from("water_logs").select("*").eq("date", TODAY),
      supabase.from("nutrition_logs").select("date, calories, protein_g, carbs_g, fat_g")
        .gte("date", new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0])
        .order("date"),
    ]);
    setMeals(m.data || []);
    setWater(w.data || []);

    // Build 7-day chart
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const grouped: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
    (week.data || []).forEach((r) => {
      if (!grouped[r.date]) grouped[r.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      grouped[r.date].calories += r.calories;
      grouped[r.date].protein += r.protein_g;
      grouped[r.date].carbs += r.carbs_g;
      grouped[r.date].fat += r.fat_g;
    });
    const now = new Date();
    const wd = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 6 + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayIdx = (d.getDay() + 6) % 7;
      return { day: days[dayIdx], ...(grouped[dateStr] || { calories: 0, protein: 0, carbs: 0, fat: 0 }) };
    });
    setWeekData(wd);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalProt = meals.reduce((s, m) => s + m.protein_g, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs_g, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat_g, 0);
  const waterTotal = water.reduce((s, w) => s + w.amount_ml, 0);
  const waterGlasses = Math.round(waterTotal / 250);
  const waterTargetGlasses = Math.round(settings.water_goal_ml / 250);

  const handleAddMeal = async () => {
    if (!mealName || !mealCal) return;
    setPending(true);
    try {
      const newMeal = await addMeal({
        date: TODAY, meal_name: mealName,
        items: mealItems.split(",").map((s) => s.trim()).filter(Boolean),
        calories: parseInt(mealCal),
        protein_g: parseFloat(mealProt) || 0,
        carbs_g: parseFloat(mealCarbs) || 0,
        fat_g: parseFloat(mealFat) || 0,
        completed: false, time_of_day: mealTime || undefined,
      });
      setMeals((prev) => [...prev, newMeal]);
      toast.success("🥗 Repas enregistré !");
      setMealModal(false);
      setMealName(""); setMealItems(""); setMealCal(""); setMealProt(""); setMealCarbs(""); setMealFat(""); setMealTime("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setMeals((prev) => prev.map((m) => m.id === id ? { ...m, completed } : m));
    startTransition(async () => {
      try { await toggleMealCompleted(id, completed); }
      catch { setMeals((prev) => prev.map((m) => m.id === id ? { ...m, completed: !completed } : m)); }
    });
  };

  const handleAddWater = async (amount: number) => {
    try {
      const newW = await addWater(amount);
      setWater((prev) => [...prev, newW]);
      toast.success(`💧 ${amount}ml d'eau ajouté`, {
        action: {
          label: "Annuler",
          onClick: async () => {
            setWater((prev) => prev.filter((w) => w.id !== newW.id));
            await deleteWater(newW.id);
          },
        },
      });
    } catch { toast.error("Erreur"); }
  };

  const handleRemoveWater = async () => {
    const last = water[water.length - 1];
    if (!last) return;
    setWater((prev) => prev.slice(0, -1));
    try { await deleteWater(last.id); toast.success(`💧 ${last.amount_ml}ml retiré`); }
    catch { load(); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4"><CardSkeleton /></div>
        <div className="col-span-4"><CardSkeleton /></div>
        <div className="col-span-4"><CardSkeleton /></div>
      </div>
    </div>
  );

  const calPct = Math.round((totalCal / settings.calorie_goal) * 100);

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Nutrition 🥗</h1>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setMealModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
          style={{ background: "linear-gradient(135deg, #FB923C, #F97316)", boxShadow: "0 4px 16px rgba(251,146,60,0.35)" }}>
          <Plus className="w-4 h-4" /> Ajouter un repas
        </motion.button>
      </motion.div>

      {/* Calories restantes */}
      <motion.div variants={item}>
        {(() => {
          const remaining = settings.calorie_goal - totalCal;
          const pct = Math.min((totalCal / settings.calorie_goal) * 100, 100);
          const barColor = pct < 70 ? "#34D399" : pct < 90 ? "#FB923C" : "#F87171";
          return (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-700">Calories restantes</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${barColor}15`, color: barColor }}>
                    {remaining > 0 ? `−${remaining} kcal` : `+${Math.abs(remaining)} kcal dépassé`}
                  </span>
                </div>
                <span className="text-[12px] text-gray-400">{totalCal} / {settings.calorie_goal} kcal</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: barColor, boxShadow: `0 0 8px ${barColor}50` }} />
              </div>
            </div>
          );
        })()}
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        {/* Calorie ring + macros */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-5">Aujourd'hui</h2>
            <div className="flex flex-col items-center mb-6">
              <div className="relative" style={{ width: 160, height: 160 }}>
                <svg width={160} height={160} className="-rotate-90">
                  <circle cx={80} cy={80} r={62} fill="none" stroke="#FB923C20" strokeWidth={14} />
                  <motion.circle cx={80} cy={80} r={62} fill="none" stroke="#FB923C" strokeWidth={14} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 62}
                    initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 62 * (1 - Math.min(calPct / 100, 1)) }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    style={{ filter: "drop-shadow(0 0 8px rgba(251,146,60,0.5))" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[26px] font-semibold text-gray-900">{totalCal}</p>
                  <p className="text-[11px] text-gray-400">/ {settings.calorie_goal} kcal</p>
                  <p className="text-[10px] font-semibold text-apple-orange mt-0.5">{calPct}%</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <MacroBar label="Protéines" current={totalProt} target={settings.protein_goal_g} unit="g" color="#5B9CF6" />
              <MacroBar label="Glucides" current={totalCarbs} target={settings.carbs_goal_g} unit="g" color="#34D399" />
              <MacroBar label="Lipides" current={totalFat} target={settings.fat_goal_g} unit="g" color="#F472B6" />
            </div>
          </div>
        </motion.div>

        {/* Meals checklist */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Repas du jour</h2>
            {meals.length === 0 ? (
              <EmptyState icon={Apple} title="Aucun repas enregistré"
                description="Ajoutez vos repas pour suivre vos macros en temps réel."
                color="#FB923C" action={{ label: "+ Ajouter un repas", onClick: () => setMealModal(true) }} />
            ) : (
              <div className="space-y-3">
                {meals.map((meal, i) => (
                  <motion.div key={meal.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className={`p-4 rounded-2xl border transition-all ${meal.completed ? "border-green-200 bg-green-50/50" : "border-gray-100 bg-white/30"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggle(meal.id, !meal.completed)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${meal.completed ? "bg-apple-mint" : "border-2 border-gray-200 hover:border-apple-mint"}`}>
                        {meal.completed && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[13px] font-semibold text-gray-800">{meal.meal_name}</p>
                          <div className="flex items-center gap-2">
                            {meal.time_of_day && <span className="text-[11px] text-gray-400">{meal.time_of_day}</span>}
                            <span className="text-[12px] font-medium text-apple-orange">{meal.calories} kcal</span>
                          </div>
                        </div>
                        {meal.items?.length > 0 && (
                          <ul className="space-y-0.5">
                            {meal.items.map((it, j) => (
                              <li key={j} className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-gray-300" />{it}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Weekly chart + water */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">7 derniers jours</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} barSize={8} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="protein" name="Protéines" fill="#5B9CF6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="carbs" name="Glucides" fill="#34D399" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fat" name="Lipides" fill="#F472B6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hydratation */}
            <div className="mt-5 p-4 rounded-2xl" style={{ background: "rgba(91,156,246,0.08)", border: "1px solid rgba(91,156,246,0.12)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-apple-blue" />
                  <p className="text-[13px] font-semibold text-gray-700">Hydratation</p>
                </div>
                <p className="text-[13px] font-semibold text-apple-blue">
                  {(waterTotal / 1000).toFixed(1)}L / {settings.water_goal_ml / 1000}L
                </p>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                {Array.from({ length: waterTargetGlasses }).map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.03 }}
                    className="flex-1 h-3 rounded-full transition-all"
                    style={{
                      background: i < waterGlasses ? "#5B9CF6" : "rgba(91,156,246,0.15)",
                      boxShadow: i < waterGlasses ? "0 0 6px rgba(91,156,246,0.4)" : "none",
                    }} />
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mb-3">{waterGlasses} / {waterTargetGlasses} verres (250ml)</p>
              <div className="flex gap-2">
                <button onClick={handleRemoveWater} disabled={water.length === 0}
                  className="py-1.5 px-3 rounded-xl text-[12px] font-medium text-red-400 hover:bg-red-50 border border-red-200/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  −
                </button>
                {[150, 250, 500].map((ml) => (
                  <button key={ml} onClick={() => handleAddWater(ml)}
                    className="flex-1 py-1.5 rounded-xl text-[12px] font-medium text-apple-blue transition-all hover:bg-blue-50 border border-apple-blue/20">
                    +{ml}ml
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add meal modal */}
      <Modal open={mealModal} onClose={() => setMealModal(false)} title="Ajouter un repas" accentColor="#FB923C">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nom du repas" required>
              <FormInput placeholder="Déjeuner" value={mealName} onChange={setMealName} />
            </FormField>
            <FormField label="Heure">
              <FormInput placeholder="12:30" value={mealTime} onChange={setMealTime} type="time" />
            </FormField>
          </div>
          <FormField label="Aliments (séparés par virgule)">
            <FormTextarea placeholder="Poulet grillé, riz basmati, salade…" value={mealItems} onChange={setMealItems} rows={2} />
          </FormField>
          <FormField label="Calories" required>
            <FormInput placeholder="650" value={mealCal} onChange={setMealCal} type="number" min={0} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Protéines (g)">
              <FormInput placeholder="45" value={mealProt} onChange={setMealProt} type="number" min={0} />
            </FormField>
            <FormField label="Glucides (g)">
              <FormInput placeholder="80" value={mealCarbs} onChange={setMealCarbs} type="number" min={0} />
            </FormField>
            <FormField label="Lipides (g)">
              <FormInput placeholder="20" value={mealFat} onChange={setMealFat} type="number" min={0} />
            </FormField>
          </div>
          <SubmitButton label="Enregistrer le repas" loading={pending} color="#FB923C" onClick={handleAddMeal} />
        </div>
      </Modal>
    </motion.div>
  );
}
