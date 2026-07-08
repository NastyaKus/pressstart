-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 004: баннер профиля                 ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ╚══════════════════════════════════════════════════════════╝

alter table public.profiles
  add column if not exists banner_url text;
