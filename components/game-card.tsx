import Image from "next/image";
import Link from "next/link";
import { ImageOff, Heart, Clock } from "lucide-react";
import type { Game } from "@/lib/rawg";
import { ScoreBadge } from "./score-badge";

type Props = {
  game: Pick<
    Game,
    "id" | "name" | "released" | "backgroundImage" | "genres"
  >;
  score?: number | null;
  status?: string | null;
  favorite?: boolean;
  hours?: number | null;
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Пройдено",
  playing: "Прохожу",
  backlog: "В планах",
  dropped: "Брошено",
};

export function GameCard({ game, score, status, favorite, hours }: Props) {
  const year = game.released ? game.released.slice(0, 4) : null;

  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-[0_20px_50px_-18px_rgb(var(--accent)/0.6)]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2">
        {game.backgroundImage ? (
          <Image
            src={game.backgroundImage}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {typeof score === "number" && (
          <div className="absolute right-2 top-2">
            <ScoreBadge score={score} size="sm" />
          </div>
        )}
        {status && STATUS_LABELS[status] && (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {STATUS_LABELS[status]}
          </span>
        )}
        {favorite && (
          <span className="absolute bottom-2 left-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 backdrop-blur">
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-tight transition group-hover:text-accent">
          {game.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {year && <span className="chip">{year}</span>}
          {typeof hours === "number" && hours > 0 && (
            <span className="chip gap-1">
              <Clock className="h-3 w-3" />
              {hours % 1 === 0 ? hours : hours.toFixed(1)} ч
            </span>
          )}
          {game.genres.slice(0, 2).map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
