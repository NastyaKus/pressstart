-- ╔══════════════════════════════════════════════════════════╗
-- ║  pressstart — миграция 003: профили, @юзернеймы, аватарки  ║
-- ║  Запусти этот файл в Supabase → SQL Editor (один раз).     ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── Новые колонки профиля ───────────────────────────────────
alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists bio text;

-- Ник для показа = текущий username (если ещё не задан).
update public.profiles
  set display_name = coalesce(display_name, username, 'Игрок')
  where display_name is null;

-- ── username превращаем в уникальный @handle ────────────────
-- Санитайзим и добавляем короткий суффикс из id для уникальности.
update public.profiles p
  set username = lower(
        left(regexp_replace(coalesce(nullif(p.username, ''), 'user'),
                            '[^a-zA-Z0-9_]', '', 'g'), 16)
      ) || '_' || left(replace(p.id::text, '-', ''), 4)
  where p.username is null
     or p.username !~ '^[a-z0-9_]{3,20}$'
     or exists (
       select 1 from public.profiles q
       where lower(q.username) = lower(p.username) and q.id <> p.id
     );

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- ── Триггер создания профиля: display_name + уникальный handle ──
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

-- ── Публичное чтение библиотек (для чужих профилей) ─────────
-- Запись/изменение/удаление остаются owner-only (политики из schema.sql).
drop policy if exists "Публичное чтение записей" on public.game_entries;
create policy "Публичное чтение записей"
  on public.game_entries for select using (true);

-- ── Storage: bucket для аватарок ────────────────────────────
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "Аватарки: публичное чтение" on storage.objects;
create policy "Аватарки: публичное чтение"
  on storage.objects for select
  using (bucket_id = 'avatars');

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
