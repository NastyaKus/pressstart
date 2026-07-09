import { CRITERIA, type CriterionKey } from "@/lib/criteria";

/** SVG-радар (пентагон) по 5 критериям, значения 0–10. Тема-aware. */
export function Radar({
  values,
  size = 260,
}: {
  values: Record<CriterionKey, number>;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 44;
  const n = CRITERIA.length;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  // Кольца-сетка.
  const rings = [0.25, 0.5, 0.75, 1].map((k) =>
    CRITERIA.map((_, i) => point(i, r * k))
      .map((p) => `${p.x},${p.y}`)
      .join(" ")
  );

  // Полигон значений.
  const valuePts = CRITERIA.map((c, i) =>
    point(i, r * (Math.max(0, values[c.key]) / 10))
  );
  const valueStr = valuePts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth={1}
        />
      ))}
      {CRITERIA.map((_, i) => {
        const p = point(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgb(var(--border))"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={valueStr}
        fill="rgb(var(--accent) / 0.25)"
        stroke="rgb(var(--accent))"
        strokeWidth={2}
      />
      {valuePts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="rgb(var(--accent))" />
      ))}

      {CRITERIA.map((c, i) => {
        const p = point(i, r + 22);
        return (
          <text
            key={c.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            fill="rgb(var(--muted))"
            style={{ fontWeight: 600 }}
          >
            {c.label}
          </text>
        );
      })}
    </svg>
  );
}
