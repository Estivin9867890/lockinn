"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase-server";
import { addPoints } from "./points";
import type { Investment, InvestmentTransaction } from "@/lib/types";

export async function getInvestments(): Promise<Investment[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("investments")
    .select("*, transactions:investment_transactions(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data || []) as Investment[];
}

export async function addInvestment(payload: {
  name: string;
  ticker?: string;
  category: string;
  amount_eur: number;
  quantity?: number;
  buy_price?: number;
  current_price?: number;
  date: string;
  notes?: string;
}): Promise<Investment> {
  const { sb, user } = await requireUser();
  const { data, error } = await sb
    .from("investments")
    .insert({ user_id: user.id, ...payload })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Create initial buy transaction
  if (payload.quantity && payload.buy_price) {
    await sb.from("investment_transactions").insert({
      user_id: user.id,
      investment_id: data.id,
      type: "buy",
      quantity: payload.quantity,
      price_eur: payload.buy_price,
      total_eur: payload.amount_eur,
      date: payload.date,
    });
  }

  revalidatePath("/investments");
  return { ...data, transactions: [] } as Investment;
}

export async function addTransaction(payload: {
  investment_id: string;
  type: "buy" | "sell";
  quantity: number;
  price_eur: number;
  date: string;
  notes?: string;
}): Promise<InvestmentTransaction> {
  const { sb, user } = await requireUser();
  const total_eur = payload.quantity * payload.price_eur;

  const { data, error } = await sb
    .from("investment_transactions")
    .insert({ user_id: user.id, ...payload, total_eur })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Update investment amount_eur
  const { data: inv } = await sb.from("investments")
    .select("amount_eur, quantity")
    .eq("id", payload.investment_id)
    .single();
  if (inv) {
    const newQty = (inv.quantity || 0) + (payload.type === "buy" ? payload.quantity : -payload.quantity);
    const newAmt = (inv.amount_eur || 0) + (payload.type === "buy" ? total_eur : -total_eur);
    await sb.from("investments").update({
      quantity: newQty,
      amount_eur: Math.max(0, newAmt),
      current_price: payload.price_eur,
    }).eq("id", payload.investment_id);
  }

  if (payload.type === "buy") {
    await addPoints("investissement", `Investissement — ${payload.quantity} unités`, 15);
  }

  revalidatePath("/investments");
  return data as InvestmentTransaction;
}

export async function deleteInvestment(id: string): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("investments").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/investments");
}

export async function updateCurrentPrice(investmentId: string, price: number): Promise<void> {
  const { sb, user } = await requireUser();
  await sb.from("investments").update({ current_price: price })
    .eq("id", investmentId).eq("user_id", user.id);
  revalidatePath("/investments");
}
