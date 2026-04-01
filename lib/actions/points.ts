"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { PointRecord } from "@/lib/types";
import { DEFAULT_POINTS_CONFIG } from "@/lib/types";

const TODAY = () => new Date().toISOString().split("T")[0];

export async function addPoints(action: string, label: string, customPoints?: number): Promise<PointRecord> {
  const { sb, user } = await requireUser();
  const points = customPoints ?? DEFAULT_POINTS_CONFIG[action] ?? 0;
  const { data: row, error } = await sb
    .from("points_history")
    .insert({ user_id: user.id, date: TODAY(), action, label, points })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/score");
  return row as PointRecord;
}

export async function deletePoints(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  const { error } = await sb
    .from("points_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/score");
}

export async function getTodayPoints(): Promise<{ total: number; records: PointRecord[] }> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("points_history")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", TODAY())
    .order("created_at", { ascending: false });
  const records = (data || []) as PointRecord[];
  const total = records.reduce((s, r) => s + r.points, 0);
  return { total, records };
}

export async function getMonthPoints(): Promise<number> {
  const { sb, user } = await requireUser();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { data } = await sb
    .from("points_history")
    .select("points")
    .eq("user_id", user.id)
    .gte("date", startOfMonth.toISOString().split("T")[0]);
  return ((data || []) as { points: number }[]).reduce((s, r) => s + r.points, 0);
}

export async function getStreakData(dailyGoal: number): Promise<{
  currentStreak: number;
  bestStreak: number;
  successRate: number;
  last30Days: { date: string; points: number; success: boolean }[];
}> {
  const { sb, user } = await requireUser();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data } = await sb
    .from("points_history")
    .select("date, points")
    .eq("user_id", user.id)
    .gte("date", since.toISOString().split("T")[0]);

  // Group by date
  const byDate: Record<string, number> = {};
  for (const r of data || []) {
    byDate[r.date] = (byDate[r.date] || 0) + r.points;
  }

  // Build 30-day array
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const date = d.toISOString().split("T")[0];
    const points = byDate[date] || 0;
    return { date, points, success: points >= dailyGoal };
  });

  // Current streak (from today backwards)
  let currentStreak = 0;
  for (let i = last30Days.length - 1; i >= 0; i--) {
    if (last30Days[i].success) currentStreak++;
    else break;
  }

  // Best streak in period
  let bestStreak = 0;
  let streak = 0;
  for (const day of last30Days) {
    if (day.success) { streak++; bestStreak = Math.max(bestStreak, streak); }
    else streak = 0;
  }

  const successDays = last30Days.filter((d) => d.success).length;
  const successRate = Math.round((successDays / 30) * 100);

  return { currentStreak, bestStreak, successRate, last30Days };
}
