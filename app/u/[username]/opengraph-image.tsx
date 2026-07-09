import { ImageResponse } from "next/og";
import { getProfileByUsername, getEntriesByUser } from "@/lib/profiles-server";
import { loadOgFont } from "@/lib/og-font";

export const runtime = "nodejs";
export const alt = "pressstart — профиль";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfileByUsername(params.username).catch(() => null);
  const name = profile?.display_name || profile?.username || "pressstart";
  const entries = profile ? await getEntriesByUser(profile.id) : [];
  const games = entries.length;
  const hours = Math.round(entries.reduce((s, e) => s + (e.hours_played ?? 0), 0));
  const completed = entries.filter((e) => e.status === "completed").length;
  const font = await loadOgFont();

  const stats = [
    { v: games, l: "игр" },
    { v: completed, l: "пройдено" },
    { v: hours, l: "часов" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#05080e",
          position: "relative",
        }}
      >
        {profile?.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.banner_url}
            alt=""
            width={1200}
            height={260}
            style={{ width: "1200px", height: "260px", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "1200px",
              height: "260px",
              display: "flex",
              background: "linear-gradient(120deg,#22d3ee,#3b82f6)",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 64px",
            marginTop: "-90px",
          }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              width={160}
              height={160}
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "80px",
                border: "6px solid #05080e",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "80px",
                border: "6px solid #05080e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "72px",
                color: "#05080e",
                background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
              }}
            >
              {(profile?.username ?? "p")[0].toUpperCase()}
            </div>
          )}

          <div
            style={{
              display: "flex",
              marginTop: "20px",
              fontSize: "56px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#22d3ee" }}>
            @{profile?.username ?? "pressstart"}
          </div>

          <div style={{ display: "flex", gap: "48px", marginTop: "28px" }}>
            {stats.map((s) => (
              <div
                key={s.l}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "48px",
                    fontWeight: 700,
                    color: "#e7f0fa",
                  }}
                >
                  {s.v}
                </div>
                <div style={{ display: "flex", fontSize: "22px", color: "#8a9ab0" }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "36px",
            right: "48px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "26px",
            color: "#e7f0fa",
          }}
        >
          press<span style={{ color: "#22d3ee" }}>start</span>
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
