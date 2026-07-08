type LogoProps = {
  size?: number;
  withText?: boolean;
  className?: string;
};

/** Логотип pressstart: неоновая «play»-марка + вордмарк с мигающим курсором. */
export function Logo({ size = 34, withText = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withText && (
        <span className="font-display text-lg font-bold tracking-tight">
          press
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            start
          </span>
        </span>
      )}
    </span>
  );
}

/** Только SVG-иконка (для компактных мест). */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-xl"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-xl accent-gradient opacity-90"
        style={{ boxShadow: "0 0 18px -2px rgb(var(--accent) / 0.75)" }}
      />
      <svg
        viewBox="0 0 32 32"
        width={size * 0.62}
        height={size * 0.62}
        className="relative"
        fill="none"
      >
        <path
          d="M12 8.5l11 7.5-11 7.5z"
          fill="rgb(var(--accent-fg))"
        />
      </svg>
    </span>
  );
}
