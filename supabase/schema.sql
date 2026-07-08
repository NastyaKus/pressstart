-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — схема базы данных для Supabase               ║
-- ║  Запусти этот файл один раз в Supabase → SQL Editor.       ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── Профили пользователей ───────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Профили видны всем" on public.profiles;
create policy "Профили видны всем"
  on public.profiles for select using (true);

drop policy if exists "Правит только владелец профиля" on public.profiles;
create policy "Правит только владелец профиля"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Создаёт только владелец профиля" on public.profiles;
create policy "Создаёт только владелец профиля"
  on public.profiles for insert with check (auth.uid() = id);

-- ── Записи о играх (библиотека пользователя) ────────────────
create table if not exists public.game_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rawg_id integer not null,
  name text not null,
  cover_url text,
  released text,
  genres text[] default '{}',
  status text not null default 'completed'
    check (status in ('completed', 'playing', 'backlog', 'dropped')),
  review text,
  -- Критерии оценки (1–10):
  atmosphere smallint check (atmosphere between 1 and 10),
  story smallint check (story between 1 and 10),
  gameplay smallint check (gameplay between 1 and 10),
  graphics smallint check (graphics between 1 and 10),
  sound smallint check (sound between 1 and 10),
  -- Итоговая оценка считается автоматически как среднее по критериям:
  overall numeric(3, 1) generated always as (
    round(
      (coalesce(atmosphere, 0) + coalesce(story, 0) + coalesce(gameplay, 0)
        + coalesce(graphics, 0) + coalesce(sound, 0))::numeric / 5,
      1
    )
  ) stored,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, rawg_id)
);

alter table public.game_entries enable row level security;

drop policy if exists "Свои записи: чтение" on public.game_entries;
create policy "Свои записи: чтение"
  on public.game_entries for select using (auth.uid() = user_id);

drop policy if exists "Свои записи: добавление" on public.game_entries;
create policy "Свои записи: добавление"
  on public.game_entries for insert with check (auth.uid() = user_id);

drop policy if exists "Свои записи: изменение" on public.game_entries;
create policy "Свои записи: изменение"
  on public.game_entries for update using (auth.uid() = user_id);

drop policy if exists "Свои записи: удаление" on public.game_entries;
create policy "Свои записи: удаление"
  on public.game_entries for delete using (auth.uid() = user_id);

create index if not exists game_entries_user_idx
  on public.game_entries (user_id, added_at desc);

-- ── Автосоздание профиля при регистрации ────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Автообновление updated_at ───────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists game_entries_touch on public.game_entries;
create trigger game_entries_touch
  before update on public.game_entries
  for each row execute function public.touch_updated_at();
