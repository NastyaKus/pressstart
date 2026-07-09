"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { fetchEntries } from "@/lib/entries";
import { GameGrid } from "./game-grid";
import type { Game } from "@/lib/rawg";

function toSlug(name: string): string {
  const n = name.toLowerCase();
  if (n === "rpg") return "role-playing-games-rpg";
  if (n.includes("massively")) return "massively-multiplayer";
  return n.replace(/\s+/g, "-");
}

export function Recommendations() {
  const { user } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [genre, setGenre] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const entries = await fetchEntries();
        if (entries.length === 0) return;

        // Топ-жанр по частоте.
        const count = new Map<string, number>();
        for (const e of entries)
          for (const g of e.genres ?? [])
            count.set(g, (count.get(g) ?? 0) + 1);
        const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!top) return;
        setGenre(top);

        const owned = new Set(entries.map((e) => e.rawg_id));
        const res = await fetch(
          `/api/games/search?genre=${toSlug(top)}&ordering=-rating`
        );
        const data = await res.json();
        const recs = ((data.games ?? []) as Game[])
          .filter((g) => !owned.has(g.id))
          .slice(0, 8);
        setGames(recs);
      } catch {
        /* тихо */
      }
    })();
  }, [user]);

  if (!user || games.length === 0) return null;

  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <Sparkles className="h-7 w-7 text-accent" /> Рекомендуем тебе
        </h2>
        <p className="mt-1 text-muted">
          По твоему любимому жанру{genre ? `: ${genre}` : ""}
        </p>
      </div>
      <GameGrid games={games} />
    </section>
  );
}
