"use server";
import { requireUser } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { Note } from "@/lib/types";

export async function getNotes(): Promise<Note[]> {
  const { sb, user } = await requireUser();
  const { data } = await sb
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function addNote(data: { title?: string; content?: string }): Promise<Note> {
  const { sb, user } = await requireUser();
  const { data: row, error } = await sb
    .from("notes")
    .insert({ user_id: user.id, title: data.title || "Sans titre", content: data.content || "" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath("/");
  return row;
}

export async function updateNote(id: string, patch: { title?: string; content?: string; pinned?: boolean; tags?: string[] }) {
  const { sb } = await requireUser();
  const { error } = await sb
    .from("notes")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function deleteNote(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath("/");
}
