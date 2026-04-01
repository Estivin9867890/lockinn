"use client";
import { useEffect, useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Droplets, Apple, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addMealWithIngredients, toggleMealCompleted, addWater, deleteWater, getMealIngredients } from "@/lib/actions/nutrition";
import { getSupplements, getTodaySupplementLogs, toggleSupplementLog } from "@/lib/actions/supplements";
import { addPoints } from "@/lib/actions/points";
import { useSettings } from "@/contexts/SettingsContext";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, SubmitButton } from "@/components/ui/Modal";
import type { NutritionLog, WaterLog, MealIngredient, Supplement, SupplementLog } from "@/lib/types";
import { searchFoods, calcMacros, type FoodItem } from "@/lib/food-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

// ─── Food Search ──────────────────────────────────────────────────────────────
interface FoodIngredient { food: FoodItem; weightG: number }

function FoodSearchRow({ onAdd }: { onAdd: (ingredient: FoodIngredient) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [weight, setWeight] = useState("100");
  const [showResults, setShowResults] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(searchFoods(query, 8));
    setShowResults(query.length > 0);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (food: FoodItem) => {
    setSelected(food);
    setQuery(food.name);
    setShowResults(false);
  };

  const handleAdd = () => {
    if (!selected || !weight) return;
    onAdd({ food: selected, weightG: parseFloat(weight) });
    setSelected(null);
    setQuery("");
    setWeight("100");
  };

  const macros = selected && weight ? calcMacros(selected, parseFloat(weight) || 0) : null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={ref}>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
              onFocus={() => setShowResults(query.length > 0)}
              placeholder="Rechercher un aliment…"
              className="flex-1 text-[13px] text-gray-800 bg-transparent outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); }}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showResults && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.98)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.08)" }}>
                {results.map((food) => (
                  <button key={food.name} onClick={() => select(food)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50/50 transition-colors text-left">
                    <div>
                      <p className="text-[13px] font-medium text-gray-800">{food.name}</p>
                      <p className="text-[10px] text-gray-400">{food.category}</p>
                    </div>
                    <p className="text-[11px] text-gray-400">P{food.protein_g}·G{food.carbs_g}·L{food.fat_g}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 px-3 py-2 rounded-xl w-24"
          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
            min={1} className="w-full text-[13px] text-gray-800 bg-transparent outline-none text-center" />
          <span className="text-[11px] text-gray-400">g</span>
        </div>

        <button onClick={handleAdd} disabled={!selected}
          className="px-3 py-2 rounded-xl text-white text-[13px] font-medium disabled:opacity-30 transition-all"
          style={{ background: "linear-gradient(135deg, #FB923C, #F97316)" }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {macros && selected && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px]"
          style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
          <span className="text-gray-600 font-medium">{selected.name} · {weight}g</span>
          <span className="ml-auto font-semibold text-apple-orange">{macros.calories} kcal</span>
          <span className="text-blue-500">P{macros.protein_g}g</span>
          <span className="text-green-500">G{macros.carbs_g}g</span>
          <span className="text-pink-500">L{macros.fat_g}g</span>
        </motion.div>
      )}
    </div>
  );
}

export default function NutritionPage() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [water, setWater] = useState<WaterLog[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [mealModal, setMealModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Expanded meal for ingredients
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [mealIngredients, setMealIngredients] = useState<Record<string, MealIngredient[]>>({});

  // Meal form
  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [ingredients, setIngredients] = useState<{ food: FoodItem; weightG: number }[]>([]);

  const load = async () => {
    const [m, w, week, supps, suppLogs] = await Promise.all([
      supabase.from("nutrition_logs").select("*").eq("date", TODAY).order("created_at"),
      supabase.from("water_logs").select("*").eq("date", TODAY),
      supabase.from("nutrition_logs").select("date, calories, protein_g, carbs_g, fat_g")
        .gte("date", new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0])
        .order("date"),
      getSupplements(),
      getTodaySupplementLogs(),
    ]);
    setMeals(m.data || []);
    setWater(w.data || []);
    setSupplements(supps);
    setSupplementLogs(suppLogs);

    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const grouped: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
    (week.data || []).forEach((r: any) => {
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

  // Calculated totals (from meals + supplement macros)
  const mealCal = meals.reduce((s, m) => s + m.calories, 0);
  const mealProt = meals.reduce((s, m) => s + m.protein_g, 0);
  const mealCarbs = meals.reduce((s, m) => s + m.carbs_g, 0);
  const mealFat = meals.reduce((s, m) => s + m.fat_g, 0);

  const loggedSupps = supplements.filter((s) => supplementLogs.some((l) => l.supplement_id === s.id) && s.has_macros);
  const suppCal = loggedSupps.reduce((s, sup) => s + Math.round(sup.protein_g * 4 + sup.carbs_g * 4 + sup.fat_g * 9), 0);
  const suppProt = loggedSupps.reduce((s, sup) => s + sup.protein_g, 0);
  const suppCarbs = loggedSupps.reduce((s, sup) => s + sup.carbs_g, 0);
  const suppFat = loggedSupps.reduce((s, sup) => s + sup.fat_g, 0);

  const totalCal = mealCal + suppCal;
  const totalProt = mealProt + suppProt;
  const totalCarbs = mealCarbs + suppCarbs;
  const totalFat = mealFat + suppFat;

  const waterTotal = water.reduce((s, w) => s + w.amount_ml, 0);
  const waterGlasses = Math.round(waterTotal / 250);
  const waterTargetGlasses = Math.round(settings.water_goal_ml / 250);

  // Computed ingredients totals
  const ingredientTotals = ingredients.reduce((acc, { food, weightG }) => {
    const m = calcMacros(food, weightG);
    return {
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
    };
  }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  const handleAddMeal = async () => {
    if (!mealName || ingredients.length === 0) {
      toast.error("Ajoutez au moins un aliment");
      return;
    }
    setPending(true);
    try {
      const ingredientInputs = ingredients.map(({ food, weightG }) => {
        const m = calcMacros(food, weightG);
        return { food_name: `${food.name} (${weightG}g)`, weight_g: weightG, ...m };
      });
      const mealData = {
        date: TODAY,
        meal_name: mealName,
        items: ingredients.map(({ food, weightG }) => `${food.name} (${weightG}g)`),
        calories: ingredientTotals.calories,
        protein_g: ingredientTotals.protein_g,
        carbs_g: ingredientTotals.carbs_g,
        fat_g: ingredientTotals.fat_g,
        completed: false,
        time_of_day: mealTime || undefined,
      };
      const newMeal = await addMealWithIngredients(mealData, ingredientInputs);
      setMeals((prev) => [...prev, newMeal]);
      await addPoints("repas_sain", `Repas: ${mealName}`);
      toast.success("🥗 Repas enregistré ! +15 pts");
      setMealModal(false);
      setMealName(""); setMealTime(""); setIngredients([]);
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
      // Award water goal points when target reached
      const newTotal = waterTotal + amount;
      if (newTotal >= settings.water_goal_ml && waterTotal < settings.water_goal_ml) {
        await addPoints("objectif_eau", "Objectif eau atteint 💧");
        toast.success(`💧 ${amount}ml ajouté · +10 pts pour l'objectif eau !`);
      } else {
        toast.success(`💧 ${amount}ml d'eau ajouté`);
      }
    } catch { toast.error("Erreur"); }
  };

  const handleRemoveWater = async () => {
    const last = water[water.length - 1];
    if (!last) return;
    setWater((prev) => prev.slice(0, -1));
    try { await deleteWater(last.id); toast.success(`💧 ${last.amount_ml}ml retiré`); }
    catch { load(); }
  };

  const handleToggleSupplement = async (suppId: string, currentlyLogged: boolean) => {
    const supp = supplements.find((s) => s.id === suppId)!;
    const newLogged = !currentlyLogged;
    setSupplementLogs((prev) =>
      newLogged
        ? [...prev, { id: "temp", user_id: "", supplement_id: suppId, date: TODAY, created_at: "" }]
        : prev.filter((l) => l.supplement_id !== suppId)
    );
    try {
      await toggleSupplementLog(suppId, newLogged);
      if (newLogged) {
        await addPoints("supplement_check", `${supp.name} pris ✓`);
        toast.success(`✅ ${supp.name} coché ! +5 pts`);
      }
    } catch { load(); }
  };

  const handleExpandMeal = async (mealId: string) => {
    if (expandedMeal === mealId) { setExpandedMeal(null); return; }
    setExpandedMeal(mealId);
    if (!mealIngredients[mealId]) {
      const ings = await getMealIngredients(mealId);
      setMealIngredients((prev) => ({ ...prev, [mealId]: ings }));
    }
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

      {/* Calories bar */}
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
        {/* Ring + macros */}
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

        {/* Meals */}
        <motion.div variants={item} className="col-span-4">
          <div className="card h-full">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Repas du jour</h2>
            {meals.length === 0 ? (
              <EmptyState icon={Apple} title="Aucun repas enregistré"
                description="Ajoutez vos repas pour suivre vos macros en temps réel."
                color="#FB923C" action={{ label: "+ Ajouter un repas", onClick: () => setMealModal(true) }} />
            ) : (
              <div className="space-y-2">
                {meals.map((meal, i) => {
                  const isExpanded = expandedMeal === meal.id;
                  const ings = mealIngredients[meal.id];
                  return (
                    <motion.div key={meal.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      className={`rounded-2xl border transition-all ${meal.completed ? "border-green-200 bg-green-50/50" : "border-gray-100 bg-white/30"}`}>
                      <div className="flex items-start gap-3 p-3">
                        <button
                          onClick={() => handleToggle(meal.id, !meal.completed)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${meal.completed ? "bg-apple-mint" : "border-2 border-gray-200 hover:border-apple-mint"}`}>
                          {meal.completed && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-gray-800">{meal.meal_name}</p>
                            <div className="flex items-center gap-1.5">
                              {meal.time_of_day && <span className="text-[11px] text-gray-400">{meal.time_of_day}</span>}
                              <span className="text-[12px] font-medium text-apple-orange">{meal.calories} kcal</span>
                              <button onClick={() => handleExpandMeal(meal.id)}
                                className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-black/5">
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            P{Math.round(meal.protein_g)}g · G{Math.round(meal.carbs_g)}g · L{Math.round(meal.fat_g)}g
                          </p>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="px-3 pb-3 overflow-hidden">
                            {ings === undefined ? (
                              <p className="text-[11px] text-gray-400">Chargement…</p>
                            ) : ings.length > 0 ? (
                              <div className="space-y-1 border-t border-gray-100 pt-2">
                                {ings.map((ing) => (
                                  <div key={ing.id} className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-600">{ing.food_name}</span>
                                    <span className="text-gray-400">{ing.calories} kcal · P{Math.round(ing.protein_g)}·G{Math.round(ing.carbs_g)}·L{Math.round(ing.fat_g)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-2">
                                {meal.items?.join(", ") || "Aucun détail"}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Chart + Water + Supplements */}
        <motion.div variants={item} className="col-span-4 space-y-4">
          {/* 7-day chart */}
          <div className="card">
            <h2 className="text-[14px] font-semibold text-gray-800 mb-3">7 derniers jours</h2>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} barSize={7} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="protein" name="Protéines" fill="#5B9CF6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="carbs" name="Glucides" fill="#34D399" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fat" name="Lipides" fill="#F472B6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hydratation */}
          <div className="card p-4 rounded-2xl" style={{ background: "rgba(91,156,246,0.08)", border: "1px solid rgba(91,156,246,0.12)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-apple-blue" />
                <p className="text-[13px] font-semibold text-gray-700">Hydratation</p>
              </div>
              <p className="text-[13px] font-semibold text-apple-blue">
                {(waterTotal / 1000).toFixed(1)}L / {settings.water_goal_ml / 1000}L
              </p>
            </div>
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              {Array.from({ length: Math.min(waterTargetGlasses, 12) }).map((_, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                  className="flex-1 h-3 rounded-full min-w-[8px] transition-all"
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

          {/* Performance Checklist (Supplements) */}
          {supplements.length > 0 && (
            <div className="card">
              <h2 className="text-[14px] font-semibold text-gray-800 mb-3">Checklist Performance 💊</h2>
              <div className="space-y-2">
                {supplements.map((supp) => {
                  const logged = supplementLogs.some((l) => l.supplement_id === supp.id);
                  return (
                    <motion.button
                      key={supp.id}
                      onClick={() => handleToggleSupplement(supp.id, logged)}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: logged ? "rgba(52,211,153,0.08)" : "rgba(0,0,0,0.03)",
                        border: logged ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(0,0,0,0.06)",
                      }}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${logged ? "bg-apple-mint" : "border-2 border-gray-200"}`}>
                        {logged && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <p className="text-[12px] font-medium text-gray-700 flex-1">{supp.name}</p>
                      {supp.has_macros && (
                        <p className="text-[10px] text-gray-400">
                          P{supp.protein_g}g · {Math.round(supp.protein_g * 4 + supp.carbs_g * 4 + supp.fat_g * 9)}kcal
                        </p>
                      )}
                      {logged && <span className="text-[10px] text-green-500 font-semibold">+5 pts</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Meal modal */}
      <Modal open={mealModal} onClose={() => { setMealModal(false); setIngredients([]); setMealName(""); setMealTime(""); }}
        title="Composer un repas" accentColor="#FB923C" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nom du repas" required>
              <FormInput placeholder="Déjeuner" value={mealName} onChange={setMealName} />
            </FormField>
            <FormField label="Heure">
              <FormInput placeholder="12:30" value={mealTime} onChange={setMealTime} type="time" />
            </FormField>
          </div>

          {/* Food search */}
          <div>
            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block mb-3">
              Ajouter des aliments
            </label>
            <FoodSearchRow onAdd={(ing) => setIngredients((prev) => [...prev, ing])} />
          </div>

          {/* Ingredients list */}
          {ingredients.length > 0 && (
            <div>
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Composition du plat
              </label>
              <div className="space-y-1.5">
                {ingredients.map(({ food, weightG }, i) => {
                  const m = calcMacros(food, weightG);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)" }}>
                      <span className="text-[13px] text-gray-800 flex-1">{food.name} · {weightG}g</span>
                      <span className="text-[11px] text-gray-500">{m.calories} kcal · P{m.protein_g}·G{m.carbs_g}·L{m.fat_g}</span>
                      <button onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                        className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100">
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="mt-3 p-3 rounded-xl"
                style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-gray-700">Total du repas</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-apple-orange">{ingredientTotals.calories} kcal</span>
                    <span className="text-[11px] text-blue-500">P{Math.round(ingredientTotals.protein_g)}g</span>
                    <span className="text-[11px] text-green-500">G{Math.round(ingredientTotals.carbs_g)}g</span>
                    <span className="text-[11px] text-pink-500">L{Math.round(ingredientTotals.fat_g)}g</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SubmitButton label={`Enregistrer le repas (+15 pts)`} loading={pending} color="#FB923C"
            onClick={handleAddMeal} />
        </div>
      </Modal>
    </motion.div>
  );
}
