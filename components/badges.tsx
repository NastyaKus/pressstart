import { computeBadges, type BadgeStats } from "@/lib/badges";

export function Badges({ stats }: { stats: BadgeStats }) {
  const badges = computeBadges(stats);
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Ачивки</h2>
        <span className="font-mono text-xs text-muted">
          {earned.length}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-3">
        {[...earned, ...locked].map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.key}
              title={b.desc}
              className={`card flex flex-col items-center gap-1.5 p-3 text-center transition ${
                b.earned ? "" : "opacity-40 grayscale"
              }`}
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  b.earned
                    ? "accent-gradient text-accent-fg shadow-[0_0_16px_-3px_rgb(var(--accent)/0.8)]"
                    : "bg-surface-2 text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold leading-tight">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
