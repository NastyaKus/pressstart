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
  select
    rawg_id,
    (array_agg(name order by added_at desc))[1] as name,
    (array_agg(cover_url order by added_at desc))[1] as cover_url,
    (array_agg(released order by added_at desc))[1] as released,
    (array_agg(genres order by added_at desc))[1] as genres,
    count(*) as adds
  from public.game_entries
  where added_at > now() - make_interval(days => p_days)
  group by rawg_id
  order by adds desc, max(added_at) desc
  limit p_limit;
$$;
