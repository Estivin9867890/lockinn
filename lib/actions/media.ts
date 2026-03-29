"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { MediaItem } from "@/lib/types";

export async function addMedia(data: Omit<MediaItem, "id" | "created_at">): Promise<MediaItem> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("media_vault").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/media");
  revalidatePath("/");
  return row;
}

export async function updateMediaStatus(id: string, status: MediaItem["status"], progress?: number) {
  const { sb } = await requireUser();
  const { error } = await sb.from("media_vault").update({ status, ...(progress !== undefined ? { progress } : {}) }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/media");
}

export async function updateMediaRating(id: string, rating: number) {
  const { sb } = await requireUser();
  const { error } = await sb.from("media_vault").update({ rating }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/media");
}

export async function deleteMedia(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("media_vault").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/media");
}
