import Link from "next/link";
import { notFound } from "next/navigation";
import { Library, Trophy, Clock, Star, Swords } from "lucide-react";
import { getProfileByUsername, getEntriesByUser } from "@/lib/profiles-server";
import { Avatar } from "@/components/avatar";
import { GameGrid } from "@/components/game-grid";
import { Badges } from "@/components/badges";
import { StatsCharts } from "@/components/charts";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfileByUsername(params.username);
  if (!profile) return { title: "Профиль — pressstart" };
  const name = profile.display_name || profile.username;
  const desc =
    profile.bio || `Игровая библиотека и оценки ${name} на pressstart`;
  return {
    title: `${name} (@${profile.username}) — pressstart`,
    description: desc,
    openGraph: { title: `${name} · @${profile.username}`, description: desc },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfileByUsername(params.username);
  if (!profile) notFound();

  const entries = await getEntriesByUser(profile.id);

  const rated = entries.filter((e) => e.overall && e.overall > 0);
  const avg =
    rated.length > 0
      ? rated.reduce((s, e) => s + (e.overall ?? 0), 0) / rated.length
      : 0;
  const completed = entries.filter((e) => e.status === "completed").length;
  const hours = entries.reduce((s, e) => s + (e.hours_played ?? 0), 0);

  const name = profile.display_name || profile.username;
  const joined = new Date(profile.created_at).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const games = entries.map((e) => ({
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
    entries.filter((e) => e.overall).map((e) => [e.rawg_id, e.overall as number])
  );
  const statuses = Object.fromEntries(entries.map((e) => [e.rawg_id, e.status]));
  const favorites = Object.fromEntries(
    entries.map((e) => [e.rawg_id, e.favorite])
  );
  const hoursMap = Object.fromEntries(
    entries.map((e) => [e.rawg_id, e.hours_played])
  );

  const stats = [
    { icon: <Library className="h-5 w-5" />, value: entries.length, label: "Игр" },
    { icon: <Trophy className="h-5 w-5" />, value: completed, label: "Пройдено" },
    { icon: <Clock className="h-5 w-5" />, value: hours, label: "Часов" },
    {
      icon: <Star className="h-5 w-5" />,
      value: avg > 0 ? avg.toFixed(1) : "—",
      label: "Средняя",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Шапка профиля */}
      <div className="card animate-fade-up overflow-hidden">
        <div className="relative h-32 overflow-hidden">
          {profile.banner_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.banner_url}
                alt=""
                className="h-full w-full scale-105 object-cover blur-[2px]"
              />
              <div className="absolute inset-0 bg-black/25" />
            </>
          ) : (
            <div className="h-full w-full accent-gradient" />
          )}
        </div>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <div className="relative z-10 -mt-16 shrink-0">
            <Avatar
              src={profile.avatar_url}
              name={name}
              size={96}
              className="ring-4 ring-surface"
            />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {name}
            </h1>
            <p className="font-mono text-sm text-accent">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm text-muted">{profile.bio}</p>
            )}
            <p className="mt-1 text-xs text-muted">на pressstart с {joined}</p>
          </div>
          <Link
            href={`/compare/${profile.username}`}
            className="btn-outline shrink-0"
          >
            <Swords className="h-4 w-4" /> Сравнить
          </Link>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex flex-col gap-1 p-4 sm:p-5">
            <span className="text-accent">{s.icon}</span>
            <span className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
              {s.value}
            </span>
            <span className="text-xs text-muted sm:text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Ачивки */}
      {entries.length > 0 && (
        <Badges
          stats={{
            total: entries.length,
            completed,
            hours,
            rated: rated.length,
            favorites: entries.filter((e) => e.favorite).length,
          }}
        />
      )}

      {/* Статистика */}
      <StatsCharts entries={entries} />

      {/* Библиотека */}
      <div>
        <h2 className="mb-4 font-display text-xl font-bold">Библиотека</h2>
        {games.length > 0 ? (
          <GameGrid
            games={games}
            scores={scores}
            statuses={statuses}
            favorites={favorites}
            hours={hoursMap}
          />
        ) : (
          <div className="card p-10 text-center text-muted">
            Пока пусто — {name} ещё не добавил игр.
          </div>
        )}
      </div>

      <div className="text-center">
        <Link href="/users" className="text-sm text-accent hover:underline">
          ← Найти других игроков
        </Link>
      </div>
    </div>
  );
}
