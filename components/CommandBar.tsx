"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MapPin, Apple, Wallet, Film, Package,
  Plus, Dumbbell, Utensils, CreditCard, Search, ArrowRight,
  Droplets, Settings, Calendar, FileText, Lock, FileEdit,
} from "lucide-react";
import { toast } from "sonner";
import { addWater, deleteWater } from "@/lib/actions/nutrition";
import { addNote } from "@/lib/actions/notes";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", color: "#5B9CF6" },
  { label: "Calendrier", icon: Calendar, href: "/calendar", color: "#FB923C" },
  { label: "Notes", icon: FileText, href: "/notes", color: "#A78BFA" },
  { label: "Sport & Carte", icon: MapPin, href: "/sport", color: "#34D399" },
  { label: "Nutrition", icon: Apple, href: "/nutrition", color: "#FB923C" },
  { label: "Budget & Finance", icon: Wallet, href: "/budget", color: "#F472B6" },
  { label: "Media Vault", icon: Film, href: "/media", color: "#A78BFA" },
  { label: "Inventaire", icon: Package, href: "/inventory", color: "#FBBF24" },
  { label: "Réglages", icon: Settings, href: "/settings", color: "#9CA3AF" },
];

const QUICK_ACTIONS = [
  { label: "🔒 LockIn Session", icon: Lock, color: "#5B9CF6", href: "/calendar?template=lockin", hint: "Ouvre Calendrier" },
  { label: "Ajouter une dépense", icon: CreditCard, color: "#F472B6", href: "/budget", hint: "Ouvre Budget" },
  { label: "Logger un entraînement", icon: Dumbbell, color: "#34D399", href: "/sport", hint: "Ouvre Sport" },
  { label: "Ajouter un repas", icon: Utensils, color: "#FB923C", href: "/nutrition", hint: "Ouvre Nutrition" },
  { label: "Nouveau spot", icon: MapPin, color: "#5B9CF6", href: "/sport", hint: "Ouvre Carte" },
];

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandBar({ open, onClose }: CommandBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

  // Detect "eau NNN" or "water NNN" shortcut
  const waterMatch = search.match(/^(?:eau|water)\s+(\d+)/i);
  const waterAmount = waterMatch ? parseInt(waterMatch[1]) : null;

  // Load notes when search has 2+ chars
  useEffect(() => {
    if (search.length >= 2 && !waterAmount) {
      const q = search.toLowerCase();
      supabase
        .from("notes")
        .select("id, title, content, pinned, tags, created_at, updated_at")
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order("updated_at", { ascending: false })
        .limit(5)
        .then(({ data }) => {
          setNotes((data as Note[]) ?? []);
          setNotesLoaded(true);
        });
    } else {
      setNotes([]);
      setNotesLoaded(false);
    }
  }, [search, waterAmount]);

  useEffect(() => { if (!open) setSearch(""); }, [open]);

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleWaterAdd = () => {
    if (!waterAmount) return;
    startTransition(async () => {
      try {
        const newW = await addWater(waterAmount);
        onClose();
        toast.success(`💧 ${waterAmount}ml d'eau ajouté`, {
          action: {
            label: "Annuler",
            onClick: async () => {
              if (newW?.id) await deleteWater(newW.id);
            },
          },
        });
      } catch {
        toast.error("Erreur lors de l'ajout de l'eau");
      }
    });
  };

  const handleNewNote = () => {
    startTransition(async () => {
      try {
        const note = await addNote({ title: "Nouvelle note", content: "" });
        onClose();
        router.push(`/notes?id=${note.id}`);
      } catch {
        toast.error("Erreur lors de la création de la note");
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-[560px] mx-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.94)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 25px 80px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <Command shouldFilter={true} loop>
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-black/5">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Rechercher… ou «eau 250» pour ajouter de l'eau"
                    className="flex-1 text-[15px] text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"
                    autoFocus
                  />
                  <kbd
                    onClick={onClose}
                    className="text-[11px] bg-black/6 border border-black/8 rounded-lg px-2 py-1 text-gray-400 cursor-pointer hover:bg-black/10"
                  >
                    Esc
                  </kbd>
                </div>

                <Command.List className="max-h-[420px] overflow-y-auto p-2">
                  <Command.Empty className="py-10 text-center text-[14px] text-gray-400">
                    Aucun résultat pour « {search} »
                  </Command.Empty>

                  {/* Water quick-add */}
                  {waterAmount && (
                    <Command.Group
                      heading="Action rapide"
                      className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-gray-400 [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                    >
                      <Command.Item
                        value={`eau ${waterAmount}`}
                        onSelect={handleWaterAdd}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[14px] text-gray-700 transition-all data-[selected=true]:bg-blue-50 data-[selected=true]:text-apple-blue outline-none"
                      >
                        <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Droplets className="w-4 h-4 text-apple-blue" />
                        </span>
                        <span className="flex-1 font-medium">
                          Ajouter <span className="text-apple-blue">{waterAmount}ml</span> d'eau
                        </span>
                        {isPending ? (
                          <div className="w-4 h-4 border-2 border-apple-blue/30 border-t-apple-blue rounded-full animate-spin" />
                        ) : (
                          <kbd className="text-[10px] bg-black/5 rounded-md px-1.5 py-0.5 text-gray-400">↵</kbd>
                        )}
                      </Command.Item>
                    </Command.Group>
                  )}

                  {/* Note search results */}
                  {notesLoaded && notes.length > 0 && (
                    <Command.Group
                      heading="Notes"
                      className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-gray-400 [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                    >
                      {notes.map((note) => (
                        <Command.Item
                          key={note.id}
                          value={`note-${note.id}-${note.title}`}
                          onSelect={() => handleNav(`/notes?id=${note.id}`)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[14px] text-gray-700 transition-all data-[selected=true]:bg-purple-50 outline-none"
                        >
                          <span className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-purple-500" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <p className="font-medium truncate">{note.title || "Sans titre"}</p>
                            {note.content && (
                              <p className="text-[11px] text-gray-400 truncate">
                                {note.content.replace(/[#*`]/g, "").slice(0, 60)}
                              </p>
                            )}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Nouvelle note action */}
                  {search.length >= 2 && !waterAmount && (
                    <Command.Group
                      heading="Créer"
                      className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-gray-400 [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                    >
                      <Command.Item
                        value={`nouvelle note ${search}`}
                        onSelect={handleNewNote}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[14px] text-gray-700 transition-all data-[selected=true]:bg-purple-50 outline-none"
                      >
                        <span className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <FileEdit className="w-4 h-4 text-purple-500" />
                        </span>
                        <span className="flex-1 font-medium">Nouvelle note</span>
                        <Plus className="w-3.5 h-3.5 text-gray-300" />
                      </Command.Item>
                    </Command.Group>
                  )}

                  {/* Navigation */}
                  <Command.Group
                    heading="Navigation"
                    className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-gray-400 [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                  >
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.href}
                          value={item.label}
                          onSelect={() => handleNav(item.href)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[14px] text-gray-700 transition-all data-[selected=true]:bg-blue-50 data-[selected=true]:text-apple-blue outline-none"
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${item.color}18` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: item.color }} />
                          </span>
                          <span className="flex-1 font-medium">{item.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  <Command.Separator className="my-1 h-px bg-black/5 mx-3" />

                  {/* Quick Actions */}
                  <Command.Group
                    heading="Actions rapides"
                    className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-gray-400 [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                  >
                    {QUICK_ACTIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.label}
                          value={item.label}
                          onSelect={() => handleNav(item.href)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[14px] text-gray-700 transition-all data-[selected=true]:bg-blue-50 data-[selected=true]:text-apple-blue outline-none"
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${item.color}18` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: item.color }} />
                          </span>
                          <span className="flex-1 font-medium">{item.label}</span>
                          <span className="text-[11px] text-gray-300">{item.hint}</span>
                          <Plus className="w-3.5 h-3.5 text-gray-300" />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>

                {/* Footer hints */}
                <div className="px-4 py-2.5 border-t border-black/5 flex items-center gap-4">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <kbd className="bg-black/5 rounded px-1.5 py-0.5 text-[10px]">↑↓</kbd> Naviguer
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <kbd className="bg-black/5 rounded px-1.5 py-0.5 text-[10px]">↵</kbd> Ouvrir
                  </span>
                  <span className="text-[11px] text-gray-400 ml-auto">
                    Essayez <code className="bg-black/5 px-1 rounded text-[10px]">eau 250</code>
                  </span>
                </div>
              </Command>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
