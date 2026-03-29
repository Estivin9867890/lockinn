"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, Film, BookOpen, Tv } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addMedia, updateMediaStatus, updateMediaRating, deleteMedia } from "@/lib/actions/media";
import EmptyState from "@/components/ui/EmptyState";
import { MediaGridSkeleton } from "@/components/ui/Skeleton";
import Modal, { FormField, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/ui/Modal";
import type { MediaItem } from "@/lib/types";
import {
  MEDIA_TYPES, MEDIA_TYPE_LABELS, MEDIA_STATUSES, MEDIA_STATUS_LABELS, MEDIA_STATUS_COLORS,
} from "@/lib/types";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

type TypeFilter = "all" | "movie" | "series" | "book";
type StatusFilter = "all" | "to-watch" | "watching" | "completed";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  movie: <Film className="w-3.5 h-3.5" />,
  series: <Tv className="w-3.5 h-3.5" />,
  book: <BookOpen className="w-3.5 h-3.5" />,
};

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modal, setModal] = useState(false);
  const [pending, setPending] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaItem["type"]>("movie");
  const [status, setStatus] = useState<MediaItem["status"]>("to-watch");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [posterUrl, setPosterUrl] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("media_vault").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  const handleAdd = async () => {
    if (!title) return;
    setPending(true);
    try {
      const newItem = await addMedia({
        title, type, status, genre: genre || undefined, year: year ? parseInt(year) : undefined,
        poster_url: posterUrl || undefined, notes: notes || undefined, progress: 0,
      });
      setItems((prev) => [newItem, ...prev]);
      toast.success("🎬 Média ajouté !");
      setModal(false);
      setTitle(""); setGenre(""); setPosterUrl(""); setNotes("");
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleStatusChange = async (id: string, newStatus: MediaItem["status"]) => {
    setItems((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus, progress: newStatus === "completed" ? 100 : m.progress } : m));
    try { await updateMediaStatus(id, newStatus, newStatus === "completed" ? 100 : undefined); toast.success("Statut mis à jour"); }
    catch { load(); }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
    try { await deleteMedia(id); toast.success("Média supprimé"); }
    catch { load(); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 skeleton rounded-xl" />
      <MediaGridSkeleton count={10} />
    </div>
  );

  const completedCount = items.filter((m) => m.status === "completed").length;
  const watchingCount = items.filter((m) => m.status === "watching").length;
  const toWatchCount = items.filter((m) => m.status === "to-watch").length;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Media Vault 🎬</h1>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
          style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)", boxShadow: "0 4px 16px rgba(167,139,250,0.35)" }}>
          <Plus className="w-4 h-4" /> Ajouter un média
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Terminés", value: completedCount, icon: "✅", color: "#34D399" },
          { label: "En cours", value: watchingCount, icon: "▶️", color: "#FB923C" },
          { label: "À voir / lire", value: toWatchCount, icon: "📋", color: "#A78BFA" },
          { label: "Total", value: items.length, icon: "📚", color: "#5B9CF6" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card">
            <span className="text-2xl mb-3 block">{kpi.icon}</span>
            <p className="text-[28px] font-semibold text-gray-900">{kpi.value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl glass-sm">
          {(["all", "movie", "series", "book"] as TypeFilter[]).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${typeFilter === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "all" ? "Tout" : t === "movie" ? "🎬 Films" : t === "series" ? "📺 Séries" : "📚 Livres"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl glass-sm">
          {(["all", "to-watch", "watching", "completed"] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${statusFilter === s ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              {s === "all" ? "Tous" : MEDIA_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-gray-400 ml-1">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
      </motion.div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={Film} title="Aucun média"
          description="Appuyez sur ⌘K ou sur le bouton + pour ajouter votre premier film, série ou livre."
          color="#A78BFA" action={{ label: "+ Ajouter un média", onClick: () => setModal(true) }} />
      ) : (
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((media, i) => {
              const statusInfo = MEDIA_STATUS_COLORS[media.status];
              return (
                <motion.div key={media.id} layout initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ y: -6, scale: 1.02 }} className="group cursor-pointer">
                  <div className="relative rounded-2xl overflow-hidden aspect-[2/3] bg-gray-100 shadow-card mb-3">
                    {media.poster_url ? (
                      <img src={media.poster_url} alt={media.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-100 to-gray-200">
                        {media.type === "movie" ? "🎬" : media.type === "series" ? "📺" : "📚"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: statusInfo.bg, color: statusInfo.color, backdropFilter: "blur(8px)", border: `1px solid ${statusInfo.color}30` }}>
                        {MEDIA_STATUS_LABELS[media.status]}
                      </span>
                    </div>

                    {/* Type */}
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] bg-black/30 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                        {TYPE_ICONS[media.type]}
                      </span>
                    </div>

                    {/* Progress */}
                    {media.status === "watching" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                        <div className="h-full bg-apple-orange" style={{ width: `${media.progress}%` }} />
                      </div>
                    )}

                    {/* Rating */}
                    {media.rating && (
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1 text-[11px] bg-black/40 backdrop-blur-sm text-yellow-400 font-semibold px-2 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 fill-yellow-400" />{media.rating}/10
                        </span>
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      {media.status !== "completed" && (
                        <button onClick={() => handleStatusChange(media.id, "completed")}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-apple-mint text-white">
                          ✓ Terminé
                        </button>
                      )}
                      <button onClick={() => handleDelete(media.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-400 text-white">
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">{media.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-gray-400">{media.genre || MEDIA_TYPE_LABELS[media.type]}</p>
                      {media.year && <p className="text-[11px] text-gray-400">{media.year}</p>}
                    </div>
                    {media.status === "watching" && (
                      <p className="text-[10px] text-apple-orange mt-0.5">{media.progress}% terminé</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter un média" accentColor="#A78BFA">
        <div className="space-y-4">
          <FormField label="Titre" required>
            <FormInput placeholder="Dune: Part Two" value={title} onChange={setTitle} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <FormSelect value={type} onChange={(v) => setType(v as MediaItem["type"])}
                options={MEDIA_TYPES.map((t) => ({ value: t, label: `${t === "movie" ? "🎬" : t === "series" ? "📺" : "📚"} ${MEDIA_TYPE_LABELS[t]}` }))} />
            </FormField>
            <FormField label="Statut">
              <FormSelect value={status} onChange={(v) => setStatus(v as MediaItem["status"])}
                options={MEDIA_STATUSES.map((s) => ({ value: s, label: MEDIA_STATUS_LABELS[s] }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Genre">
              <FormInput placeholder="Sci-Fi, Drame…" value={genre} onChange={setGenre} />
            </FormField>
            <FormField label="Année">
              <FormInput placeholder="2024" value={year} onChange={setYear} type="number" min={1800} max={2030} />
            </FormField>
          </div>
          <FormField label="URL de l'affiche (optionnel)">
            <FormInput placeholder="https://…" value={posterUrl} onChange={setPosterUrl} />
          </FormField>
          <FormField label="Notes">
            <FormTextarea placeholder="Vos impressions…" value={notes} onChange={setNotes} rows={2} />
          </FormField>
          <SubmitButton label="Ajouter le média" loading={pending} color="#A78BFA" onClick={handleAdd} />
        </div>
      </Modal>
    </motion.div>
  );
}
