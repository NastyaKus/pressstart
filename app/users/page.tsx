"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import type { Profile } from "@/lib/profiles";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    try {
      let req = supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      const term = q.trim();
      if (term) {
        req = req.or(
          `username.ilike.%${term}%,display_name.ilike.%${term}%`
        );
      }
      const { data } = await req;
      setResults((data ?? []) as Profile[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Игроки
        </h1>
        <p className="mt-1 text-muted">
          Найди других и посмотри их библиотеки и оценки
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ник или @юзернейм…"
          className="input pl-11"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((p) => (
            <Link
              key={p.id}
              href={`/u/${p.username}`}
              className="card flex items-center gap-3 p-3 transition hover:border-accent/50 hover:-translate-y-0.5"
            >
              <Avatar
                src={p.avatar_url}
                name={p.display_name || p.username}
                size={44}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {p.display_name || p.username}
                </p>
                <p className="truncate font-mono text-sm text-accent">
                  @{p.username}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 p-10 text-center text-muted">
          <Users className="h-8 w-8" />
          {query ? "Никого не нашлось" : "Пока нет игроков"}
        </div>
      )}
    </div>
  );
}
