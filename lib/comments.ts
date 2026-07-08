"use client";

import { createClient } from "@/lib/supabase/client";

export type CommentAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type GameComment = {
  id: string;
  rawg_id: number;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: CommentAuthor | null;
};

/** Все отзывы к игре (новые сверху) с автором. */
export async function fetchComments(rawgId: number): Promise<GameComment[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("game_comments")
    .select("*, profiles(username, display_name, avatar_url)")
    .eq("rawg_id", rawgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GameComment[];
}

/** Оценки игроков по этой игре (user_id → overall) для показа рядом с отзывом. */
export async function fetchGameScores(
  rawgId: number
): Promise<Record<string, number>> {
  const supabase = createClient();
  if (!supabase) return {};
  const { data } = await supabase
    .from("game_entries")
    .select("user_id, overall")
    .eq("rawg_id", rawgId);
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { user_id: string; overall: number | null }[]) {
    if (row.overall && row.overall > 0) map[row.user_id] = row.overall;
  }
  return map;
}

export async function postComment(
  rawgId: number,
  body: string
): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нужно войти в аккаунт");
  const { error } = await supabase
    .from("game_comments")
    .insert({ rawg_id: rawgId, user_id: user.id, body });
  if (error) throw error;
}

export async function updateComment(id: string, body: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase
    .from("game_comments")
    .update({ body })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const { error } = await supabase.from("game_comments").delete().eq("id", id);
  if (error) throw error;
}
