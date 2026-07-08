-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 006: отзывы к играм                 ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ╚══════════════════════════════════════════════════════════╝

create table if not exists public.game_comments (
  id uuid primary key default gen_random_uuid(),
  rawg_id integer not null,
  -- FK на profiles (не на auth.users) — чтобы PostgREST умел embed profiles(...)
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_comments_game_idx
  on public.game_comments (rawg_id, created_at desc);

alter table public.game_comments enable row level security;

drop policy if exists "Отзывы: чтение всем" on public.game_comments;
create policy "Отзывы: чтение всем"
  on public.game_comments for select using (true);

drop policy if exists "Отзывы: свой insert" on public.game_comments;
create policy "Отзывы: свой insert"
  on public.game_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Отзывы: свой update" on public.game_comments;
create policy "Отзывы: свой update"
  on public.game_comments for update using (auth.uid() = user_id);

drop policy if exists "Отзывы: свой delete" on public.game_comments;
create policy "Отзывы: свой delete"
  on public.game_comments for delete using (auth.uid() = user_id);

-- updated_at автообновление (функция touch_updated_at уже есть в schema)
drop trigger if exists game_comments_touch on public.game_comments;
create trigger game_comments_touch
  before update on public.game_comments
  for each row execute function public.touch_updated_at();
