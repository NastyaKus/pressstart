import { CRITERIA, scoreColor, type CriterionKey } from "@/lib/criteria";

export function CriteriaDisplay({
  ratings,
}: {
  ratings: Partial<Record<CriterionKey, number | null>>;
}) {
  return (
    <div className="space-y-3">
      {CRITERIA.map(({ key, label, icon: Icon }) => {
        const v = ratings[key] ?? 0;
        const color = scoreColor(v);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="flex w-28 shrink-0 items-center gap-2 text-sm text-muted">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(v / 10) * 100}%`, background: color }}
              />
            </div>
            <span
              className="w-8 text-right font-display text-sm font-bold tabular-nums"
              style={{ color }}
            >
              {v}
            </span>
          </div>
        );
      })}
    </div>
  );
}
