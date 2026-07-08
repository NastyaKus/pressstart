"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import type { Game } from "@/lib/rawg";
import { GameGrid, GameGridSkeleton } from "@/components/game-grid";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setGames(data.games ?? []);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Дебаунс поиска.
  useEffect(() => {
    const t = setTimeout(() => load(query), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Каталог игр
        </h1>
        <p className="mt-1 text-muted">
          Найди игру и добавь её в свою библиотеку
        </p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 bg-bg/80 px-4 py-3 backdrop-blur-lg sm:top-20">
        <div className="relative mx-auto max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например, The Witcher, Hades, Portal…"
            className="input pl-11"
            autoFocus
          />
        </div>
      </div>

      {loading ? (
        <GameGridSkeleton count={12} />
      ) : games.length > 0 ? (
        <GameGrid games={games} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-muted">
            Ничего не нашлось по запросу «{query}». Попробуй иначе.
          </p>
        </div>
      )}
    </div>
  );
}
