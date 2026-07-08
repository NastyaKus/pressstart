"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Trophy, Gamepad2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";

type Row = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  games: number;
  hours: number;
  completed: number;
  avg_score: number | null;
};

type Metric = "games" | "hours";

export default function LeaderboardPage() {
  const [metric, setMetric] = useState<Metric>("games");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: Metric) => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .order(m, { ascending: false })
      .limit(50);
    setRows(((data ?? []) as Row[]).filter((r) => r.games > 0));
    setLoading(false);
  }, []);

  useEffect(() => {
    load(metric);
  }, [metric, load]);

  const medal = ["#facc15", "#cbd5e1", "#f59e0b"];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="animate-fade-up">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
          <Trophy className="h-7 w-7 text-accent" /> Лидерборд
        </h1>
        <p className="mt-1 text-muted">Топ игроков pressstart</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: "games" as Metric, label: "По играм", icon: Gamepad2 },
          { key: "hours" as Metric, label: "По часам", icon: Clock },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMetric(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              metric === t.key
                ? "bg-accent text-accent-fg"
                : "bg-surface-2 text-muted hover:text-fg"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Пока пусто — добавляйте игры, чтобы попасть в топ.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={`/u/${r.username}`}
              className="card flex items-center gap-3 p-3 transition hover:border-accent/50 hover:-translate-y-0.5"
            >
              <span
                className="w-7 shrink-0 text-center font-display text-lg font-bold tabular-nums"
                style={{ color: i < 3 ? medal[i] : "rgb(var(--muted))" }}
              >
                {i + 1}
              </span>
              <Avatar
                src={r.avatar_url}
                name={r.display_name || r.username}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.display_name || r.username}
                </p>
                <p className="truncate font-mono text-xs text-accent">
                  @{r.username}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold tabular-nums">
                  {metric === "games" ? r.games : Math.round(r.hours)}
                </p>
                <p className="font-mono text-[11px] text-muted">
                  {metric === "games" ? "игр" : "часов"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
