import { HealthEvent } from "@/lib/events";
import { formatMET } from "@/lib/time";

function SeverityDot({ severity }: { severity: HealthEvent["severity"] }) {
  const color =
    severity === "CRITICAL"
      ? "bg-critical"
      : severity === "WARNING"
        ? "bg-warning"
        : "bg-accent";
  return <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}

export default function Timeline({ events }: { events: HealthEvent[] }) {
  const sorted = [...events].sort((a, b) => b.t - a.t);
  return (
    <ul className="max-h-80 space-y-0 overflow-y-auto pr-1">
      {sorted.map((event) => (
        <li
          key={event.id}
          className="flex items-start gap-3 border-b border-border py-2.5 animate-fade-in last:border-0"
        >
          <SeverityDot severity={event.severity} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-xs text-foreground">{event.title}</p>
              <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-faint">
                {formatMET(event.t)}
              </span>
            </div>
            <p className="mt-0.5 break-words text-[11px] leading-relaxed text-muted">
              {event.description}
            </p>
            <p
              className={`mt-1 font-mono text-[10px] tracking-[0.18em] ${
                event.severity === "CRITICAL"
                  ? "text-critical"
                  : event.severity === "WARNING"
                    ? "text-warning"
                    : "text-accent"
              }`}
            >
              {event.severity}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
