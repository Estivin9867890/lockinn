"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { CalendarEvent } from "@/lib/types";

export async function getEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at");
  return data || [];
}

export async function addEvent(
  data: Omit<CalendarEvent, "id" | "created_at">
): Promise<CalendarEvent> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("events")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/");
  return row;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, "id" | "created_at">>
): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from("events").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteEvent(id: string): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

/** Parse .ics content and batch-insert events */
export async function importICS(icsContent: string): Promise<number> {
  const { sb, user } = await requireUser();

  function parseICSDate(val: string): string {
    const clean = val.replace("TZID=", "").split(":").pop()!;
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T00:00:00Z`;
    }
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:00Z`;
  }

  const eventBlocks = icsContent.split("BEGIN:VEVENT").slice(1);
  const rows: any[] = [];

  for (const block of eventBlocks) {
    const get = (key: string) => {
      const match = block.match(new RegExp(`^${key}[^:]*:(.+)$`, "m"));
      return match ? match[1].trim() : "";
    };
    const title = get("SUMMARY");
    const startRaw = get("DTSTART");
    const endRaw = get("DTEND");
    if (!title || !startRaw) continue;
    const start_at = parseICSDate(startRaw);
    const end_at = endRaw ? parseICSDate(endRaw) : start_at;
    const all_day = startRaw.length === 8 || startRaw.includes("VALUE=DATE");
    rows.push({ user_id: user.id, title, start_at, end_at, type: "personal", color: "#FB923C", all_day, notes: get("DESCRIPTION") || undefined });
  }

  if (rows.length === 0) return 0;
  const { error } = await sb.from("events").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  return rows.length;
}
