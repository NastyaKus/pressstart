import { ImageResponse } from "next/og";
import { getGame } from "@/lib/rawg";
import { loadOgFont } from "@/lib/og-font";

export const runtime = "nodejs";
export const alt = "pressstart — игра";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const game = await getGame(Number(params.id)).catch(() => null);
  const name = game?.name ?? "pressstart";
  const cover = game?.backgroundImage ?? null;
  const rating = game?.rating ? game.rating.toFixed(1) : null;
  const font = await loadOgFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#05080e",
        }}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(5,8,14,0.95) 0%, rgba(5,8,14,0.55) 55%, rgba(5,8,14,0.35) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
                alignItems: "center",
                justifyContent: "center",
                color: "#05080e",
                fontSize: "26px",
              }}
            >
              ▶
            </div>
            <div style={{ display: "flex", fontSize: "30px", color: "#e7f0fa" }}>
              press<span style={{ color: "#22d3ee" }}>start</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "24px",
              fontSize: "68px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            {name}
          </div>
          {rating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "6px 18px",
                  borderRadius: "999px",
                  background: "rgba(34,211,238,0.15)",
                  border: "2px solid #22d3ee",
                  color: "#22d3ee",
                  fontSize: "32px",
                  fontWeight: 700,
                }}
              >
                {rating}
              </div>
              <div style={{ display: "flex", fontSize: "26px", color: "#8a9ab0" }}>
                / 5 рейтинг
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Inter", data: font, weight: 700 as const, style: "normal" as const }]
        : [],
    }
  );
}
