import { HealthReading, HealthStatus } from "./telemetry";

export type EventType =
  | "ROUTINE_CHECK"
  | "EXERCISE_COMPLETED"
  | "HR_STABILIZED"
  | "OXYGEN_CHANGED"
  | "TEMPERATURE_CHANGED"
  | "ALERT_DETECTED"
  | "ALERT_RESOLVED"
  | "MISSION_STATUS";

export type EventSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface HealthEvent {
  id: string;
  type: EventType;
  t: number;
  severity: EventSeverity;
  title: string;
  description: string;
}

export const ROUTINE_CHECK_INTERVAL_SECONDS = 60;
export const EXERCISE_MILESTONE_MINUTES = 15;

/** Emitted only when the Stage 5 mission status actually changes. */
export function missionStatusEvent(
  t: number,
  previous: HealthStatus | null,
  next: HealthStatus,
): HealthEvent | null {
  if (previous === null || previous === next) return null;
  return {
    id: `evt_${t}_mission`,
    type: "MISSION_STATUS",
    t,
    severity: next === "CRITICAL" ? "CRITICAL" : next === "WARNING" ? "WARNING" : "INFO",
    title: "Mission health status changed",
    description: `Mission status moved from ${previous} to ${next} (simulated).`,
  };
}

/**
 * Concise plausible mission history shown on first load. Deterministic;
 * timestamps are relative to the simulated mission clock start.
 */
export function seedEvents(startT: number): HealthEvent[] {
  const seed: Array<[number, EventType, EventSeverity, string, string]> = [
    [4 * 3600 + 12 * 60, "ROUTINE_CHECK", "INFO", "Routine health check", "Scheduled wellness sweep completed (simulated)."],
    [3 * 3600 + 40 * 60, "EXERCISE_COMPLETED", "INFO", "Exercise session completed", "Resistance training block · 32 min (simulated)."],
    [2 * 3600 + 15 * 60, "OXYGEN_CHANGED", "WARNING", "Oxygen level changed", "Simulated SpO₂ entered the WARNING band."],
    [2 * 3600 - 25 * 60, "OXYGEN_CHANGED", "INFO", "Oxygen recovered", "Simulated SpO₂ returned to the NORMAL band."],
    [3600 + 5 * 60, "HR_STABILIZED", "INFO", "Heart rate stabilized", "Heart rate returned to its nominal band (simulated)."],
    [42 * 60, "ROUTINE_CHECK", "INFO", "Routine health check", "Scheduled wellness sweep completed (simulated)."],
    [18 * 60, "EXERCISE_COMPLETED", "INFO", "Exercise session completed", "Treadmill interval block · 28 min (simulated)."],
    [5 * 60, "MISSION_STATUS", "INFO", "Mission health status changed", "Mission status holds at NORMAL (simulated)."],
  ];
  return seed
    .map(([offset, type, severity, title, description], i) => ({
      id: `seed_${i}`,
      type,
      severity,
      title,
      description,
      t: startT - offset,
    }))
    .sort((a, b) => b.t - a.t);
}

function exerciseMilestone(minutes: number): number {
  return Math.floor(minutes / EXERCISE_MILESTONE_MINUTES);
}

/**
 * Pure event generator: compares previous vs next reading/status and emits
 * events only when entering a new state or crossing a meaningful boundary.
 * This prevents duplicate alert events on every tick of a steady condition.
 */
export function generateEvents(
  previous: HealthReading | null,
  next: HealthReading,
  previousOverall: HealthStatus | null,
  nextOverall: HealthStatus,
  previousParamStatuses: Record<string, HealthStatus> | null,
  nextParamStatuses: Record<string, HealthStatus>,
  lastRoutineCheckT: number | null,
): HealthEvent[] {
  const events: HealthEvent[] = [];
  let seq = 0;
  const id = () => `evt_${next.t}_${seq++}`;

  // Overall status escalations -------------------------------------------
  if (previousOverall !== null && nextOverall !== previousOverall) {
    if (nextOverall === "CRITICAL") {
      events.push({
        id: id(),
        type: "ALERT_DETECTED",
        t: next.t,
        severity: "CRITICAL",
        title: "Critical alert detected",
        description:
          "At least one monitored parameter crossed its critical threshold (simulated).",
      });
    } else if (nextOverall === "WARNING" && previousOverall === "NORMAL") {
      events.push({
        id: id(),
        type: "ALERT_DETECTED",
        t: next.t,
        severity: "WARNING",
        title: "Warning alert detected",
        description:
          "A monitored parameter left its nominal band (simulated).",
      });
    } else if (nextOverall === "NORMAL") {
      events.push({
        id: id(),
        type: "ALERT_RESOLVED",
        t: next.t,
        severity: "INFO",
        title: previousOverall === "CRITICAL"
          ? "Critical alert resolved"
          : "Warning cleared",
        description:
          "All monitored parameters returned to their nominal bands (simulated).",
      });
    }
  }

  // Parameter-level transitions ------------------------------------------
  if (previousParamStatuses !== null) {
    const prevHr = previousParamStatuses.heartRate;
    const nextHr = nextParamStatuses.heartRate;
    if ((prevHr === "WARNING" || prevHr === "CRITICAL") && nextHr === "NORMAL") {
      events.push({
        id: id(),
        type: "HR_STABILIZED",
        t: next.t,
        severity: "INFO",
        title: "Heart rate stabilized",
        description: "Heart rate returned to its nominal band (simulated).",
      });
    }

    const prevO2 = previousParamStatuses.spo2;
    const nextO2 = nextParamStatuses.spo2;
    if (prevO2 !== nextO2) {
      events.push({
        id: id(),
        type: "OXYGEN_CHANGED",
        t: next.t,
        severity: nextO2 === "NORMAL" ? "INFO" : nextO2 === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: "Oxygen level changed",
        description: `Simulated SpO₂ moved from ${prevO2} to ${nextO2} band.`,
      });
    }

    const prevTemp = previousParamStatuses.temperature;
    const nextTemp = nextParamStatuses.temperature;
    if (prevTemp !== nextTemp) {
      events.push({
        id: id(),
        type: "TEMPERATURE_CHANGED",
        t: next.t,
        severity: nextTemp === "NORMAL" ? "INFO" : nextTemp === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: "Temperature changed",
        description: `Simulated temperature moved from ${prevTemp} to ${nextTemp} band.`,
      });
    }
  }

  // Exercise milestone ----------------------------------------------------
  if (previous !== null) {
    const prevM = exerciseMilestone(previous.exerciseMinutes);
    const nextM = exerciseMilestone(next.exerciseMinutes);
    if (nextM > prevM && nextM > 0) {
      events.push({
        id: id(),
        type: "EXERCISE_COMPLETED",
        t: next.t,
        severity: "INFO",
        title: "Exercise block logged",
        description: `Cumulative exercise reached ~${nextM * EXERCISE_MILESTONE_MINUTES} minutes (simulated).`,
      });
    }
  }

  // Routine check heartbeat ------------------------------------------------
  if (
    lastRoutineCheckT === null ||
    next.t - lastRoutineCheckT >= ROUTINE_CHECK_INTERVAL_SECONDS
  ) {
    events.push({
      id: id(),
      type: "ROUTINE_CHECK",
      t: next.t,
      severity: "INFO",
      title: "Routine health check",
      description: "Scheduled wellness sweep completed (simulated).",
    });
  }

  return events;
}
