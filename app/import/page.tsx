"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogIn,
  Download,
  Clock,
  Check,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { saveEntry, type GameStatus } from "@/lib/entries";
import type { Game } from "@/lib/rawg";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SteamGame = { appid: number; name: string; hours: number; cover: string };

const STATUSES: { key: GameStatus; label: string }[] = [
  { key: "completed", label: "Пройдено" },
  { key: "playing", label: "Прохожу" },
  { key: "backlog", label: "В планах" },
];

/** Ищем игру в RAWG по названию и берём лучшее совпадение. */
async function matchRawg(name: string): Promise<Game | null> {
  try {
    const res = await fetch(`/api/games/search?q=${encodeURIComponent(name)}`);
    const data = await res.json();
    return (data.games?.[0] as Game) ?? null;
  } catch {
    return null;
  }
}

export default function ImportPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState("");
  const [status, setStatus] = useState<GameStatus>("completed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<SteamGame[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(
    null
  );

  async function loadGames() {
    setError(null);
    setResult(null);
    setGames([]);
    if (!profile.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/steam/import?id=${encodeURIComponent(profile.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить");
      const list = (data.games ?? []) as SteamGame[];
      if (list.length === 0) {
        setError(
          "Игр не найдено. Проверь, что профиль публичный (Steam → Приватность → «Мои игры» = «Открытый»)."
        );
      }
      setGames(list);
      setSelected(new Set(list.map((g) => g.appid)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function toggle(appid: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(appid)) next.delete(appid);
      else next.add(appid);
      return next;
    });
  }

  async function runImport() {
    const chosen = games.filter((g) => selected.has(g.appid));
    if (chosen.length === 0) return;
    setImporting(true);
    setError(null);
    setProgress({ done: 0, total: chosen.length });
    let added = 0;
    let skipped = 0;

    for (const g of chosen) {
      const match = await matchRawg(g.name);
      if (match) {
        try {
          await saveEntry({
            rawg_id: match.id,
            name: match.name,
            cover_url: match.backgroundImage,
            released: match.released,
            genres: match.genres,
            status,
            review: "",
            hours_played: g.hours,
            platforms_played: ["PC"],
            favorite: false,
            atmosphere: null,
            story: null,
            gameplay: null,
            graphics: null,
            sound: null,
          });
          added += 1;
        } catch {
          skipped += 1;
        }
      } else {
        skipped += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResult({ added, skipped });
    setImporting(false);
  }

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Импорт из Steam</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {isSupabaseConfigured
            ? "Войди в аккаунт, чтобы импортировать игры и часы из Steam."
            : "Демо‑режим: подключи Supabase, чтобы импортировать (см. README)."}
        </p>
        <Link href="/auth" className="btn-primary mt-6">
          <LogIn className="h-4 w-4" /> Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Импорт из Steam
        </h1>
        <p className="mt-1 text-muted">
          Подтяни свою библиотеку и наигранные часы прямо из Steam.
        </p>
      </div>

      {/* Ввод профиля */}
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Ссылка на профиль Steam или SteamID
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadGames()}
              placeholder="steamcommunity.com/id/твой_ник"
              className="input flex-1"
            />
            <button
              onClick={loadGames}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Загрузить
            </button>
          </div>
          <p className="mt-2 font-mono text-xs text-muted">
            Профиль должен быть публичным (Приватность → «Мои игры» = «Открытый»).
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      {/* Результат импорта */}
      {result && (
        <div className="card space-y-4 p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-500/15 text-green-500">
            <Check className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium">
            Импортировано: {result.added}
            {result.skipped > 0 && (
              <span className="text-muted">
                {" "}
                · не найдено в базе: {result.skipped}
              </span>
            )}
          </p>
          <button
            onClick={() => {
              router.push("/library");
              router.refresh();
            }}
            className="btn-primary mx-auto"
          >
            Перейти в библиотеку
          </button>
        </div>
      )}

      {/* Список игр */}
      {games.length > 0 && !result && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Найдено игр: <span className="text-fg">{games.length}</span> ·
              выбрано{" "}
              <span className="text-accent">{selected.size}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Статус:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GameStatus)}
                className="input w-auto cursor-pointer py-1.5"
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-[28rem] space-y-2 overflow-y-auto rounded-2xl border border-border/60 p-2">
            {games.map((g) => {
              const active = selected.has(g.appid);
              return (
                <button
                  key={g.appid}
                  onClick={() => toggle(g.appid)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                    active ? "bg-accent/10" : "hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                      active
                        ? "border-transparent accent-gradient text-accent-fg"
                        : "border-border"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <div className="relative h-10 w-[86px] shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <Image
                      src={g.cover}
                      alt={g.name}
                      fill
                      sizes="86px"
                      className="object-cover"
                    />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">
                    {g.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted">
                    <Clock className="h-3 w-3" />
                    {g.hours} ч
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={runImport}
            disabled={importing || selected.size === 0}
            className="btn-primary w-full"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Импортирую… {progress.done}/{progress.total}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Импортировать выбранные ({selected.size})
              </>
            )}
          </button>
          <p className="text-center font-mono text-xs text-muted">
            Игры сопоставляются с базой RAWG по названию · часы берутся из Steam
          </p>
        </div>
      )}

      <a
        href="https://steamcommunity.com/my/edit/settings"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 text-xs text-muted transition hover:text-accent"
      >
        Ключи не нужны · открыть настройки приватности Steam{" "}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
