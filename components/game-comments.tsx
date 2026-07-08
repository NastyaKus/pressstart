"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Trash2, Pencil, X, Check, MessageSquare } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { useToast } from "./toast";
import { Avatar } from "./avatar";
import { ScoreBadge } from "./score-badge";
import { timeAgo } from "@/lib/relative-time";
import {
  fetchComments,
  fetchGameScores,
  postComment,
  updateComment,
  deleteComment,
  type GameComment,
} from "@/lib/comments";

export function GameComments({ rawgId }: { rawgId: number }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [comments, setComments] = useState<GameComment[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  async function reload() {
    try {
      const [c, s] = await Promise.all([
        fetchComments(rawgId),
        fetchGameScores(rawgId),
      ]);
      setComments(c);
      setScores(s);
    } catch {
      /* таблицы ещё нет — тихо */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawgId]);

  async function submit() {
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    try {
      await postComment(rawgId, text);
      setBody("");
      toast("Отзыв опубликован");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setPosting(false);
    }
  }

  async function saveEdit(id: string) {
    const text = editBody.trim();
    if (!text) return;
    try {
      await updateComment(id, text);
      setEditId(null);
      toast("Отзыв обновлён");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  }

  async function remove(id: string) {
    try {
      await deleteComment(id);
      setComments((c) => c.filter((x) => x.id !== id));
      toast("Отзыв удалён");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  }

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
        <MessageSquare className="h-5 w-5 text-accent" />
        Отзывы
        {comments.length > 0 && (
          <span className="font-mono text-sm text-muted">
            {comments.length}
          </span>
        )}
      </h2>

      {/* Форма */}
      {user ? (
        <div className="card mb-5 p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Поделись впечатлением об игре…"
            className="input resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-muted">
              {body.length}/1000
            </span>
            <button
              onClick={submit}
              disabled={posting || !body.trim()}
              className="btn-primary"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Опубликовать
            </button>
          </div>
        </div>
      ) : (
        <div className="card mb-5 p-4 text-center text-sm text-muted">
          <Link href="/auth" className="font-medium text-accent hover:underline">
            Войди
          </Link>
          , чтобы оставить отзыв.
        </div>
      )}

      {/* Лента */}
      {loading ? (
        <div className="grid place-items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : comments.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          Пока нет отзывов — будь первым.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const author = c.profiles;
            const name = author?.display_name || author?.username || "Игрок";
            const score = scores[c.user_id];
            const isMine = user?.id === c.user_id;
            return (
              <div key={c.id} className="card p-4">
                <div className="mb-2 flex items-center gap-3">
                  {author ? (
                    <Link href={`/u/${author.username}`} className="shrink-0">
                      <Avatar src={author.avatar_url} name={name} size={36} />
                    </Link>
                  ) : (
                    <Avatar name={name} size={36} />
                  )}
                  <div className="min-w-0 flex-1">
                    {author ? (
                      <Link
                        href={`/u/${author.username}`}
                        className="truncate font-medium hover:text-accent"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="font-medium">{name}</span>
                    )}
                    <p className="font-mono text-xs text-muted">
                      {author && `@${author.username} · `}
                      {timeAgo(c.created_at)}
                      {c.updated_at !== c.created_at && " · изм."}
                    </p>
                  </div>
                  {typeof score === "number" && (
                    <ScoreBadge score={score} size="sm" />
                  )}
                  {isMine && editId !== c.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditId(c.id);
                          setEditBody(c.body);
                        }}
                        className="text-muted transition hover:text-fg"
                        aria-label="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-muted transition hover:text-red-500"
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editId === c.id ? (
                  <div>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      className="input resize-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditId(null)}
                        className="btn-ghost h-8 px-3 text-sm"
                      >
                        <X className="h-4 w-4" /> Отмена
                      </button>
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="btn-primary h-8 px-3 text-sm"
                      >
                        <Check className="h-4 w-4" /> Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-fg/90">
                    {c.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
