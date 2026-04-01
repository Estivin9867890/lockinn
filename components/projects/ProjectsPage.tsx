"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Timer, Play, Square, Check, Trash2, ChevronRight } from "lucide-react";
import { getProjects, addProject, deleteProject, addMilestone, completeMilestone, deleteMilestone, saveFocusSession } from "@/lib/actions/projects";
import type { Project, Milestone } from "@/lib/types";
import { toast } from "sonner";

const DIFFICULTY_LABELS = { easy: "Facile", medium: "Moyen", hard: "Difficile" };
const DIFFICULTY_POINTS = { easy: 15, medium: 30, hard: 50 };
const DIFFICULTY_COLORS = { easy: "#34D399", medium: "#5B9CF6", hard: "#F87171" };
const PROJECT_EMOJIS = ["🚀", "💼", "🎨", "📱", "🏗️", "💡", "🎯", "📚", "🌍", "💪"];
const PROJECT_COLORS = ["#5B9CF6", "#34D399", "#FB923C", "#A78BFA", "#F472B6", "#FBBF24"];

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newMsOpen, setNewMsOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projEmoji, setProjEmoji] = useState("🚀");
  const [projColor, setProjColor] = useState(PROJECT_COLORS[0]);
  const [msTitle, setMsTitle] = useState("");
  const [msDifficulty, setMsDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  useEffect(() => {
    getProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setActiveProject(data[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const handleStopTimer = async () => {
    setTimerRunning(false);
    const minutes = Math.floor(timerSecs / 60);
    if (minutes > 0 && activeProject) {
      await saveFocusSession(activeProject.id, minutes);
      const newTime = activeProject.total_time_min + minutes;
      setProjects((prev) => prev.map((p) => p.id === activeProject.id ? { ...p, total_time_min: newTime } : p));
      setActiveProject((prev) => prev ? { ...prev, total_time_min: newTime } : prev);
      const pts = Math.floor(minutes / 5);
      toast.success(`⏱️ ${minutes}min de focus${pts > 0 ? ` — +${pts} pts` : ""}`);
    }
    setTimerSecs(0);
  };

  const handleAddProject = async () => {
    if (!projTitle.trim()) return;
    const proj = await addProject({ title: projTitle.trim(), description: projDesc, emoji: projEmoji, color: projColor });
    setProjects((prev) => [{ ...proj, milestones: [] }, ...prev]);
    setActiveProject({ ...proj, milestones: [] });
    setProjTitle(""); setProjDesc(""); setProjEmoji("🚀"); setProjColor(PROJECT_COLORS[0]);
    setNewProjectOpen(false);
    toast.success("🚀 Projet créé !");
  };

  const handleDeleteProject = async (id: string) => {
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    setActiveProject(remaining[0] ?? null);
    await deleteProject(id);
    toast.success("Projet supprimé");
  };

  const handleAddMilestone = async () => {
    if (!msTitle.trim() || !activeProject) return;
    const pts = DIFFICULTY_POINTS[msDifficulty];
    const ms = await addMilestone({ project_id: activeProject.id, title: msTitle.trim(), difficulty: msDifficulty, points: pts });
    const updated = { ...activeProject, milestones: [...(activeProject.milestones || []), ms] };
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => p.id === activeProject.id ? updated : p));
    setMsTitle(""); setMsDifficulty("medium"); setNewMsOpen(false);
    toast.success("Étape ajoutée");
  };

  const handleCompleteMilestone = async (ms: Milestone) => {
    if (ms.completed || !activeProject) return;
    const updated = {
      ...activeProject,
      milestones: activeProject.milestones?.map((m) => m.id === ms.id ? { ...m, completed: true } : m),
    };
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => p.id === activeProject.id ? updated : p));
    await completeMilestone(ms.id, activeProject.id);
    toast.success(`✅ ${ms.title} — +${ms.points} pts`);
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!activeProject) return;
    const updated = { ...activeProject, milestones: activeProject.milestones?.filter((m) => m.id !== id) };
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => p.id === activeProject.id ? updated : p));
    await deleteMilestone(id);
  };

  const getProgress = (proj: Project) => {
    const ms = proj.milestones || [];
    return ms.length === 0 ? 0 : Math.round((ms.filter((m) => m.completed).length / ms.length) * 100);
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-40 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 h-96 bg-gray-100 rounded-2xl" />
        <div className="col-span-8 h-96 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={itemAnim} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Entrepreneuriat</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Projets 🚀</h1>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setNewProjectOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 4px 16px rgba(91,156,246,0.4)" }}>
          <Plus className="w-4 h-4" /> Nouveau projet
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        {/* Project list */}
        <motion.div variants={itemAnim} className="col-span-4">
          <div className="card p-3 space-y-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
              {projects.length} projet{projects.length !== 1 ? "s" : ""}
            </p>
            {projects.length === 0 && (
              <p className="text-[13px] text-gray-400 text-center py-10">Lance ton premier projet !</p>
            )}
            {projects.map((proj) => {
              const pct = getProgress(proj);
              const isActive = activeProject?.id === proj.id;
              return (
                <motion.button key={proj.id} onClick={() => setActiveProject(proj)}
                  whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${isActive ? "bg-white shadow-sm" : "hover:bg-black/4"}`}>
                  <span className="text-[22px]">{proj.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">{proj.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: proj.color }} />
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{pct}%</span>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Project detail */}
        <motion.div variants={itemAnim} className="col-span-8">
          {!activeProject ? (
            <div className="card flex flex-col items-center justify-center h-80 text-center">
              <span className="text-[48px] mb-4">🚀</span>
              <p className="text-[15px] font-semibold text-gray-700">Sélectionne un projet</p>
              <p className="text-[12px] text-gray-400 mt-1">ou crée-en un nouveau</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Project header */}
              <div className="card" style={{ background: `linear-gradient(135deg, ${activeProject.color}10, ${activeProject.color}04)` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[40px]">{activeProject.emoji}</span>
                    <div>
                      <h2 className="text-[20px] font-bold text-gray-900">{activeProject.title}</h2>
                      {activeProject.description && (
                        <p className="text-[12px] text-gray-500 mt-0.5">{activeProject.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[12px] text-gray-500">
                          ⏱️ {Math.floor(activeProject.total_time_min / 60)}h{activeProject.total_time_min % 60}m
                        </span>
                        <span className="text-[12px] text-gray-500">
                          ✅ {(activeProject.milestones || []).filter((m) => m.completed).length}/{(activeProject.milestones || []).length} étapes
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProject(activeProject.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] text-gray-500">Progression</span>
                    <span className="text-[11px] font-bold" style={{ color: activeProject.color }}>{getProgress(activeProject)}%</span>
                  </div>
                  <div className="h-2.5 bg-black/6 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgress(activeProject)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: `linear-gradient(90deg, ${activeProject.color}, ${activeProject.color}BB)` }} />
                  </div>
                </div>
              </div>

              {/* Timer LockIn */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: timerRunning ? "rgba(91,156,246,0.12)" : "rgba(0,0,0,0.04)" }}>
                      <Timer className={`w-4 h-4 ${timerRunning ? "text-blue-500" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800">Timer Focus</p>
                      <p className="text-[11px] text-gray-400">1 pt par 5 min · {activeProject.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.p animate={{ color: timerRunning ? "#3B82F6" : "#374151" }}
                      className="text-[28px] font-bold tabular-nums">
                      {formatTime(timerSecs)}
                    </motion.p>
                    {!timerRunning ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setTimerRunning(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #34D399, #10B981)", boxShadow: "0 4px 12px rgba(52,211,153,0.3)" }}>
                        <Play className="w-4 h-4" /> Démarrer
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleStopTimer}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #F87171, #EF4444)", boxShadow: "0 4px 12px rgba(248,113,113,0.3)" }}>
                        <Square className="w-4 h-4" /> Arrêter
                      </motion.button>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {timerRunning && timerSecs >= 5 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 px-3 py-2 rounded-xl text-[12px] text-blue-600 font-medium"
                      style={{ background: "rgba(91,156,246,0.08)" }}>
                      🔒 Mode focus actif — {Math.floor(timerSecs / 60) > 0 ? `${Math.floor(timerSecs / 60)}min` : "Courage !"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Milestones */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-gray-800">Étapes clés</h3>
                  <button onClick={() => setNewMsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-gray-600 hover:bg-black/5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>

                {(activeProject.milestones || []).length === 0 && !newMsOpen && (
                  <p className="text-[13px] text-gray-400 text-center py-6">Décompose ton projet en étapes !</p>
                )}

                <div className="space-y-2">
                  {(activeProject.milestones || []).map((ms) => (
                    <motion.div key={ms.id} layout
                      className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${ms.completed ? "opacity-55" : "hover:bg-black/3"}`}>
                      <button onClick={() => handleCompleteMilestone(ms)} disabled={ms.completed}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          ms.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
                        }`}>
                        {ms.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <p className={`flex-1 text-[13px] font-medium ${ms.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {ms.title}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: `${DIFFICULTY_COLORS[ms.difficulty as keyof typeof DIFFICULTY_COLORS]}15`,
                          color: DIFFICULTY_COLORS[ms.difficulty as keyof typeof DIFFICULTY_COLORS],
                        }}>
                        {DIFFICULTY_LABELS[ms.difficulty as keyof typeof DIFFICULTY_LABELS]}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400">+{ms.points}pts</span>
                      <button onClick={() => handleDeleteMilestone(ms.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {newMsOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3">
                      <input autoFocus type="text" placeholder="Nom de l'étape (ex: Créer le logo)"
                        value={msTitle} onChange={(e) => setMsTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddMilestone(); if (e.key === "Escape") setNewMsOpen(false); }}
                        className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                      <div className="flex items-center gap-2">
                        {(["easy", "medium", "hard"] as const).map((d) => (
                          <button key={d} onClick={() => setMsDifficulty(d)}
                            className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                            style={{
                              background: msDifficulty === d ? `${DIFFICULTY_COLORS[d]}15` : "rgba(0,0,0,0.04)",
                              border: msDifficulty === d ? `1.5px solid ${DIFFICULTY_COLORS[d]}40` : "1.5px solid transparent",
                              color: msDifficulty === d ? DIFFICULTY_COLORS[d] : "#6B7280",
                            }}>
                            {DIFFICULTY_LABELS[d]} · +{DIFFICULTY_POINTS[d]}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddMilestone} disabled={!msTitle.trim()}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)" }}>
                          Ajouter l'étape
                        </button>
                        <button onClick={() => setNewMsOpen(false)}
                          className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-black/5">
                          Annuler
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* New project modal */}
      <AnimatePresence>
        {newProjectOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setNewProjectOpen(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", bounce: 0.3 }}
              className="relative z-10 w-full max-w-[400px] rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.98)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-[16px] font-bold text-gray-900 mb-5">Nouveau projet 🚀</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <select value={projEmoji} onChange={(e) => setProjEmoji(e.target.value)}
                    className="w-14 h-12 text-[24px] text-center rounded-xl appearance-none cursor-pointer outline-none"
                    style={{ background: `${projColor}15`, border: `1.5px solid ${projColor}30` }}>
                    {PROJECT_EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input autoFocus type="text" placeholder="Nom du projet" value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddProject(); }}
                    className="flex-1 px-3.5 py-3 rounded-xl text-[14px] font-semibold text-gray-800 outline-none"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                </div>
                <textarea placeholder="Description (optionnel)" value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)} rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 outline-none resize-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500">Couleur :</span>
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} onClick={() => setProjColor(c)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: projColor === c ? "#1F2937" : "transparent" }} />
                  ))}
                </div>
                <button disabled={!projTitle.trim()} onClick={handleAddProject}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${projColor}, ${projColor}CC)`, boxShadow: `0 4px 16px ${projColor}40` }}>
                  Créer le projet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
