/**
 * Импорт библиотеки Steam через официальный Steam Web API (GetOwnedGames).
 *
 * ВАЖНО: нужен ОДИН серверный ключ STEAM_API_KEY на весь сайт (ставит владелец
 * один раз). После этого ЛЮБОЙ пользователь импортит свой профиль без ключей —
 * просто вставив ссылку. Анонимного доступа к чужой библиотеке у Steam больше нет.
 *
 * Требование к пользователю: публичный профиль (Приватность → «Мои игры»).
 */

const STEAM_KEY = process.env.STEAM_API_KEY ?? "";
export const hasSteamKey = Boolean(STEAM_KEY);

export type SteamGame = {
  appid: number;
  name: string;
  hours: number; // часы = playtime_forever / 60
  cover: string; // обложка со Steam CDN
};

/** Достаём steamid64 или vanity-имя из ввода пользователя. */
function parseInput(raw: string): { steamid?: string; vanity?: string } {
  const input = raw.trim();

  const profiles = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profiles) return { steamid: profiles[1] };

  const idUrl = input.match(/steamcommunity\.com\/id\/([^/?#]+)/);
  if (idUrl) return { vanity: idUrl[1] };

  if (/^\d{17}$/.test(input)) return { steamid: input };

  return { vanity: input };
}

async function resolveSteamId(raw: string): Promise<string | null> {
  const { steamid, vanity } = parseInput(raw);
  if (steamid) return steamid;
  if (!vanity) return null;

  const url = new URL(
    "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/"
  );
  url.searchParams.set("key", STEAM_KEY);
  url.searchParams.set("vanityurl", vanity);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  return data?.response?.success === 1 ? data.response.steamid : null;
}

/** Игры пользователя со временем в часах, отсортированные по убыванию. */
export async function getOwnedGames(raw: string): Promise<SteamGame[]> {
  const steamid = await resolveSteamId(raw);
  if (!steamid)
    throw new Error(
      "Не удалось найти профиль. Проверь ссылку или SteamID."
    );

  const url = new URL(
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
  );
  url.searchParams.set("key", STEAM_KEY);
  url.searchParams.set("steamid", steamid);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const data = await res.json();
  const games = (data?.response?.games ?? []) as {
    appid: number;
    name: string;
    playtime_forever: number;
  }[];

  return games
    .map((g) => ({
      appid: g.appid,
      name: g.name,
      hours: Math.round((g.playtime_forever ?? 0) / 60),
      cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
    }))
    .sort((a, b) => b.hours - a.hours);
}
