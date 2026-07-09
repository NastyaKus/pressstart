"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, X, Loader2, Plus } from "lucide-react";
import type { Game } from "@/lib/rawg";
import { GENRES, PLATFORMS, ORDERINGS } from "@/lib/rawg";
import { GameGrid, GameGridSkeleton } from "@/components/game-grid";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [ordering, setOrdering] = useState("-added");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const buildQuery = useCallback(
    (q: string, g: string, p: string, o: string, pg: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (g) params.set("genre", g);
      if (p) params.set("platform", p);
      if (o) params.set("ordering", o);
      if (pg > 1) params.set("page", String(pg));
      return params.toString();
    },
    []
  );

  const load = useCallback(
    async (q: string, g: string, p: string, o: string) => {
      setLoading(true);
      setPage(1);
      try {
        const res = await fetch(`/api/games/search?${buildQuery(q, g, p, o, 1)}`);
        const data = await res.json();
        setGames(data.games ?? []);
        setHasMore(Boolean(data.hasMore));
      } catch {
        setGames([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/games/search?${buildQuery(query, genre, platform, ordering, next)}`
      );
      const data = await res.json();
      const more = (data.games ?? []) as Game[];
      // Отсекаем возможные дубли по id.
      setGames((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...more.filter((x) => !seen.has(x.id))];
      });
      setHasMore(Boolean(data.hasMore));
      setPage(next);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(
      () => load(query, genre, platform, ordering),
      query ? 350 : 0
    );
    return () => clearTimeout(t);
  }, [query, genre, platform, ordering, load]);

  const hasFilters = genre || platform || ordering !== "-added";

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

      <div className="sticky top-16 z-30 -mx-4 space-y-3 px-4 py-3 backdrop-blur-lg sm:top-20">
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

        {/* Фильтры */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Фильтры:
          </span>
          <FilterSelect
            value={genre}
            onChange={setGenre}
            placeholder="Все жанры"
            options={GENRES.map((g) => ({ value: g.slug, label: g.label }))}
          />
          <FilterSelect
            value={platform}
            onChange={setPlatform}
            placeholder="Все платформы"
            options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))}
          />
          <FilterSelect
            value={ordering}
            onChange={setOrdering}
            placeholder="Сортировка"
            options={ORDERINGS.map((o) => ({ value: o.value, label: o.label }))}
          />
          {hasFilters && (
            <button
              onClick={() => {
                setGenre("");
                setPlatform("");
                setOrdering("-added");
              }}
              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-fg"
            >
              <X className="h-3.5 w-3.5" /> Сбросить
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <GameGridSkeleton count={12} />
      ) : games.length > 0 ? (
        <>
          <GameGrid games={games} />
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-outline"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Загрузить ещё
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-muted">Ничего не нашлось. Попробуй изменить фильтры.</p>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm outline-none transition ${
        value
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-border bg-surface text-fg"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
