"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase-server";
import { addPoints } from "./points";
import type { SleepLog } from "@/lib/types";

function calcDurationMin(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bed = bh * 60 + bm;
  let wake = wh * 60 + wm;
  if (wake <= bed) wake += 24 * 60;
  return wake - bed;
}

function calcScore(durationMin: number, quality: number, goalHours: number): number {
  const durationScore = Math.min((durationMin / (goalHours * 60)) * 60, 60);
  const qualityScore = (quality / 10) * 40;
  return Math.round(durationScore + qualityScore);
}

export async function getSleepLogs(): Promise<SleepLog[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("sleep_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(30);
  return (data || []) as SleepLog[];
}

export async function addSleepLog(payload: {
  date: string;
  bedtime: string;
  wake_time: string;
  quality: number;
  notes?: string;
  goal_hours?: number;
}): Promise<SleepLog> {
  const { sb, user } = await requireUser();
  const goalHours = payload.goal_hours ?? 8;
  const durationMin = calcDurationMin(payload.bedtime, payload.wake_time);
  const score = calcScore(durationMin, payload.quality, goalHours);

  const { data, error } = await sb.from("sleep_logs").insert({
    user_id: user.id,
    date: payload.date,
    bedtime: payload.bedtime,
    wake_time: payload.wake_time,
    duration_min: durationMin,
    quality: payload.quality,
    score,
    notes: payload.notes ?? null,
  }).select().single();

  if (error) throw new Error(error.message);

  if (score >= 80) {
    await addPoints("sommeil_top", `Sommeil optimal — score ${score}/100`, 20);
  } else if (score >= 60) {
    await addPoints("sommeil_ok", `Sommeil correct — score ${score}/100`, 10);
  }

  revalidatePath("/sleep");
  revalidatePath("/score");
  return data as SleepLog;
}

export async function deleteSleepLog(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("sleep_logs").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/sleep");
}
