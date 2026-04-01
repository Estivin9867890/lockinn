"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Timer, Play, Square, Check, Trash2, ChevronRight,
  GitBranch, List, Smartphone, ShieldOff,
} from "lucide-react";
import {
  getProjects, addProject, deleteProject,
  addMilestone, completeMilestone, deleteMilestone, saveFocusSession,
} from "@/lib/actions/projects";
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

// ─── Skill Tree SVG ───────────────────────────────────────────────────────────

function SkillTree({ project, onComplete }: {
  project: Project;
  onComplete: (ms: Milestone) => void;
}) {
  const milestones = project.milestones || [];
  const NODE_W = 150;
  const NODE_H = 52;
  const SPACE_X = 190;
  const ROOT_W = 120;
  const START_X = 16;
  const CY = 90;
  const total = START_X + ROOT_W + milestones.length * SPACE_X + 24;

  const toXY = (i: number) => ({
    x: START_X + ROOT_W + i * SPACE_X,
    y: CY - NODE_H / 2,
  });

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={total} height={180} style={{ minWidth: total }}>
        {/* Root project node */}
        <rect x={START_X} y={CY - NODE_H / 2} width={ROOT_W} height={NODE_H}
          rx={NODE_H / 2} fill={`${project.color}18`}
          stroke={project.color} strokeWidth={2} />
        <text x={START_X + ROOT_W / 2} y={CY - 7} textAnchor="middle"
          fontSize={16} fill={project.color}>{project.emoji}</text>
        <text x={START_X + ROOT_W / 2} y={CY + 10} textAnchor="middle"
          fontSize={9} fontWeight="600" fill={project.color}>
          {project.title.length > 12 ? project.title.slice(0, 11) + "…" : project.title}
        </text>

        {milestones.map((ms, i) => {
          const { x, y } = toXY(i);
          const prevX = i === 0 ? START_X + ROOT_W : toXY(i - 1).x + NODE_W;
          const isLocked = i > 0 && !milestones[i - 1].completed;
          const dc = ms.difficulty as keyof typeof DIFFICULTY_COLORS;
          const nodeColor = ms.completed
            ? DIFFICULTY_COLORS[dc]
            : isLocked ? "#E5E7EB" : "#9CA3AF";

          return (
            <g key={ms.id}>
              {/* Connector */}
              <path
                d={`M ${prevX} ${CY} C ${prevX + 40} ${CY}, ${x - 40} ${CY}, ${x} ${CY}`}
                stroke={ms.completed ? DIFFICULTY_COLORS[dc] : "#E5E7EB"}
                strokeWidth={3} fill="none" strokeLinecap="round"
              />

              {/* Node */}
              <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={NODE_H / 2}
                fill={ms.completed ? `${nodeColor}18` : isLocked ? "#F9FAFB" : "#F3F4F6"}
                stroke={nodeColor} strokeWidth={2}
                className={!ms.completed && !isLocked ? "cursor-pointer" : ""}
                onClick={!ms.completed && !isLocked ? () => onComplete(ms) : undefined}
                style={{ transition: "all 0.2s" }}
              />

              {/* Node label */}
              <text x={x + NODE_W / 2} y={y + 18} textAnchor="middle"
                fontSize={10} fontWeight="700"
                fill={isLocked ? "#D1D5DB" : nodeColor}>
                {isLocked ? "🔒" : ms.completed ? "✅" : "◯"}{" "}
                {ms.title.length > 14 ? ms.title.slice(0, 13) + "…" : ms.title}
              </text>
              <text x={x + NODE_W / 2} y={y + 33} textAnchor="middle"
                fontSize={9} fill={isLocked ? "#D1D5DB" : "#9CA3AF"}>
                +{ms.points}pts · {DIFFICULTY_LABELS[dc]}
              </text>

              {/* Unlock hint */}
              {!ms.completed && !isLocked && (
                <text x={x + NODE_W / 2} y={y + NODE_H + 14} textAnchor="middle"
                  fontSize={8} fill="#9CA3AF">
                  Tap pour valider
                </text>
              )}
            </g>
          );
        })}

        {milestones.length === 0 && (
          <text x={START_X + ROOT_W + 60} y={CY + 5} textAnchor="middle"
            fontSize={11} fill="#9CA3AF">
            Ajoute des étapes pour construire l'arbre →
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newMsOpen, setNewMsOpen] = useState(false);

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // No-Phone Zone
  const [noPhoneMode, setNoPhoneMode] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const phoneLocked = useRef(false);

  // Forms
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projEmoji, setProjEmoji] = useState("🚀");
  const [projColor, setProjColor] = useState(PROJECT_COLORS[0]);
  const [msTitle, setMsTitle] = useState("");
  const [msDifficulty, setMsDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  useEffect(() => {
    getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setActiveProject(data[0]);
      setLoading(false);
    });
  }, []);

  // Timer interval
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // No-Phone Zone: Page Visibility API
  useEffect(() => {
    if (!timerRunning || !noPhoneMode) return;
    phoneLocked.current = true;

    const handleVisibility = () => {
      if (document.hidden && phoneLocked.current) {
        setDistractions(d => d + 1);
        toast.error("📱 Distraction détectée ! Multiplicateur réduit.", { duration: 2500 });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [timerRunning, noPhoneMode]);

  const handleStopTimer = async () => {
    phoneLocked.current = false;
    setTimerRunning(false);
    const minutes = Math.floor(timerSecs / 60);
    if (minutes > 0 && activeProject) {
      const basePts = Math.floor(minutes / 5);
      const multiplier = noPhoneMode && distractions === 0 ? 1.5 : 1;
      const pts = Math.round(basePts * multiplier);
      await saveFocusSession(activeProject.id, minutes);
      const newTime = activeProject.total_time_min + minutes;
      setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, total_time_min: newTime } : p));
      setActiveProject(prev => prev ? { ...prev, total_time_min: newTime } : prev);

      if (noPhoneMode && distractions === 0) {
        toast.success(`🚫📱 No-Phone accompli ! ${minutes}min — +${pts} pts (x1.5 !)`);
      } else if (noPhoneMode && distractions > 0) {
        toast.success(`⏱️ ${minutes}min — +${pts} pts (${distractions} distraction${distractions > 1 ? "s" : ""})`);
      } else if (pts > 0) {
        toast.success(`⏱️ ${minutes}min de focus — +${pts} pts`);
      }
    }
    setTimerSecs(0);
    setDistractions(0);
    setNoPhoneMode(false);
  };

  const handleAddProject = async () => {
    if (!projTitle.trim()) return;
    const proj = await addProject({ title: projTitle.trim(), description: projDesc, emoji: projEmoji, color: projColor });
    setProjects(prev => [{ ...proj, milestones: [] }, ...prev]);
    setActiveProject({ ...proj, milestones: [] });
    setProjTitle(""); setProjDesc(""); setProjEmoji("🚀"); setProjColor(PROJECT_COLORS[0]);
    setNewProjectOpen(false);
    toast.success("🚀 Projet créé !");
  };

  const handleDeleteProject = async (id: string) => {
    const remaining = projects.filter(p => p.id !== id);
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
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updated : p));
    setMsTitle(""); setMsDifficulty("medium"); setNewMsOpen(false);
    toast.success("Étape ajoutée");
  };

  const handleCompleteMilestone = async (ms: Milestone) => {
    if (ms.completed || !activeProject) return;
    const updated = {
      ...activeProject,
      milestones: activeProject.milestones?.map(m => m.id === ms.id ? { ...m, completed: true } : m),
    };
    setActiveProject(updated);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updated : p));
    await completeMilestone(ms.id, activeProject.id);
    toast.success(`✅ ${ms.title} débloqué — +${ms.points} pts`);
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!activeProject) return;
    const updated = { ...activeProject, milestones: activeProject.milestones?.filter(m => m.id !== id) };
    setActiveProject(updated);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updated : p));
    await deleteMilestone(id);
  };

  const getProgress = (proj: Project) => {
    const ms = proj.milestones || [];
    return ms.length === 0 ? 0 : Math.round((ms.filter(m => m.completed).length / ms.length) * 100);
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
      {/* Header */}
      <motion.div variants={itemAnim} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Entrepreneuriat</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Projets 🚀</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
            <button onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: viewMode === "list" ? "white" : "transparent",
                color: viewMode === "list" ? "#111827" : "#9CA3AF",
                boxShadow: viewMode === "list" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              <List className="w-3.5 h-3.5" /> Liste
            </button>
            <button onClick={() => setViewMode("tree")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: viewMode === "tree" ? "white" : "transparent",
                color: viewMode === "tree" ? "#111827" : "#9CA3AF",
                boxShadow: viewMode === "tree" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              <GitBranch className="w-3.5 h-3.5" /> Arbre
            </button>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setNewProjectOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 4px 16px rgba(91,156,246,0.4)" }}>
            <Plus className="w-4 h-4" /> Nouveau
          </motion.button>
        </div>
      </motion.div>

      {/* Skill Tree View */}
      <AnimatePresence mode="wait">
        {viewMode === "tree" ? (
          <motion.div key="tree"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="space-y-4">
            {projects.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-16 text-center">
                <span className="text-[48px] mb-3">🌳</span>
                <p className="text-[15px] font-semibold text-gray-700">Lance ton arbre de compétences</p>
                <p className="text-[12px] text-gray-400 mt-1">Crée un projet et ajoute des étapes séquentielles</p>
              </div>
            ) : (
              projects.map(proj => (
                <motion.div key={proj.id} layout className="card overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${proj.color}06, transparent)` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[24px]">{proj.emoji}</span>
                    <div>
                      <p className="text-[15px] font-bold text-gray-900">{proj.title}</p>
                      <p className="text-[11px] text-gray-400">{getProgress(proj)}% complété</p>
                    </div>
                    <button onClick={() => { setActiveProject(proj); setViewMode("list"); }}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium text-gray-500 hover:bg-black/5 transition-colors">
                      Gérer <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <SkillTree project={proj} onComplete={handleCompleteMilestone} />
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (

          /* ── List View ── */
          <motion.div key="list"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
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
                  {projects.map(proj => {
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
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
                                ✅ {(activeProject.milestones || []).filter(m => m.completed).length}/{(activeProject.milestones || []).length} étapes
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

                    {/* Timer LockIn + No-Phone Zone */}
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: timerRunning ? (noPhoneMode ? "rgba(167,139,250,0.12)" : "rgba(91,156,246,0.12)") : "rgba(0,0,0,0.04)" }}>
                            <Timer className={`w-4 h-4 ${timerRunning ? (noPhoneMode ? "text-purple-500" : "text-blue-500") : "text-gray-400"}`} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-800">Timer Focus</p>
                            <p className="text-[11px] text-gray-400">
                              1 pt / 5min{noPhoneMode ? " · x1.5 si no-phone 🚫📱" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <motion.p animate={{ color: timerRunning ? (noPhoneMode ? "#7C3AED" : "#3B82F6") : "#374151" }}
                            className="text-[28px] font-bold tabular-nums">
                            {formatTime(timerSecs)}
                          </motion.p>
                          {!timerRunning ? (
                            <div className="flex items-center gap-2">
                              {/* No-Phone toggle */}
                              <button onClick={() => setNoPhoneMode(v => !v)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                  background: noPhoneMode ? "rgba(167,139,250,0.12)" : "rgba(0,0,0,0.04)",
                                  border: noPhoneMode ? "1.5px solid rgba(167,139,250,0.3)" : "1.5px solid transparent",
                                }}
                                title="Activer le mode No-Phone (x1.5 pts si pas de distraction)">
                                {noPhoneMode ? <ShieldOff className="w-4 h-4 text-purple-500" /> : <Smartphone className="w-4 h-4 text-gray-400" />}
                              </button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => { setDistractions(0); setTimerRunning(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                                style={{
                                  background: noPhoneMode
                                    ? "linear-gradient(135deg, #7C3AED, #A78BFA)"
                                    : "linear-gradient(135deg, #34D399, #10B981)",
                                  boxShadow: noPhoneMode ? "0 4px 12px rgba(124,58,237,0.3)" : "0 4px 12px rgba(52,211,153,0.3)",
                                }}>
                                <Play className="w-4 h-4" /> Démarrer
                              </motion.button>
                            </div>
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
                        {timerRunning && noPhoneMode && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl"
                            style={{ background: distractions > 0 ? "rgba(248,113,113,0.08)" : "rgba(167,139,250,0.08)" }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px]">{distractions > 0 ? "😬" : "🧘"}</span>
                              <p className="text-[12px] font-semibold"
                                style={{ color: distractions > 0 ? "#EF4444" : "#7C3AED" }}>
                                {distractions === 0
                                  ? "🚫📱 Mode No-Phone actif — ×1.5 garanti !"
                                  : `${distractions} distraction${distractions > 1 ? "s" : ""} — multiplicateur perdu`}
                              </p>
                            </div>
                            <span className="text-[12px] font-bold"
                              style={{ color: distractions > 0 ? "#EF4444" : "#7C3AED" }}>
                              {distractions > 0 ? "×1.0" : "×1.5"}
                            </span>
                          </motion.div>
                        )}
                        {timerRunning && !noPhoneMode && timerSecs >= 5 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 px-3 py-2 rounded-xl text-[12px] text-blue-600 font-medium"
                            style={{ background: "rgba(91,156,246,0.08)" }}>
                            🔒 Focus actif — {Math.floor(timerSecs / 60) > 0 ? `${Math.floor(timerSecs / 60)}min` : "Courage !"}
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
                        <p className="text-[13px] text-gray-400 text-center py-6">Décompose ton projet en étapes séquentielles !</p>
                      )}

                      <div className="space-y-2">
                        {(activeProject.milestones || []).map((ms, i) => {
                          const isLocked = i > 0 && !(activeProject.milestones?.[i - 1]?.completed);
                          return (
                            <motion.div key={ms.id} layout
                              className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${ms.completed ? "opacity-55" : isLocked ? "opacity-40" : "hover:bg-black/3"}`}>
                              <button onClick={() => !isLocked && handleCompleteMilestone(ms)} disabled={ms.completed || isLocked}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  ms.completed ? "bg-green-500 border-green-500" : isLocked ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-green-400"
                                }`}>
                                {ms.completed && <Check className="w-3 h-3 text-white" />}
                                {isLocked && <span className="text-[10px]">🔒</span>}
                              </button>
                              <p className={`flex-1 text-[13px] font-medium ${ms.completed ? "line-through text-gray-400" : isLocked ? "text-gray-300" : "text-gray-800"}`}>
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
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {newMsOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3">
                            <input autoFocus type="text" placeholder="Nom de l'étape (ex: Créer le logo)"
                              value={msTitle} onChange={e => setMsTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleAddMilestone(); if (e.key === "Escape") setNewMsOpen(false); }}
                              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
                              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                            <div className="flex items-center gap-2">
                              {(["easy", "medium", "hard"] as const).map(d => (
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
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={e => e.stopPropagation()}>
              <h2 className="text-[16px] font-bold text-gray-900 mb-5">Nouveau projet 🚀</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] flex-shrink-0"
                    style={{ background: `${projColor}18`, border: `1.5px solid ${projColor}30` }}>
                    {projEmoji}
                  </div>
                  <select value={projEmoji} onChange={e => setProjEmoji(e.target.value)}
                    className="sr-only">
                    {PROJECT_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input autoFocus type="text" placeholder="Nom du projet" value={projTitle}
                    onChange={e => setProjTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddProject(); }}
                    className="flex-1 px-3.5 py-3 rounded-xl text-[14px] font-semibold text-gray-800 outline-none"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                </div>
                {/* Emoji picker */}
                <div className="flex flex-wrap gap-2">
                  {PROJECT_EMOJIS.map(e => (
                    <button key={e} onClick={() => setProjEmoji(e)}
                      className="w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-all"
                      style={{
                        background: projEmoji === e ? `${projColor}20` : "rgba(0,0,0,0.04)",
                        border: projEmoji === e ? `1.5px solid ${projColor}50` : "1.5px solid transparent",
                      }}>
                      {e}
                    </button>
                  ))}
                </div>
                <textarea placeholder="Description (optionnel)" value={projDesc}
                  onChange={e => setProjDesc(e.target.value)} rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 outline-none resize-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500">Couleur :</span>
                  {PROJECT_COLORS.map(c => (
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
