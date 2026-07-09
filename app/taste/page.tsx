"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogIn, Fingerprint, Trophy, XCircle } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { fetchEntries } from "@/lib/entries";
import { computeTaste, type Taste } from "@/lib/taste";
import { CRITERIA } from "@/lib/criteria";
import { scoreColor } from "@/lib/criteria";
import { Radar } from "@/components/radar";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function Bars({
  rows,
  unit = "",
}: {
  rows: { label: string; value: number; color?: string; suffix?: string }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-right text-xs text-muted">
            {r.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(4, (r.value / max) * 100)}%`,
                background: r.color ?? "rgb(var(--accent))",
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums">
            {r.value}
            {r.suffix ?? unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TastePage() {
  const { user, loading: userLoading } = useUser();
  const [taste, setTaste] = useState<Taste | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchEntries()
      .then((e) => setTaste(computeTaste(e)))
      .catch(() => setTaste(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Игровой вкус</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {isSupabaseConfigured
            ? "Войди, чтобы увидеть анализ своего игрового вкуса."
            : "Демо‑режим: подключи Supabase (см. README)."}
        </p>
        <Link href="/auth" className="btn-primary mt-6">
          <LogIn className="h-4 w-4" /> Войти
        </Link>
      </div>
    );
  }

  if (userLoading || loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!taste || taste.total === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Игровой вкус</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          Добавь и оцени несколько игр — и здесь появится твой портрет.
        </p>
        <Link href="/discover" className="btn-primary mt-6">
          Найти игры
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
          <Fingerprint className="h-7 w-7 text-accent" /> Твой игровой вкус
        </h1>
        <p className="mt-1 text-muted">
          Анализ по {taste.rated} оценённым играм из {taste.total}
        </p>
      </div>

      {/* Портрет */}
      <div className="card relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{ background: "rgb(var(--accent) / 0.4)" }}
        />
        <p className="relative font-display text-xl font-semibold leading-relaxed sm:text-2xl">
          {taste.portrait}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Радар критериев */}
        <div className="card flex flex-col items-center p-6">
          <h2 className="mb-2 self-start font-display text-lg font-bold">
            Что тебе важнее
          </h2>
          <Radar values={taste.criteriaAvg} />
          <div className="mt-2 grid w-full grid-cols-5 gap-1 text-center">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <div
                  className="font-display text-lg font-bold tabular-nums"
                  style={{ color: scoreColor(taste.criteriaAvg[c.key]) }}
                >
                  {taste.criteriaAvg[c.key] || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Итоги */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
          <div className="card flex flex-col gap-1 p-5">
            <span className="text-accent">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="font-display text-3xl font-bold tabular-nums">
              {taste.completionPct}%
            </span>
            <span className="text-sm text-muted">Процент завершения</span>
          </div>
          <div className="card flex flex-col gap-1 p-5">
            <span className="text-red-500">
              <XCircle className="h-5 w-5" />
            </span>
            <span className="font-display text-3xl font-bold tabular-nums">
              {taste.dropped}
            </span>
            <span className="text-sm text-muted">Игр брошено</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {taste.topGenres.length > 0 && (
          <div className="card p-5">
            <p className="mb-4 text-sm font-medium text-muted">
              Любимые жанры (по оценке)
            </p>
            <Bars
              rows={taste.topGenres.map((g) => ({
                label: g.name,
                value: g.avg,
                color: scoreColor(g.avg),
              }))}
            />
          </div>
        )}
        {taste.years.length > 0 && (
          <div className="card p-5">
            <p className="mb-4 text-sm font-medium text-muted">Любимые годы</p>
            <Bars
              rows={taste.years.map((y) => ({ label: y.year, value: y.count }))}
            />
          </div>
        )}
        {taste.platforms.length > 0 && (
          <div className="card p-5">
            <p className="mb-4 text-sm font-medium text-muted">Платформы</p>
            <Bars
              rows={taste.platforms.map((p) => ({
                label: p.name,
                value: p.count,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
