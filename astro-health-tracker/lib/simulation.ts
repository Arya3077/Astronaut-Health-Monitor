"use client";

// Simulation orchestrator. Pure state transitions live in stepSimulation();
// the React hook is a thin wrapper that just drives ticks on an interval.

import { useEffect, useState } from "react";
import {
  Alert,
  HealthReading,
  HealthStatus,
  HISTORY_LIMIT,
  PARAMETERS,
  Parameter,
  TICK_SECONDS,
  buildAlert,
  getOverallStatus,
  getParameterStatuses,
  nextReading,
  nominalReading,
} from "./telemetry";
import {
  HealthScore,
  getHealthScore,
  getMissionStatus,
} from "./healthScore";
import {
  HealthEvent,
  generateEvents,
  missionStatusEvent,
  seedEvents,
} from "./events";
import { MISSION_START_T } from "./time";

export type Scenario = "NOMINAL" | "CRITICAL_DEMO" | "WARNING_DEMO" | "RECOVERING";

export interface SimulationState {
  t: number;
  reading: HealthReading;
  previousReading: HealthReading | null;
  history: HealthReading[];
  statuses: Record<Parameter, HealthStatus>;
  overallStatus: HealthStatus;
  score: HealthScore;
  missionStatus: HealthStatus;
  events: HealthEvent[];
  alerts: Alert[];
  running: boolean;
  scenario: Scenario;
  /** Index into the deterministic scenario scripts below. */
  planIndex: number;
  lastRoutineCheckT: number | null;
  alertSeq: number;
}

/** Deterministic SpO₂ descent for judging: ~6 ticks to CRITICAL. */
const CRITICAL_SPO2_PLAN = [97, 95, 93, 91, 89, 88];

/** Deterministic HR elevation: WARNING without immediately hitting CRITICAL. */
const WARNING_HR_PLAN = [72, 86, 98, 106, 112];

const EVENT_HISTORY_LIMIT = 50;

export function initialState(): SimulationState {
  const reading = nominalReading(MISSION_START_T);
  const statuses = getParameterStatuses(reading);
  const overall = getOverallStatus(reading);
  const score = getHealthScore(reading);
  return {
    t: reading.t,
    reading,
    previousReading: null,
    history: Array.from({ length: 30 }, (_, i) =>
      nominalReading(reading.t - (29 - i) * 2),
    ),
    statuses,
    overallStatus: overall,
    score,
    missionStatus: getMissionStatus(score.score, overall),
    events: seedEvents(reading.t),
    alerts: [],
    running: true,
    scenario: "NOMINAL",
    planIndex: 0,
    lastRoutineCheckT: null,
    alertSeq: 0,
  };
}

function scriptedReading(state: SimulationState, rand: () => number): HealthReading {
  const base = nextReading(state.reading, rand);
  if (state.scenario === "CRITICAL_DEMO") {
    const idx = Math.min(state.planIndex, CRITICAL_SPO2_PLAN.length - 1);
    return { ...base, spo2: CRITICAL_SPO2_PLAN[idx] };
  }
  if (state.scenario === "WARNING_DEMO") {
    const idx = Math.min(state.planIndex, WARNING_HR_PLAN.length - 1);
    return { ...base, heartRate: WARNING_HR_PLAN[idx] };
  }
  return base;
}

function recoveringReading(state: SimulationState, rand: () => number): HealthReading {
  const nominal = nominalReading(state.t + TICK_SECONDS);
  const prev = state.reading;
  const pull = (current: number, target: number, noise: number) =>
    current + (target - current) * 0.3 + (rand() * 2 - 1) * noise;
  return {
    t: prev.t + TICK_SECONDS,
    heartRate: Math.min(160, Math.max(30, pull(prev.heartRate, nominal.heartRate, 1))),
    spo2: Math.min(100, Math.max(80, pull(prev.spo2, nominal.spo2, 0.1))),
    temperature: Math.min(41, Math.max(34, pull(prev.temperature, nominal.temperature, 0.05))),
    sleepHours: Math.min(14, Math.max(0, pull(prev.sleepHours, nominal.sleepHours, 0.05))),
    exerciseMinutes: prev.exerciseMinutes + (rand() < 0.3 ? rand() * 2 : 0),
  };
}

export function stepSimulation(
  state: SimulationState,
  rand: () => number,
): SimulationState {
  const reading =
    state.scenario === "RECOVERING"
      ? recoveringReading(state, rand)
      : state.scenario === "NOMINAL"
        ? nextReading(state.reading, rand)
        : scriptedReading(state, rand);

  const statuses = getParameterStatuses(reading);
  const overallStatus = getOverallStatus(reading);
  const score = getHealthScore(reading);
  const history = [...state.history, reading].slice(-HISTORY_LIMIT);

  const newEvents = generateEvents(
    state.reading,
    reading,
    state.overallStatus,
    overallStatus,
    state.statuses,
    statuses,
    state.lastRoutineCheckT,
  );
  const lastRoutineCheckT = newEvents.some((e) => e.type === "ROUTINE_CHECK")
    ? reading.t
    : state.lastRoutineCheckT;

  const missionStatus = getMissionStatus(score.score, overallStatus);
  const missionEvent = missionStatusEvent(
    reading.t,
    state.missionStatus,
    missionStatus,
  );
  if (missionEvent) newEvents.push(missionEvent);

  // Alert lifecycle per parameter: create / update / clear ------------------
  let alertSeq = state.alertSeq;
  const alerts: Alert[] = [];
  for (const p of PARAMETERS) {
    if (statuses[p] === "NORMAL") continue;
    const previous = state.alerts.find((a) => a.parameter === p);
    const same =
      previous !== undefined && previous.severity === statuses[p];
    alerts.push(
      buildAlert(
        p,
        reading,
        statuses[p],
        history,
        same ? previous.acknowledged : false,
        same ? previous.id : `alert_${++alertSeq}`,
      ),
    );
  }

  // Scenario bookkeeping ---------------------------------------------------
  let scenario = state.scenario;
  let planIndex = state.planIndex + 1;
  if (scenario === "RECOVERING") {
    const nominal = getOverallStatus(reading) === "NORMAL";
    if (nominal) {
      scenario = "NOMINAL";
      planIndex = 0;
    }
  }
  if (scenario === "CRITICAL_DEMO" && planIndex >= CRITICAL_SPO2_PLAN.length) {
    // Hold the final scripted value so the critical state persists.
    planIndex = CRITICAL_SPO2_PLAN.length - 1;
  }
  if (scenario === "WARNING_DEMO" && planIndex >= WARNING_HR_PLAN.length) {
    planIndex = WARNING_HR_PLAN.length - 1;
  }

  return {
    ...state,
    t: reading.t,
    previousReading: state.reading,
    reading,
    history,
    statuses,
    overallStatus,
    score,
    missionStatus,
    events: [...state.events, ...newEvents].slice(-EVENT_HISTORY_LIMIT),
    alerts,
    scenario,
    planIndex,
    lastRoutineCheckT,
    alertSeq,
  };
}

// ---------------------------------------------------------------------------
// React hook — thin interval driver; no simulation math lives here.
// ---------------------------------------------------------------------------

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(initialState);

  useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => {
      setState((s) => (s.running ? stepSimulation(s, Math.random) : s));
    }, 2000);
    return () => window.clearInterval(id);
  }, [state.running]);

  return {
    state,
    triggerCriticalDemo: () =>
      setState((s) => ({ ...s, scenario: "CRITICAL_DEMO", planIndex: 0 })),
    triggerWarningDemo: () =>
      setState((s) => ({ ...s, scenario: "WARNING_DEMO", planIndex: 0 })),
    resumeNominal: () =>
      setState((s) => ({ ...s, scenario: "RECOVERING", planIndex: 0 })),
    pause: () => setState((s) => ({ ...s, running: false })),
    resume: () => setState((s) => ({ ...s, running: true })),
    acknowledgeAlert: (id: string) =>
      setState((s) => ({
        ...s,
        alerts: s.alerts.map((a) =>
          a.id === id ? { ...a, acknowledged: true } : a,
        ),
      })),
  };
}
