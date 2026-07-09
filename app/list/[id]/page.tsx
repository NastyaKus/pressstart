import Link from "next/link";
import { notFound } from "next/navigation";
import { ListMusic } from "lucide-react";
import { getListWithItems } from "@/lib/lists-server";
import { GameGrid } from "@/components/game-grid";
import { Avatar } from "@/components/avatar";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const data = await getListWithItems(params.id);
  if (!data) return { title: "Список — pressstart" };
  const desc =
    data.list.description ||
    `Подборка из ${data.items.length} игр на pressstart`;
  return {
    title: `${data.list.title} — pressstart`,
    description: desc,
    openGraph: { title: data.list.title, description: desc },
  };
}

export default async function ListPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getListWithItems(params.id);
  if (!data) notFound();
  const { list, items, author } = data;

  const games = items.map((it) => ({
    id: it.rawg_id,
    name: it.name,
    released: it.released,
    backgroundImage: it.cover_url,
    genres: it.genres ?? [],
    slug: "",
    rating: 0,
    platforms: [],
  }));

  return (
    <div className="space-y-8">
      <div className="card animate-fade-up p-6">
        <div className="mb-2 flex items-center gap-2 text-accent">
          <ListMusic className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-wide">
            Список
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {list.title}
        </h1>
        {list.description && (
          <p className="mt-2 text-muted">{list.description}</p>
        )}
        {author && (
          <Link
            href={`/u/${author.username}`}
            className="mt-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg"
          >
            <Avatar
              src={author.avatar_url}
              name={author.display_name || author.username}
              size={24}
            />
            {author.display_name || author.username}
            <span className="text-accent">@{author.username}</span>
          </Link>
        )}
        <p className="mt-3 font-mono text-xs text-muted">{items.length} игр</p>
      </div>

      {games.length > 0 ? (
        <GameGrid games={games} />
      ) : (
        <div className="card p-10 text-center text-muted">
          В списке пока нет игр.
        </div>
      )}
    </div>
  );
}
