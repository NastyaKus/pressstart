"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Dices, X, ArrowRight } from "lucide-react";

type Pick = {
  rawg_id: number;
  name: string;
  cover_url: string | null;
  status: string;
};

type Source = "backlog" | "all";

export function BacklogRandomizer({ entries }: { entries: Pick[] }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [current, setCurrent] = useState<Pick | null>(null);
  const [source, setSource] = useState<Source>("all");
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => setMounted(true), []);
  useEffect(() => () => clearInterval(timer.current), []);

  const backlog = entries.filter((e) => e.status === "backlog");

  function listFor(src: Source): Pick[] {
    return src === "backlog" ? backlog : entries;
  }
  const pool = listFor(source);

  function pickFrom(list: Pick[], avoid?: Pick | null): Pick | null {
    if (list.length === 0) return null;
    if (list.length === 1) return list[0];
    let next = list[Math.floor(Math.random() * list.length)];
    let guard = 0;
    while (avoid && next.rawg_id === avoid.rawg_id && guard < 10) {
      next = list[Math.floor(Math.random() * list.length)];
      guard += 1;
    }
    return next;
  }

  function roll(list = pool) {
    if (list.length === 0) return;
    setOpen(true);
    setRolling(true);
    let ticks = 0;
    let last: Pick | null = null;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      last = pickFrom(list, last);
      setCurrent(last);
      ticks += 1;
      if (ticks > 16) {
        clearInterval(timer.current);
        setRolling(false);
      }
    }, 90);
  }

  if (entries.length === 0) return null;

  const modal = open && (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="card relative w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-muted transition hover:text-fg"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Источник */}
        <div className="mb-4 inline-flex rounded-lg bg-surface-2 p-0.5 text-xs">
          {(
            [
              { key: "all", label: "Все игры" },
              { key: "backlog", label: `В планах (${backlog.length})` },
            ] as { key: Source; label: string }[]
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setSource(s.key);
                const list = listFor(s.key);
                if (list.length > 0) roll(list);
              }}
              disabled={s.key === "backlog" && backlog.length === 0}
              className={`rounded-md px-3 py-1.5 font-medium transition disabled:opacity-40 ${
                source === s.key
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="mb-3 font-mono text-xs uppercase tracking-wide text-accent">
          {rolling ? "выбираю…" : "тебе выпало"}
        </p>

        {current && (
          <>
            <div
              className={`relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-surface-2 transition-transform ${
                rolling ? "scale-95 opacity-80" : "scale-100"
              }`}
            >
              {current.cover_url && (
                <Image
                  src={current.cover_url}
                  alt={current.name}
                  fill
                  sizes="384px"
                  className="object-cover"
                />
              )}
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">
              {current.name}
            </h3>
          </>
        )}

        {!rolling && current && (
          <div className="mt-5 flex gap-2">
            <button onClick={() => roll()} className="btn-ghost flex-1">
              <Dices className="h-4 w-4" /> Ещё раз
            </button>
            <Link
              href={`/game/${current.rawg_id}`}
              className="btn-primary flex-1"
              onClick={() => setOpen(false)}
            >
              Открыть <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => roll()} className="btn-outline">
        <Dices className="h-4 w-4" /> Во что поиграть?
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
