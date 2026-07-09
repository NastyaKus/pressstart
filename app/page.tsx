import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPopularGames, hasRawgKey } from "@/lib/rawg";
import { GameGrid } from "@/components/game-grid";
import { Trending } from "@/components/trending";
import { Recommendations } from "@/components/recommendations";
import { CRITERIA } from "@/lib/criteria";

export const revalidate = 3600;

export default async function HomePage() {
  const games = await getPopularGames(12);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-border/70 glass px-6 py-20 sm:px-12 sm:py-28">
        {/* внутренние блики */}
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full opacity-60 blur-[90px]"
          style={{ background: "radial-gradient(circle, rgb(var(--accent) / 0.5), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full opacity-40 blur-[90px]"
          style={{ background: "radial-gradient(circle, rgb(var(--accent-2) / 0.45), transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-3xl text-center animate-fade-up">
          <span className="chip mb-6 gap-2 font-mono">
            <span className="h-1.5 w-1.5 rounded-full accent-gradient" style={{ animation: "glow-pulse 2s ease infinite" }} />
            insert coin · твоя игровая библиотека
          </span>

          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
            <span className="text-glow">Press</span>{" "}
            <span className="accent-gradient animate-gradient bg-clip-text text-transparent">
              Start
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted sm:text-lg">
            Отмечай пройденные игры и оценивай их по критериям — атмосфера,
            сюжет, геймплей, графика и звук. Красиво, по‑своему, в одном месте.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Оценка по критериям
          </h2>
          <p className="mt-2 text-muted">
            Каждая игра — не одна цифра, а честный разбор по пяти осям.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
          {CRITERIA.map(({ key, label, icon: Icon, hint }, i) => (
            <div
              key={key}
              className="group card flex animate-fade-up flex-col items-center gap-2.5 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:glow"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl accent-gradient text-accent-fg shadow-[0_0_18px_-4px_rgb(var(--accent)/0.7)] transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display font-semibold">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Персональные рекомендации (залогиненным) */}
      <Recommendations />

      {/* Тренды недели */}
      <Trending />

      {/* Популярные игры */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Популярное сейчас
            </h2>
            <p className="mt-1 text-muted">Начни собирать свою библиотеку</p>
          </div>
          <Link
            href="/discover"
            className="hidden items-center gap-1 text-sm font-medium text-accent transition hover:gap-2 sm:flex"
          >
            Весь каталог <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <GameGrid games={games} />
        {!hasRawgKey && (
          <p className="mt-6 card p-4 text-center text-sm text-muted">
            Показан демо‑набор игр. Добавь бесплатный ключ{" "}
            <span className="font-medium text-fg">RAWG_API_KEY</span>, чтобы
            открыть всю базу из сотен тысяч игр.
          </p>
        )}
      </section>
    </div>
  );
}
