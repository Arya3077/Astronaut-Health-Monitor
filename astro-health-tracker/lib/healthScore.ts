import {
  Parameter,
  PARAMETERS,
  THRESHOLDS,
  HealthReading,
  HealthStatus,
} from "./telemetry";

// Deterministic, weighted UX/demo metric — NOT a medical assessment.
//
// Piecewise model per parameter:
//   inside the nominal band            -> 100
//   between band edge and critical edge -> 100 down to 50
//   beyond the critical edge           -> 50 down to 0 at the bound

const WEIGHTS: Record<Parameter, number> = {
  spo2: 0.3,
  heartRate: 0.25,
  temperature: 0.2,
  sleepHours: 0.125,
  exerciseMinutes: 0.125,
};

function parameterScore(parameter: Parameter, value: number): number {
  const th = THRESHOLDS[parameter];
  if (value >= th.normalLo && value <= th.normalHi) return 100;

  if (value < th.normalLo) {
    if (value >= th.criticalLo) {
      // Warning zone: 100 -> 50.
      return (
        100 -
        (50 * (th.normalLo - value)) / Math.max(1e-9, th.normalLo - th.criticalLo)
      );
    }
    // Critical zone: 50 -> 0 at the lower bound.
    return Math.max(
      0,
      (50 * (value - th.boundLo)) / Math.max(1e-9, th.criticalLo - th.boundLo),
    );
  }

  if (value <= th.criticalHi) {
    return (
      100 -
      (50 * (value - th.normalHi)) / Math.max(1e-9, th.criticalHi - th.normalHi)
    );
  }
  return Math.max(
    0,
    (50 * (th.boundHi - value)) / Math.max(1e-9, th.boundHi - th.criticalHi),
  );
}

export interface HealthScore {
  /** Overall 0–100 score. */
  score: number;
  /** Deterministic per-parameter sub-scores (0–100). */
  parameters: Record<Parameter, number>;
  /** Weighting used, for transparency in the UI. */
  weights: Record<Parameter, number>;
}

export function getHealthScore(reading: HealthReading): HealthScore {
  const parameters = {} as Record<Parameter, number>;
  let total = 0;
  for (const p of PARAMETERS) {
    const s = Math.min(100, Math.max(0, Math.round(parameterScore(p, reading[p]))));
    parameters[p] = s;
    total += s * WEIGHTS[p];
  }
  return {
    score: Math.min(100, Math.max(0, Math.round(total))),
    parameters,
    weights: { ...WEIGHTS },
  };
}

// Centralized mission-level status thresholds. A Stage 4 CRITICAL on any
// parameter always forces CRITICAL; otherwise the score bands decide.
export const MISSION_STATUS_THRESHOLDS = {
  warningBelow: 85,
  criticalBelow: 55,
} as const;

export function getMissionStatus(
  score: number,
  overallStatus: HealthStatus,
): HealthStatus {
  if (overallStatus === "CRITICAL") return "CRITICAL";
  if (score < MISSION_STATUS_THRESHOLDS.criticalBelow) return "CRITICAL";
  if (score < MISSION_STATUS_THRESHOLDS.warningBelow) return "WARNING";
  return "NORMAL";
}
