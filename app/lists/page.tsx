"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogIn, Plus, ListPlus, Trash2, ChevronRight } from "lucide-react";
import { useUser } from "@/lib/use-user";
import {
  fetchMyLists,
  createList,
  deleteList,
  type GameList,
} from "@/lib/lists";
import { useToast } from "@/components/toast";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ListsPage() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [lists, setLists] = useState<(GameList & { count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMyLists()
      .then(setLists)
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, [user]);

  async function onCreate() {
    const t = title.trim();
    if (!t) return;
    setCreating(true);
    try {
      const list = await createList(t);
      setLists((l) => [{ ...list, count: 0 }, ...l]);
      setTitle("");
      toast("Список создан");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteList(id);
      setLists((l) => l.filter((x) => x.id !== id));
      toast("Список удалён");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  }

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Списки</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {isSupabaseConfigured
            ? "Войди, чтобы создавать подборки игр."
            : "Демо‑режим: подключи Supabase (см. README)."}
        </p>
        <Link href="/auth" className="btn-primary mt-6">
          <LogIn className="h-4 w-4" /> Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Мои списки
        </h1>
        <p className="mt-1 text-muted">
          Свои подборки: «Топ-10», «Хочу пройти» — и делись ссылкой
        </p>
      </div>

      <div className="card flex flex-col gap-2 p-4 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreate()}
          maxLength={60}
          placeholder="Название нового списка…"
          className="input flex-1"
        />
        <button onClick={onCreate} disabled={creating} className="btn-primary">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Создать
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : lists.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center text-muted">
          <ListPlus className="h-8 w-8" />
          Пока нет списков — создай первый выше.
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((l) => (
            <div
              key={l.id}
              className="card flex items-center gap-3 p-4 transition hover:border-accent/50"
            >
              <Link href={`/list/${l.id}`} className="flex flex-1 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="font-mono text-xs text-muted">{l.count} игр</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>
              <button
                onClick={() => onDelete(l.id)}
                className="text-muted transition hover:text-red-500"
                aria-label="Удалить список"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
