"use client";

import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  username: string; // @handle
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

const PROFILE_COLS = "id, username, display_name, bio, avatar_url, created_at";

/** Профиль по @юзернейму (регистронезависимо). */
export async function fetchProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .ilike("username", username)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

/** Профиль текущего пользователя. */
export async function fetchMyProfile(): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

/** Проверка, свободен ли @юзернейм (исключая себя). */
export async function isUsernameAvailable(
  username: string,
  selfId?: string
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  let q = supabase.from("profiles").select("id").ilike("username", username);
  if (selfId) q = q.neq("id", selfId);
  const { data, error } = await q.maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return !data;
}

export type ProfileUpdate = {
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
};

/** Обновить свой профиль. */
export async function updateProfile(patch: ProfileUpdate): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нужно войти в аккаунт");
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505")
      throw new Error("Этот @юзернейм уже занят");
    throw error;
  }
}

/** Загрузить аватарку в Storage и вернуть публичный URL. */
export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нужно войти в аккаунт");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/avatar_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

/** Валидность @юзернейма: 3–20 символов, латиница/цифры/подчёркивание. */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
}
