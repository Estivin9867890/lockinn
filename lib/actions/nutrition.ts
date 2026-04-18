"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { NutritionLog, WaterLog, MealIngredient } from "@/lib/types";

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

export interface IngredientInput {
  food_name: string;
  weight_g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
}

export async function addMealWithIngredients(
  mealData: Omit<NutritionLog, "id" | "created_at">,
  ingredients: IngredientInput[]
): Promise<NutritionLog> {
  const { sb, user } = await requireUser();
  const { data: meal, error } = await sb
    .from("nutrition_logs")
    .insert({ ...mealData, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (ingredients.length > 0) {
    await sb.from("meal_ingredients").insert(
      ingredients.map((ing) => ({ ...ing, meal_id: meal.id }))
    );
  }
  revalidatePath("/nutrition");
  revalidatePath("/");
  return meal as NutritionLog;
}

export async function getMealIngredients(mealId: string): Promise<MealIngredient[]> {
  const { sb } = await requireUser();
  const { data } = await sb
    .from("meal_ingredients")
    .select("*")
    .eq("meal_id", mealId)
    .order("created_at");
  return (data || []) as MealIngredient[];
}

export async function addWeightLog(weight_kg: number, date?: string, notes?: string): Promise<import("@/lib/types").WeightLog> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("weight_logs")
    .insert({ weight_kg, date: date ?? new Date().toISOString().split("T")[0], notes: notes ?? null, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
  return row;
}

export async function getWeightLogs(limit = 60): Promise<import("@/lib/types").WeightLog[]> {
  const { sb } = await requireUser();
  const { data } = await sb
    .from("weight_logs")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  return (data || []) as import("@/lib/types").WeightLog[];
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
