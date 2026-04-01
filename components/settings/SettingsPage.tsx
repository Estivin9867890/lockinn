"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Droplets, Flame, Footprints, Dumbbell, DollarSign,
  Moon, Apple, Activity, Settings, ChevronRight, User, Zap, Scale, Trophy,
  Link2, Palette, Bell, Globe, Swords, Shield, Download, Trash2, Sun,
  ToggleLeft, ToggleRight, Calendar, Cloud,
} from "lucide-react";
import { DEFAULT_POINTS_CONFIG } from "@/lib/types";
import type { CustomBadHabit } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { useDebouncedCallback } from "use-debounce";
import type { UserSettings } from "@/lib/types";
import { upsertSettings } from "@/lib/actions/settings";

type SettingKey = keyof Omit<UserSettings, "id" | "user_id" | "updated_at">;

const sections = [
  {
    id: "profil",
    label: "Profil",
    icon: User,
    color: "#5B9CF6",
    fields: [],
  },
  {
    id: "sante",
    label: "Santé & Sport",
    icon: Activity,
    color: "#34D399",
    fields: [
      {
        key: "steps_goal" as SettingKey,
        label: "Objectif de pas / jour",
        icon: Footprints,
        unit: "pas",
        min: 1000, max: 30000, step: 500,
        color: "#F87171",
      },
      {
        key: "workout_sessions_per_week" as SettingKey,
        label: "Sessions sport / semaine",
        icon: Dumbbell,
        unit: "sessions",
        min: 1, max: 14, step: 1,
        color: "#34D399",
      },
      {
        key: "sleep_goal_hours" as SettingKey,
        label: "Objectif sommeil",
        icon: Moon,
        unit: "h",
        min: 5, max: 12, step: 0.5,
        color: "#818CF8",
      },
    ],
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: Apple,
    color: "#FB923C",
    fields: [
      {
        key: "water_goal_ml" as SettingKey,
        label: "Objectif hydratation",
        icon: Droplets,
        unit: "ml",
        min: 500, max: 5000, step: 100,
        color: "#5B9CF6",
      },
      {
        key: "calorie_goal" as SettingKey,
        label: "Objectif calorique",
        icon: Flame,
        unit: "kcal",
        min: 1200, max: 4000, step: 50,
        color: "#FB923C",
      },
      {
        key: "protein_goal_g" as SettingKey,
        label: "Objectif protéines",
        icon: Activity,
        unit: "g",
        min: 50, max: 300, step: 5,
        color: "#5B9CF6",
      },
      {
        key: "carbs_goal_g" as SettingKey,
        label: "Objectif glucides",
        icon: Activity,
        unit: "g",
        min: 50, max: 500, step: 5,
        color: "#34D399",
      },
      {
        key: "fat_goal_g" as SettingKey,
        label: "Objectif lipides",
        icon: Activity,
        unit: "g",
        min: 20, max: 200, step: 5,
        color: "#F472B6",
      },
    ],
  },
  {
    id: "diete",
    label: "Diète",
    icon: Scale,
    color: "#10B981",
    fields: [],
  },
  {
    id: "finances",
    label: "Finances",
    icon: DollarSign,
    color: "#F472B6",
    fields: [
      {
        key: "monthly_budget_eur" as SettingKey,
        label: "Budget mensuel",
        icon: DollarSign,
        unit: "€",
        min: 100, max: 10000, step: 50,
        color: "#F472B6",
      },
    ],
  },
  {
    id: "gamification",
    label: "Score LockIn",
    icon: Trophy,
    color: "#F59E0B",
    fields: [],
  },
  {
    id: "integrations",
    label: "Intégrations",
    icon: Link2,
    color: "#6366F1",
    fields: [],
  },
  {
    id: "apparence",
    label: "Apparence",
    icon: Palette,
    color: "#EC4899",
    fields: [],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "#F59E0B",
    fields: [],
  },
  {
    id: "localisation",
    label: "Localisation",
    icon: Globe,
    color: "#14B8A6",
    fields: [],
  },
  {
    id: "difficulte",
    label: "Difficulté",
    icon: Swords,
    color: "#EF4444",
    fields: [],
  },
  {
    id: "securite",
    label: "Sécurité",
    icon: Shield,
    color: "#8B5CF6",
    fields: [],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } },
};

function SettingRow({
  label,
  fieldKey,
  icon: Icon,
  unit,
  min,
  max,
  step,
  color,
  value,
  onChange,
}: {
  label: string;
  fieldKey: SettingKey;
  icon: any;
  unit: string;
  min: number;
  max: number;
  step: number;
  color: string;
  value: number;
  onChange: (key: SettingKey, v: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const pct = ((localValue - min) / (max - min)) * 100;

  const handleChange = (v: number) => {
    setLocalValue(v);
    onChange(fieldKey, v);
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-black/4 last:border-0">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Label + slider */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-gray-700">{label}</span>
          <span className="text-[13px] font-semibold" style={{ color }}>
            {localValue} {unit}
          </span>
        </div>
        {/* Custom slider */}
        <div className="relative h-1.5 bg-gray-100 rounded-full">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, background: color }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            style={{ zIndex: 2 }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-md transition-all duration-100 pointer-events-none"
            style={{
              left: `calc(${pct}% - 8px)`,
              borderColor: color,
              boxShadow: `0 0 0 3px ${color}20`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-300">{min} {unit}</span>
          <span className="text-[10px] text-gray-300">{max} {unit}</span>
        </div>
      </div>

      {/* Number input */}
      <input
        type="number"
        value={localValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-20 text-right px-2 py-1.5 rounded-xl text-[13px] font-semibold text-gray-700 outline-none"
        style={{
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onFocus={(e) => { e.target.style.border = `1px solid ${color}60`; }}
        onBlur={(e) => { e.target.style.border = "1px solid rgba(0,0,0,0.06)"; }}
      />
    </div>
  );
}

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sédentaire", multiplier: 1.2, hint: "Peu ou pas d'exercice" },
  { value: "light", label: "Légère", multiplier: 1.375, hint: "1-3 fois/semaine" },
  { value: "moderate", label: "Modérée", multiplier: 1.55, hint: "3-5 fois/semaine" },
  { value: "active", label: "Active", multiplier: 1.725, hint: "6-7 fois/semaine" },
  { value: "very_active", label: "Très active", multiplier: 1.9, hint: "Sport intense quotidien" },
];

function calcBMR(weight: number, height: number, age: number): number {
  // Mifflin-St Jeor (male — no gender field, use male formula)
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
}

function calcPreset(bmr: number, activityMultiplier: number, goal: "loss" | "maintenance" | "gain") {
  const tdee = Math.round(bmr * activityMultiplier);
  const cals = goal === "loss" ? tdee - 500 : goal === "gain" ? tdee + 300 : tdee;
  // Protein: 2g/kg body weight or 30% of kcal
  const protein = Math.round((cals * 0.30) / 4);
  const fat = Math.round((cals * 0.25) / 9);
  const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
  return { cals, protein, fat, carbs };
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profil");
  const { settings, updateSetting } = useSettings();
  const [displayName, setDisplayName] = useState(settings.display_name || "");
  const searchParams = useSearchParams();
  const [weight, setWeight] = useState(settings.weight_kg || 75);
  const [height, setHeight] = useState(settings.height_cm || 175);
  const [age, setAge] = useState(settings.age || 25);
  const [activityLevel, setActivityLevel] = useState(settings.activity_level || "moderate");
  const [editableConfig, setEditableConfig] = useState<Record<string, number>>({ ...DEFAULT_POINTS_CONFIG });
  const [badHabits, setBadHabits] = useState<CustomBadHabit[]>([]);
  const [newHabit, setNewHabit] = useState({ label: "", emoji: "🚬", points: -20 });
  const [theme, setTheme] = useState<string>(settings.theme || "space_gray");
  const [currency, setCurrency] = useState<string>(settings.currency || "EUR");
  const [hardcoreMode, setHardcoreMode] = useState<boolean>(settings.hardcore_mode || false);
  const [autoReset33h, setAutoReset33h] = useState<boolean>(settings.auto_reset_33h !== false);
  const [thermalThreshold, setThermalThreshold] = useState<number>(settings.thermal_threshold || 80);
  const [morningTime, setMorningTime] = useState<string>(settings.morning_routine_time || "07:00");
  const [nightTime, setNightTime] = useState<string>(settings.night_routine_time || "22:00");
  const [weeklyBudget, setWeeklyBudget] = useState<number>(settings.weekly_budget_eur || Math.round((settings.monthly_budget_eur || 1500) / 4));

  useEffect(() => {
    setDisplayName(settings.display_name || "");
  }, [settings.display_name]);

  useEffect(() => {
    setEditableConfig({ ...DEFAULT_POINTS_CONFIG, ...(settings.custom_points_config || {}) });
  }, [settings.custom_points_config]);

  useEffect(() => {
    setBadHabits(settings.custom_bad_habits || []);
  }, [settings.custom_bad_habits]);

  useEffect(() => { setTheme(settings.theme || "space_gray"); }, [settings.theme]);
  useEffect(() => { setCurrency(settings.currency || "EUR"); }, [settings.currency]);
  useEffect(() => { setHardcoreMode(settings.hardcore_mode || false); }, [settings.hardcore_mode]);
  useEffect(() => { setAutoReset33h(settings.auto_reset_33h !== false); }, [settings.auto_reset_33h]);
  useEffect(() => { setThermalThreshold(settings.thermal_threshold || 80); }, [settings.thermal_threshold]);
  useEffect(() => { setMorningTime(settings.morning_routine_time || "07:00"); }, [settings.morning_routine_time]);
  useEffect(() => { setNightTime(settings.night_routine_time || "22:00"); }, [settings.night_routine_time]);
  useEffect(() => { setWeeklyBudget(settings.weekly_budget_eur || Math.round((settings.monthly_budget_eur || 1500) / 4)); }, [settings.weekly_budget_eur, settings.monthly_budget_eur]);

  useEffect(() => {
    const strava = searchParams.get("strava");
    if (strava === "connected") toast.success("Strava connecté avec succès !");
    if (strava === "error") toast.error("Erreur de connexion Strava");
  }, [searchParams]);

  const debouncedUpdate = useDebouncedCallback(
    async (key: SettingKey, value: number) => {
      await updateSetting(key, value);
      toast.success("Réglage sauvegardé", { duration: 1500 });
    },
    600
  );

  const debouncedNameUpdate = useDebouncedCallback(async (value: string) => {
    await updateSetting("display_name", value);
    toast.success("Nom mis à jour", { duration: 1500 });
  }, 600);

  const debouncedSaveConfig = useDebouncedCallback(async (config: Record<string, number>) => {
    await upsertSettings({ custom_points_config: config } as any);
    toast.success("Points mis à jour", { duration: 1500 });
  }, 800);

  const currentSection = sections.find((s) => s.id === activeSection)!;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-[13px] font-medium text-gray-400">Configuration</p>
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">
          Réglages ⚙️
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Personnalisez vos objectifs — les graphiques se mettent à jour instantanément.
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-12 gap-5">
        {/* Sidebar navigation — macOS Préférences Système style */}
        <div className="col-span-3">
          <div className="card p-2 space-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
              Catégories
            </p>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:bg-black/5 hover:text-gray-700"
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${section.color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: section.color }} />
                  </span>
                  <span className="flex-1 text-left">{section.label}</span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Info card */}
          <div
            className="mt-4 p-4 rounded-2xl"
            style={{ background: "rgba(91,156,246,0.08)", border: "1px solid rgba(91,156,246,0.15)" }}
          >
            <p className="text-[12px] font-semibold text-blue-600 mb-1">💡 Astuce</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Les anneaux du Dashboard et les graphiques de Nutrition se recalculent instantanément
              quand vous modifiez un objectif.
            </p>
          </div>
        </div>

        {/* Main settings panel */}
        <div className="col-span-9">
          <div className="card">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${currentSection.color}18` }}
              >
                <currentSection.icon className="w-5 h-5" style={{ color: currentSection.color }} />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">{currentSection.label}</h2>
                <p className="text-[12px] text-gray-400">
                  {activeSection === "profil" ? "Nom, intégrations" :
                   activeSection === "gamification" ? "Bonus & malus LockIn Score" :
                   activeSection === "integrations" ? "Strava, Google Cal, Apple iCloud" :
                   activeSection === "apparence" ? "Thèmes et personnalisation visuelle" :
                   activeSection === "notifications" ? "Seuils et horaires de routine" :
                   activeSection === "localisation" ? "Devise, unités et région" :
                   activeSection === "difficulte" ? "Mode hardcore et comportements avancés" :
                   activeSection === "securite" ? "Export de données et journaux" :
                   `${currentSection.fields.length} objectif${currentSection.fields.length > 1 ? "s" : ""} configurables`}
                </p>
              </div>
              {activeSection !== "profil" && (
                <div className="ml-auto">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-600 font-medium">
                    ✓ Auto-sauvegardé
                  </span>
                </div>
              )}
            </div>

            {/* Fields */}
            <div>
              {activeSection === "diete" ? (
                <div className="space-y-6">
                  {/* Body metrics */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Mensurations</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Poids", value: weight, set: setWeight, unit: "kg", min: 40, max: 200, key: "weight_kg" as SettingKey },
                        { label: "Taille", value: height, set: setHeight, unit: "cm", min: 140, max: 220, key: "height_cm" as SettingKey },
                        { label: "Âge", value: age, set: setAge, unit: "ans", min: 15, max: 80, key: "age" as SettingKey },
                      ].map((field) => (
                        <div key={field.key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-gray-400">{field.label}</label>
                          <div className="flex items-center gap-1 px-3 py-2.5 rounded-xl"
                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <input
                              type="number"
                              value={field.value}
                              min={field.min}
                              max={field.max}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                field.set(v);
                                updateSetting(field.key, v);
                              }}
                              className="flex-1 text-[14px] font-semibold text-gray-800 bg-transparent border-none outline-none w-0"
                            />
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{field.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity level */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Niveau d'activité</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {ACTIVITY_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => {
                            setActivityLevel(level.value);
                            updateSetting("activity_level", level.value);
                          }}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all"
                          style={{
                            background: activityLevel === level.value ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.04)",
                            border: activityLevel === level.value ? "1.5px solid rgba(16,185,129,0.4)" : "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <span className="text-[12px] font-semibold" style={{ color: activityLevel === level.value ? "#10B981" : "#6B7280" }}>
                            {level.label}
                          </span>
                          <span className="text-[10px] text-gray-400 leading-tight">{level.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BMR display */}
                  {(() => {
                    const bmr = calcBMR(weight, height, age);
                    const mult = ACTIVITY_LEVELS.find(l => l.value === activityLevel)?.multiplier ?? 1.55;
                    const tdee = Math.round(bmr * mult);
                    return (
                      <div className="p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-emerald-700">Métabolisme calculé</span>
                          <span className="text-[11px] text-gray-400">Mifflin-St Jeor</span>
                        </div>
                        <div className="flex gap-6 mt-2">
                          <div>
                            <p className="text-[11px] text-gray-400">BMR (repos)</p>
                            <p className="text-[18px] font-bold text-gray-800">{bmr} <span className="text-[12px] font-normal text-gray-400">kcal</span></p>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400">TDEE (maintenance)</p>
                            <p className="text-[18px] font-bold text-emerald-600">{tdee} <span className="text-[12px] font-normal text-gray-400">kcal</span></p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Presets */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Appliquer un preset</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { goal: "loss" as const, label: "Perte de poids", emoji: "📉", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", desc: "TDEE − 500 kcal" },
                        { goal: "maintenance" as const, label: "Maintenance", emoji: "⚖️", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", desc: "TDEE exact" },
                        { goal: "gain" as const, label: "Prise de masse", emoji: "📈", color: "#5B9CF6", bg: "rgba(91,156,246,0.08)", border: "rgba(91,156,246,0.25)", desc: "TDEE + 300 kcal" },
                      ] as const).map(({ goal, label, emoji, color, bg, border, desc }) => {
                        const bmr = calcBMR(weight, height, age);
                        const mult = ACTIVITY_LEVELS.find(l => l.value === activityLevel)?.multiplier ?? 1.55;
                        const p = calcPreset(bmr, mult, goal);
                        return (
                          <button
                            key={goal}
                            onClick={async () => {
                              await Promise.all([
                                updateSetting("calorie_goal", p.cals),
                                updateSetting("protein_goal_g", p.protein),
                                updateSetting("carbs_goal_g", p.carbs),
                                updateSetting("fat_goal_g", p.fat),
                                updateSetting("nutrition_goal", goal),
                              ]);
                              toast.success(`Preset "${label}" appliqué — objectifs mis à jour`);
                            }}
                            className="flex flex-col gap-2 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                            style={{ background: bg, border: `1.5px solid ${border}` }}
                          >
                            <span className="text-[20px]">{emoji}</span>
                            <p className="text-[13px] font-semibold" style={{ color }}>{label}</p>
                            <p className="text-[11px] text-gray-400">{desc}</p>
                            <div className="space-y-0.5 mt-1">
                              <p className="text-[11px] text-gray-600 font-medium">{p.cals} kcal/j</p>
                              <p className="text-[10px] text-gray-400">P {p.protein}g · G {p.carbs}g · L {p.fat}g</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : activeSection === "profil" ? (
                <div className="space-y-6">
                  {/* Display name */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                      Nom d'affichage
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      placeholder="Votre prénom"
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        debouncedNameUpdate(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl text-[14px] text-gray-800 outline-none transition-all"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                      onFocus={(e) => { e.target.style.background = "rgba(91,156,246,0.06)"; e.target.style.border = "1px solid rgba(91,156,246,0.45)"; }}
                      onBlur={(e) => { e.target.style.background = "rgba(0,0,0,0.04)"; e.target.style.border = "1px solid rgba(0,0,0,0.08)"; }}
                    />
                    <p className="text-[11px] text-gray-400">Utilisé dans le message de bienvenue du Dashboard.</p>
                  </div>

                  {/* Strava connect */}
                  <div className="pt-4 border-t border-black/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(252,76,2,0.12)" }}>
                        <Zap className="w-5 h-5" style={{ color: "#FC4C02" }} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-gray-900">Strava</h3>
                        <p className="text-[12px] text-gray-400">Synchronisez vos activités automatiquement</p>
                      </div>
                      {settings.strava_connected && (
                        <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-600 font-medium">
                          ✓ Connecté
                        </span>
                      )}
                    </div>
                    {settings.strava_connected ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl" style={{ background: "rgba(252,76,2,0.06)", border: "1px solid rgba(252,76,2,0.12)" }}>
                          <p className="text-[12px] text-gray-600">
                            Compte Strava connecté. Vos activités sont synchronisées automatiquement.
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            const res = await fetch("/api/strava/sync");
                            if (res.ok) { toast.success("Activités Strava synchronisées !"); }
                            else { toast.error("Erreur de synchronisation"); }
                          }}
                          className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                          style={{ background: "linear-gradient(135deg, #FC4C02, #E84C00)", boxShadow: "0 4px 16px rgba(252,76,2,0.3)" }}
                        >
                          Synchroniser maintenant
                        </button>
                        <button
                          onClick={async () => {
                            await updateSetting("strava_connected", false);
                            toast.success("Strava déconnecté");
                          }}
                          className="w-full py-2 rounded-xl text-[12px] font-medium text-gray-500 hover:text-gray-700 hover:bg-black/5 transition-all"
                        >
                          Déconnecter Strava
                        </button>
                      </div>
                    ) : (
                      <a
                        href="/api/strava/auth"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #FC4C02, #E84C00)", boxShadow: "0 4px 16px rgba(252,76,2,0.3)" }}
                      >
                        <Zap className="w-4 h-4" />
                        Connecter Strava
                      </a>
                    )}
                  </div>
                </div>
              ) : activeSection === "gamification" ? (
                <div className="space-y-6">
                  {/* Built-in actions — editable points */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Actions positives</p>
                    <p className="text-[11px] text-gray-400 mb-3">Modifie la valeur en points de chaque action.</p>
                    {Object.entries({
                      seance_validee:   { label: "Séance validée", emoji: "🏋️", positive: true },
                      objectif_eau:     { label: "Objectif eau atteint", emoji: "💧", positive: true },
                      repas_sain:       { label: "Repas enregistré", emoji: "🥗", positive: true },
                      supplement_check: { label: "Supplément pris", emoji: "💊", positive: true },
                    }).map(([key, conf]) => {
                      const color = "#34D399";
                      return (
                        <div key={key} className="flex items-center gap-4 py-3 border-b border-black/4 last:border-0">
                          <span className="text-xl">{conf.emoji}</span>
                          <p className="flex-1 text-[13px] font-medium text-gray-700">{conf.label}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-[12px] font-semibold text-gray-400">+</span>
                            <input
                              type="number"
                              min={1} max={200} step={5}
                              value={editableConfig[key] ?? DEFAULT_POINTS_CONFIG[key]}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                const updated = { ...editableConfig, [key]: v };
                                setEditableConfig(updated);
                                debouncedSaveConfig(updated);
                              }}
                              className="w-16 text-center px-2 py-1.5 rounded-xl text-[13px] font-bold outline-none"
                              style={{ background: "rgba(52,211,153,0.08)", border: "1.5px solid rgba(52,211,153,0.3)", color }}
                            />
                            <span className="text-[11px] text-gray-400">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions négatives</p>
                    {Object.entries({
                      uber_eats:      { label: "Uber Eats / Junk food", emoji: "🍔" },
                      seance_manquee: { label: "Séance manquée", emoji: "😴" },
                      alcool:         { label: "Alcool", emoji: "🍺" },
                    }).map(([key, conf]) => {
                      const color = "#F87171";
                      const currentVal = editableConfig[key] ?? DEFAULT_POINTS_CONFIG[key];
                      return (
                        <div key={key} className="flex items-center gap-4 py-3 border-b border-black/4 last:border-0">
                          <span className="text-xl">{conf.emoji}</span>
                          <p className="flex-1 text-[13px] font-medium text-gray-700">{conf.label}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-[12px] font-semibold text-gray-400">−</span>
                            <input
                              type="number"
                              min={1} max={200} step={5}
                              value={Math.abs(currentVal)}
                              onChange={(e) => {
                                const v = -Math.abs(Number(e.target.value));
                                const updated = { ...editableConfig, [key]: v };
                                setEditableConfig(updated);
                                debouncedSaveConfig(updated);
                              }}
                              className="w-16 text-center px-2 py-1.5 rounded-xl text-[13px] font-bold outline-none"
                              style={{ background: "rgba(248,113,113,0.08)", border: "1.5px solid rgba(248,113,113,0.3)", color }}
                            />
                            <span className="text-[11px] text-gray-400">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom bad habits */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Mauvaises habitudes personnalisées</p>
                    {badHabits.length > 0 && (
                      <div className="space-y-1.5 mb-4">
                        {badHabits.map((habit) => (
                          <div key={habit.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
                            <span className="text-lg">{habit.emoji}</span>
                            <span className="flex-1 text-[13px] font-medium text-gray-700">{habit.label}</span>
                            <span className="text-[13px] font-bold text-red-400">{habit.points} pts</span>
                            <button
                              onClick={async () => {
                                const updated = badHabits.filter((h) => h.id !== habit.id);
                                setBadHabits(updated);
                                await upsertSettings({ custom_bad_habits: updated } as any);
                                toast.success("Habitude supprimée");
                              }}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors text-red-400 text-[14px]"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add form */}
                    <div className="flex items-center gap-2 p-3 rounded-2xl"
                      style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.1)" }}>
                      <input
                        type="text"
                        placeholder="Emoji"
                        value={newHabit.emoji}
                        onChange={(e) => setNewHabit((p) => ({ ...p, emoji: e.target.value }))}
                        className="w-12 text-center px-1 py-1.5 rounded-xl text-[16px] bg-white border border-black/8 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Nom de l'habitude"
                        value={newHabit.label}
                        onChange={(e) => setNewHabit((p) => ({ ...p, label: e.target.value }))}
                        className="flex-1 px-3 py-1.5 rounded-xl text-[13px] bg-white border border-black/8 outline-none text-gray-700"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] text-gray-400">−</span>
                        <input
                          type="number"
                          min={1} max={200} step={5}
                          value={Math.abs(newHabit.points)}
                          onChange={(e) => setNewHabit((p) => ({ ...p, points: -Math.abs(Number(e.target.value)) }))}
                          className="w-14 text-center px-2 py-1.5 rounded-xl text-[13px] font-bold bg-white border border-black/8 outline-none text-red-400"
                        />
                      </div>
                      <button
                        disabled={!newHabit.label.trim()}
                        onClick={async () => {
                          if (!newHabit.label.trim()) return;
                          const habit: CustomBadHabit = { id: Date.now().toString(), ...newHabit };
                          const updated = [...badHabits, habit];
                          setBadHabits(updated);
                          await upsertSettings({ custom_bad_habits: updated } as any);
                          setNewHabit({ label: "", emoji: "🚬", points: -20 });
                          toast.success("Habitude ajoutée");
                        }}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white transition-all disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #F87171, #EF4444)" }}
                      >
                        + Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Daily goal info */}
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <p className="text-[12px] font-semibold text-amber-700 mb-1">🎯 Objectif journalier</p>
                    <p className="text-[22px] font-bold text-amber-600">100 pts</p>
                    <p className="text-[11px] text-gray-500 mt-1">Atteins 100 pts/jour pour valider ta journée et maintenir ta série 🔥</p>
                  </div>
                </div>
              ) : activeSection === "integrations" ? (
                <div className="space-y-6">
                  {/* Strava */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(252,76,2,0.12)" }}>
                      <Zap className="w-5 h-5" style={{ color: "#FC4C02" }} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-gray-900">Strava</h3>
                      <p className="text-[12px] text-gray-400">Synchronisez vos activités sportives</p>
                    </div>
                    {settings.strava_connected && (
                      <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-600 font-medium">✓ Connecté</span>
                    )}
                  </div>
                  {settings.strava_connected ? (
                    <div className="space-y-2 mb-6">
                      <button onClick={async () => { const res = await fetch("/api/strava/sync"); if (res.ok) toast.success("Strava synchronisé !"); else toast.error("Erreur"); }}
                        className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #FC4C02, #E84C00)" }}>
                        Synchroniser maintenant
                      </button>
                      <button onClick={async () => { await updateSetting("strava_connected", false); toast.success("Strava déconnecté"); }}
                        className="w-full py-2 rounded-xl text-[12px] font-medium text-gray-500 hover:bg-black/5 transition-all">
                        Déconnecter
                      </button>
                    </div>
                  ) : (
                    <a href="/api/strava/auth"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold text-white mb-6"
                      style={{ background: "linear-gradient(135deg, #FC4C02, #E84C00)", boxShadow: "0 4px 16px rgba(252,76,2,0.3)" }}>
                      <Zap className="w-4 h-4" /> Connecter Strava
                    </a>
                  )}

                  {/* Google Calendar */}
                  <div className="border-t border-black/5 pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(66,133,244,0.12)" }}>
                        <Calendar className="w-5 h-5" style={{ color: "#4285F4" }} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-gray-900">Google Calendar</h3>
                        <p className="text-[12px] text-gray-400">Synchronisation bidirectionnelle des événements</p>
                      </div>
                      <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">Bientôt</span>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(66,133,244,0.06)", border: "1px dashed rgba(66,133,244,0.2)" }}>
                      <p className="text-[12px] text-gray-500">L'intégration Google Calendar sera disponible prochainement via OAuth 2.0.</p>
                    </div>
                  </div>

                  {/* Apple iCloud */}
                  <div className="border-t border-black/5 pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <Cloud className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-gray-900">Apple iCloud</h3>
                        <p className="text-[12px] text-gray-400">Calendrier & Rappels Apple</p>
                      </div>
                      <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">Bientôt</span>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.1)" }}>
                      <p className="text-[12px] text-gray-500">L'intégration iCloud nécessite CalDAV — disponible dans une prochaine mise à jour.</p>
                    </div>
                  </div>
                </div>
              ) : activeSection === "apparence" ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Thème de l'interface</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: "space_gray", label: "Space Gray", bg: "linear-gradient(135deg, #1C1C1E, #2C2C2E)", accent: "#5B9CF6", preview: "#3A3A3C" },
                        { id: "deep_black", label: "Deep Black", bg: "linear-gradient(135deg, #000000, #0D0D0D)", accent: "#A78BFA", preview: "#1A1A1A" },
                        { id: "midnight_blue", label: "Midnight Blue", bg: "linear-gradient(135deg, #0F0F2E, #1A1A4E)", accent: "#34D399", preview: "#1E1E5E" },
                      ] as const).map((t) => (
                        <button key={t.id} onClick={async () => { setTheme(t.id); await updateSetting("theme" as any, t.id); toast.success(`Thème "${t.label}" appliqué`); }}
                          className="flex flex-col gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                          style={{ background: theme === t.id ? `${t.accent}12` : "rgba(0,0,0,0.03)", border: `1.5px solid ${theme === t.id ? t.accent + "50" : "rgba(0,0,0,0.08)"}` }}>
                          <div className="w-full h-16 rounded-xl overflow-hidden relative" style={{ background: t.bg }}>
                            <div className="absolute bottom-2 left-2 right-2 h-2 rounded-full opacity-40" style={{ background: t.accent }} />
                            <div className="absolute top-2 left-2 w-8 h-2 rounded-full opacity-60" style={{ background: t.preview }} />
                          </div>
                          <p className="text-[13px] font-semibold" style={{ color: theme === t.id ? t.accent : "#6B7280" }}>{t.label}</p>
                          {theme === t.id && <span className="text-[10px] font-medium" style={{ color: t.accent }}>✓ Actif</span>}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">Le thème sera appliqué au prochain rechargement de page.</p>
                  </div>
                </div>
              ) : activeSection === "notifications" ? (
                <div className="space-y-6">
                  {/* Thermal threshold */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Roue thermique — seuil d'alerte</p>
                    <p className="text-[11px] text-gray-400 mb-4">La roue thermique passe à l'orange à ce pourcentage de dépense hebdomadaire.</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[12px] text-gray-500">Seuil</span>
                          <span className="text-[13px] font-bold" style={{ color: "#F59E0B" }}>{thermalThreshold}%</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full">
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${thermalThreshold}%`, background: "linear-gradient(to right, #34D399, #F59E0B, #EF4444)" }} />
                          <input type="range" min={50} max={100} step={5} value={thermalThreshold}
                            onChange={async (e) => { const v = Number(e.target.value); setThermalThreshold(v); await updateSetting("thermal_threshold" as any, v); }}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" style={{ zIndex: 2 }} />
                          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-amber-400 shadow-md pointer-events-none"
                            style={{ left: `calc(${((thermalThreshold - 50) / 50) * 100}% - 8px)` }} />
                        </div>
                        <div className="flex justify-between mt-1"><span className="text-[10px] text-gray-300">50%</span><span className="text-[10px] text-gray-300">100%</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Routine times */}
                  <div className="border-t border-black/5 pt-5">
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Horaires de routine</p>
                    <div className="space-y-3">
                      {[
                        { label: "Routine du matin", icon: Sun, value: morningTime, set: setMorningTime, key: "morning_routine_time", color: "#F59E0B" },
                        { label: "Routine du soir", icon: Moon, value: nightTime, set: setNightTime, key: "night_routine_time", color: "#818CF8" },
                      ].map(({ label, icon: Icon, value, set, key, color }) => (
                        <div key={key} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <span className="flex-1 text-[13px] font-medium text-gray-700">{label}</span>
                          <input type="time" value={value}
                            onChange={async (e) => { set(e.target.value); await updateSetting(key as any, e.target.value); toast.success("Horaire mis à jour", { duration: 1200 }); }}
                            className="px-3 py-1.5 rounded-xl text-[13px] font-semibold outline-none"
                            style={{ background: `${color}10`, border: `1.5px solid ${color}30`, color }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeSection === "localisation" ? (
                <div className="space-y-6">
                  {/* Currency */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Devise</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "EUR", symbol: "€", label: "Euro" },
                        { id: "USD", symbol: "$", label: "Dollar US" },
                        { id: "GBP", symbol: "£", label: "Livre sterling" },
                      ].map((c) => (
                        <button key={c.id} onClick={async () => { setCurrency(c.id); await updateSetting("currency" as any, c.id); toast.success(`Devise : ${c.label}`); }}
                          className="flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all"
                          style={{ background: currency === c.id ? "rgba(20,184,166,0.12)" : "rgba(0,0,0,0.03)", border: `1.5px solid ${currency === c.id ? "rgba(20,184,166,0.4)" : "rgba(0,0,0,0.08)"}` }}>
                          <span className="text-[24px] font-bold" style={{ color: currency === c.id ? "#14B8A6" : "#9CA3AF" }}>{c.symbol}</span>
                          <span className="text-[12px] font-semibold" style={{ color: currency === c.id ? "#14B8A6" : "#6B7280" }}>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget hebdo */}
                  <div className="border-t border-black/5 pt-5">
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Budget hebdomadaire</p>
                    <p className="text-[11px] text-gray-400 mb-3">Utilisé pour la roue thermique. Par défaut = budget mensuel ÷ 4.</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-[13px] font-medium text-gray-700">Limite hebdomadaire</span>
                      <div className="flex items-center gap-1">
                        <input type="number" min={50} max={5000} step={25} value={weeklyBudget}
                          onChange={async (e) => { const v = Number(e.target.value); setWeeklyBudget(v); await updateSetting("weekly_budget_eur" as any, v); }}
                          className="w-24 text-right px-2 py-1.5 rounded-xl text-[13px] font-bold text-teal-600 outline-none"
                          style={{ background: "rgba(20,184,166,0.08)", border: "1.5px solid rgba(20,184,166,0.3)" }} />
                        <span className="text-[12px] text-gray-400">{currency === "EUR" ? "€" : currency === "USD" ? "$" : "£"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeSection === "difficulte" ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="text-[12px] font-semibold text-red-600 mb-1">⚠️ Mode avancé</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">Ces options modifient le comportement de la gamification. Activer avec prudence.</p>
                  </div>

                  {/* Hardcore mode */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: hardcoreMode ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.03)", border: `1.5px solid ${hardcoreMode ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.08)"}`, transition: "all 0.3s" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hardcoreMode ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.06)" }}>
                      <Swords className="w-5 h-5" style={{ color: hardcoreMode ? "#EF4444" : "#9CA3AF" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-gray-900">Mode Hardcore</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">Malus ×2 · Flamme à 200 pts/jour · Pas de rattrapage</p>
                    </div>
                    <button onClick={async () => { const next = !hardcoreMode; setHardcoreMode(next); await updateSetting("hardcore_mode" as any, next); toast.success(next ? "Mode Hardcore activé 🔥" : "Mode Hardcore désactivé"); }}>
                      {hardcoreMode
                        ? <ToggleRight className="w-8 h-8" style={{ color: "#EF4444" }} />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                  </div>

                  {/* Auto-reset 33h */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: autoReset33h ? "rgba(91,156,246,0.06)" : "rgba(0,0,0,0.03)", border: `1.5px solid ${autoReset33h ? "rgba(91,156,246,0.25)" : "rgba(0,0,0,0.08)"}`, transition: "all 0.3s" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: autoReset33h ? "rgba(91,156,246,0.15)" : "rgba(0,0,0,0.06)" }}>
                      <Bell className="w-5 h-5" style={{ color: autoReset33h ? "#5B9CF6" : "#9CA3AF" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-gray-900">Auto-Reset 33h</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">Rappel automatique si aucune action depuis 33h</p>
                    </div>
                    <button onClick={async () => { const next = !autoReset33h; setAutoReset33h(next); await updateSetting("auto_reset_33h" as any, next); toast.success(next ? "Auto-reset activé" : "Auto-reset désactivé"); }}>
                      {autoReset33h
                        ? <ToggleRight className="w-8 h-8" style={{ color: "#5B9CF6" }} />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                  </div>
                </div>
              ) : activeSection === "securite" ? (
                <div className="space-y-6">
                  {/* Export */}
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Exporter mes données</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const data = JSON.stringify(settings, null, 2);
                          const blob = new Blob([data], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = `lockin-export-${new Date().toISOString().slice(0, 10)}.json`;
                          a.click(); URL.revokeObjectURL(url);
                          toast.success("Export JSON téléchargé");
                        }}
                        className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", boxShadow: "0 4px 16px rgba(139,92,246,0.3)" }}>
                        <Download className="w-4 h-4" /> Export JSON
                      </button>
                      <button
                        onClick={() => {
                          const headers = "Clé,Valeur\n";
                          const rows = Object.entries(settings).map(([k, v]) => `${k},"${String(v).replace(/"/g, '""')}"`).join("\n");
                          const blob = new Blob([headers + rows], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = `lockin-export-${new Date().toISOString().slice(0, 10)}.csv`;
                          a.click(); URL.revokeObjectURL(url);
                          toast.success("Export CSV téléchargé");
                        }}
                        className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[13px] font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ background: "rgba(139,92,246,0.1)", border: "1.5px solid rgba(139,92,246,0.3)", color: "#8B5CF6" }}>
                        <Download className="w-4 h-4" /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Clear logs */}
                  <div className="border-t border-black/5 pt-5">
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Nettoyage sélectif</p>
                    <p className="text-[11px] text-gray-400 mb-4">Supprimer des données spécifiques. Cette action est irréversible.</p>
                    <div className="space-y-2">
                      {[
                        { label: "Effacer l'historique des points", desc: "Supprime tous les logs de points LockIn", table: "points_history", color: "#F59E0B" },
                        { label: "Effacer les logs sommeil", desc: "Supprime toutes les entrées de sommeil", table: "sleep_logs", color: "#818CF8" },
                        { label: "Effacer les mémos", desc: "Supprime tous les mémos et notes", table: "memos", color: "#34D399" },
                      ].map(({ label, desc, table, color }) => (
                        <div key={table} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                          <div className="flex-1">
                            <p className="text-[13px] font-medium text-gray-700">{label}</p>
                            <p className="text-[11px] text-gray-400">{desc}</p>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Confirmer la suppression de ${label.toLowerCase()} ?`)) {
                                toast.error(`Suppression de ${table} — connectez-vous à Supabase pour confirmer`);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90"
                            style={{ background: `${color}12`, border: `1px solid ${color}30`, color }}>
                            <Trash2 className="w-3.5 h-3.5" /> Effacer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {currentSection.fields.map((field) => (
                    <SettingRow
                      key={field.key}
                      label={field.label}
                      fieldKey={field.key}
                      icon={field.icon}
                      unit={field.unit}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      color={field.color}
                      value={settings[field.key] as number}
                      onChange={debouncedUpdate}
                    />
                  ))}
                  {activeSection === "sante" && (
                    <div className="flex items-center gap-4 py-4 border-t border-black/4 mt-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(129,140,248,0.12)" }}>
                        <Moon className="w-4 h-4" style={{ color: "#818CF8" }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-700">Heure de coucher cible</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Heure idéale pour aller dormir</p>
                      </div>
                      <input
                        type="time"
                        value={settings.sleep_target_time || "23:00"}
                        onChange={(e) => updateSetting("sleep_target_time" as any, e.target.value)}
                        className="px-3 py-2 rounded-xl text-[13px] font-semibold text-gray-700 outline-none"
                        style={{ background: "rgba(129,140,248,0.08)", border: "1.5px solid rgba(129,140,248,0.3)", color: "#818CF8" }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Reset to defaults */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={async () => {
                for (const [k, v] of Object.entries({
                  water_goal_ml: 2000,
                  calorie_goal: 2200,
                  protein_goal_g: 165,
                  carbs_goal_g: 250,
                  fat_goal_g: 75,
                  steps_goal: 10000,
                  workout_sessions_per_week: 4,
                  monthly_budget_eur: 1500,
                  sleep_goal_hours: 8,
                })) {
                  await updateSetting(k as SettingKey, v);
                }
                toast.success("Réglages réinitialisés");
              }}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5"
            >
              Réinitialiser les valeurs par défaut
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
