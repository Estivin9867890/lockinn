"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { PRRecord } from "@/lib/types";

export async function getPRs(): Promise<PRRecord[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("pr_tracker")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  return (data || []) as PRRecord[];
}

export async function addPR(data: Omit<PRRecord, "id" | "user_id" | "created_at">): Promise<PRRecord> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("pr_tracker")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
  return row as PRRecord;
}

export async function deletePR(id: string) {
  const { sb } = await requireUser();
  await sb.from("pr_tracker").delete().eq("id", id);
  revalidatePath("/sport");
}
