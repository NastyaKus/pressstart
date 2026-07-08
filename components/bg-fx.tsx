/**
 * Фиксированный декоративный фон: неоновые блобы + сетка + сканлайны.
 * Чисто визуальный слой, не перехватывает клики. Уважает reduced-motion (через CSS).
 */
export function BgFx() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Плавающие неоновые блобы */}
      <div
        className="absolute -left-32 -top-32 h-[38rem] w-[38rem] rounded-full opacity-40 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent) / 0.55), transparent 70%)",
          animation: "drift 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-40 top-1/3 h-[34rem] w-[34rem] rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent-2) / 0.5), transparent 70%)",
          animation: "drift 28s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full opacity-20 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent) / 0.45), transparent 70%)",
          animation: "drift 25s ease-in-out infinite",
        }}
      />

      {/* Тонкая сетка */}
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--border)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
        }}
      />

      {/* Едва заметные сканлайны */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgb(var(--fg)) 0px, rgb(var(--fg)) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}
