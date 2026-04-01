"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { Supplement, SupplementLog } from "@/lib/types";

const TODAY = () => new Date().toISOString().split("T")[0];

const DEFAULT_SUPPLEMENTS = [
  { name: "Créatine", protein_g: 0, carbs_g: 0, fat_g: 0, has_macros: false, sort_order: 0 },
  { name: "Vitamines / Oméga-3", protein_g: 0, carbs_g: 0, fat_g: 0, has_macros: false, sort_order: 1 },
  { name: "Whey (1 dose)", protein_g: 25, carbs_g: 1, fat_g: 0.5, has_macros: true, sort_order: 2 },
  { name: "Caféine", protein_g: 0, carbs_g: 0, fat_g: 0, has_macros: false, sort_order: 3 },
];

export async function getSupplements(): Promise<Supplement[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("supplements")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");

  // Auto-seed defaults if empty
  if (!data || data.length === 0) {
    const { data: seeded } = await sb
      .from("supplements")
      .insert(DEFAULT_SUPPLEMENTS.map((s) => ({ ...s, user_id: user.id })))
      .select();
    return (seeded || []) as Supplement[];
  }
  return data as Supplement[];
}

export async function addSupplement(
  data: Omit<Supplement, "id" | "user_id" | "created_at">
): Promise<Supplement> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("supplements")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  return row as Supplement;
}

export async function getTodaySupplementLogs(): Promise<SupplementLog[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("supplement_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", TODAY());
  return (data || []) as SupplementLog[];
}

export async function toggleSupplementLog(supplementId: string, checked: boolean): Promise<void> {
  const { sb, user } = await requireUser();
  if (checked) {
    await sb
      .from("supplement_logs")
      .insert({ user_id: user.id, supplement_id: supplementId, date: TODAY() });
  } else {
    await sb
      .from("supplement_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("supplement_id", supplementId)
      .eq("date", TODAY());
  }
  revalidatePath("/nutrition");
  revalidatePath("/");
}
