"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { WorkoutDay, WorkoutExercise } from "@/lib/types";

export async function getWeeklyProgram(): Promise<WorkoutDay[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("workout_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("day_of_week");
  return (data || []) as WorkoutDay[];
}

export async function upsertWorkoutDay(
  dayOfWeek: number,
  label: string,
  exercises: WorkoutExercise[]
): Promise<WorkoutDay> {
  const { sb, user } = await requireUser();
  const { data: existing } = await sb
    .from("workout_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("day_of_week", dayOfWeek)
    .single();

  let row;
  if (existing?.id) {
    const { data } = await sb
      .from("workout_plans")
      .update({ label, exercises })
      .eq("id", existing.id)
      .select()
      .single();
    row = data;
  } else {
    const { data } = await sb
      .from("workout_plans")
      .insert({ user_id: user.id, day_of_week: dayOfWeek, label, exercises })
      .select()
      .single();
    row = data;
  }
  revalidatePath("/sport");
  return row as WorkoutDay;
}

export async function deleteWorkoutDay(id: string) {
  const { sb } = await requireUser();
  await sb.from("workout_plans").delete().eq("id", id);
  revalidatePath("/sport");
}
