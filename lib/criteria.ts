import type { LucideIcon } from "lucide-react";
import { Cloud, BookOpen, Gamepad2, Palette, Music } from "lucide-react";

export type CriterionKey =
  | "atmosphere"
  | "story"
  | "gameplay"
  | "graphics"
  | "sound";

export type Criterion = {
  key: CriterionKey;
  label: string;
  icon: LucideIcon;
  hint: string;
};

/** Критерии оценки — ядро pressstart. Легко расширить новым пунктом. */
export const CRITERIA: Criterion[] = [
  { key: "atmosphere", label: "Атмосфера", icon: Cloud, hint: "Погружение и настроение" },
  { key: "story", label: "Сюжет", icon: BookOpen, hint: "История и персонажи" },
  { key: "gameplay", label: "Геймплей", icon: Gamepad2, hint: "Механики и управление" },
  { key: "graphics", label: "Графика", icon: Palette, hint: "Визуал и стиль" },
  { key: "sound", label: "Звук", icon: Music, hint: "Музыка и звуки" },
];

export type Ratings = Record<CriterionKey, number>;

export const DEFAULT_RATINGS: Ratings = {
  atmosphere: 7,
  story: 7,
  gameplay: 7,
  graphics: 7,
  sound: 7,
};

/** Средняя оценка по всем критериям, округлённая до 0.1. */
export function overallScore(r: Ratings): number {
  const values = CRITERIA.map((c) => r[c.key]);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/** Цвет для оценки (0–10): красный → жёлтый → зелёный. */
export function scoreColor(score: number): string {
  if (score >= 8.5) return "#22c55e";
  if (score >= 7) return "#84cc16";
  if (score >= 5.5) return "#eab308";
  if (score >= 4) return "#f97316";
  return "#ef4444";
}
