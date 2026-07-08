"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ScoreBadge } from "./score-badge";

export function CommunityRating({ rawgId }: { rawgId: number }) {
  const [stats, setStats] = useState<{
    avg: number | null;
    ratings: number;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .rpc("game_community_stats", { p_rawg_id: rawgId })
      .then(({ data, error }) => {
        if (error || !data || !data[0]) return;
        setStats({ avg: data[0].avg_score, ratings: data[0].ratings });
      });
  }, [rawgId]);

  if (!stats) return null;

  return (
    <div className="card flex items-center gap-3 p-4">
      {stats.avg && stats.ratings > 0 ? (
        <>
          <ScoreBadge score={stats.avg} size="md" />
          <div>
            <p className="text-sm font-medium">Оценка сообщества</p>
            <p className="font-mono text-xs text-muted">
              {stats.ratings}{" "}
              {stats.ratings === 1
                ? "оценка"
                : stats.ratings < 5
                  ? "оценки"
                  : "оценок"}
            </p>
          </div>
        </>
      ) : (
        <>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">
            <Users className="h-4 w-4" />
          </span>
          <p className="text-sm text-muted">
            Пока нет оценок — стань первым
          </p>
        </>
      )}
    </div>
  );
}
