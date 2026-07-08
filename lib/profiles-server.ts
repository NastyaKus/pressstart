import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/profiles";
import type { GameEntry } from "@/lib/entries";

/** Публичный профиль по @юзернейму (серверный клиент, публичные политики). */
export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, banner_url, created_at")
    .ilike("username", username)
    .maybeSingle();
  return (data as Profile) ?? null;
}

/** Публичная библиотека пользователя по его id. */
export async function getEntriesByUser(userId: string): Promise<GameEntry[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("game_entries")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  return (data ?? []) as GameEntry[];
}
