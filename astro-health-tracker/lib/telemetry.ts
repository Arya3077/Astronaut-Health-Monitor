// Central telemetry domain model for the ASTRAL simulation.
// All threshold numbers live here — nowhere else.

export type Parameter =
  | "heartRate"
  | "spo2"
  | "temperature"
  | "sleepHours"
  | "exerciseMinutes";

export type Severity = "NORMAL" | "WARNING" | "CRITICAL";

export type HealthStatus = Severity;

export interface HealthReading {
  /** Mission elapsed time in seconds. */
  t: number;
  heartRate: number;
  spo2: number;
  temperature: number;
  sleepHours: number;
  exerciseMinutes: number;
}

export const PARAMETERS: Parameter[] = [
  "heartRate",
  "spo2",
  "temperature",
  "sleepHours",
  "exerciseMinutes",
];

/**
 * Nominal band, warning edge (== normal band edge) and critical edge
 * for each parameter, plus the outer bounds used to clamp simulation.
 */
export interface ParameterThresholds {
  normalLo: number;
  normalHi: number;
  criticalLo: number;
  criticalHi: number;
  boundLo: number;
  boundHi: number;
  nominal: number;
}

export const THRESHOLDS: Record<Parameter, ParameterThresholds> = {
  spo2: {
    normalLo: 94,
    normalHi: 100,
    criticalLo: 90,
    criticalHi: 101, // SpO2 cannot exceed 100; no upper critical side.
    boundLo: 80,
    boundHi: 100,
    nominal: 97.5,
  },
  heartRate: {
    normalLo: 50,
    normalHi: 100,
    criticalLo: 40,
    criticalHi: 130,
    boundLo: 30,
    boundHi: 160,
    nominal: 68,
  },
  temperature: {
    normalLo: 35.8,
    normalHi: 37.8,
    criticalLo: 35.5,
    criticalHi: 38.5,
    boundLo: 34,
    boundHi: 41,
    nominal: 36.6,
  },
  sleepHours: {
    normalLo: 6.5,
    normalHi: 9.5,
    criticalLo: 5,
    criticalHi: 12,
    boundLo: 0,
    boundHi: 14,
    nominal: 7.4,
  },
  exerciseMinutes: {
    normalLo: 20,
    normalHi: 150,
    criticalLo: 5,
    criticalHi: 180,
    boundLo: 0,
    boundHi: 240,
    nominal: 42,
  },
};

export function getParameterStatus(
  parameter: Parameter,
  value: number,
): HealthStatus {
  const th = THRESHOLDS[parameter];
  if (value < th.criticalLo || value > th.criticalHi) return "CRITICAL";
  if (value < th.normalLo || value > th.normalHi) return "WARNING";
  return "NORMAL";
}

export function getParameterStatuses(
  reading: HealthReading,
): Record<Parameter, HealthStatus> {
  return {
    heartRate: getParameterStatus("heartRate", reading.heartRate),
    spo2: getParameterStatus("spo2", reading.spo2),
    temperature: getParameterStatus("temperature", reading.temperature),
    sleepHours: getParameterStatus("sleepHours", reading.sleepHours),
    exerciseMinutes: getParameterStatus(
      "exerciseMinutes",
      reading.exerciseMinutes,
    ),
  };
}

const SEVERITY_RANK: Record<Severity, number> = {
  NORMAL: 0,
  WARNING: 1,
  CRITICAL: 2,
};

export function worstSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Overall status is the most severe status among the monitored parameters. */
export function getOverallStatus(
  reading: HealthReading,
): HealthStatus {
  const statuses = getParameterStatuses(reading);
  return PARAMETERS.reduce<HealthStatus>(
    (acc, p) => worstSeverity(acc, statuses[p]),
    "NORMAL",
  );
}

// ---------------------------------------------------------------------------
// Simulation primitives
// ---------------------------------------------------------------------------

export const TICK_SECONDS = 2;
export const HISTORY_LIMIT = 120;

/** Per-tick volatility for the mean-reverting random walk. */
const VOLATILITY: Record<Parameter, number> = {
  heartRate: 1.6,
  spo2: 0.35,
  temperature: 0.06,
  sleepHours: 0.05,
  exerciseMinutes: 0,
};

const MEAN_REVERSION: Record<Parameter, number> = {
  heartRate: 0.06,
  spo2: 0.08,
  temperature: 0.06,
  sleepHours: 0.02,
  exerciseMinutes: 0,
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Advances one parameter via a mean-reverting random walk.
 * Sleep drifts slowly around its nominal value; exercise accumulates
 * slowly and is probabilistic. Deterministic for a given rand source.
 */
export function stepParameter(
  parameter: Parameter,
  previous: number,
  rand: () => number,
): number {
  const th = THRESHOLDS[parameter];

  if (parameter === "exerciseMinutes") {
    // Exercise accumulates in short blocks; no downward drift.
    const increment = rand() < 0.3 ? rand() * 2 : 0;
    return clamp(previous + increment, th.boundLo, th.boundHi);
  }

  const drift = (th.nominal - previous) * MEAN_REVERSION[parameter];
  const noise = (rand() * 2 - 1) * VOLATILITY[parameter];
  return clamp(previous + drift + noise, th.boundLo, th.boundHi);
}

/** Computes the next reading from a previous one. Pure given rand. */
export function nextReading(
  previous: HealthReading,
  rand: () => number,
): HealthReading {
  return {
    t: previous.t + TICK_SECONDS,
    heartRate: stepParameter("heartRate", previous.heartRate, rand),
    spo2: stepParameter("spo2", previous.spo2, rand),
    temperature: stepParameter("temperature", previous.temperature, rand),
    sleepHours: stepParameter("sleepHours", previous.sleepHours, rand),
    exerciseMinutes: stepParameter(
      "exerciseMinutes",
      previous.exerciseMinutes,
      rand,
    ),
  };
}

export function nominalReading(t: number): HealthReading {
  return {
    t,
    heartRate: 68,
    spo2: 97.5,
    temperature: 36.6,
    sleepHours: 7.4,
    exerciseMinutes: 42,
  };
}

// ---------------------------------------------------------------------------
// Alert model
// ---------------------------------------------------------------------------

export type Trend = "rising" | "falling" | "stable";

export interface Alert {
  id: string;
  parameter: Parameter;
  value: number;
  unit: string;
  threshold: number;
  thresholdLabel: string;
  severity: Severity;
  trend: Trend;
  explanation: string;
  t: number;
  acknowledged: boolean;
}

const PARAMETER_LABEL: Record<Parameter, string> = {
  heartRate: "heart rate",
  spo2: "oxygen saturation",
  temperature: "body temperature",
  sleepHours: "sleep duration",
  exerciseMinutes: "exercise duration",
};

const PARAMETER_UNIT: Record<Parameter, string> = {
  heartRate: "BPM",
  spo2: "%",
  temperature: "°C",
  sleepHours: "H",
  exerciseMinutes: "MIN",
};

const TREND_EPSILON: Record<Parameter, number> = {
  heartRate: 3,
  spo2: 0.8,
  temperature: 0.15,
  sleepHours: 0.2,
  exerciseMinutes: 4,
};

/** Trend from recent samples: compares the oldest and newest of the last few. */
export function computeTrend(
  history: HealthReading[],
  parameter: Parameter,
): Trend {
  const window = history.slice(-5).map((r) => r[parameter]);
  if (window.length < 2) return "stable";
  const delta = window[window.length - 1] - window[0];
  if (delta > TREND_EPSILON[parameter]) return "rising";
  if (delta < -TREND_EPSILON[parameter]) return "falling";
  return "stable";
}

/** Which configured critical bound the value most directly violates. */
export function breachedThreshold(
  parameter: Parameter,
  value: number,
): { threshold: number; comparison: "below" | "above" } {
  const th = THRESHOLDS[parameter];
  if (value < th.criticalLo) return { threshold: th.criticalLo, comparison: "below" };
  if (value > th.criticalHi && th.criticalHi <= th.boundHi)
    return { threshold: th.criticalHi, comparison: "above" };
  if (value < th.normalLo) return { threshold: th.normalLo, comparison: "below" };
  return { threshold: th.normalHi, comparison: "above" };
}

export function buildAlert(
  parameter: Parameter,
  reading: HealthReading,
  severity: Severity,
  history: HealthReading[],
  acknowledged: boolean,
  id: string,
): Alert {
  const value = reading[parameter];
  const { threshold, comparison } = breachedThreshold(parameter, value);
  const trend = computeTrend(history, parameter);
  const unit = PARAMETER_UNIT[parameter];
  return {
    id,
    parameter,
    value,
    unit,
    threshold,
    thresholdLabel: `${comparison === "below" ? "<" : ">"} ${threshold} ${unit}`,
    severity,
    trend,
    explanation:
      `Simulated telemetry indicates ${PARAMETER_LABEL[parameter]} is ${comparison} ` +
      `the configured ${severity === "CRITICAL" ? "critical" : "warning"} threshold ` +
      `(${threshold} ${unit}). Trend over recent samples: ${trend.toUpperCase()}.`,
    t: reading.t,
    acknowledged,
  };
}
