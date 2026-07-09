-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 007: тренды недели                  ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ╚══════════════════════════════════════════════════════════╝

create or replace function public.trending_games(
  p_days integer default 7,
  p_limit integer default 12
)
returns table (
  rawg_id integer,
  name text,
  cover_url text,
  released text,
  genres text[],
  adds bigint
)
language sql
stable
security invoker
as $$
  select c.rawg_id, g.name, g.cover_url, g.released, g.genres, c.adds
  from (
    select e.rawg_id, count(*) as adds, max(e.added_at) as last_added
    from public.game_entries e
    where e.added_at > now() - make_interval(days => p_days)
    group by e.rawg_id
    order by adds desc, last_added desc
    limit p_limit
  ) c
  join lateral (
    select e.name, e.cover_url, e.released, e.genres
    from public.game_entries e
    where e.rawg_id = c.rawg_id
    order by e.added_at desc
    limit 1
  ) g on true
  order by c.adds desc, c.last_added desc;
$$;
