import { NextResponse } from "next/server";
import { getPopularGames } from "@/lib/rawg";

export async function GET() {
  const games = await getPopularGames();
  return NextResponse.json({ games });
}
