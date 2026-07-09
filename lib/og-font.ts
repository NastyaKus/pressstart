/**
 * Грузит TTF Inter (Bold, с кириллицей) со стабильного CDN для next/og.
 * Возвращает null при неудаче — тогда OG рендерит дефолтным шрифтом (латиница).
 * Кешируется в память процесса, чтобы не тянуть на каждый запрос.
 */
let cached: ArrayBuffer | null | undefined;

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter/Inter_700Bold.ttf";

export async function loadOgFont(): Promise<ArrayBuffer | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(FONT_URL, { next: { revalidate: 86400 } });
    cached = res.ok ? await res.arrayBuffer() : null;
  } catch {
    cached = null;
  }
  return cached;
}
