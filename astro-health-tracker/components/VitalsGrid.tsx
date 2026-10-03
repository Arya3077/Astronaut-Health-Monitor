import {
  HealthReading,
  HealthStatus,
  Parameter,
} from "@/lib/telemetry";

const NOTE_STYLE: Record<HealthStatus, string> = {
  NORMAL: "text-accent",
  WARNING: "text-warning",
  CRITICAL: "text-critical",
};

function Vital({
  label,
  value,
  unit,
  status,
  context,
}: {
  label: string;
  value: string;
  unit: string;
  status: HealthStatus;
  context: string;
}) {
  return (
    <div className="min-w-0 rounded-sm border border-border bg-panel px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.16em] text-muted">
          {label}
        </span>
        <span
          className={`font-mono text-[10px] tracking-[0.16em] ${NOTE_STYLE[status]}`}
        >
          {status}
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl leading-none text-foreground">
        {value}
        <span className="ml-1.5 text-xs text-muted">{unit}</span>
      </p>
      <p className="mt-1.5 font-mono text-[9px] tracking-[0.18em] text-faint">
        {context}
      </p>
    </div>
  );
}

export default function VitalsGrid({
  reading,
  statuses,
  className = "",
}: {
  reading: HealthReading;
  statuses: Record<Parameter, HealthStatus>;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5 ${className}`}
    >
      <Vital
        label="HEART RATE"
        value={reading.heartRate.toFixed(0)}
        unit="BPM"
        status={statuses.heartRate}
        context="LIVE"
      />
      <Vital
        label="OXYGEN"
        value={reading.spo2.toFixed(0)}
        unit="%"
        status={statuses.spo2}
        context="LIVE"
      />
      <Vital
        label="TEMPERATURE"
        value={reading.temperature.toFixed(1)}
        unit="°C"
        status={statuses.temperature}
        context="CORE"
      />
      <Vital
        label="SLEEP"
        value={reading.sleepHours.toFixed(1)}
        unit="H"
        status={statuses.sleepHours}
        context="LAST CYCLE"
      />
      <Vital
        label="EXERCISE"
        value={reading.exerciseMinutes.toFixed(0)}
        unit="MIN"
        status={statuses.exerciseMinutes}
        context="TODAY"
      />
    </div>
  );
}
