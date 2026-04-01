"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { Project, Milestone } from "@/lib/types";
import { addPoints } from "./points";

export async function getProjects(): Promise<Project[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("projects")
    .select("*, milestones(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data || []) as Project[];
}

export async function addProject(payload: Partial<Omit<Project, "id" | "user_id" | "created_at" | "milestones">>): Promise<Project> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("projects")
    .insert({ user_id: user.id, total_time_min: 0, ...payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  return row as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("projects").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/projects");
}

export async function addMilestone(payload: {
  project_id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}): Promise<Milestone> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("milestones")
    .insert({ user_id: user.id, ...payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  return row as Milestone;
}

export async function completeMilestone(id: string, _projectId: string): Promise<void> {
  const { sb, user } = await requireUser();
  const { data: ms } = await sb.from("milestones").select("*").eq("id", id).single();
  if (!ms || ms.completed) return;

  await sb.from("milestones")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  await addPoints("milestone_complete", `✅ Étape validée : ${ms.title}`, ms.points);
  revalidatePath("/projects");
}

export async function deleteMilestone(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("milestones").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/projects");
}

export async function saveFocusSession(projectId: string, durationMin: number): Promise<void> {
  const { sb, user } = await requireUser();

  await sb.from("focus_sessions").insert({
    user_id: user.id,
    project_id: projectId,
    duration_min: durationMin,
  });

  // Update project total_time_min
  const { data: proj } = await sb.from("projects").select("total_time_min").eq("id", projectId).single();
  if (proj) {
    await sb.from("projects")
      .update({ total_time_min: (proj.total_time_min || 0) + durationMin })
      .eq("id", projectId)
      .eq("user_id", user.id);
  }

  // Points : 1 pt par tranche de 5 min
  const pts = Math.floor(durationMin / 5);
  if (pts > 0) {
    await addPoints("focus_session", `⏱️ Focus ${durationMin}min`, pts);
  }

  revalidatePath("/projects");
}
