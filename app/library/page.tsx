"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, LogIn, Library as LibraryIcon, Trophy, Star } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { fetchEntries, type GameEntry, type GameStatus } from "@/lib/entries";
import { GameGrid, GameGridSkeleton } from "@/components/game-grid";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const FILTERS: { key: GameStatus | "all"; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "completed", label: "Пройдено" },
  { key: "playing", label: "Прохожу" },
  { key: "backlog", label: "В планах" },
  { key: "dropped", label: "Брошено" },
];

export default function LibraryPage() {
  const { user, loading: userLoading } = useUser();
  const [entries, setEntries] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GameStatus | "all">("all");

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
    return { total: entries.length, completed, avg };
  }, [entries]);

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.status === filter)),
    [entries, filter]
  );

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
  const statuses = Object.fromEntries(
    filtered.map((e) => [e.rawg_id, e.status])
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
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Моя библиотека
        </h1>
        <p className="mt-1 text-muted">Все твои игры и оценки в одном месте</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={<LibraryIcon className="h-5 w-5" />} value={stats.total} label="Всего игр" />
        <StatCard icon={<Trophy className="h-5 w-5" />} value={stats.completed} label="Пройдено" />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          value={stats.avg > 0 ? stats.avg.toFixed(1) : "—"}
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
          </div>

          {games.length > 0 ? (
            <GameGrid games={games} scores={scores} statuses={statuses} />
          ) : (
            <p className="py-8 text-center text-muted">
              Нет игр с этим статусом.
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
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="card flex flex-col gap-1 p-4 sm:p-5">
      <span className="text-accent">{icon}</span>
      <span className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
        {value}
      </span>
      <span className="text-xs text-muted sm:text-sm">{label}</span>
    </div>
  );
}
