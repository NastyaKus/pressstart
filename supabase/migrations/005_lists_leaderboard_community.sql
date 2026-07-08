-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 005: списки, лидерборд, community   ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ╚══════════════════════════════════════════════════════════╝

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

-- Списки: публичное чтение, запись владельцем.
drop policy if exists "Списки: чтение всем" on public.lists;
create policy "Списки: чтение всем" on public.lists for select using (true);

drop policy if exists "Списки: владелец пишет" on public.lists;
create policy "Списки: владелец пишет" on public.lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Айтемы: публичное чтение; запись, если список принадлежит тебе.
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

-- ── Лидерборд (view поверх публичных данных) ────────────────
drop view if exists public.leaderboard;
create view public.leaderboard
  with (security_invoker = on) as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  count(e.id) as games,
  coalesce(sum(e.hours_played), 0)::numeric as hours,
  count(e.id) filter (where e.status = 'completed') as completed,
  round(avg(e.overall) filter (where e.overall > 0), 1) as avg_score
from public.profiles p
left join public.game_entries e on e.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_url;

-- ── Community-рейтинг игры (средняя по всем пользователям) ───
create or replace function public.game_community_stats(p_rawg_id integer)
returns table (avg_score numeric, ratings integer)
language sql
stable
security invoker
as $$
  select
    round(avg(overall) filter (where overall > 0), 1) as avg_score,
    count(*) filter (where overall > 0)::integer as ratings
  from public.game_entries
  where rawg_id = p_rawg_id;
$$;
