import type { Game } from "@/lib/rawg";
import { GameCard } from "./game-card";

export function GameGrid({
  games,
  scores,
  statuses,
}: {
  games: Game[];
  scores?: Record<number, number>;
  statuses?: Record<number, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          score={scores?.[game.id]}
          status={statuses?.[game.id]}
        />
      ))}
    </div>
  );
}

export function GameGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border">
          <div className="skeleton aspect-[16/9] w-full" />
          <div className="space-y-2 p-3.5">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
