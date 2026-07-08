"use client";

import { createClient } from "@/lib/supabase/client";
import type { CriterionKey } from "@/lib/criteria";

export type GameStatus = "completed" | "playing" | "backlog" | "dropped";

export type GameEntry = {
  id: string;
  user_id: string;
  rawg_id: number;
  name: string;
  cover_url: string | null;
  released: string | null;
  genres: string[];
  status: GameStatus;
  review: string | null;
  overall: number | null;
  hours_played: number | null;
  platforms_played: string[] | null;
  favorite: boolean;
  added_at: string;
} & Record<CriterionKey, number | null>;

export type EntryInput = {
  rawg_id: number;
  name: string;
  cover_url: string | null;
  released: string | null;
  genres: string[];
  status: GameStatus;
  review: string;
  hours_played: number | null;
  platforms_played: string[];
  favorite: boolean;
  atmosphere: number;
  story: number;
  gameplay: number;
  graphics: number;
  sound: number;
};

/** Все записи текущего пользователя. */
export async function fetchEntries(): Promise<GameEntry[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("game_entries")
    .select("*")
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GameEntry[];
}

/** Запись по rawg_id для текущего пользователя (или null). */
export async function fetchEntry(rawgId: number): Promise<GameEntry | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("game_entries")
    .select("*")
    .eq("rawg_id", rawgId)
    .maybeSingle();
  if (error) throw error;
  return (data as GameEntry) ?? null;
}

/** Создать или обновить запись (upsert по user_id + rawg_id). */
export async function saveEntry(input: EntryInput): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нужно войти в аккаунт");

  const { error } = await supabase.from("game_entries").upsert(
    { ...input, user_id: user.id },
    { onConflict: "user_id,rawg_id" }
  );
  if (error) throw error;
}

/** Быстро переключить «избранное» для уже добавленной игры. */
export async function toggleFavorite(
  rawgId: number,
  favorite: boolean
): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase
    .from("game_entries")
    .update({ favorite })
    .eq("rawg_id", rawgId);
  if (error) throw error;
}

/** Удалить запись из библиотеки. */
export async function removeEntry(rawgId: number): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase
    .from("game_entries")
    .delete()
    .eq("rawg_id", rawgId);
  if (error) throw error;
}
