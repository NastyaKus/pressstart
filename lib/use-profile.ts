"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMyProfile, type Profile } from "@/lib/profiles";

/** Реактивно отслеживает профиль текущего пользователя. */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    reload();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => reload());

    // Мгновенное обновление после сохранения профиля в настройках.
    window.addEventListener("pressstart:profile", reload);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pressstart:profile", reload);
    };
  }, [reload]);

  return { profile, loading, reload };
}
