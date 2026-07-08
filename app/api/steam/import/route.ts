import { NextResponse } from "next/server";
import { getOwnedGames, hasSteamKey } from "@/lib/steam";

export async function GET(request: Request) {
  if (!hasSteamKey) {
    return NextResponse.json(
      {
        error:
          "Импорт из Steam не настроен: добавьте STEAM_API_KEY в переменные окружения.",
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { error: "Укажите ссылку на профиль Steam или SteamID." },
      { status: 400 }
    );
  }

  try {
    const games = await getOwnedGames(id);
    return NextResponse.json({ games });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка Steam" },
      { status: 502 }
    );
  }
}
