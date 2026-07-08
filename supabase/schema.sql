-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — схема базы данных для Supabase               ║
-- ║  Запусти этот файл один раз в Supabase → SQL Editor.       ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── Профили пользователей ───────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,            -- уникальный @handle
  display_name text,                 -- ник для показа
  bio text,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

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
  hours_played numeric check (hours_played >= 0),
  platforms_played text[] not null default '{}',
  favorite boolean not null default false,
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

-- Библиотеки публично читаемы (для чужих профилей); запись — owner-only ниже.
drop policy if exists "Публичное чтение записей" on public.game_entries;
create policy "Публичное чтение записей"
  on public.game_entries for select using (true);

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
declare
  base text;
  handle text;
begin
  base := lower(regexp_replace(
    coalesce(nullif(new.raw_user_meta_data->>'username', ''),
             split_part(new.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_]', '', 'g'));
  if length(base) < 3 then base := 'user'; end if;
  handle := left(base, 16) || '_' || left(replace(new.id::text, '-', ''), 4);

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    handle,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''),
             split_part(new.email, '@', 1))
  )
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

-- ── Storage: bucket для аватарок ────────────────────────────
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "Аватарки: публичное чтение" on storage.objects;
create policy "Аватарки: публичное чтение"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Аватарки: загрузка своих" on storage.objects;
create policy "Аватарки: загрузка своих"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Аватарки: замена своих" on storage.objects;
create policy "Аватарки: замена своих"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Аватарки: удаление своих" on storage.objects;
create policy "Аватарки: удаление своих"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Кастомные списки ────────────────────────────────────────
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  rawg_id integer not null,
  name text not null,
  cover_url text,
  released text,
  genres text[] default '{}',
  added_at timestamptz not null default now(),
  unique (list_id, rawg_id)
);

create index if not exists lists_user_idx on public.lists (user_id, created_at desc);
create index if not exists list_items_list_idx on public.list_items (list_id, added_at desc);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

drop policy if exists "Списки: чтение всем" on public.lists;
create policy "Списки: чтение всем" on public.lists for select using (true);

drop policy if exists "Списки: владелец пишет" on public.lists;
create policy "Списки: владелец пишет" on public.lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Айтемы: чтение всем" on public.list_items;
create policy "Айтемы: чтение всем" on public.list_items for select using (true);

drop policy if exists "Айтемы: владелец списка пишет" on public.list_items;
create policy "Айтемы: владелец списка пишет" on public.list_items
  for all
  using (
    exists (select 1 from public.lists l
            where l.id = list_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lists l
            where l.id = list_id and l.user_id = auth.uid())
  );

-- ── Лидерборд ───────────────────────────────────────────────
drop view if exists public.leaderboard;
create view public.leaderboard
  with (security_invoker = on) as
select
  p.id, p.username, p.display_name, p.avatar_url,
  count(e.id) as games,
  coalesce(sum(e.hours_played), 0)::numeric as hours,
  count(e.id) filter (where e.status = 'completed') as completed,
  round(avg(e.overall) filter (where e.overall > 0), 1) as avg_score
from public.profiles p
left join public.game_entries e on e.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_url;

-- ── Community-рейтинг игры ──────────────────────────────────
create or replace function public.game_community_stats(p_rawg_id integer)
returns table (avg_score numeric, ratings integer)
language sql stable security invoker as $$
  select
    round(avg(overall) filter (where overall > 0), 1) as avg_score,
    count(*) filter (where overall > 0)::integer as ratings
  from public.game_entries
  where rawg_id = p_rawg_id;
$$;
