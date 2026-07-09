import { CRITERIA, type CriterionKey } from "@/lib/criteria";
import type { GameEntry } from "@/lib/entries";

export type Taste = {
  total: number;
  rated: number;
  criteriaAvg: Record<CriterionKey, number>;
  topGenres: { name: string; avg: number; count: number }[];
  years: { year: string; count: number; avg: number }[];
  platforms: { name: string; count: number }[];
  dropped: number;
  completionPct: number;
  portrait: string;
};

const TYPE_WORD: Record<CriterionKey, string> = {
  atmosphere: "атмосферный",
  story: "сюжетный",
  gameplay: "геймплейный",
  graphics: "визуальный",
  sound: "аудиофильский",
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function computeTaste(entries: GameEntry[]): Taste {
  const rated = entries.filter((e) => e.overall && e.overall > 0);

  // Средние по критериям.
  const criteriaAvg = {} as Record<CriterionKey, number>;
  for (const c of CRITERIA) {
    const vals = entries
      .map((e) => e[c.key])
      .filter((v): v is number => typeof v === "number" && v > 0);
    criteriaAvg[c.key] = avg(vals);
  }

  // Топ-жанры по средней оценке (минимум 2 игры).
  const genreScores = new Map<string, number[]>();
  for (const e of rated)
    for (const g of e.genres ?? [])
      genreScores.set(g, [...(genreScores.get(g) ?? []), e.overall as number]);
  const topGenres = [...genreScores.entries()]
    .filter(([, v]) => v.length >= 2)
    .map(([name, v]) => ({ name, avg: avg(v), count: v.length }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);

  // Любимые годы.
  const yearScores = new Map<string, number[]>();
  for (const e of entries) {
    const y = e.released?.slice(0, 4);
    if (!y) continue;
    yearScores.set(y, [
      ...(yearScores.get(y) ?? []),
      ...(e.overall && e.overall > 0 ? [e.overall] : []),
    ]);
  }
  const years = [...yearScores.entries()]
    .map(([year, v]) => ({ year, count: v.length, avg: avg(v) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Платформы прохождения.
  const platCount = new Map<string, number>();
  for (const e of entries)
    for (const p of e.platforms_played ?? [])
      platCount.set(p, (platCount.get(p) ?? 0) + 1);
  const platforms = [...platCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const dropped = entries.filter((e) => e.status === "dropped").length;
  const completed = entries.filter((e) => e.status === "completed").length;
  const completionPct =
    entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0;

  return {
    total: entries.length,
    rated: rated.length,
    criteriaAvg,
    topGenres,
    years,
    platforms,
    dropped,
    completionPct,
    portrait: buildPortrait({
      criteriaAvg,
      topGenres,
      entries,
      dropped,
      completionPct,
      ratedCount: rated.length,
    }),
  };
}

function buildPortrait(d: {
  criteriaAvg: Record<CriterionKey, number>;
  topGenres: { name: string; avg: number }[];
  entries: GameEntry[];
  dropped: number;
  completionPct: number;
  ratedCount: number;
}): string {
  if (d.ratedCount < 3) {
    return "Оцени хотя бы несколько игр — и здесь появится твой игровой портрет.";
  }

  const sorted = CRITERIA.map((c) => ({ key: c.key, v: d.criteriaAvg[c.key] })).sort(
    (a, b) => b.v - a.v
  );
  const top1 = sorted[0];
  const top2 = sorted[1];

  // Тип игрока.
  let typeWord: string;
  const keys = [top1.key, top2.key];
  if (keys.includes("story") && keys.includes("atmosphere")) {
    typeWord = "сюжетно‑атмосферный";
  } else if (keys.includes("gameplay") && keys.includes("graphics")) {
    typeWord = "геймплейно‑визуальный";
  } else {
    typeWord = TYPE_WORD[top1.key];
  }

  const sentences: string[] = [`Ты — ${typeWord} игрок.`];

  if (d.topGenres.length > 0) {
    const names = d.topGenres.slice(0, 3).map((g) => g.name);
    sentences.push(
      `Твои самые высокие оценки получают ${names.join(", ")}.`
    );
  }

  // Паттерн дропов.
  if (d.dropped > 0) {
    const droppedEntries = d.entries.filter((e) => e.status === "dropped");
    const completedEntries = d.entries.filter((e) => e.status === "completed");
    const dh = avg(
      droppedEntries.map((e) => e.hours_played ?? 0).filter((h) => h > 0)
    );
    const ch = avg(
      completedEntries.map((e) => e.hours_played ?? 0).filter((h) => h > 0)
    );
    // Топ-жанр среди брошенных.
    const dg = new Map<string, number>();
    for (const e of droppedEntries)
      for (const g of e.genres ?? []) dg.set(g, (dg.get(g) ?? 0) + 1);
    const topDropGenre = [...dg.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    if (dh > 0 && ch > 0 && dh > ch * 1.15) {
      sentences.push(
        `Чаще всего ты бросаешь долгие игры${topDropGenre ? `, особенно ${topDropGenre}` : ""}.`
      );
    } else if (topDropGenre) {
      sentences.push(`Чаще всего ты не дожимаешь ${topDropGenre}.`);
    }
  }

  // Отношение к завершению.
  if (d.completionPct >= 70) {
    sentences.push("Ты доводишь начатое до финала — редко бросаешь игры.");
  } else if (d.completionPct <= 35) {
    sentences.push("Ты легко переключаешься между играми и не держишься за одну.");
  }

  return sentences.join(" ");
}
