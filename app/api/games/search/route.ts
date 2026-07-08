import { NextResponse } from "next/server";
import { searchGames, getPopularGames } from "@/lib/rawg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const games = q ? await searchGames(q) : await getPopularGames();
  return NextResponse.json({ games });
}
