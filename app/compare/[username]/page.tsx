"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, LogIn, ArrowLeftRight, Swords } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { fetchEntries, fetchEntriesOf, type GameEntry } from "@/lib/entries";
import { fetchProfileByUsername, type Profile } from "@/lib/profiles";
import { Avatar } from "@/components/avatar";
import { ScoreBadge } from "@/components/score-badge";
import { GameGrid } from "@/components/game-grid";
import { scoreColor } from "@/lib/criteria";

export default function ComparePage({
  params,
}: {
  params: { username: string };
}) {
  const { user, loading: userLoading } = useUser();
  const [mine, setMine] = useState<GameEntry[]>([]);
  const [theirs, setTheirs] = useState<GameEntry[]>([]);
  const [target, setTarget] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const prof = await fetchProfileByUsername(params.username);
        if (!prof) {
          setNotFound(true);
          return;
        }
        setTarget(prof);
        const [m, t] = await Promise.all([
          fetchEntries(),
          fetchEntriesOf(prof.id),
        ]);
        setMine(m);
        setTheirs(t);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, params.username]);

  const data = useMemo(() => {
    const mineMap = new Map(mine.map((e) => [e.rawg_id, e]));
    const theirsMap = new Map(theirs.map((e) => [e.rawg_id, e]));
    const commonIds = [...mineMap.keys()].filter((id) => theirsMap.has(id));

    const common = commonIds.map((id) => ({
      mine: mineMap.get(id)!,
      theirs: theirsMap.get(id)!,
    }));

    const coRated = common.filter(
      (c) => (c.mine.overall ?? 0) > 0 && (c.theirs.overall ?? 0) > 0
    );
    const avgDiff =
      coRated.length > 0
        ? coRated.reduce(
            (s, c) => s + Math.abs((c.mine.overall ?? 0) - (c.theirs.overall ?? 0)),
            0
          ) / coRated.length
        : null;
    const match = avgDiff == null ? null : Math.round((1 - avgDiff / 9) * 100);

    const onlyMine = mine.filter((e) => !theirsMap.has(e.rawg_id));
    const onlyTheirs = theirs.filter((e) => !mineMap.has(e.rawg_id));

    return { common, coRated, match, onlyMine, onlyTheirs };
  }, [mine, theirs]);

  const toGame = (e: GameEntry) => ({
    id: e.rawg_id,
    name: e.name,
    released: e.released,
    backgroundImage: e.cover_url,
    genres: e.genres ?? [],
    slug: "",
    rating: 0,
    platforms: [],
  });

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Сравнение</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          Войди, чтобы сравнить свою библиотеку с @{params.username}.
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

  if (notFound || !target) {
    return (
      <div className="py-16 text-center text-muted">
        Игрок @{params.username} не найден.
      </div>
    );
  }

  const targetName = target.display_name || target.username;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
          <Swords className="h-7 w-7 text-accent" /> Сравнение вкусов
        </h1>
        <Link
          href={`/u/${target.username}`}
          className="mt-1 inline-block text-sm text-accent hover:underline"
        >
          с @{target.username}
        </Link>
      </div>

      {/* Итог */}
      <div className="card grid grid-cols-3 items-center gap-4 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar name="Ты" size={56} />
          <span className="text-sm font-medium">Ты</span>
        </div>
        <div className="text-center">
          {data.match != null ? (
            <>
              <p
                className="font-display text-4xl font-bold"
                style={{ color: scoreColor((data.match / 100) * 10) }}
              >
                {data.match}%
              </p>
              <p className="text-xs text-muted">совпадение вкусов</p>
            </>
          ) : (
            <>
              <ArrowLeftRight className="mx-auto h-7 w-7 text-muted" />
              <p className="mt-1 text-xs text-muted">
                нет общих оценённых игр
              </p>
            </>
          )}
          <p className="mt-2 font-mono text-xs text-muted">
            {data.common.length} общих · {data.coRated.length} оценили оба
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar src={target.avatar_url} name={targetName} size={56} />
          <span className="max-w-full truncate text-sm font-medium">
            {targetName}
          </span>
        </div>
      </div>

      {/* Общие игры с оценками */}
      {data.common.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">
            Общие игры ({data.common.length})
          </h2>
          <div className="space-y-2">
            {data.common
              .sort(
                (a, b) =>
                  Math.abs((b.mine.overall ?? 0) - (b.theirs.overall ?? 0)) -
                  Math.abs((a.mine.overall ?? 0) - (a.theirs.overall ?? 0))
              )
              .map((c) => (
                <Link
                  key={c.mine.rawg_id}
                  href={`/game/${c.mine.rawg_id}`}
                  className="card flex items-center gap-3 p-2.5 transition hover:border-accent/50"
                >
                  <div className="relative h-11 w-[76px] shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {c.mine.cover_url && (
                      <Image
                        src={c.mine.cover_url}
                        alt={c.mine.name}
                        fill
                        sizes="76px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.mine.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {(c.mine.overall ?? 0) > 0 ? (
                      <ScoreBadge score={c.mine.overall as number} size="sm" />
                    ) : (
                      <span className="w-9 text-center text-xs text-muted">—</span>
                    )}
                    <span className="text-muted">vs</span>
                    {(c.theirs.overall ?? 0) > 0 ? (
                      <ScoreBadge score={c.theirs.overall as number} size="sm" />
                    ) : (
                      <span className="w-9 text-center text-xs text-muted">—</span>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Эксклюзивы */}
      {data.onlyTheirs.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">
            Есть у {targetName}, нет у тебя ({data.onlyTheirs.length})
          </h2>
          <GameGrid games={data.onlyTheirs.slice(0, 8).map(toGame)} />
        </section>
      )}
      {data.onlyMine.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">
            Только у тебя ({data.onlyMine.length})
          </h2>
          <GameGrid games={data.onlyMine.slice(0, 8).map(toGame)} />
        </section>
      )}
    </div>
  );
}
