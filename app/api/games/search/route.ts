import { NextResponse } from "next/server";
import { getGames } from "@/lib/rawg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const { games, hasMore } = await getGames({
    q: searchParams.get("q")?.trim() ?? "",
    genre: searchParams.get("genre") ?? "",
    platform: searchParams.get("platform") ?? "",
    ordering: searchParams.get("ordering") ?? "-added",
    page,
  });
  return NextResponse.json({ games, hasMore });
}
