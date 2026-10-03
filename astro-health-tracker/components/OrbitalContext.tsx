export default function OrbitalContext({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section
      aria-label="Orbital position"
      className={`min-w-0 rounded-sm border border-border bg-panel ${className}`}
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted">
          ORBITAL POSITION
        </h2>
        <span className="font-mono text-[9px] tracking-[0.2em] text-faint">
          SIMULATED
        </span>
      </header>
      <div className="flex flex-col items-center gap-3 p-4">
        <svg
          viewBox="0 0 200 140"
          className="h-28 w-full max-w-[220px]"
          role="img"
          aria-label="Earth, orbit path and spacecraft"
        >
          <ellipse
            cx="100"
            cy="70"
            rx="80"
            ry="42"
            fill="none"
            stroke="var(--color-border-strong)"
            strokeDasharray="4 5"
          />
          <circle cx="100" cy="128" r="14" fill="none" stroke="var(--color-accent)" strokeWidth="2" />
          <path d="M90 124a14 14 0 0 1 20 0" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" opacity="0.6" />
          <rect x="-4" y="-4" width="8" height="8" fill="var(--color-accent)">
            <animateMotion
              dur="18s"
              repeatCount="indefinite"
              path="M180,70 a80,42 0 1,1 -160,0 a80,42 0 1,1 160,0"
            />
          </rect>
        </svg>
        <dl className="w-full space-y-1.5 border-t border-border pt-3 text-sm">
          {[
            ["ALTITUDE", "408 km"],
            ["VELOCITY", "7.66 km/s"],
            ["ORBIT", "92 min"],
            ["NEXT GROUND CONTACT", "06:42"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[10px] tracking-[0.16em] text-muted">
                {k}
              </dt>
              <dd className="min-w-0 break-words text-right font-mono text-xs text-foreground">
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-[9px] tracking-[0.2em] text-faint">
          SIMULATED MISSION CONTEXT
        </p>
      </div>
    </section>
  );
}
