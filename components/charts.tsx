import { scoreColor } from "@/lib/criteria";

type Row = { label: string; value: number; color?: string; suffix?: string };

/** Горизонтальные бары: одна серия, тонкие марки, скруглённый конец, прямые подписи. */
function BarChart({ rows, unit = "" }: { rows: Row[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-right text-xs text-muted">
            {r.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(4, (r.value / max) * 100)}%`,
                background: r.color ?? "rgb(var(--accent))",
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-fg">
            {r.value}
            {r.suffix ?? unit}
          </span>
        </div>
      ))}
    </div>
  );
}

type MiniEntry = {
  name: string;
  genres: string[] | null;
  overall: number | null;
  hours_played: number | null;
};

export function StatsCharts({ entries }: { entries: MiniEntry[] }) {
  if (entries.length === 0) return null;

  // Топ жанров по количеству.
  const genreCount = new Map<string, number>();
  for (const e of entries)
    for (const g of e.genres ?? [])
      genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  const genres: Row[] = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  // Распределение оценок (по округлённой средней), цвет по смыслу.
  const buckets = new Map<number, number>();
  for (const e of entries) {
    if (e.overall && e.overall > 0) {
      const b = Math.round(e.overall);
      buckets.set(b, (buckets.get(b) ?? 0) + 1);
    }
  }
  const scores: Row[] = [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([b, value]) => ({
      label: `${b} / 10`,
      value,
      color: scoreColor(b),
    }));

  // Топ по часам.
  const topHours: Row[] = entries
    .filter((e) => (e.hours_played ?? 0) > 0)
    .sort((a, b) => (b.hours_played ?? 0) - (a.hours_played ?? 0))
    .slice(0, 5)
    .map((e) => ({
      label: e.name,
      value: Math.round(e.hours_played ?? 0),
      suffix: " ч",
    }));

  const blocks = [
    { title: "Жанры", rows: genres },
    { title: "Оценки", rows: scores },
    { title: "Больше всего наиграно", rows: topHours },
  ].filter((b) => b.rows.length > 0);

  if (blocks.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-bold">Статистика</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.title} className="card p-5">
            <p className="mb-4 text-sm font-medium text-muted">{b.title}</p>
            <BarChart rows={b.rows} />
          </div>
        ))}
      </div>
    </div>
  );
}
