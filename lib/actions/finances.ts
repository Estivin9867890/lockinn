"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { FinanceTransaction, FinanceSubscription } from "@/lib/types";

export async function addIncome(data: Omit<FinanceTransaction, "id" | "created_at" | "is_income">): Promise<FinanceTransaction> {
  return addTransaction({ ...data, is_income: true });
}

export async function addTransaction(data: Omit<FinanceTransaction, "id" | "created_at">): Promise<FinanceTransaction> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("finances_transactions").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/");
  return row;
}

export async function deleteTransaction(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("finances_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function addSubscription(data: Omit<FinanceSubscription, "id" | "created_at">): Promise<FinanceSubscription> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb.from("finances_subscriptions").insert({ ...data, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  return row;
}

export async function deleteSubscription(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("finances_subscriptions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}
