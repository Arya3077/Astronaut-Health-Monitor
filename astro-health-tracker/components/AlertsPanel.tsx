import { Alert } from "@/lib/telemetry";
import { formatMET } from "@/lib/time";

const PARAMETER_TITLE: Record<string, string> = {
  heartRate: "HEART RATE",
  spo2: "OXYGEN SATURATION",
  temperature: "BODY TEMPERATURE",
  sleepHours: "SLEEP DURATION",
  exerciseMinutes: "EXERCISE DURATION",
};

function TrendLabel({ trend }: { trend: Alert["trend"] }) {
  const arrow = trend === "rising" ? "↑" : trend === "falling" ? "↓" : "→";
  return (
    <span className="font-mono tracking-[0.18em]">
      {arrow} {trend.toUpperCase()}
    </span>
  );
}

export default function AlertsPanel({
  alerts,
  onAcknowledge,
}: {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}) {
  const sorted = [...alerts].sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "CRITICAL" ? -1 : 1;
    return b.t - a.t;
  });

  return (
    <section
      aria-label="Health alerts"
      className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6"
    >
      <div className="rounded-sm border border-border bg-panel">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted">
            ACTIVE ALERTS
          </h2>
          <span className="font-mono text-[10px] tracking-[0.2em] text-faint">
            {sorted.length} ACTIVE
          </span>
        </header>

        {sorted.length === 0 ? (
          <div className="p-4">
            <p className="font-mono text-xs tracking-[0.22em] text-accent">
              NO ACTIVE ALERTS
            </p>
            <p className="mt-1 break-words text-xs text-muted">
              ALL CREW PARAMETERS WITHIN NOMINAL RANGE
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((alert) => {
              const critical = alert.severity === "CRITICAL";
              if (critical) {
                return (
                  <li
                    key={alert.id}
                    className="border-l-2 border-critical bg-panel-raised p-5 animate-fade-in"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 font-mono text-sm tracking-[0.26em] text-critical">
                        <span className="h-2 w-2 rounded-full bg-critical animate-status-pulse" />
                        CRITICAL HEALTH EVENT
                      </p>
                      <span className="rounded-sm border border-critical px-2 py-0.5 font-mono text-[10px] tracking-[0.24em] text-critical">
                        SOS
                      </span>
                    </div>
                    <p className="mt-4 font-mono text-[11px] tracking-[0.22em] text-muted">
                      {PARAMETER_TITLE[alert.parameter]}
                    </p>
                    <p className="mt-1 font-mono text-5xl leading-none text-foreground">
                      {alert.value.toFixed(alert.unit === "°C" ? 1 : 0)}
                      <span className="ml-2 text-lg text-muted">{alert.unit}</span>
                    </p>
                    <p className="mt-3 font-mono text-[11px] tracking-[0.18em] text-muted">
                      THRESHOLD:{" "}
                      <span className="text-foreground">{alert.thresholdLabel}</span>
                    </p>
                    <p className="mt-2 break-words text-xs leading-relaxed text-muted">
                      {alert.explanation}
                    </p>
                    <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-critical">
                      <TrendLabel trend={alert.trend} />
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-faint">
                      {formatMET(alert.t)} · IMMEDIATE ATTENTION REQUIRED
                    </p>
                    <div className="mt-4">
                      {alert.acknowledged ? (
                        <span className="font-mono text-[10px] tracking-[0.22em] text-faint">
                          ACKNOWLEDGED · CONDITION MONITORED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAcknowledge(alert.id)}
                          className="rounded-sm border border-critical bg-panel px-4 py-2 font-mono text-[11px] tracking-[0.22em] text-critical hover:bg-critical/10"
                        >
                          ACKNOWLEDGE ALERT
                        </button>
                      )}
                    </div>
                  </li>
                );
              }
              return (
                <li
                  key={alert.id}
                  className={`border-l-2 p-4 animate-fade-in ${
                    alert.acknowledged ? "border-border opacity-70" : "border-warning"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p
                      className={`font-mono text-xs tracking-[0.22em] ${
                        critical ? "text-critical" : "text-warning"
                      }`}
                    >
                      {alert.severity} · {PARAMETER_TITLE[alert.parameter]}
                    </p>
                    <span className="font-mono text-[10px] tracking-[0.12em] text-faint">
                      {formatMET(alert.t)}
                    </span>
                  </div>
                  <p className="mt-2 break-words font-mono text-xl text-foreground">
                    {alert.value.toFixed(alert.unit === "°C" ? 1 : 0)}
                    <span className="ml-1.5 text-xs text-muted">{alert.unit}</span>
                  </p>
                  <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-muted">
                    THRESHOLD {alert.thresholdLabel} · TREND{" "}
                    <TrendLabel trend={alert.trend} />
                  </p>
                  <p className="mt-2 break-words text-xs leading-relaxed text-muted">
                    {alert.explanation}
                  </p>
                  <div className="mt-3">
                    {alert.acknowledged ? (
                      <span className="font-mono text-[10px] tracking-[0.22em] text-faint">
                        ACKNOWLEDGED · CONDITION MONITORED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAcknowledge(alert.id)}
                        className="rounded-sm border border-border-strong bg-panel-raised px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-foreground hover:border-accent-dim"
                      >
                        ACKNOWLEDGE
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
