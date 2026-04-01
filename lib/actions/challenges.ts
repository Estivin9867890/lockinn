"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { Challenge } from "@/lib/types";
import { addPoints } from "./points";

// Date du lundi de la semaine courante
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=dim, 1=lun…
  const diff = (day === 0 ? -6 : 1 - day); // offset vers lundi
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

const WEEKLY_POOL: Array<Omit<Challenge, "id" | "user_id" | "current" | "completed" | "completed_at" | "created_at" | "week_start">> = [
  { title: "Hydratation parfaite", description: "Atteins ton objectif d'eau 5 jours", emoji: "💧", type: "weekly", target: 5, points_reward: 40 },
  { title: "Semaine sportive", description: "Valide 3 séances de sport", emoji: "🏋️", type: "weekly", target: 3, points_reward: 60 },
  { title: "Journal alimentaire", description: "Enregistre 10 repas cette semaine", emoji: "🥗", type: "weekly", target: 10, points_reward: 50 },
  { title: "Suppléments réguliers", description: "Prends tes suppléments 5 jours d'affilée", emoji: "💊", type: "weekly", target: 5, points_reward: 30 },
  { title: "Mémos productifs", description: "Crée 3 mémos cette semaine", emoji: "📝", type: "weekly", target: 3, points_reward: 25 },
];

const EASTER_EGGS_POOL: Array<Omit<Challenge, "id" | "user_id" | "current" | "completed" | "completed_at" | "created_at" | "week_start">> = [
  { title: "Lève-tôt", description: "Score ≥ 100 pts avant 9h pendant 3 jours", emoji: "🌅", type: "easter_egg", target: 3, points_reward: 150 },
  { title: "Athlète", description: "5 séances de sport en une semaine", emoji: "🏆", type: "easter_egg", target: 5, points_reward: 200 },
  { title: "Clean Week", description: "0 junk food & 0 alcool pendant 7 jours", emoji: "🥦", type: "easter_egg", target: 7, points_reward: 250 },
  { title: "Maniaque santé", description: "100% suppléments pris 7 jours de suite", emoji: "💪", type: "easter_egg", target: 7, points_reward: 180 },
  { title: "Focus Master", description: "Cumule 5h de sessions focus", emoji: "🔒", type: "easter_egg", target: 300, points_reward: 300 },
];

export async function getChallenges(): Promise<{ weekly: Challenge[]; easterEggs: Challenge[] }> {
  const { sb, user } = await requireUser();
  const weekStart = currentWeekStart();

  // Vérifier si les défis hebdo existent pour cette semaine
  const { data: existingWeekly } = await sb
    .from("challenges")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "weekly")
    .eq("week_start", weekStart);

  if (!existingWeekly || existingWeekly.length === 0) {
    await sb.from("challenges").insert(
      WEEKLY_POOL.map((c) => ({ ...c, user_id: user.id, week_start: weekStart, current: 0, completed: false }))
    );
  }

  // Vérifier si les easter eggs existent
  const { data: existingEggs } = await sb
    .from("challenges")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "easter_egg");

  if (!existingEggs || existingEggs.length === 0) {
    await sb.from("challenges").insert(
      EASTER_EGGS_POOL.map((c) => ({ ...c, user_id: user.id, current: 0, completed: false }))
    );
  }

  const [{ data: weekly }, { data: eggs }] = await Promise.all([
    sb.from("challenges").select("*").eq("user_id", user.id).eq("type", "weekly").eq("week_start", weekStart).order("created_at"),
    sb.from("challenges").select("*").eq("user_id", user.id).eq("type", "easter_egg").order("points_reward"),
  ]);

  return {
    weekly: (weekly || []) as Challenge[],
    easterEggs: (eggs || []) as Challenge[],
  };
}

export async function updateChallengeProgress(id: string, increment: number): Promise<void> {
  const { sb, user } = await requireUser();
  const { data: ch } = await sb.from("challenges").select("*").eq("id", id).single();
  if (!ch || ch.completed) return;

  const newCurrent = Math.min(ch.current + increment, ch.target);
  const completed = newCurrent >= ch.target;

  await sb.from("challenges").update({
    current: newCurrent,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq("id", id).eq("user_id", user.id);

  if (completed) {
    await addPoints("challenge_complete", `🎯 Défi : ${ch.title}`, ch.points_reward);
  }

  revalidatePath("/challenges");
  revalidatePath("/score");
}

export async function manualCompleteChallenge(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  const { data: ch } = await sb.from("challenges").select("*").eq("id", id).single();
  if (!ch || ch.completed) return;

  await sb.from("challenges").update({
    current: ch.target,
    completed: true,
    completed_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id);

  await addPoints("challenge_complete", `🥚 Easter Egg : ${ch.title}`, ch.points_reward);
  revalidatePath("/challenges");
  revalidatePath("/score");
}
