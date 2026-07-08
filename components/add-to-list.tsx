"use client";

import { useEffect, useState } from "react";
import { ListPlus, Plus, Loader2, Check } from "lucide-react";
import { useUser } from "@/lib/use-user";
import {
  fetchMyLists,
  createList,
  addToList,
  type GameList,
} from "@/lib/lists";
import { useToast } from "./toast";

type GameInfo = {
  id: number;
  name: string;
  cover_url: string | null;
  released: string | null;
  genres: string[];
};

export function AddToList({ game }: { game: GameInfo }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<(GameList & { count: number })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || loaded || !user) return;
    fetchMyLists()
      .then(setLists)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [open, loaded, user]);

  if (!user) return null;

  const item = {
    rawg_id: game.id,
    name: game.name,
    cover_url: game.cover_url,
    released: game.released,
    genres: game.genres,
  };

  async function add(list: GameList) {
    setBusy(true);
    try {
      await addToList(list.id, item);
      setAddedTo((s) => new Set(s).add(list.id));
      toast(`Добавлено в «${list.title}»`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    const t = newTitle.trim();
    if (!t) return;
    setBusy(true);
    try {
      const list = await createList(t);
      await addToList(list.id, item);
      setLists((l) => [{ ...list, count: 1 }, ...l]);
      setAddedTo((s) => new Set(s).add(list.id));
      setNewTitle("");
      toast(`Создан список «${t}» и добавлена игра`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-outline w-full"
      >
        <ListPlus className="h-4 w-4" /> В список
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full z-50 mb-2 w-full overflow-hidden rounded-xl glass-strong p-2 shadow-xl">
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {!loaded ? (
                <div className="grid place-items-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                </div>
              ) : lists.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted">
                  Нет списков — создай ниже
                </p>
              ) : (
                lists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => add(l)}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-2"
                  >
                    <span className="truncate">{l.title}</span>
                    {addedTo.has(l.id) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="mt-1 flex gap-1 border-t border-border/60 pt-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                placeholder="Новый список…"
                className="input flex-1 py-1.5 text-sm"
              />
              <button
                onClick={createAndAdd}
                disabled={busy || !newTitle.trim()}
                className="btn-primary px-2.5"
                aria-label="Создать и добавить"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
