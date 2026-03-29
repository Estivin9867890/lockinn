"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, Search, Trash2, Eye, Edit3, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addNote, updateNote, deleteNote } from "@/lib/actions/notes";
import { useDebouncedCallback } from "use-debounce";
import type { Note } from "@/lib/types";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

// Minimal markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-semibold text-gray-800 mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-[17px] font-semibold text-gray-900 mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-[20px] font-bold text-gray-900 mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-700">$1</em>')
    .replace(/^- \[x\] (.+)$/gm, '<label class="flex items-center gap-2 py-0.5"><input type="checkbox" checked disabled class="accent-apple-blue" /><span class="line-through text-gray-400 text-[13px]">$1</span></label>')
    .replace(/^- \[ \] (.+)$/gm, '<label class="flex items-center gap-2 py-0.5"><input type="checkbox" disabled class="accent-apple-blue" /><span class="text-gray-700 text-[13px]">$1</span></label>')
    .replace(/^- (.+)$/gm, '<li class="text-[13px] text-gray-700 flex gap-2 py-0.5"><span class="text-gray-400 mt-0.5">•</span>$1</li>')
    .replace(/^(?!<[hliH])(.+)$/gm, '<p class="text-[13px] text-gray-700 leading-relaxed">$1</p>')
    .replace(/^$/gm, '<div class="h-2" />');
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Note | null>(null);
  const [preview, setPreview] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    setNotes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectNote = (note: Note) => {
    setSelected(note);
    setLocalTitle(note.title);
    setLocalContent(note.content);
    setPreview(false);
  };

  const debouncedSave = useDebouncedCallback(async (id: string, title: string, content: string) => {
    await updateNote(id, { title, content });
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n));
  }, 600);

  const handleTitleChange = (v: string) => {
    setLocalTitle(v);
    if (selected) debouncedSave(selected.id, v, localContent);
  };

  const handleContentChange = (v: string) => {
    setLocalContent(v);
    if (selected) debouncedSave(selected.id, localTitle, v);
  };

  const handleNew = async () => {
    try {
      const note = await addNote({ title: "Sans titre", content: "" });
      setNotes((prev) => [note, ...prev]);
      selectNote(note);
      setTimeout(() => titleRef.current?.select(), 100);
    } catch { toast.error("Erreur"); }
  };

  const handlePin = async (note: Note) => {
    const pinned = !note.pinned;
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, pinned } : n)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    if (selected?.id === note.id) setSelected((s) => s ? { ...s, pinned } : null);
    await updateNote(note.id, { pinned });
  };

  const handleDelete = async (note: Note) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    if (selected?.id === note.id) { setSelected(null); setLocalTitle(""); setLocalContent(""); }
    await deleteNote(note.id);
    toast.success("Note supprimée", {
      action: { label: "Annuler", onClick: () => load() },
    });
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !selected) return;
    const tags = [...(selected.tags || []), newTag.trim()];
    setSelected((s) => s ? { ...s, tags } : null);
    setNotes((prev) => prev.map((n) => n.id === selected.id ? { ...n, tags } : n));
    await updateNote(selected.id, { tags });
    setNewTag("");
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selected) return;
    const tags = selected.tags.filter((t) => t !== tag);
    setSelected((s) => s ? { ...s, tags } : null);
    setNotes((prev) => prev.map((n) => n.id === selected.id ? { ...n, tags } : n));
    await updateNote(selected.id, { tags });
  };

  const filtered = notes.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.pinned);
  const regular = filtered.filter((n) => !n.pinned);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return `Aujourd'hui ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <motion.div className="space-y-5 h-[calc(100vh-64px)]" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">Notes 📝</h1>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
          style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)", boxShadow: "0 4px 16px rgba(167,139,250,0.35)" }}>
          <Plus className="w-4 h-4" /> Nouvelle note
        </motion.button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-12 gap-5" style={{ height: "calc(100% - 90px)" }}>
        {/* Notes list */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] text-gray-800 outline-none"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-3xl mb-3">📝</p>
                <p className="text-[13px] font-medium text-gray-600">Aucune note</p>
                <p className="text-[11px] text-gray-400 mt-1">Créez votre premier Brain Dump</p>
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1">Épinglées</p>
                    {pinned.map((note) => <NoteRow key={note.id} note={note} selected={selected?.id === note.id}
                      onSelect={() => selectNote(note)} onPin={() => handlePin(note)}
                      onDelete={() => handleDelete(note)} formatDate={formatDate} />)}
                    {regular.length > 0 && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 pt-2">Autres</p>}
                  </>
                )}
                {regular.map((note) => <NoteRow key={note.id} note={note} selected={selected?.id === note.id}
                  onSelect={() => selectNote(note)} onPin={() => handlePin(note)}
                  onDelete={() => handleDelete(note)} formatDate={formatDate} />)}
              </>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-8">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                className="card h-full flex flex-col gap-4">
                {/* Editor header */}
                <div className="flex items-center justify-between pb-3 border-b border-black/5">
                  <input ref={titleRef} value={localTitle} onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Sans titre"
                    className="flex-1 text-[20px] font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-300" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">{formatDate(selected.updated_at)}</span>
                    <button onClick={() => setPreview(!preview)}
                      className={`p-2 rounded-xl transition-all ${preview ? "bg-purple-50 text-purple-600" : "bg-black/5 text-gray-500 hover:bg-black/8"}`}
                      title={preview ? "Mode édition" : "Prévisualisation"}>
                      {preview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap -mt-2">
                  {(selected.tags || []).map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA" }}>
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-60">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Ajouter un tag…"
                      className="text-[11px] text-gray-500 bg-transparent outline-none placeholder-gray-300 w-24" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                  {preview ? (
                    <div className="prose-lockin h-full overflow-auto"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(localContent) }} />
                  ) : (
                    <textarea value={localContent} onChange={(e) => handleContentChange(e.target.value)}
                      placeholder={"# Titre\n\nCommencez à écrire…\n\n- [ ] Case à cocher\n- [x] Terminé\n- Point de liste\n\n**Gras**, *italique*"}
                      className="w-full h-full resize-none bg-transparent outline-none text-[13px] text-gray-700 leading-relaxed font-mono placeholder-gray-300" />
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-black/5">
                  <p className="text-[11px] text-gray-400">
                    {localContent.split(" ").filter(Boolean).length} mots · Sauvegarde auto
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handlePin(selected)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${selected.pinned ? "bg-amber-50 text-amber-600" : "bg-black/5 text-gray-500 hover:bg-black/8"}`}>
                      <Pin className="w-3.5 h-3.5" />
                      {selected.pinned ? "Épinglée" : "Épingler"}
                    </button>
                    <button onClick={() => handleDelete(selected)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-red-400 bg-red-50 hover:bg-red-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="card h-full flex flex-col items-center justify-center text-center">
                <p className="text-5xl mb-4">📝</p>
                <p className="text-[16px] font-semibold text-gray-700 mb-2">Sélectionne une note</p>
                <p className="text-[13px] text-gray-400 mb-6">ou crée-en une nouvelle pour commencer</p>
                <button onClick={handleNew}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-[13px] font-medium"
                  style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)", boxShadow: "0 4px 16px rgba(167,139,250,0.35)" }}>
                  <Plus className="w-4 h-4" /> Nouvelle note
                </button>
                <div className="mt-6 p-4 rounded-2xl text-left max-w-xs"
                  style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  <p className="text-[11px] font-semibold text-purple-500 mb-2">💡 Markdown supporté</p>
                  <div className="space-y-1 text-[11px] text-gray-500 font-mono">
                    <p># Titre H1</p>
                    <p>**gras**, *italique*</p>
                    <p>- [ ] case à cocher</p>
                    <p>- [x] terminé</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoteRow({ note, selected, onSelect, onPin, onDelete, formatDate }: {
  note: Note; selected: boolean;
  onSelect: () => void; onPin: () => void; onDelete: () => void;
  formatDate: (d: string) => string;
}) {
  const preview = note.content.replace(/[#*\-\[\]]/g, "").trim().slice(0, 60) || "Vide";
  return (
    <motion.div layout
      onClick={onSelect}
      className={`p-3 rounded-xl cursor-pointer transition-all group ${selected ? "bg-white shadow-sm" : "hover:bg-black/3"}`}
      style={selected ? { border: "1px solid rgba(167,139,250,0.25)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" } : {}}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {note.pinned && <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            <p className="text-[13px] font-semibold text-gray-800 truncate">{note.title}</p>
          </div>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{preview}</p>
          <p className="text-[10px] text-gray-300 mt-1">{formatDate(note.updated_at)}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onPin(); }}
            className="p-1 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors">
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {note.tags?.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>#{t}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
