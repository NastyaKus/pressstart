-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 002: часы, платформы, избранное     ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ║  Безопасна для существующих данных (ADD COLUMN IF NOT EXISTS).║
-- ╚══════════════════════════════════════════════════════════╝

alter table public.game_entries
  add column if not exists hours_played numeric check (hours_played >= 0);

alter table public.game_entries
  add column if not exists platforms_played text[] not null default '{}';

alter table public.game_entries
  add column if not exists favorite boolean not null default false;
