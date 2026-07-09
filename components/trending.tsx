"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GameGrid } from "./game-grid";
import type { Game } from "@/lib/rawg";

type Row = {
  rawg_id: number;
  name: string;
  cover_url: string | null;
  released: string | null;
  genres: string[] | null;
};

export function Trending() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .rpc("trending_games", { p_days: 7, p_limit: 8 })
      .then(({ data, error }) => {
        if (error || !data) return;
        setGames(
          (data as Row[]).map((r) => ({
            id: r.rawg_id,
            name: r.name,
            released: r.released,
            backgroundImage: r.cover_url,
            genres: r.genres ?? [],
            slug: "",
            rating: 0,
            platforms: [],
          }))
        );
      });
  }, []);

  if (games.length === 0) return null;

  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <TrendingUp className="h-7 w-7 text-accent" /> Тренды недели
        </h2>
        <p className="mt-1 text-muted">Что добавляют игроки прямо сейчас</p>
      </div>
      <GameGrid games={games} />
    </section>
  );
}
