"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Trash2, Plus, LogIn } from "lucide-react";
import { RatingCriteria } from "./rating-criteria";
import { DEFAULT_RATINGS, type Ratings } from "@/lib/criteria";
import { useUser } from "@/lib/use-user";
import {
  fetchEntry,
  saveEntry,
  removeEntry,
  type GameStatus,
} from "@/lib/entries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const STATUSES: { key: GameStatus; label: string }[] = [
  { key: "completed", label: "Пройдено" },
  { key: "playing", label: "Прохожу" },
  { key: "backlog", label: "В планах" },
  { key: "dropped", label: "Брошено" },
];

type GameInfo = {
  id: number;
  name: string;
  cover_url: string | null;
  released: string | null;
  genres: string[];
};

export function GameActions({ game }: { game: GameInfo }) {
  const { user, loading: userLoading } = useUser();
  const [loaded, setLoaded] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [status, setStatus] = useState<GameStatus>("completed");
  const [ratings, setRatings] = useState<Ratings>(DEFAULT_RATINGS);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    fetchEntry(game.id)
      .then((entry) => {
        if (entry) {
          setInLibrary(true);
          setStatus(entry.status);
          setReview(entry.review ?? "");
          setRatings({
            atmosphere: entry.atmosphere ?? 7,
            story: entry.story ?? 7,
            gameplay: entry.gameplay ?? 7,
            graphics: entry.graphics ?? 7,
            sound: entry.sound ?? 7,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user, game.id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveEntry({
        rawg_id: game.id,
        name: game.name,
        cover_url: game.cover_url,
        released: game.released,
        genres: game.genres,
        status,
        review,
        ...ratings,
      });
      setInLibrary(true);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError(null);
    try {
      await removeEntry(game.id);
      setInLibrary(false);
      setRatings(DEFAULT_RATINGS);
      setReview("");
      setStatus("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || !loaded) {
    return (
      <div className="card grid place-items-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card p-6 text-center">
        <p className="mb-4 text-muted">
          {isSupabaseConfigured
            ? "Войди в аккаунт, чтобы добавить игру в библиотеку и оценить её."
            : "Демо‑режим: добавь ключи Supabase, чтобы сохранять оценки (см. README)."}
        </p>
        <Link href="/auth" className="btn-primary">
          <LogIn className="h-4 w-4" /> Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="card space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">
          {inLibrary ? "Моя оценка" : "Оценить игру"}
        </h2>
        {inLibrary && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" /> В библиотеке
          </span>
        )}
      </div>

      {/* Статус */}
      <div>
        <p className="mb-2 text-sm font-medium">Статус</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === s.key
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Критерии */}
      <RatingCriteria value={ratings} onChange={setRatings} />

      {/* Отзыв */}
      <div>
        <p className="mb-2 text-sm font-medium">Заметка (необязательно)</p>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          placeholder="Что запомнилось?"
          className="input resize-none"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : savedFlash ? (
            <Check className="h-4 w-4" />
          ) : inLibrary ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {savedFlash
            ? "Сохранено"
            : inLibrary
              ? "Сохранить изменения"
              : "Добавить в библиотеку"}
        </button>
        {inLibrary && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="btn-outline"
            aria-label="Удалить из библиотеки"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
