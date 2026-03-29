"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { SportSpot, SportSession } from "@/lib/types";

export async function addSpot(data: Omit<SportSpot, "id" | "created_at">): Promise<SportSpot> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("sport_spots").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
  revalidatePath("/");
  return row;
}

export async function deleteSpot(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("sport_spots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
}

export async function addSession(data: Omit<SportSession, "id" | "created_at">): Promise<SportSession> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("sport_sessions").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
  revalidatePath("/");
  return row;
}

export async function deleteSession(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("sport_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
}
