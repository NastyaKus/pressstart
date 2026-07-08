# 🎮 pressstart

Красивый и минималистичный трекер пройденных игр. Собирай свою библиотеку,
отмечай статус прохождения и **оценивай каждую игру по критериям** — атмосфера,
сюжет, геймплей, графика и звук. Светлая и тёмная темы из коробки.

![stack](https://img.shields.io/badge/Next.js-14-black) ![stack](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E) ![stack](https://img.shields.io/badge/RAWG-API-orange)

## Возможности

- 🔎 **Каталог игр** из базы RAWG (800k+ игр) с живым поиском, обложками и скриншотами
- ⭐ **Оценка по 5 критериям** с автоматическим подсчётом итогового балла
- 📚 **Личная библиотека** со статусами (пройдено / прохожу / в планах / брошено), фильтрами и статистикой
- 🔐 **Аккаунты** на Supabase — данные сохраняются и защищены Row Level Security
- 🌗 **Две темы** — минималистичные светлая и тёмная
- 📱 Адаптивный интерфейс с мобильной навигацией

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # заполни ключи (см. ниже)
npm run dev                  # http://localhost:3000
```

> Без ключей сайт запускается в **демо‑режиме**: доступен встроенный набор
> популярных игр, но вход и сохранение отключены.

## Настройка ключей

### 1. RAWG API (база игр и картинки)

1. Зарегистрируйся на <https://rawg.io/apidocs> и нажми **Get API Key**.
2. Впиши ключ в `.env.local`:
   ```
   RAWG_API_KEY=твой_ключ
   ```

### 2. Supabase (аккаунты и сохранение данных)

1. Создай бесплатный проект на <https://supabase.com>.
2. Открой **Project Settings → API** и скопируй `Project URL` и `anon public` ключ:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_anon_ключ
   ```
3. Открой **SQL Editor**, вставь содержимое [`supabase/schema.sql`](./supabase/schema.sql)
   и выполни — это создаст таблицы, политики доступа (RLS) и триггеры.
4. (Опционально) В **Authentication → Providers → Email** можно отключить
   подтверждение почты, чтобы входить сразу после регистрации.

## Структура проекта

```
app/
  page.tsx              — лендинг (hero + популярные игры)
  discover/             — каталог с поиском
  library/              — личная библиотека + статистика
  game/[id]/            — страница игры + форма оценки
  auth/                 — вход и регистрация
  api/games/            — серверные роуты к RAWG (прячут ключ)
components/             — GameCard, RatingCriteria, Navbar, ThemeToggle…
lib/
  rawg.ts               — клиент RAWG + демо‑набор игр
  criteria.ts           — критерии оценки и подсчёт итога
  entries.ts            — работа с библиотекой в Supabase
  supabase/             — клиенты Supabase (browser/server)
supabase/schema.sql     — схема БД
```

## Критерии оценки

Оценка складывается из пяти осей (1–10), итог — среднее:

**Атмосфера · Сюжет · Геймплей · Графика · Звук**

Набор легко изменить в [`lib/criteria.ts`](./lib/criteria.ts) — добавь или
переименуй критерий (и, при желании, соответствующую колонку в `schema.sql`).

## Деплой

Проект — обычное приложение Next.js, отлично деплоится на **Vercel**:
подключи репозиторий, добавь те же переменные окружения в настройках проекта —
и всё. Домены RAWG/Steam для картинок уже прописаны в `next.config.js`.

## Стек

Next.js 14 (App Router) · TypeScript · Tailwind CSS · next-themes ·
Supabase (`@supabase/ssr`) · RAWG API · lucide-react
