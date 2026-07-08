"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, Plus, LogIn, Heart, Clock } from "lucide-react";
import { RatingCriteria } from "./rating-criteria";
import { DEFAULT_RATINGS, type Ratings } from "@/lib/criteria";
import { platformOptions, platformIcon } from "@/lib/platforms";
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
  platforms: string[];
};

export function GameActions({ game }: { game: GameInfo }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [loaded, setLoaded] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [status, setStatus] = useState<GameStatus>("completed");
  const [ratings, setRatings] = useState<Ratings>(DEFAULT_RATINGS);
  const [review, setReview] = useState("");
  const [hours, setHours] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = platformOptions(game.platforms);

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
          setHours(entry.hours_played != null ? String(entry.hours_played) : "");
          setPlatforms(entry.platforms_played ?? []);
          setFavorite(Boolean(entry.favorite));
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

  function togglePlatform(name: string) {
    setPlatforms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const wasInLibrary = inLibrary;
    try {
      const parsedHours = hours.trim() === "" ? null : Number(hours);
      await saveEntry({
        rawg_id: game.id,
        name: game.name,
        cover_url: game.cover_url,
        released: game.released,
        genres: game.genres,
        status,
        review,
        hours_played:
          parsedHours != null && !Number.isNaN(parsedHours) ? parsedHours : null,
        platforms_played: platforms,
        favorite,
        ...ratings,
      });
      setInLibrary(true);
      // После первого добавления игры — сразу в библиотеку.
      if (!wasInLibrary) {
        router.push("/library");
        router.refresh();
        return;
      }
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
      setHours("");
      setPlatforms([]);
      setFavorite(false);
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">
          {inLibrary ? "Моя оценка" : "Оценить игру"}
        </h2>
        <button
          onClick={() => setFavorite((f) => !f)}
          aria-label="В избранное"
          className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
            favorite
              ? "border-transparent bg-red-500/15 text-red-500"
              : "border-border bg-surface text-muted hover:text-fg"
          }`}
        >
          <Heart
            key={String(favorite)}
            className={`h-[18px] w-[18px] transition-transform ${
              favorite ? "scale-110 fill-red-500 heart-pop" : ""
            }`}
          />
        </button>
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

      {/* Часы наиграно */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Clock className="h-4 w-4 text-muted" /> Часов наиграно
        </p>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Например, 42"
          className="input"
        />
      </div>

      {/* Платформы прохождения (мультивыбор) */}
      <div>
        <p className="mb-2 text-sm font-medium">На чём играл</p>
        <div className="flex flex-wrap gap-2">
          {options.map((name) => {
            const Icon = platformIcon(name);
            const active = platforms.includes(name);
            return (
              <button
                key={name}
                onClick={() => togglePlatform(name)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "bg-surface-2 text-muted hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                {name}
              </button>
            );
          })}
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
