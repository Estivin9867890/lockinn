"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Filter, MapPin, Dumbbell } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addSpot, addSession, deleteSession } from "@/lib/actions/sport";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton, KPIRowSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/ui/Modal";
import type { SportSpot, SportSession } from "@/lib/types";
import { SPORT_LABELS, SPORT_EMOJIS, SPORT_COLORS, SPORT_TYPES } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

const SESSION_EMOJI: Record<string, string> = {
  Course: "🏃", Vélo: "🚴", Muscu: "🏋️", Escalade: "🧗", Skate: "🛹",
  Yoga: "🧘", Natation: "🏊", Autre: "💪",
  run: "🏃", bike: "🚴", gym: "🏋️", climb: "🧗", skate: "🛹",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

export default function SportPage() {
  const [spots, setSpots] = useState<SportSpot[]>([]);
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotModal, setSpotModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [pending, setPending] = useState(false);

  // Spot form
  const [spotName, setSpotName] = useState("");
  const [spotLat, setSpotLat] = useState("");
  const [spotLng, setSpotLng] = useState("");
  const [spotType, setSpotType] = useState("run");
  const [spotDist, setSpotDist] = useState("");
  const [spotNotes, setSpotNotes] = useState("");

  // Session form
  const [sesDate, setSesDate] = useState(new Date().toISOString().split("T")[0]);
  const [sesType, setSesType] = useState("Course");
  const [sesDuration, setSesDuration] = useState("");
  const [sesCalories, setSesCalories] = useState("");

  const load = async () => {
    const [sp, se] = await Promise.all([
      supabase.from("sport_spots").select("*").order("created_at", { ascending: false }),
      supabase.from("sport_sessions").select("*").order("date", { ascending: false }).limit(20),
    ]);
    setSpots(sp.data || []);
    setSessions(se.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAddSpot = async () => {
    if (!spotName || !spotLat || !spotLng) return;
    setPending(true);
    try {
      const newSpot = await addSpot({
        name: spotName, lat: parseFloat(spotLat), lng: parseFloat(spotLng),
        type: spotType as SportSpot["type"],
        distance_km: spotDist ? parseFloat(spotDist) : undefined,
        notes: spotNotes || undefined,
      });
      setSpots((prev) => [newSpot, ...prev]);
      toast.success("📍 Spot ajouté !");
      setSpotModal(false);
      setSpotName(""); setSpotLat(""); setSpotLng(""); setSpotDist(""); setSpotNotes("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleAddSession = async () => {
    if (!sesDuration) return;
    setPending(true);
    try {
      const newSes = await addSession({
        date: sesDate, type: sesType,
        duration_min: parseInt(sesDuration),
        calories: sesCalories ? parseInt(sesCalories) : undefined,
      });
      setSessions((prev) => [newSes, ...prev]);
      toast.success("💪 Session enregistrée !");
      setSessionModal(false);
      setSesDuration(""); setSesCalories("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  // Build weekly chart data
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekData = weekDays.map((day, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const ses = sessions.filter((s) => s.date === dateStr);
    return { day, calories: ses.reduce((s, x) => s + (x.calories || 0), 0), sessions: ses.length };
  });

  const totalCal = sessions.reduce((s, x) => s + (x.calories || 0), 0);
  const totalMin = sessions.reduce((s, x) => s + x.duration_min, 0);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <KPIRowSkeleton cols={4} />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8"><CardSkeleton className="h-80" /></div>
        <div className="col-span-4 space-y-4"><CardSkeleton /><CardSkeleton /></div>
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Sport & Carte 🗺️</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSessionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
            style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 4px 16px rgba(91,156,246,0.35)" }}>
            <Plus className="w-4 h-4" /> Session
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSpotModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
            style={{ background: "linear-gradient(135deg, #34D399, #10B981)", boxShadow: "0 4px 16px rgba(52,211,153,0.35)" }}>
            <Plus className="w-4 h-4" /> Spot
          </motion.button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Spots enregistrés", value: spots.length, icon: "📍", color: "#5B9CF6" },
          { label: "Sessions ce mois", value: sessions.length, icon: "🏋️", color: "#34D399" },
          { label: "Calories brûlées", value: totalCal.toLocaleString("fr-FR"), icon: "🔥", color: "#FB923C" },
          { label: "Temps total", value: `${Math.floor(totalMin / 60)}h${totalMin % 60}m`, icon: "⏱️", color: "#A78BFA" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
            <span className="text-2xl mb-3 block">{kpi.icon}</span>
            <p className="text-[22px] font-semibold text-gray-900 leading-none">{kpi.value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        {/* Map */}
        <motion.div variants={item} className="col-span-8">
          <div className="card" style={{ height: 480 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-800">Carte des spots</h2>
              <span className="text-[12px] text-gray-400">{spots.length} spot{spots.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ height: "calc(100% - 50px)" }}>
              <MapComponent compact={false} spots={spots} />
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={item} className="col-span-4 space-y-5">
          {/* Weekly chart */}
          <div className="card">
            <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Semaine en cours</h3>
            {sessions.length === 0 ? (
              <EmptyState icon={Dumbbell} title="Aucune session" description="Ajoutez votre première session d'entraînement." color="#34D399" />
            ) : (
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 10, fontSize: 12 }}
                      formatter={(v: any) => [`${v} kcal`, ""]} />
                    <Bar dataKey="calories" fill="#34D399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Spots list */}
          <div className="card">
            <h3 className="text-[14px] font-semibold text-gray-800 mb-3">Mes spots</h3>
            {spots.length === 0 ? (
              <EmptyState icon={MapPin} title="Aucun spot" description='Appuyez sur "+ Spot" pour ajouter votre premier lieu.' color="#5B9CF6"
                action={{ label: "+ Nouveau spot", onClick: () => setSpotModal(true) }} />
            ) : (
              <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                {spots.map((spot, i) => (
                  <motion.div key={spot.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/3 transition-colors cursor-pointer">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${SPORT_COLORS[spot.type]}18` }}>
                      {SPORT_EMOJIS[spot.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-700 truncate">{spot.name}</p>
                      <p className="text-[11px] text-gray-400">{SPORT_LABELS[spot.type]}{spot.distance_km ? ` · ${spot.distance_km} km` : ""}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Sessions history */}
        <motion.div variants={item} className="col-span-12">
          <div className="card">
            <h2 className="text-[15px] font-semibold text-gray-800 mb-4">Historique des sessions</h2>
            {sessions.length === 0 ? (
              <EmptyState icon={Dumbbell} title="Aucune session enregistrée"
                description='Utilisez le bouton "+ Session" ou ⌘K pour commencer à tracker vos entraînements.'
                color="#5B9CF6" action={{ label: "+ Ajouter une session", onClick: () => setSessionModal(true) }} />
            ) : (
              <div className="grid grid-cols-7 gap-3">
                {sessions.slice(0, 14).map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.04 }} whileHover={{ y: -3 }}
                    className="p-4 rounded-2xl text-center cursor-pointer"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
                    <p className="text-[11px] text-gray-400 mb-1">{s.date?.slice(5).replace("-", "/")}</p>
                    <p className="text-2xl mb-1">{SESSION_EMOJI[s.type] || "💪"}</p>
                    <p className="text-[12px] font-semibold text-gray-700">{s.type}</p>
                    <p className="text-[11px] text-gray-400">{s.duration_min}min</p>
                    {s.calories && <p className="text-[11px] text-apple-mint font-medium mt-1">{s.calories} kcal</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal: Nouveau spot */}
      <Modal open={spotModal} onClose={() => setSpotModal(false)} title="Nouveau spot" accentColor="#34D399">
        <div className="space-y-4">
          <FormField label="Nom du lieu" required>
            <FormInput placeholder="Bois de Vincennes" value={spotName} onChange={setSpotName} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitude" required>
              <FormInput placeholder="48.8366" value={spotLat} onChange={setSpotLat} type="number" step={0.0001} />
            </FormField>
            <FormField label="Longitude" required>
              <FormInput placeholder="2.4374" value={spotLng} onChange={setSpotLng} type="number" step={0.0001} />
            </FormField>
          </div>
          <FormField label="Type">
            <FormSelect value={spotType} onChange={setSpotType}
              options={SPORT_TYPES.map((t) => ({ value: t, label: `${SPORT_EMOJIS[t]} ${SPORT_LABELS[t]}` }))} />
          </FormField>
          <FormField label="Distance (km)">
            <FormInput placeholder="8.4" value={spotDist} onChange={setSpotDist} type="number" step={0.1} />
          </FormField>
          <FormField label="Notes">
            <FormTextarea placeholder="Notes sur ce spot…" value={spotNotes} onChange={setSpotNotes} rows={2} />
          </FormField>
          <SubmitButton label="Ajouter le spot" loading={pending} color="#34D399" onClick={handleAddSpot} />
        </div>
      </Modal>

      {/* Modal: Nouvelle session */}
      <Modal open={sessionModal} onClose={() => setSessionModal(false)} title="Logger une session" accentColor="#5B9CF6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date" required>
              <FormInput value={sesDate} onChange={setSesDate} type="date" />
            </FormField>
            <FormField label="Type" required>
              <FormSelect value={sesType} onChange={setSesType}
                options={["Course", "Vélo", "Muscu", "Escalade", "Skate", "Yoga", "Natation", "Autre"].map((t) => ({ value: t, label: t }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Durée (min)" required>
              <FormInput placeholder="45" value={sesDuration} onChange={setSesDuration} type="number" min={1} />
            </FormField>
            <FormField label="Calories brûlées">
              <FormInput placeholder="350" value={sesCalories} onChange={setSesCalories} type="number" min={0} />
            </FormField>
          </div>
          <SubmitButton label="Enregistrer la session" loading={pending} color="#5B9CF6" onClick={handleAddSession} />
        </div>
      </Modal>
    </motion.div>
  );
}
