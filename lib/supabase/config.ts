export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Настроен ли Supabase. Пока ключей нет, сайт работает в «демо-режиме»:
 * каталог игр доступен, а вход/библиотека мягко показывают подсказку.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
