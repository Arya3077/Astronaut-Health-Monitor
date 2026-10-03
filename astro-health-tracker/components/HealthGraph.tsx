"use client";

import { useState } from "react";
import {
  HealthReading,
  Parameter,
  THRESHOLDS,
  getParameterStatus,
} from "@/lib/telemetry";
import { formatClock } from "@/lib/time";

const META: Record<Parameter, { label: string; unit: string; precision: number }> = {
  heartRate: { label: "HEART RATE", unit: "BPM", precision: 0 },
  spo2: { label: "OXYGEN", unit: "%", precision: 0 },
  temperature: { label: "TEMPERATURE", unit: "°C", precision: 1 },
  sleepHours: { label: "SLEEP", unit: "H", precision: 1 },
  exerciseMinutes: { label: "EXERCISE", unit: "MIN", precision: 0 },
};

const ORDER: Parameter[] = [
  "heartRate",
  "spo2",
  "temperature",
  "sleepHours",
  "exerciseMinutes",
];

const W = 600;
const H = 200;
const PAD = { l: 36, r: 10, t: 12, b: 22 };

const STATUS_FILL: Record<string, string> = {
  WARNING: "var(--color-warning)",
  CRITICAL: "var(--color-critical)",
  NORMAL: "var(--color-accent)",
};

export default function HealthGraph({ history }: { history: HealthReading[] }) {
  const [param, setParam] = useState<Parameter>("heartRate");
  const th = THRESHOLDS[param];
  const meta = META[param];

  const t0 = history.length > 0 ? history[0].t : 0;
  const t1 = history.length > 1 ? history[history.length - 1].t : t0 + 1;

  const x = (t: number) =>
    PAD.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    PAD.t +
    (1 - (v - th.boundLo) / (th.boundHi - th.boundLo)) * (H - PAD.t - PAD.b);

  const points = history.map((r) => `${x(r.t).toFixed(1)},${y(r[param]).toFixed(1)}`);

  // Status-transition markers for this parameter.
  const markers: Array<{ x: number; y: number; status: string }> = [];
  for (let i = 1; i < history.length; i++) {
    const prev = getParameterStatus(param, history[i - 1][param]);
    const cur = getParameterStatus(param, history[i][param]);
    if (prev !== cur) {
      markers.push({ x: x(history[i].t), y: y(history[i][param]), status: cur });
    }
  }

  const current = history.length > 0 ? history[history.length - 1] : null;
  const ticks = history.filter((_, i) => i % 30 === 0);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setParam(p)}
            className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] ${
              p === param
                ? "border-accent-dim bg-panel-raised text-accent"
                : "border-border text-faint"
            }`}
          >
            {META[p].label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted">
          {meta.label} · CURRENT
        </p>
        <p className="font-mono text-sm text-foreground">
          {current ? current[param].toFixed(meta.precision) : "—"}
          <span className="ml-1 text-[10px] text-muted">{meta.unit}</span>
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`${meta.label} history`}
      >
        {/* normal band */}
        <rect
          x={PAD.l}
          y={y(th.normalHi)}
          width={W - PAD.l - PAD.r}
          height={Math.max(0, y(th.normalLo) - y(th.normalHi))}
          fill="var(--color-accent)"
          opacity="0.05"
        />
        {/* threshold lines */}
        {[th.normalLo, th.normalHi].map((v) => (
          <line
            key={`n${v}`}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--color-border-strong)"
            strokeDasharray="3 4"
          />
        ))}
        {th.criticalLo > th.boundLo && (
          <line x1={PAD.l} x2={W - PAD.r} y1={y(th.criticalLo)} y2={y(th.criticalLo)} stroke="var(--color-critical)" strokeOpacity="0.5" strokeDasharray="3 4" />
        )}
        {th.criticalHi < th.boundHi && (
          <line x1={PAD.l} x2={W - PAD.r} y1={y(th.criticalHi)} y2={y(th.criticalHi)} stroke="var(--color-critical)" strokeOpacity="0.5" strokeDasharray="3 4" />
        )}
        {/* axis labels */}
        <text x={PAD.l - 6} y={y(th.boundHi) + 3} textAnchor="end" fontSize="9" fill="var(--color-faint)" fontFamily="monospace">
          {th.boundHi}
        </text>
        <text x={PAD.l - 6} y={y(th.boundLo) + 3} textAnchor="end" fontSize="9" fill="var(--color-faint)" fontFamily="monospace">
          {th.boundLo}
        </text>
        {ticks.map((r) => (
          <text key={r.t} x={x(r.t)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--color-faint)" fontFamily="monospace">
            {formatClock(r.t).slice(0, 5)}
          </text>
        ))}
        {/* history line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
        />
        {/* transition markers */}
        {markers.map((m, i) => (
          <circle
            key={i}
            cx={m.x}
            cy={m.y}
            r="3.5"
            fill={STATUS_FILL[m.status]}
            stroke="var(--color-panel)"
            strokeWidth="1.5"
          />
        ))}
        {current && (
          <circle cx={x(current.t)} cy={y(current[param])} r="3" fill="var(--color-accent)" />
        )}
      </svg>

      <p className="mt-1 font-mono text-[9px] tracking-[0.16em] text-faint">
        DASHED BAND EDGES = STAGE 4 NOMINAL RANGE · RED DASHED = CRITICAL EDGE ·
        MARKERS = PARAMETER STATUS TRANSITIONS · HISTORY {history.length} SAMPLES
      </p>
    </div>
  );
}
