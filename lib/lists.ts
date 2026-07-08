"use client";

import { createClient } from "@/lib/supabase/client";

export type GameList = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type ListItem = {
  id: string;
  list_id: string;
  rawg_id: number;
  name: string;
  cover_url: string | null;
  released: string | null;
  genres: string[];
  added_at: string;
};

/** Списки текущего пользователя (+ кол-во игр). */
export async function fetchMyLists(): Promise<
  (GameList & { count: number })[]
> {
  const supabase = createClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("lists")
    .select("*, list_items(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    user_id: l.user_id as string,
    title: l.title as string,
    description: (l.description as string) ?? null,
    created_at: l.created_at as string,
    count:
      (l.list_items as { count: number }[] | undefined)?.[0]?.count ?? 0,
  }));
}

export async function createList(
  title: string,
  description = ""
): Promise<GameList> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нужно войти в аккаунт");
  const { data, error } = await supabase
    .from("lists")
    .insert({ user_id: user.id, title, description })
    .select("*")
    .single();
  if (error) throw error;
  return data as GameList;
}

export async function deleteList(id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw error;
}

export async function addToList(
  listId: string,
  game: Omit<ListItem, "id" | "list_id" | "added_at">
): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase
    .from("list_items")
    .upsert(
      { list_id: listId, ...game },
      { onConflict: "list_id,rawg_id" }
    );
  if (error) throw error;
}

export async function removeFromList(
  listId: string,
  rawgId: number
): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("rawg_id", rawgId);
  if (error) throw error;
}
