"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { InventoryItem } from "@/lib/types";

export async function addInventoryItem(data: Omit<InventoryItem, "id" | "created_at">): Promise<InventoryItem> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("inventory").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  return row;
}

export async function updateUsage(id: string, current_usage: number) {
  const { sb } = await requireUser();
  const { error } = await sb.from("inventory").update({ current_usage }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function deleteInventoryItem(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("inventory").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}
