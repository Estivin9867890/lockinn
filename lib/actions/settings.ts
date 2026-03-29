"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { UserSettings } from "@/lib/types";

export async function getSettings(): Promise<UserSettings | null> {
  const { sb, user } = await requireUser();
  const { data } = await sb.from("user_settings").select("*").eq("user_id", user.id).single();
  return data;
}

export async function upsertSettings(
  patch: Partial<Omit<UserSettings, "id" | "user_id" | "updated_at">>
) {
  const { sb, user } = await requireUser();
  const { error } = await sb
    .from("user_settings")
    .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
