/**
 * Слой доступа к RAWG API (https://rawg.io/apidocs).
 * Если ключ не задан — работаем на встроенном демо-наборе игр,
 * чтобы интерфейс не был пустым.
 */

const RAWG_BASE = "https://api.rawg.io/api";
const RAWG_KEY = process.env.RAWG_API_KEY ?? "";

export const hasRawgKey = Boolean(RAWG_KEY);

export type Game = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  backgroundImage: string | null;
  rating: number; // метакритик-подобный рейтинг RAWG (0–5)
  genres: string[];
  platforms: string[];
};

export type GameDetail = Game & {
  description: string;
  screenshots: string[];
  developers: string[];
  metacritic: number | null;
  website: string | null;
};

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  metacritic?: number | null;
  genres?: { name: string }[];
  parent_platforms?: { platform: { name: string } }[];
  short_screenshots?: { image: string }[];
};

function normalize(g: RawgGame): Game {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    released: g.released,
    backgroundImage: g.background_image,
    rating: g.rating ?? 0,
    genres: (g.genres ?? []).map((x) => x.name),
    platforms: (g.parent_platforms ?? []).map((x) => x.platform.name),
  };
}

async function rawgFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${RAWG_BASE}${path}`);
  url.searchParams.set("key", RAWG_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`RAWG ${res.status}`);
  return res.json();
}

export async function getPopularGames(pageSize = 24): Promise<Game[]> {
  if (!hasRawgKey) return FALLBACK_GAMES.slice(0, pageSize);
  try {
    const data = await rawgFetch("/games", {
      ordering: "-added",
      page_size: String(pageSize),
      metacritic: "80,100",
    });
    return (data.results as RawgGame[]).map(normalize);
  } catch {
    return FALLBACK_GAMES.slice(0, pageSize);
  }
}

export async function searchGames(query: string, pageSize = 24): Promise<Game[]> {
  const q = query.trim();
  if (!hasRawgKey) {
    if (!q) return FALLBACK_GAMES;
    const lower = q.toLowerCase();
    return FALLBACK_GAMES.filter((g) => g.name.toLowerCase().includes(lower));
  }
  try {
    const data = await rawgFetch("/games", {
      search: q,
      page_size: String(pageSize),
      search_precise: "true",
    });
    return (data.results as RawgGame[]).map(normalize);
  } catch {
    return [];
  }
}

export async function getGame(id: number): Promise<GameDetail | null> {
  if (!hasRawgKey) {
    const g = FALLBACK_GAMES.find((x) => x.id === id);
    if (!g) return null;
    return {
      ...g,
      description: FALLBACK_DESCRIPTIONS[g.id] ?? "Описание недоступно в демо-режиме. Добавьте ключ RAWG, чтобы получить полные данные.",
      screenshots: g.backgroundImage ? [g.backgroundImage] : [],
      developers: [],
      metacritic: null,
      website: null,
    };
  }
  try {
    const [detail, shots] = await Promise.all([
      rawgFetch(`/games/${id}`),
      rawgFetch(`/games/${id}/screenshots`).catch(() => ({ results: [] })),
    ]);
    const base = normalize(detail as RawgGame);
    return {
      ...base,
      description: stripHtml(detail.description_raw || detail.description || ""),
      screenshots: ((shots.results ?? []) as { image: string }[]).map(
        (s) => s.image
      ),
      developers: (detail.developers ?? []).map((d: { name: string }) => d.name),
      metacritic: detail.metacritic ?? null,
      website: detail.website || null,
    };
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Демо-набор игр (используется без ключа RAWG) ─────────────
// Обложки берём со стабильного CDN Steam по appid.
const steam = (appid: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;

export const FALLBACK_GAMES: Game[] = [
  { id: 292030, slug: "the-witcher-3", name: "The Witcher 3: Wild Hunt", released: "2015-05-18", backgroundImage: steam(292030), rating: 4.7, genres: ["RPG", "Экшен"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 1245620, slug: "elden-ring", name: "Elden Ring", released: "2022-02-25", backgroundImage: steam(1245620), rating: 4.6, genres: ["RPG", "Souls-like"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 1086940, slug: "baldurs-gate-3", name: "Baldur's Gate 3", released: "2023-08-03", backgroundImage: steam(1086940), rating: 4.8, genres: ["RPG", "Пошаговая"], platforms: ["PC", "PlayStation"] },
  { id: 1145360, slug: "hades", name: "Hades", released: "2020-09-17", backgroundImage: steam(1145360), rating: 4.5, genres: ["Рогалик", "Экшен"], platforms: ["PC", "PlayStation", "Xbox", "Switch"] },
  { id: 367520, slug: "hollow-knight", name: "Hollow Knight", released: "2017-02-24", backgroundImage: steam(367520), rating: 4.6, genres: ["Метроидвания", "Платформер"], platforms: ["PC", "Switch"] },
  { id: 1174180, slug: "red-dead-redemption-2", name: "Red Dead Redemption 2", released: "2019-11-05", backgroundImage: steam(1174180), rating: 4.6, genres: ["Экшен", "Приключение"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 1091500, slug: "cyberpunk-2077", name: "Cyberpunk 2077", released: "2020-12-10", backgroundImage: steam(1091500), rating: 4.2, genres: ["RPG", "Экшен"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 1593500, slug: "god-of-war", name: "God of War", released: "2022-01-14", backgroundImage: steam(1593500), rating: 4.6, genres: ["Экшен", "Приключение"], platforms: ["PC", "PlayStation"] },
  { id: 632470, slug: "disco-elysium", name: "Disco Elysium", released: "2019-10-15", backgroundImage: steam(632470), rating: 4.5, genres: ["RPG", "Детектив"], platforms: ["PC", "PlayStation", "Xbox", "Switch"] },
  { id: 504230, slug: "celeste", name: "Celeste", released: "2018-01-25", backgroundImage: steam(504230), rating: 4.4, genres: ["Платформер", "Инди"], platforms: ["PC", "PlayStation", "Xbox", "Switch"] },
  { id: 413150, slug: "stardew-valley", name: "Stardew Valley", released: "2016-02-26", backgroundImage: steam(413150), rating: 4.5, genres: ["Симулятор", "Инди"], platforms: ["PC", "PlayStation", "Xbox", "Switch"] },
  { id: 814380, slug: "sekiro", name: "Sekiro: Shadows Die Twice", released: "2019-03-22", backgroundImage: steam(814380), rating: 4.5, genres: ["Экшен", "Souls-like"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 620, slug: "portal-2", name: "Portal 2", released: "2011-04-19", backgroundImage: steam(620), rating: 4.7, genres: ["Головоломка", "Экшен"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 379720, slug: "doom-2016", name: "DOOM", released: "2016-05-13", backgroundImage: steam(379720), rating: 4.4, genres: ["Шутер", "Экшен"], platforms: ["PC", "PlayStation", "Xbox"] },
  { id: 268910, slug: "cuphead", name: "Cuphead", released: "2017-09-29", backgroundImage: steam(268910), rating: 4.4, genres: ["Платформер", "Инди"], platforms: ["PC", "PlayStation", "Xbox", "Switch"] },
  { id: 220, slug: "half-life-2", name: "Half-Life 2", released: "2004-11-16", backgroundImage: steam(220), rating: 4.6, genres: ["Шутер", "Экшен"], platforms: ["PC"] },
];

const FALLBACK_DESCRIPTIONS: Record<number, string> = {
  292030:
    "Сюжетная RPG в огромном открытом мире: Геральт из Ривии ищет Цири, попутно охотясь на чудовищ. Эталон атмосферы и повествования.",
  1245620:
    "Souls-like в открытом мире Междуземья, созданном при участии Джорджа Р. Р. Мартина. Свобода исследования и бескомпромиссная сложность.",
  1086940:
    "Глубокая ролевая игра по правилам D&D с пошаговыми боями, реактивным сюжетом и невероятной свободой выбора.",
  1145360:
    "Роглайт-экшен про побег из подземного царства. Динамичные бои, стильная графика и живые диалоги богов Олимпа.",
};
