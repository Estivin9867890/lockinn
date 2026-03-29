"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Droplets, Flame, Footprints, Dumbbell, DollarSign,
  Moon, Apple, Activity, Settings, ChevronRight, User, Zap, Scale,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useDebouncedCallback } from "use-debounce";
import type { UserSettings } from "@/lib/types";

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

  useEffect(() => {
    setDisplayName(settings.display_name || "");
  }, [settings.display_name]);

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
                  {activeSection === "profil" ? "Nom, intégrations" : `${currentSection.fields.length} objectif${currentSection.fields.length > 1 ? "s" : ""} configurables`}
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
              ) : (
                currentSection.fields.map((field) => (
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
                ))
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
