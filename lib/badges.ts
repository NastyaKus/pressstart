import type { LucideIcon } from "lucide-react";
import {
  Gamepad2,
  Trophy,
  Flame,
  Star,
  Heart,
  Clock,
  Crown,
  Swords,
  Sparkles,
} from "lucide-react";

export type BadgeStats = {
  total: number;
  completed: number;
  hours: number;
  rated: number;
  favorites: number;
};

export type Badge = {
  key: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  earned: boolean;
};

/** Считаем ачивки из статистики библиотеки — без БД. */
export function computeBadges(s: BadgeStats): Badge[] {
  return [
    { key: "first", label: "Первый старт", desc: "Первая игра в библиотеке", icon: Sparkles, earned: s.total >= 1 },
    { key: "collector10", label: "Коллекционер", desc: "10 игр в библиотеке", icon: Gamepad2, earned: s.total >= 10 },
    { key: "collector50", label: "Хранитель", desc: "50 игр в библиотеке", icon: Crown, earned: s.total >= 50 },
    { key: "collector100", label: "Легенда", desc: "100 игр в библиотеке", icon: Trophy, earned: s.total >= 100 },
    { key: "finisher25", label: "Финишёр", desc: "25 пройденных игр", icon: Swords, earned: s.completed >= 25 },
    { key: "critic", label: "Критик", desc: "10 оценённых игр", icon: Star, earned: s.rated >= 10 },
    { key: "fan", label: "Фанат", desc: "10 игр в избранном", icon: Heart, earned: s.favorites >= 10 },
    { key: "hours100", label: "Задрот", desc: "100+ часов суммарно", icon: Clock, earned: s.hours >= 100 },
    { key: "hours1000", label: "Ноу-лайф", desc: "1000+ часов суммарно", icon: Flame, earned: s.hours >= 1000 },
  ];
}
