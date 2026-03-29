"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { NutritionLog, WaterLog } from "@/lib/types";

export async function addMeal(data: Omit<NutritionLog, "id" | "created_at">): Promise<NutritionLog> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("nutrition_logs").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
  return row;
}

export async function toggleMealCompleted(id: string, completed: boolean) {
  const { sb } = await requireUser();
  const { error } = await sb.from("nutrition_logs").update({ completed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
}

export async function deleteMeal(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("nutrition_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
}

export async function deleteWater(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("water_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
}

export async function addWater(amount_ml: number, date?: string): Promise<WaterLog> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("water_logs")
    .insert({ amount_ml, date: date ?? new Date().toISOString().split("T")[0], user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
  return row;
}
