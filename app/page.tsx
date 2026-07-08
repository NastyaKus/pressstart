import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getPopularGames, hasRawgKey } from "@/lib/rawg";
import { GameGrid } from "@/components/game-grid";
import { CRITERIA } from "@/lib/criteria";

export const revalidate = 3600;

export default async function HomePage() {
  const games = await getPopularGames(12);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 sm:px-12 sm:py-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgb(var(--accent) / 0.25)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgb(var(--accent) / 0.15)" }}
        />
        <div className="relative mx-auto max-w-2xl text-center animate-fade-up">
          <span className="chip mb-5 gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            твоя игровая библиотека
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            press<span className="text-accent">start</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
            Отмечай пройденные игры и оценивай их по критериям — атмосфера,
            сюжет, геймплей, графика и звук. Красиво, по‑своему, в одном месте.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/discover" className="btn-primary">
              Найти игру <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth" className="btn-outline">
              Создать аккаунт
            </Link>
          </div>
        </div>
      </section>

      {/* Критерии */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Оценка по критериям
          </h2>
          <p className="mt-2 text-muted">
            Каждая игра — не одна цифра, а честный разбор по пяти осям.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {CRITERIA.map(({ key, label, icon: Icon, hint }) => (
            <div
              key={key}
              className="card flex flex-col items-center gap-2 p-5 text-center transition hover:border-accent/50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display font-semibold">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Популярные игры */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Популярное сейчас
            </h2>
            <p className="mt-1 text-muted">Начни собирать свою библиотеку</p>
          </div>
          <Link
            href="/discover"
            className="hidden items-center gap-1 text-sm font-medium text-accent hover:underline sm:flex"
          >
            Весь каталог <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <GameGrid games={games} />
        {!hasRawgKey && (
          <p className="mt-6 rounded-xl border border-border bg-surface-2 p-4 text-center text-sm text-muted">
            Показан демо‑набор игр. Добавь бесплатный ключ{" "}
            <span className="font-medium text-fg">RAWG_API_KEY</span>, чтобы
            открыть всю базу из сотен тысяч игр.
          </p>
        )}
      </section>
    </div>
  );
}
