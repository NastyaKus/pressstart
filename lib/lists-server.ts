import { createClient } from "@/lib/supabase/server";
import type { GameList, ListItem } from "@/lib/lists";

/** Список + его игры + автор (публично). */
export async function getListWithItems(id: string): Promise<{
  list: GameList;
  items: ListItem[];
  author: { username: string; display_name: string | null; avatar_url: string | null } | null;
} | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!list) return null;

  const { data: items } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", id)
    .order("added_at", { ascending: false });

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", (list as GameList).user_id)
    .maybeSingle();

  return {
    list: list as GameList,
    items: (items ?? []) as ListItem[],
    author: (author as {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    }) ?? null,
  };
}
