"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { Memo } from "@/lib/types";
import { EVENT_COLORS } from "@/lib/types";

export async function getMemos(): Promise<Memo[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("memos")
    .select("*")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return (data || []) as Memo[];
}

export async function addMemo(payload: {
  content: string;
  icon: string;
  color: string;
  scheduled_at?: string | null;
}): Promise<Memo> {
  const { sb, user } = await requireUser();

  let event_id: string | null = null;

  // Smart Schedule — auto-inject dans le calendrier
  if (payload.scheduled_at) {
    const start = new Date(payload.scheduled_at);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // +30min
    const { data: ev } = await sb
      .from("events")
      .insert({
        user_id: user.id,
        title: payload.content.slice(0, 80),
        type: "personal",
        color: EVENT_COLORS.personal,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        all_day: false,
        notes: `📝 Mémo : ${payload.content}`,
      })
      .select()
      .single();
    event_id = ev?.id ?? null;
  }

  const { data: row, error } = await sb
    .from("memos")
    .insert({
      user_id: user.id,
      content: payload.content,
      icon: payload.icon,
      color: payload.color,
      scheduled_at: payload.scheduled_at || null,
      event_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/memo");
  revalidatePath("/calendar");
  return row as Memo;
}

export async function deleteMemo(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  // Supprimer l'événement calendrier lié si existant
  const { data: memo } = await sb.from("memos").select("event_id").eq("id", id).single();
  if (memo?.event_id) {
    await sb.from("events").delete().eq("id", memo.event_id).eq("user_id", user.id);
  }
  await sb.from("memos").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/memo");
  revalidatePath("/calendar");
}

export async function toggleMemo(id: string, completed: boolean): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("memos").update({ completed }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/memo");
}

export async function togglePinMemo(id: string, pinned: boolean): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("memos").update({ pinned }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/memo");
}
