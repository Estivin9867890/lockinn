"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Grid3X3,
  Lock, Dumbbell, Upload, Download, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
  addMonths, subMonths, startOfMonth, endOfMonth, isToday, isSameDay,
  isSameMonth, parseISO, formatISO, differenceInMinutes, getHours, getMinutes,
  setHours, setMinutes, startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { addEvent, deleteEvent, importICS } from "@/lib/actions/calendar";
import Modal, { FormField, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/ui/Modal";
import type { CalendarEvent, EventType } from "@/lib/types";
import { EVENT_COLORS, EVENT_LABELS } from "@/lib/types";

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 7;
const END_HOUR = 23;

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } } };

interface EventForm {
  title: string; type: EventType; startDate: string; startTime: string;
  endTime: string; notes: string; all_day: boolean;
}

const emptyForm = (): EventForm => ({
  title: "", type: "personal", all_day: false, notes: "",
  startDate: format(new Date(), "yyyy-MM-dd"),
  startTime: format(setMinutes(setHours(new Date(), getHours(new Date())), 0), "HH:mm"),
  endTime: format(setMinutes(setHours(new Date(), getHours(new Date()) + 1), 0), "HH:mm"),
});

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("week");
  const [refDate, setRefDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm());
  const [pending, setPending] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(refDate, { weekStartsOn: 1 }) });
  const monthDays = eachDayOfInterval({ start: startOfMonth(refDate), end: endOfMonth(refDate) });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const from = view === "week"
      ? formatISO(weekStart)
      : formatISO(startOfMonth(refDate));
    const to = view === "week"
      ? formatISO(endOfWeek(refDate, { weekStartsOn: 1 }))
      : formatISO(endOfMonth(refDate));
    const { data } = await supabase.from("events").select("*")
      .gte("start_at", from).lte("start_at", to).order("start_at");
    setEvents(data || []);
    setLoading(false);
  }, [refDate, view]); // eslint-disable-line

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const openTemplateLockin = () => {
    const now = new Date();
    const h = getHours(now); const m = getMinutes(now);
    setForm({
      title: "🔒 LockIn Session",
      type: "lockin", all_day: false, notes: "Mode focus — concentration totale.",
      startDate: format(now, "yyyy-MM-dd"),
      startTime: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      endTime: `${String(h + 2).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    });
    setModal(true);
  };

  const openTemplateSport = () => {
    const now = new Date();
    setForm({
      title: "🏃 Sport Session",
      type: "sport", all_day: false, notes: "",
      startDate: format(now, "yyyy-MM-dd"),
      startTime: "07:00", endTime: "08:00",
    });
    setModal(true);
  };

  const handleClickSlot = (day: Date, hour: number) => {
    setForm({
      ...emptyForm(),
      startDate: format(day, "yyyy-MM-dd"),
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
    });
    setModal(true);
  };

  const handleAddEvent = async () => {
    if (!form.title) return;
    setPending(true);
    try {
      const start_at = `${form.startDate}T${form.startTime}:00`;
      const end_at = form.all_day ? `${form.startDate}T23:59:00` : `${form.startDate}T${form.endTime}:00`;
      const newEv = await addEvent({
        title: form.title, type: form.type, color: EVENT_COLORS[form.type],
        start_at, end_at, notes: form.notes || undefined, all_day: form.all_day,
      });
      setEvents((prev) => [...prev, newEv].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      toast.success("📅 Événement ajouté !", {
        action: { label: "Annuler", onClick: async () => { await deleteEvent(newEv.id); loadEvents(); } },
      });
      setModal(false);
      setForm(emptyForm());
    } catch { toast.error("Erreur lors de l'ajout"); }
    setPending(false);
  };

  const handleDelete = async (ev: CalendarEvent) => {
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    setSelectedEvent(null);
    await deleteEvent(ev.id);
    toast.success("Événement supprimé");
  };

  const handleICSImport = async (file: File) => {
    try {
      const content = await file.text();
      const count = await importICS(content);
      toast.success(`${count} événement(s) importé(s) depuis Apple Calendar`);
      loadEvents();
    } catch { toast.error("Erreur d'import .ics"); }
  };

  const handleICSExport = () => {
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LockIn//FR",
      ...events.flatMap((ev) => [
        "BEGIN:VEVENT",
        `DTSTART:${ev.start_at.replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTEND:${ev.end_at.replace(/[-:]/g, "").split(".")[0]}Z`,
        `SUMMARY:${ev.title}`,
        ...(ev.notes ? [`DESCRIPTION:${ev.notes}`] : []),
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lockin.ics"; a.click();
    URL.revokeObjectURL(url);
  };

  // Check if a LockIn event is active now
  const now = new Date();
  const activeLockIn = events.find((ev) => ev.type === "lockin" &&
    new Date(ev.start_at) <= now && new Date(ev.end_at) >= now);

  // Position event in weekly grid
  const eventPos = (ev: CalendarEvent) => {
    const start = parseISO(ev.start_at);
    const end = parseISO(ev.end_at);
    const topMinutes = (getHours(start) - START_HOUR) * 60 + getMinutes(start);
    const durationMin = Math.max(differenceInMinutes(end, start), 15);
    return {
      top: (topMinutes / 60) * HOUR_HEIGHT,
      height: Math.max((durationMin / 60) * HOUR_HEIGHT, 24),
    };
  };

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-400">Catégorie</p>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mt-0.5">
            Calendrier 📅
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* ICS import */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-gray-500 bg-black/5 hover:bg-black/8 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" /> Importer .ics
            <input type="file" accept=".ics" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleICSImport(e.target.files[0])} />
          </label>
          <button onClick={handleICSExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-gray-500 bg-black/5 hover:bg-black/8 transition-all">
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>

          {/* Templates */}
          <button onClick={openTemplateLockin}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 4px 14px rgba(91,156,246,0.35)" }}>
            <Lock className="w-3.5 h-3.5" /> LockIn Session
          </button>
          <button onClick={openTemplateSport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #34D399, #10B981)", boxShadow: "0 4px 14px rgba(52,211,153,0.35)" }}>
            <Dumbbell className="w-3.5 h-3.5" /> Sport
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setForm(emptyForm()); setModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-white"
            style={{ background: "linear-gradient(135deg, #FB923C, #F97316)", boxShadow: "0 4px 14px rgba(251,146,60,0.35)" }}>
            <Plus className="w-4 h-4" /> Événement
          </motion.button>
        </div>
      </motion.div>

      {/* Focus Mode banner */}
      <AnimatePresence>
        {activeLockIn && (
          <motion.div key="focus"
            initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, rgba(91,156,246,0.12), rgba(129,140,248,0.08))", border: "1px solid rgba(91,156,246,0.25)" }}>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[13px] font-semibold text-blue-700">🔒 Mode Focus actif</span>
            <span className="text-[12px] text-blue-500">— {activeLockIn.title}</span>
            <span className="text-[11px] text-blue-400 ml-auto">
              Jusqu'à {format(parseISO(activeLockIn.end_at), "HH:mm")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation + view toggle */}
      <motion.div variants={item}>
        <div className="card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => view === "week" ? setRefDate(subWeeks(refDate, 1)) : setRefDate(subMonths(refDate, 1))}
              className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black/8 flex items-center justify-center transition-all">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-[15px] font-semibold text-gray-900 min-w-[180px] text-center">
              {view === "week"
                ? `${format(weekStart, "d MMM", { locale: fr })} – ${format(endOfWeek(refDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: fr })}`
                : format(refDate, "MMMM yyyy", { locale: fr })
              }
            </h2>
            <button onClick={() => view === "week" ? setRefDate(addWeeks(refDate, 1)) : setRefDate(addMonths(refDate, 1))}
              className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black/8 flex items-center justify-center transition-all">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setRefDate(new Date())}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-apple-blue bg-blue-50 hover:bg-blue-100 transition-all ml-2">
              Aujourd'hui
            </button>
          </div>

          <div className="flex bg-black/5 rounded-xl p-1 gap-1">
            {(["week", "month"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${v === view ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {v === "week" ? <><Calendar className="w-3.5 h-3.5" /> Semaine</> : <><Grid3X3 className="w-3.5 h-3.5" /> Mois</>}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Calendar views */}
      <motion.div variants={item}>
        <AnimatePresence mode="wait">
          {view === "week" ? (
            <motion.div key="week"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}>
              <WeekView days={weekDays} events={events} onClickSlot={handleClickSlot}
                onClickEvent={setSelectedEvent} eventPos={eventPos} />
            </motion.div>
          ) : (
            <motion.div key="month"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}>
              <MonthView refDate={refDate} days={monthDays} events={events}
                onClickDay={(d) => { setRefDate(d); setView("week"); }}
                onClickEvent={setSelectedEvent} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Event detail popover */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div key="detail"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div className="relative z-10 w-full max-w-[340px] rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
              style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
              <div className="h-0.5 w-full mb-4 rounded-full" style={{ background: selectedEvent.color }} />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${selectedEvent.color}18`, color: selectedEvent.color }}>
                    {EVENT_LABELS[selectedEvent.type as EventType]}
                  </span>
                  <h3 className="text-[16px] font-semibold text-gray-900 mt-2">{selectedEvent.title}</h3>
                  <p className="text-[12px] text-gray-400 mt-1">
                    {format(parseISO(selectedEvent.start_at), "EEEE d MMM · HH:mm", { locale: fr })}
                    {" → "}
                    {format(parseISO(selectedEvent.end_at), "HH:mm")}
                  </p>
                  {selectedEvent.notes && <p className="text-[12px] text-gray-500 mt-2">{selectedEvent.notes}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(selectedEvent)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add event modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel événement" accentColor="#5B9CF6">
        <div className="space-y-4">
          <FormField label="Titre" required>
            <FormInput placeholder="Nom de l'événement" value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <select value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}
                className="w-full px-3.5 py-2.5 rounded-xl text-[14px] text-gray-800 outline-none appearance-none cursor-pointer"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                {(Object.keys(EVENT_LABELS) as EventType[]).map((t) => (
                  <option key={t} value={t}>{EVENT_LABELS[t]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Date">
              <FormInput type="date" value={form.startDate}
                onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            </FormField>
          </div>
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Début">
                <FormInput type="time" value={form.startTime}
                  onChange={(v) => setForm((f) => ({ ...f, startTime: v }))} />
              </FormField>
              <FormField label="Fin">
                <FormInput type="time" value={form.endTime}
                  onChange={(v) => setForm((f) => ({ ...f, endTime: v }))} />
              </FormField>
            </div>
          )}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.all_day}
              onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
              className="w-4 h-4 rounded accent-apple-blue" />
            <span className="text-[13px] text-gray-700">Journée entière</span>
          </label>
          <FormField label="Notes">
            <FormTextarea placeholder="Description optionnelle…" value={form.notes}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))} rows={2} />
          </FormField>
          <SubmitButton label="Créer l'événement" loading={pending}
            color={EVENT_COLORS[form.type]} onClick={handleAddEvent} />
        </div>
      </Modal>
    </motion.div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ days, events, onClickSlot, onClickEvent, eventPos }: {
  days: Date[];
  events: CalendarEvent[];
  onClickSlot: (day: Date, hour: number) => void;
  onClickEvent: (ev: CalendarEvent) => void;
  eventPos: (ev: CalendarEvent) => { top: number; height: number };
}) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="card overflow-hidden p-0">
      {/* Day headers */}
      <div className="grid border-b border-black/5" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="h-12" />
        {days.map((day) => (
          <div key={day.toString()}
            className={`h-12 flex flex-col items-center justify-center border-l border-black/4 ${isToday(day) ? "bg-blue-50/70" : ""}`}>
            <p className="text-[10px] font-medium text-gray-400 uppercase">{format(day, "EEE", { locale: fr })}</p>
            <p className={`text-[14px] font-semibold ${isToday(day) ? "text-apple-blue" : "text-gray-800"}`}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "580px" }}>
        <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          {/* Time labels */}
          <div>
            {hours.map((h) => (
              <div key={h} className="flex items-start justify-end pr-3 text-[10px] text-gray-400 font-medium"
                style={{ height: HOUR_HEIGHT, paddingTop: 4 }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = events.filter((ev) => isSameDay(parseISO(ev.start_at), day));
            return (
              <div key={day.toString()}
                className="relative border-l border-black/4"
                style={{ height: hours.length * HOUR_HEIGHT }}>
                {/* Hourly slots (click to add) */}
                {hours.map((h) => (
                  <div key={h}
                    onClick={() => onClickSlot(day, h)}
                    className="border-t border-black/4 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    style={{ height: HOUR_HEIGHT }} />
                ))}
                {/* Events */}
                {dayEvents.map((ev) => {
                  const { top, height } = eventPos(ev);
                  return (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => { e.stopPropagation(); onClickEvent(ev); }}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden hover:brightness-95 transition-all"
                      style={{ top, height, background: `${ev.color}22`, borderLeft: `3px solid ${ev.color}`, zIndex: 10 }}>
                      <p className="text-[11px] font-semibold truncate" style={{ color: ev.color }}>{ev.title}</p>
                      {height > 30 && (
                        <p className="text-[10px] opacity-70" style={{ color: ev.color }}>
                          {format(parseISO(ev.start_at), "HH:mm")}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ refDate, days, events, onClickDay, onClickEvent }: {
  refDate: Date; days: Date[];
  events: CalendarEvent[];
  onClickDay: (d: Date) => void;
  onClickEvent: (ev: CalendarEvent) => void;
}) {
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  // Pad with empty days before first day
  const firstDayOfWeek = (days[0].getDay() + 6) % 7; // 0=Mon
  const paddedDays = [...Array(firstDayOfWeek).fill(null), ...days];
  while (paddedDays.length % 7 !== 0) paddedDays.push(null);

  return (
    <div className="card overflow-hidden p-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-black/5">
        {dayNames.map((d) => (
          <div key={d} className="h-9 flex items-center justify-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="h-24 border-b border-r border-black/4" />;
          const dayEvents = events.filter((ev) => isSameDay(parseISO(ev.start_at), day));
          return (
            <div key={day.toString()}
              onClick={() => onClickDay(day)}
              className={`h-24 p-2 border-b border-r border-black/4 cursor-pointer transition-colors overflow-hidden
                ${!isSameMonth(day, refDate) ? "opacity-30" : ""}
                ${isToday(day) ? "bg-blue-50/50" : "hover:bg-black/3"}`}>
              <p className={`text-[13px] font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? "bg-apple-blue text-white" : "text-gray-700"}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onClickEvent(ev); }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md cursor-pointer hover:brightness-95"
                    style={{ background: `${ev.color}20` }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                    <p className="text-[10px] font-medium truncate" style={{ color: ev.color }}>{ev.title}</p>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 3} autres</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
