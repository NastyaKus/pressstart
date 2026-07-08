"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dices, X, ArrowRight } from "lucide-react";

type Pick = {
  rawg_id: number;
  name: string;
  cover_url: string | null;
  status: string;
};

export function BacklogRandomizer({ entries }: { entries: Pick[] }) {
  const [open, setOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [current, setCurrent] = useState<Pick | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();

  // Приоритет — статус «в планах», иначе вся библиотека.
  const backlog = entries.filter((e) => e.status === "backlog");
  const pool = backlog.length > 0 ? backlog : entries;

  function roll() {
    if (pool.length === 0) return;
    setOpen(true);
    setRolling(true);
    let ticks = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCurrent(pool[Math.floor(Math.random() * pool.length)]);
      ticks += 1;
      if (ticks > 16) {
        clearInterval(timer.current);
        setCurrent(pool[Math.floor(Math.random() * pool.length)]);
        setRolling(false);
      }
    }, 90);
  }

  if (entries.length === 0) return null;

  return (
    <>
      <button onClick={roll} className="btn-outline">
        <Dices className="h-4 w-4" /> Во что поиграть?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
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

            <p className="mb-4 font-mono text-xs uppercase tracking-wide text-accent">
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
                <button onClick={roll} className="btn-ghost flex-1">
                  <Dices className="h-4 w-4" /> Ещё раз
                </button>
                <Link
                  href={`/game/${current.rawg_id}`}
                  className="btn-primary flex-1"
                >
                  Открыть <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
