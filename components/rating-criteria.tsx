"use client";

import { CRITERIA, overallScore, scoreColor, type Ratings } from "@/lib/criteria";
import { ScoreBadge } from "./score-badge";

export function RatingCriteria({
  value,
  onChange,
}: {
  value: Ratings;
  onChange: (next: Ratings) => void;
}) {
  const overall = overallScore(value);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 p-4">
        <div>
          <p className="text-sm text-muted">Итоговая оценка</p>
          <p className="font-display text-sm text-muted">среднее по критериям</p>
        </div>
        <ScoreBadge score={overall} size="lg" />
      </div>

      <div className="space-y-4">
        {CRITERIA.map(({ key, label, icon: Icon }) => {
          const v = value[key];
          const color = scoreColor(v);
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted" />
                  {label}
                </span>
                <span
                  className="font-display text-sm font-bold tabular-nums"
                  style={{ color }}
                >
                  {v}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={v}
                onChange={(e) =>
                  onChange({ ...value, [key]: Number(e.target.value) })
                }
                className="range-input w-full"
                style={{ color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
