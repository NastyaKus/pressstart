import { scoreColor } from "@/lib/criteria";

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const color = scoreColor(score);
  const dims =
    size === "lg"
      ? "h-16 w-16 text-2xl"
      : size === "sm"
        ? "h-9 w-9 text-sm"
        : "h-12 w-12 text-lg";

  return (
    <div
      className={`grid ${dims} place-items-center rounded-full font-display font-bold tabular-nums`}
      style={{
        color,
        border: `2px solid ${color}`,
        background: `${color}1f`,
      }}
    >
      {score.toFixed(1)}
    </div>
  );
}
