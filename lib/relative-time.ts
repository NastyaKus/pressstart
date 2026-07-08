/** Относительное время по-русски: «только что», «5 мин назад», «2 дня назад». */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.floor((Date.now() - then) / 1000);

  if (sec < 45) return "только что";

  const units: [number, (n: number) => string][] = [
    [60, (n) => `${n} ${plural(n, "минуту", "минуты", "минут")} назад`],
    [3600, (n) => `${n} ${plural(n, "час", "часа", "часов")} назад`],
    [86400, (n) => `${n} ${plural(n, "день", "дня", "дней")} назад`],
    [2592000, (n) => `${n} ${plural(n, "неделю", "недели", "недель")} назад`],
    [31536000, (n) => `${n} ${plural(n, "месяц", "месяца", "месяцев")} назад`],
  ];

  if (sec < 3600) return units[0][1](Math.floor(sec / 60));
  if (sec < 86400) return units[1][1](Math.floor(sec / 3600));
  if (sec < 2592000) return units[2][1](Math.floor(sec / 86400));
  if (sec < 604800 * 4) return units[3][1](Math.floor(sec / 604800));
  if (sec < 31536000) return units[4][1](Math.floor(sec / 2592000));
  const years = Math.floor(sec / 31536000);
  return `${years} ${plural(years, "год", "года", "лет")} назад`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
