"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Trophy, Calendar, Dumbbell, Edit3, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addSession, deleteSession } from "@/lib/actions/sport";
import { getPRs, addPR, deletePR } from "@/lib/actions/pr";
import { getWeeklyProgram, upsertWorkoutDay, deleteWorkoutDay } from "@/lib/actions/program";
import { addPoints } from "@/lib/actions/points";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton, KPIRowSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/ui/Modal";
import type { SportSession, PRRecord, WorkoutDay, WorkoutExercise } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const SESSION_EMOJI: Record<string, string> = {
  Course: "🏃", Vélo: "🚴", Muscu: "🏋️", Escalade: "🧗", Skate: "🛹",
  Yoga: "🧘", Natation: "🏊", Autre: "💪",
};

const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SESSION_TYPES = ["Course", "Vélo", "Muscu", "Escalade", "Skate", "Yoga", "Natation", "Autre"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

type Tab = "sessions" | "programme" | "records";

export default function SportPage() {
  const [tab, setTab] = useState<Tab>("sessions");
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [program, setProgram] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Session modal
  const [sessionModal, setSessionModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [sesDate, setSesDate] = useState(new Date().toISOString().split("T")[0]);
  const [sesType, setSesType] = useState("Muscu");
  const [sesDuration, setSesDuration] = useState("");
  const [sesFeeling, setSesFeeling] = useState(7);
  const [sesNotes, setSesNotes] = useState("");

  // PR modal
  const [prModal, setPrModal] = useState(false);
  const [prExercise, setPrExercise] = useState("");
  const [prWeight, setPrWeight] = useState("");
  const [prReps, setPrReps] = useState("");
  const [prDate, setPrDate] = useState(new Date().toISOString().split("T")[0]);
  const [prNotes, setPrNotes] = useState("");

  // Program modal
  const [programModal, setProgramModal] = useState(false);
  const [editingDay, setEditingDay] = useState<number>(0);
  const [dayLabel, setDayLabel] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    { name: "", sets: 4, reps: "8-12", weight: "" },
  ]);

  const load = async () => {
    setLoading(true);
    const [se, pr, pg] = await Promise.all([
      supabase.from("sport_sessions").select("*").order("date", { ascending: false }).limit(30),
      getPRs(),
      getWeeklyProgram(),
    ]);
    setSessions(se.data || []);
    setPrs(pr);
    setProgram(pg);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Session handlers
  const handleAddSession = async () => {
    if (!sesDuration) return;
    setPending(true);
    try {
      const newSes = await addSession({
        date: sesDate, type: sesType,
        duration_min: parseInt(sesDuration),
        feeling: sesFeeling,
        notes: sesNotes || undefined,
      });
      setSessions((prev) => [newSes, ...prev]);
      await addPoints("seance_validee", `Session ${sesType} — ${sesDuration}min`);
      toast.success("💪 Session enregistrée ! +50 pts");
      setSessionModal(false);
      setSesDuration(""); setSesNotes(""); setSesFeeling(7);
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleDeleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try { await deleteSession(id); toast.success("Session supprimée"); }
    catch { load(); }
  };

  // PR handlers
  const handleAddPR = async () => {
    if (!prExercise) return;
    setPending(true);
    try {
      const newPR = await addPR({
        exercise: prExercise,
        weight_kg: prWeight ? parseFloat(prWeight) : undefined,
        reps: prReps ? parseInt(prReps) : undefined,
        date: prDate,
        notes: prNotes || undefined,
      });
      setPrs((prev) => [newPR, ...prev]);
      toast.success("🏆 Record enregistré !");
      setPrModal(false);
      setPrExercise(""); setPrWeight(""); setPrReps(""); setPrNotes("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleDeletePR = async (id: string) => {
    setPrs((prev) => prev.filter((p) => p.id !== id));
    try { await deletePR(id); }
    catch { load(); }
  };

  // Program handlers
  const openProgramModal = (dayIndex: number) => {
    const existing = program.find((p) => p.day_of_week === dayIndex);
    setEditingDay(dayIndex);
    setDayLabel(existing?.label || "");
    setExercises(existing?.exercises?.length ? existing.exercises : [{ name: "", sets: 4, reps: "8-12", weight: "" }]);
    setProgramModal(true);
  };

  const handleSaveDay = async () => {
    const validExercises = exercises.filter((e) => e.name.trim());
    if (!dayLabel.trim() && validExercises.length === 0) return;
    setPending(true);
    try {
      const updated = await upsertWorkoutDay(editingDay, dayLabel || WEEK_DAYS[editingDay], validExercises);
      setProgram((prev) => {
        const filtered = prev.filter((p) => p.day_of_week !== editingDay);
        return [...filtered, updated].sort((a, b) => a.day_of_week - b.day_of_week);
      });
      toast.success("Programme mis à jour !");
      setProgramModal(false);
    } catch { toast.error("Erreur lors de la sauvegarde"); }
    setPending(false);
  };

  const addExercise = () => setExercises((prev) => [...prev, { name: "", sets: 4, reps: "8-12", weight: "" }]);
  const removeExercise = (i: number) => setExercises((prev) => prev.filter((_, idx) => idx !== i));
  const updateExercise = (i: number, field: keyof WorkoutExercise, value: string | number) =>
    setExercises((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  // Stats
  const avgFeeling = sessions.filter((s) => s.feeling).length > 0
    ? (sessions.filter((s) => s.feeling).reduce((s, x) => s + (x.feeling || 0), 0) / sessions.filter((s) => s.feeling).length).toFixed(1)
    : "—";
  const totalMin = sessions.reduce((s, x) => s + x.duration_min, 0);
  const thisMonthCount = sessions.filter((s) => s.date?.startsWith(new Date().toISOString().slice(0, 7))).length;

  // Feeling chart data (last 10 sessions with feeling)
  const feelingData = sessions
    .filter((s) => s.feeling)
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({ i: i + 1, feeling: s.feeling, type: s.type, date: s.date }));

  // Group PRs by exercise (best record)
  const prByExercise: Record<string, PRRecord[]> = {};
  for (const pr of prs) {
    if (!prByExercise[pr.exercise]) prByExercise[pr.exercise] = [];
    prByExercise[pr.exercise].push(pr);
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <KPIRowSkeleton cols={4} />
      <CardSkeleton className="h-80" />
    </div>
  );

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "sessions", label: "Sessions", icon: Dumbbell },
    { id: "programme", label: "Programme", icon: Calendar },
    { id: "records", label: "Records", icon: Trophy },
  ];

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Sport 🏋️</h1>
        </div>
        <div className="flex items-center gap-2">
          {tab === "sessions" && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSessionModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
              style={{ background: "linear-gradient(135deg, #34D399, #10B981)", boxShadow: "0 4px 16px rgba(52,211,153,0.35)" }}>
              <Plus className="w-4 h-4" /> Session
            </motion.button>
          )}
          {tab === "records" && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setPrModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.35)" }}>
              <Plus className="w-4 h-4" /> Nouveau Record
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Sessions ce mois", value: thisMonthCount, icon: "🏋️", color: "#34D399" },
          { label: "Ressenti moyen", value: avgFeeling !== "—" ? `${avgFeeling}/10` : "—", icon: "💯", color: "#5B9CF6" },
          { label: "Records enregistrés", value: Object.keys(prByExercise).length, icon: "🏆", color: "#F59E0B" },
          { label: "Temps total", value: `${Math.floor(totalMin / 60)}h${totalMin % 60}m`, icon: "⏱️", color: "#A78BFA" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
            <span className="text-2xl mb-3 block">{kpi.icon}</span>
            <p className="text-[22px] font-semibold text-gray-900 leading-none">{kpi.value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <div className="flex items-center gap-1 p-1 rounded-2xl w-fit"
          style={{ background: "rgba(0,0,0,0.05)" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                style={{
                  background: tab === t.id ? "rgba(255,255,255,0.9)" : "transparent",
                  color: tab === t.id ? "#1F2937" : "#9CA3AF",
                  boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── Tab: Sessions ── */}
        {tab === "sessions" && (
          <motion.div key="sessions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
            {/* Feeling chart */}
            {feelingData.length > 0 && (
              <div className="card">
                <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Courbe de Ressenti</h3>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={feelingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                      <XAxis dataKey="type" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[1, 10]} hide />
                      <Tooltip
                        contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }}
                        formatter={(v: any) => [`${v}/10`, "Ressenti"]}
                      />
                      <Line type="monotone" dataKey="feeling" stroke="#5B9CF6" strokeWidth={2.5}
                        dot={{ fill: "#5B9CF6", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sessions grid */}
            <div className="card">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-4">Historique des sessions</h2>
              {sessions.length === 0 ? (
                <EmptyState icon={Dumbbell} title="Aucune session enregistrée"
                  description='Utilisez le bouton "+ Session" pour commencer à tracker vos entraînements.'
                  color="#34D399" action={{ label: "+ Ajouter une session", onClick: () => setSessionModal(true) }} />
              ) : (
                <div className="grid grid-cols-7 gap-3">
                  {sessions.slice(0, 14).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.03 }} whileHover={{ y: -3 }}
                      className="group p-4 rounded-2xl text-center relative cursor-pointer"
                      style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <p className="text-[11px] text-gray-400 mb-1">{s.date?.slice(5).replace("-", "/")}</p>
                      <p className="text-2xl mb-1">{SESSION_EMOJI[s.type] || "💪"}</p>
                      <p className="text-[12px] font-semibold text-gray-700">{s.type}</p>
                      <p className="text-[11px] text-gray-400">{s.duration_min}min</p>
                      {s.feeling && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <span className="text-[10px] font-semibold text-apple-blue">{s.feeling}/10</span>
                        </div>
                      )}
                      <button onClick={() => handleDeleteSession(s.id)}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center transition-opacity">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Tab: Programme ── */}
        {tab === "programme" && (
          <motion.div key="programme" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-gray-800">Programme de la semaine</h2>
                <p className="text-[12px] text-gray-400">Clique sur un jour pour éditer</p>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {WEEK_DAYS.map((day, i) => {
                  const dayPlan = program.find((p) => p.day_of_week === i);
                  return (
                    <motion.button key={i} onClick={() => openProgramModal(i)}
                      whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="group p-4 rounded-2xl text-left min-h-[180px] flex flex-col transition-all"
                      style={{
                        background: dayPlan ? "rgba(91,156,246,0.08)" : "rgba(0,0,0,0.03)",
                        border: dayPlan ? "1px solid rgba(91,156,246,0.2)" : "1px dashed rgba(0,0,0,0.1)",
                      }}>
                      <p className="text-[11px] font-semibold text-gray-400 mb-2">{day.slice(0, 3).toUpperCase()}</p>
                      {dayPlan ? (
                        <>
                          <p className="text-[12px] font-bold text-gray-800 mb-2 leading-tight">{dayPlan.label}</p>
                          <div className="space-y-1 flex-1">
                            {(dayPlan.exercises || []).slice(0, 4).map((ex, j) => (
                              <p key={j} className="text-[10px] text-gray-500 truncate">
                                • {ex.name} {ex.sets}×{ex.reps}
                              </p>
                            ))}
                            {(dayPlan.exercises || []).length > 4 && (
                              <p className="text-[10px] text-gray-400">+{(dayPlan.exercises || []).length - 4} autres</p>
                            )}
                          </div>
                          <Edit3 className="w-3.5 h-3.5 text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                          <span className="text-2xl mb-1">🧘</span>
                          <p className="text-[10px] text-gray-400">Repos</p>
                          <p className="text-[9px] text-gray-300 mt-1">+ Ajouter</p>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Tab: Records ── */}
        {tab === "records" && (
          <motion.div key="records" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {Object.keys(prByExercise).length === 0 ? (
              <div className="card">
                <EmptyState icon={Trophy} title="Aucun record enregistré"
                  description='Appuie sur "+ Nouveau Record" pour commencer à tracker tes performances.'
                  color="#F59E0B" action={{ label: "+ Ajouter un record", onClick: () => setPrModal(true) }} />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(prByExercise).map(([exercise, records]) => {
                  const best = records.reduce((b, r) => {
                    if (!b) return r;
                    if (r.weight_kg && b.weight_kg && r.weight_kg > b.weight_kg) return r;
                    return b;
                  }, records[0]);
                  return (
                    <motion.div key={exercise} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: "rgba(245,158,11,0.12)" }}>🏆</div>
                          <div>
                            <p className="text-[15px] font-semibold text-gray-900">{exercise}</p>
                            <p className="text-[12px] text-gray-400">
                              Meilleur: {best.weight_kg ? `${best.weight_kg} kg` : "—"}
                              {best.reps ? ` × ${best.reps} reps` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-[13px] font-bold" style={{ color: "#F59E0B" }}>
                          {best.weight_kg ? `${best.weight_kg}kg` : best.reps ? `${best.reps} reps` : "—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {records.map((r) => (
                          <div key={r.id} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-black/3 transition-colors">
                            <span className="text-[11px] text-gray-400 w-20 flex-shrink-0">{r.date}</span>
                            <span className="text-[12px] text-gray-700 flex-1">
                              {r.weight_kg ? `${r.weight_kg} kg` : "—"}
                              {r.reps ? ` × ${r.reps} reps` : ""}
                              {r.notes ? ` · ${r.notes}` : ""}
                            </span>
                            {r.weight_kg === best.weight_kg && r.id === best.id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>PR</span>
                            )}
                            <button onClick={() => handleDeletePR(r.id)}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center transition-opacity">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Nouvelle Session ── */}
      <Modal open={sessionModal} onClose={() => setSessionModal(false)} title="Logger une session" accentColor="#34D399">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date" required>
              <FormInput value={sesDate} onChange={setSesDate} type="date" />
            </FormField>
            <FormField label="Type" required>
              <FormSelect value={sesType} onChange={setSesType}
                options={SESSION_TYPES.map((t) => ({ value: t, label: `${SESSION_EMOJI[t] || "💪"} ${t}` }))} />
            </FormField>
          </div>
          <FormField label="Durée (min)" required>
            <FormInput placeholder="60" value={sesDuration} onChange={setSesDuration} type="number" min={1} />
          </FormField>

          {/* Feeling slider */}
          <FormField label={`Ressenti — ${sesFeeling}/10`}>
            <div className="space-y-2">
              <div className="relative h-2 bg-gray-100 rounded-full">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${((sesFeeling - 1) / 9) * 100}%`,
                    background: sesFeeling >= 8 ? "#34D399" : sesFeeling >= 5 ? "#5B9CF6" : "#F87171",
                  }} />
                <input type="range" min={1} max={10} step={1} value={sesFeeling}
                  onChange={(e) => setSesFeeling(parseInt(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" style={{ zIndex: 2 }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-md pointer-events-none transition-all"
                  style={{
                    left: `calc(${((sesFeeling - 1) / 9) * 100}% - 8px)`,
                    borderColor: sesFeeling >= 8 ? "#34D399" : sesFeeling >= 5 ? "#5B9CF6" : "#F87171",
                  }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-300">
                <span>😴 1</span>
                <span>🔥 10</span>
              </div>
            </div>
          </FormField>

          <FormField label="Notes">
            <FormTextarea placeholder="Notes sur la session…" value={sesNotes} onChange={setSesNotes} rows={2} />
          </FormField>
          <SubmitButton label="Enregistrer la session (+50 pts)" loading={pending} color="#34D399" onClick={handleAddSession} />
        </div>
      </Modal>

      {/* ── Modal: Nouveau PR ── */}
      <Modal open={prModal} onClose={() => setPrModal(false)} title="Nouveau Record" accentColor="#F59E0B">
        <div className="space-y-4">
          <FormField label="Exercice" required>
            <FormInput placeholder="Développé couché, Squat…" value={prExercise} onChange={setPrExercise} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Poids (kg)">
              <FormInput placeholder="100" value={prWeight} onChange={setPrWeight} type="number" step={0.5} />
            </FormField>
            <FormField label="Répétitions">
              <FormInput placeholder="5" value={prReps} onChange={setPrReps} type="number" min={1} />
            </FormField>
            <FormField label="Date">
              <FormInput value={prDate} onChange={setPrDate} type="date" />
            </FormField>
          </div>
          <FormField label="Notes">
            <FormInput placeholder="PR avec bonne forme, video…" value={prNotes} onChange={setPrNotes} />
          </FormField>
          <SubmitButton label="Enregistrer le record 🏆" loading={pending} color="#F59E0B" onClick={handleAddPR} />
        </div>
      </Modal>

      {/* ── Modal: Éditer jour du programme ── */}
      <Modal open={programModal} onClose={() => setProgramModal(false)} title={`Programme — ${WEEK_DAYS[editingDay]}`} accentColor="#5B9CF6" size="lg">
        <div className="space-y-4">
          <FormField label="Nom de la séance">
            <FormInput placeholder="Push · Pectoraux & Épaules" value={dayLabel} onChange={setDayLabel} />
          </FormField>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Exercices</label>
              <button onClick={addExercise}
                className="flex items-center gap-1 text-[12px] text-blue-500 font-medium hover:opacity-70">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <input placeholder="Développé couché" value={ex.name}
                    onChange={(e) => updateExercise(i, "name", e.target.value)}
                    className="flex-1 text-[13px] text-gray-800 bg-transparent outline-none" />
                  <input placeholder="4" value={ex.sets} type="number" min={1}
                    onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value) || 1)}
                    className="w-10 text-center text-[13px] text-gray-600 bg-transparent outline-none" />
                  <span className="text-[11px] text-gray-400">séries</span>
                  <input placeholder="8-12" value={ex.reps}
                    onChange={(e) => updateExercise(i, "reps", e.target.value)}
                    className="w-14 text-center text-[13px] text-gray-600 bg-transparent outline-none" />
                  <span className="text-[11px] text-gray-400">reps</span>
                  <input placeholder="80kg" value={ex.weight || ""}
                    onChange={(e) => updateExercise(i, "weight", e.target.value)}
                    className="w-16 text-center text-[13px] text-gray-500 bg-transparent outline-none" />
                  <button onClick={() => removeExercise(i)}
                    className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 hover:bg-red-100">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <SubmitButton label="Sauvegarder" loading={pending} color="#5B9CF6" onClick={handleSaveDay} />
        </div>
      </Modal>
    </motion.div>
  );
}
