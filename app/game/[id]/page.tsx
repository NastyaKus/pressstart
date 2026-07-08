import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Star, Monitor, Building2 } from "lucide-react";
import { getGame, getSimilarGames } from "@/lib/rawg";
import { GameActions } from "@/components/game-actions";
import { AddToList } from "@/components/add-to-list";
import { CommunityRating } from "@/components/community-rating";
import { GameGrid } from "@/components/game-grid";

export const revalidate = 3600;

export default async function GamePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const game = await getGame(id);
  if (!game) notFound();

  const similar = await getSimilarGames(id, game.genres);
  const year = game.released ? game.released.slice(0, 4) : null;

  return (
    <div className="space-y-8">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> К каталогу
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border">
        <div className="relative aspect-[21/9] w-full bg-surface-2">
          {game.backgroundImage && (
            <Image
              src={game.backgroundImage}
              alt={game.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <h1 className="font-display text-3xl font-bold text-white drop-shadow sm:text-4xl">
            {game.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
            {year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {year}
              </span>
            )}
            {game.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" /> {game.rating.toFixed(1)} / 5
              </span>
            )}
            {game.metacritic && (
              <span className="rounded-md bg-green-500/90 px-2 py-0.5 text-xs font-bold text-white">
                Metacritic {game.metacritic}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Левая колонка: инфо */}
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            {game.genres.map((g) => (
              <span key={g} className="chip">
                {g}
              </span>
            ))}
          </div>

          {game.description && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold">Об игре</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">
                {game.description.length > 900
                  ? game.description.slice(0, 900) + "…"
                  : game.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            {game.developers.length > 0 && (
              <div className="card p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                  <Building2 className="h-3.5 w-3.5" /> Разработчик
                </p>
                <p className="text-sm font-medium">
                  {game.developers.join(", ")}
                </p>
              </div>
            )}
            {game.platforms.length > 0 && (
              <div className="card p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                  <Monitor className="h-3.5 w-3.5" /> Платформы
                </p>
                <p className="text-sm font-medium">
                  {game.platforms.join(", ")}
                </p>
              </div>
            )}
          </div>

          {game.screenshots.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold">Скриншоты</h2>
              <div className="grid grid-cols-2 gap-3">
                {game.screenshots.slice(0, 4).map((src) => (
                  <div
                    key={src}
                    className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-2"
                  >
                    <Image
                      src={src}
                      alt={game.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка: оценка */}
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <GameActions
            game={{
              id: game.id,
              name: game.name,
              cover_url: game.backgroundImage,
              released: game.released,
              genres: game.genres,
              platforms: game.platforms,
            }}
          />
          <AddToList
            game={{
              id: game.id,
              name: game.name,
              cover_url: game.backgroundImage,
              released: game.released,
              genres: game.genres,
            }}
          />
          <CommunityRating rawgId={game.id} />
        </div>
      </div>

      {/* Похожие игры */}
      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Похожие игры</h2>
          <GameGrid games={similar} />
        </section>
      )}
    </div>
  );
}
