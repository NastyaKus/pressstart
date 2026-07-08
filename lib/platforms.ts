import type { LucideIcon } from "lucide-react";
import { Monitor, Gamepad2, Smartphone, Cpu, Globe } from "lucide-react";

/** Базовый набор платформ — всегда доступен для выбора. */
export const BASE_PLATFORMS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Steam Deck",
  "Mobile",
] as const;

const ICONS: Record<string, LucideIcon> = {
  PC: Monitor,
  PlayStation: Gamepad2,
  Xbox: Gamepad2,
  "Nintendo Switch": Gamepad2,
  "Steam Deck": Cpu,
  Mobile: Smartphone,
};

export function platformIcon(name: string): LucideIcon {
  return ICONS[name] ?? Globe;
}

/** Приводим разные названия из RAWG к нашему каноничному виду. */
function normalize(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("playstation")) return "PlayStation";
  if (n.includes("xbox")) return "Xbox";
  if (n.includes("nintendo") || n.includes("switch")) return "Nintendo Switch";
  if (n === "pc" || n.includes("windows")) return "PC";
  if (n.includes("mac") || n.includes("linux")) return "PC";
  if (n.includes("ios") || n.includes("android") || n.includes("mobile"))
    return "Mobile";
  if (n.includes("steam deck")) return "Steam Deck";
  if (n.includes("web")) return "PC";
  return name;
}

/**
 * Список платформ для выбора: платформы конкретной игры (нормализованные),
 * объединённые с базовым набором, без дублей и в приятном порядке.
 */
export function platformOptions(gamePlatforms: string[] = []): string[] {
  const fromGame = gamePlatforms.map(normalize);
  const merged = [...fromGame, ...BASE_PLATFORMS];
  return Array.from(new Set(merged));
}
