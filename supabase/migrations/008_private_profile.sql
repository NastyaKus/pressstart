-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 008: приватный/публичный профиль    ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ╚══════════════════════════════════════════════════════════╝

alter table public.profiles
  add column if not exists is_public boolean not null default true;

-- Профили: видны, если публичные или свой.
drop policy if exists "Профили видны всем" on public.profiles;
drop policy if exists "Профили: публичные или свой" on public.profiles;
create policy "Профили: публичные или свой"
  on public.profiles for select
  using (is_public or auth.uid() = id);

-- Записи: видны владельцу всегда, остальным — только если профиль публичный.
drop policy if exists "Публичное чтение записей" on public.game_entries;
drop policy if exists "Свои записи: чтение" on public.game_entries;
drop policy if exists "Записи: свои или из публичного профиля" on public.game_entries;
create policy "Записи: свои или из публичного профиля"
  on public.game_entries for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = game_entries.user_id and p.is_public
    )
  );
