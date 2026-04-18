"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { ExerciseLibraryItem } from "@/lib/types";

export async function getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
  const { sb } = await requireUser();
  const { data } = await sb
    .from("exercise_library")
    .select("*")
    .order("muscle_group")
    .order("name");
  return (data || []) as ExerciseLibraryItem[];
}

export async function addExerciseLibraryItem(
  data: Omit<ExerciseLibraryItem, "id" | "user_id" | "created_at">
): Promise<ExerciseLibraryItem> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("exercise_library")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
  return row as ExerciseLibraryItem;
}

export async function deleteExerciseLibraryItem(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("exercise_library").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sport");
}
