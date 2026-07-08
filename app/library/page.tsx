"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LogIn,
  Library as LibraryIcon,
  Trophy,
  Star,
  Clock,
  Search,
  Heart,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { fetchEntries, type GameEntry, type GameStatus } from "@/lib/entries";
import { GameGrid, GameGridSkeleton } from "@/components/game-grid";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useCountUp } from "@/lib/use-count-up";

const FILTERS: { key: GameStatus | "all"; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "completed", label: "Пройдено" },
  { key: "playing", label: "Прохожу" },
  { key: "backlog", label: "В планах" },
  { key: "dropped", label: "Брошено" },
];

type SortKey = "added" | "overall" | "hours" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "added", label: "По дате" },
  { key: "overall", label: "По оценке" },
  { key: "hours", label: "По часам" },
  { key: "name", label: "По алфавиту" },
];

export default function LibraryPage() {
  const { user, loading: userLoading } = useUser();
  const [entries, setEntries] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GameStatus | "all">("all");
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("added");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchEntries()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const rated = entries.filter((e) => e.overall && e.overall > 0);
    const avg =
      rated.length > 0
        ? rated.reduce((s, e) => s + (e.overall ?? 0), 0) / rated.length
        : 0;
    const completed = entries.filter((e) => e.status === "completed").length;
    const hours = entries.reduce((s, e) => s + (e.hours_played ?? 0), 0);
    return { total: entries.length, completed, avg, hours };
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (filter !== "all") list = list.filter((e) => e.status === filter);
    if (favOnly) list = list.filter((e) => e.favorite);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "overall":
          return (b.overall ?? 0) - (a.overall ?? 0);
        case "hours":
          return (b.hours_played ?? 0) - (a.hours_played ?? 0);
        case "name":
          return a.name.localeCompare(b.name, "ru");
        default:
          return (
            new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
          );
      }
    });
    return sorted;
  }, [entries, filter, favOnly, query, sort]);

  const games = filtered.map((e) => ({
    id: e.rawg_id,
    name: e.name,
    released: e.released,
    backgroundImage: e.cover_url,
    genres: e.genres ?? [],
    slug: "",
    rating: 0,
    platforms: [],
  }));
  const scores = Object.fromEntries(
    filtered.filter((e) => e.overall).map((e) => [e.rawg_id, e.overall as number])
  );
  const statuses = Object.fromEntries(filtered.map((e) => [e.rawg_id, e.status]));
  const favorites = Object.fromEntries(
    filtered.map((e) => [e.rawg_id, e.favorite])
  );
  const hoursMap = Object.fromEntries(
    filtered.map((e) => [e.rawg_id, e.hours_played])
  );

  // Не авторизован
  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">
          <LibraryIcon className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">Твоя библиотека</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {isSupabaseConfigured
            ? "Войди в аккаунт, чтобы видеть свои пройденные игры и оценки."
            : "Демо‑режим: подключи Supabase, чтобы сохранять игры (см. README)."}
        </p>
        <Link href="/auth" className="btn-primary mt-6">
          <LogIn className="h-4 w-4" /> Войти
        </Link>
      </div>
    );
  }

  if (userLoading || loading) {
    return (
      <div className="space-y-8">
        <div className="skeleton h-9 w-48 rounded-lg" />
        <GameGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Моя библиотека
          </h1>
          <p className="mt-1 text-muted">Все твои игры и оценки в одном месте</p>
        </div>
        <Link href="/import" className="btn-outline">
          <Download className="h-4 w-4" /> Импорт из Steam
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={<LibraryIcon className="h-5 w-5" />} value={stats.total} label="Всего игр" />
        <StatCard icon={<Trophy className="h-5 w-5" />} value={stats.completed} label="Пройдено" />
        <StatCard icon={<Clock className="h-5 w-5" />} value={stats.hours} label="Часов наиграно" />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          value={stats.avg}
          decimals={1}
          empty={stats.avg === 0}
          label="Средняя оценка"
        />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-muted">
            Библиотека пуста.{" "}
            <Link href="/discover" className="font-medium text-accent hover:underline">
              Найди первую игру
            </Link>{" "}
            и оцени её.
          </p>
        </div>
      ) : (
        <>
          {/* Поиск + сортировка */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по библиотеке…"
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="input cursor-pointer appearance-none pl-10 pr-8"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filter === f.key
                    ? "bg-accent text-accent-fg"
                    : "bg-surface-2 text-muted hover:text-fg"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setFavOnly((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                favOnly
                  ? "bg-red-500/15 text-red-500"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              <Heart className={`h-4 w-4 ${favOnly ? "fill-red-500" : ""}`} />
              Избранное
            </button>
          </div>

          {games.length > 0 ? (
            <GameGrid
              games={games}
              scores={scores}
              statuses={statuses}
              favorites={favorites}
              hours={hoursMap}
            />
          ) : (
            <p className="py-8 text-center text-muted">
              Ничего не нашлось по этим фильтрам.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  decimals = 0,
  empty = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  decimals?: number;
  empty?: boolean;
}) {
  const animated = useCountUp(value);
  const shown = empty ? "—" : animated.toFixed(decimals);
  return (
    <div className="card flex flex-col gap-1 p-4 sm:p-5">
      <span className="text-accent">{icon}</span>
      <span className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
        {shown}
      </span>
      <span className="text-xs text-muted sm:text-sm">{label}</span>
    </div>
  );
}
