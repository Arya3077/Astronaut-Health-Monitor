"use client";

import { useEffect } from "react";
import { useSimulation } from "@/lib/simulation";
import { playAlertTone, primeAlertAudio } from "@/lib/alertSound";
import { formatMETSeconds } from "@/lib/time";
import { HealthStatus } from "@/lib/telemetry";
import CrewProfile from "./CrewProfile";
import AstronautSilhouette from "./AstronautSilhouette";
import Timeline from "./Timeline";
import HealthGraph from "./HealthGraph";
import AlertsPanel from "./AlertsPanel";
import OrbitalContext from "./OrbitalContext";

const STATUS_TEXT: Record<HealthStatus, string> = {
  NORMAL: "text-accent",
  WARNING: "text-warning",
  CRITICAL: "text-critical",
};

function Chip({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: string;
  unit: string;
  status: HealthStatus;
}) {
  return (
    <div className="min-w-0 rounded-sm border border-border bg-panel-raised px-2.5 py-2 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent-dim hover:bg-panel-raised/90">
      <p className="font-mono text-[9px] tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-base leading-none text-foreground">
        {value}
        <span className="ml-0.5 text-[10px] text-muted">{unit}</span>
      </p>
      <p className={`mt-1 font-mono text-[9px] tracking-[0.18em] ${STATUS_TEXT[status]}`}>
        {status}
      </p>
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={`min-w-0 rounded-sm border border-border bg-panel transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_8px_30px_rgb(0_0_0_/_0.18)] ${className}`}
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted">
          {title}
        </h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const { state, acknowledgeAlert, triggerWarningDemo, triggerCriticalDemo, resumeNominal } = useSimulation();

  // Alarm is tied to an unacknowledged CRITICAL alert: it plays once, then
  // repeats on a controlled interval, and stops only when every active
  // critical alert is acknowledged or the condition recovers.
  const unackedCritical = state.alerts.some(
    (a) => a.severity === "CRITICAL" && !a.acknowledged,
  );
  useEffect(() => {
    if (!unackedCritical) return;
    playAlertTone();
    const id = window.setInterval(playAlertTone, 4000);
    return () => window.clearInterval(id);
  }, [unackedCritical]);

  // Unlock the audio context on the user's first interaction.
  useEffect(() => {
    const unlock = () => primeAlertAudio();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <div className="motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none flex min-h-screen flex-col bg-background text-foreground">
      {/* ===== Mission header ===== */}
      <header className="animate-in fade-in slide-in-from-top-2 duration-500 border-b border-border bg-panel">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-lg font-semibold leading-none tracking-[0.28em] text-foreground">
                ASTRAL
              </p>
              <p className="mt-1.5 font-mono text-[10px] tracking-[0.22em] text-muted">
                EXPEDITION 73 · DAY 127
              </p>
            </div>
            <span className="hidden h-8 w-px bg-border sm:block" />
            <p className="hidden font-mono text-[10px] leading-relaxed tracking-[0.18em] text-faint sm:block">
              CREW HEALTH
              <br />
              INTELLIGENCE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted">
                MISSION ELAPSED
              </p>
              <p className="mt-1 font-mono text-sm tracking-[0.12em] text-foreground">
                {formatMETSeconds(state.t)}
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-sm border border-border bg-panel-raised px-3 py-2">
              <span
                className={`h-2 w-2 rounded-full animate-status-pulse ${
                  state.overallStatus === "CRITICAL"
                    ? "bg-critical"
                    : state.overallStatus === "WARNING"
                      ? "bg-warning"
                      : "bg-accent"
                }`}
              />
              <span
                className={`font-mono text-xs tracking-[0.22em] ${
                  state.overallStatus === "CRITICAL"
                    ? "text-critical"
                    : state.overallStatus === "WARNING"
                      ? "text-warning"
                      : "text-accent"
                }`}
              >
                {state.overallStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerCriticalDemo}
                className="rounded-sm border border-critical bg-panel-raised px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgb(239_68_68_/_0.12)] font-mono text-[10px] tracking-[0.18em] text-critical hover:bg-critical/10"
              >
                SIMULATE EMERGENCY
              </button>
              <button
                type="button"
                onClick={triggerWarningDemo}
                className="rounded-sm border border-border bg-panel-raised px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-warning transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgb(245_158_11_/_0.10)] hover:border-warning"
              >
                WARNING
              </button>
              <button
                type="button"
                onClick={resumeNominal}
                className="rounded-sm border border-border bg-panel-raised px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-accent transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_0_18px_rgb(56_189_248_/_0.10)] hover:border-accent-dim"
              >
                RESUME
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-top-2 duration-500 delay-75"><AlertsPanel alerts={state.alerts} onAcknowledge={acknowledgeAlert} /></div>

      {/* ===== Console body ===== */}
      <main className="animate-in fade-in duration-500 mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-4 p-4 sm:gap-5 sm:p-6 lg:grid-cols-12 lg:gap-5 lg:items-start">
        {/* --- Right column on desktop, first on mobile --- */}
        <Panel
          title="HEALTH STATUS"
          className="order-2 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1"
          action={
            <span className="font-mono text-[10px] tracking-[0.2em] text-accent">
              {state.overallStatus === "NORMAL" ? "NOMINAL" : state.overallStatus}
            </span>
          }
        >
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold tracking-[0.14em] text-foreground">
              {state.overallStatus}
            </p>
            <span
              className={`h-2.5 w-2.5 rounded-full animate-status-pulse ${
                state.overallStatus === "CRITICAL"
                  ? "bg-critical"
                  : state.overallStatus === "WARNING"
                    ? "bg-warning"
                    : "bg-accent"
              }`}
            />
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            {state.overallStatus === "NORMAL"
              ? "All monitored parameters are within nominal crew-health limits."
              : "One or more monitored parameters are outside nominal limits."}
          </p>
          <div className="mt-3.5 space-y-2 border-t border-border pt-3">
            {[
              ["CARDIAC", state.statuses.heartRate],
              ["OXYGENATION", state.statuses.spo2],
              ["THERMAL", state.statuses.temperature],
              ["RECOVERY", state.statuses.sleepHours],
            ].map(([label, status]) => (
              <div
                key={label}
                className="flex items-center justify-between font-mono text-[11px] tracking-[0.16em]"
              >
                <span className="text-muted">{label}</span>
                <span
                  className={
                    status === "CRITICAL"
                      ? "text-critical"
                      : status === "WARNING"
                        ? "text-warning"
                        : "text-accent"
                  }
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* --- Center: crew visualization --- */}
        <section
          aria-label="Crew visualization"
          className="order-3 rounded-sm border border-border bg-panel transition-all duration-500 hover:border-accent-dim lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-2"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted">
              CREW VISUALIZATION
            </h2>
            <span className="font-mono text-[10px] tracking-[0.2em] text-accent">
              LIVE
            </span>
          </header>
          <div
            className="flex min-h-[330px] flex-col items-center justify-center gap-4 p-4 sm:p-5 lg:min-h-[330px]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(27 38 55 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(27 38 55 / 0.35) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          >
            <div className="grid w-full max-w-[720px] grid-cols-3 items-center gap-2 sm:gap-4 lg:gap-5">
              <div className="col-start-2 row-start-1">
                <Chip
                  label="OXYGEN"
                  value={state.reading.spo2.toFixed(0)}
                  unit="%"
                  status={state.statuses.spo2}
                />
              </div>
              <div className="col-start-1 row-start-2">
                <Chip
                  label="HEART RATE"
                  value={state.reading.heartRate.toFixed(0)}
                  unit="BPM"
                  status={state.statuses.heartRate}
                />
              </div>
              <div className="col-start-2 row-start-2 flex justify-center px-2">
                <div
                  className={`rounded-full border-2 p-3 sm:p-4 ${
                    state.overallStatus === "CRITICAL"
                      ? "border-critical animate-status-pulse"
                      : state.overallStatus === "WARNING"
                        ? "border-warning animate-status-pulse"
                        : "border-accent animate-pulse"
                  }`}
                >
                  <AstronautSilhouette status={state.overallStatus} />
                </div>
              </div>
              <div className="col-start-3 row-start-2">
                <Chip
                  label="TEMPERATURE"
                  value={state.reading.temperature.toFixed(1)}
                  unit="°C"
                  status={state.statuses.temperature}
                />
              </div>
              <div className="col-start-1 row-start-3">
                <Chip
                  label="SLEEP"
                  value={state.reading.sleepHours.toFixed(1)}
                  unit="H"
                  status={state.statuses.sleepHours}
                />
              </div>
              <div className="col-start-3 row-start-3">
                <Chip
                  label="EXERCISE"
                  value={state.reading.exerciseMinutes.toFixed(0)}
                  unit="MIN"
                  status={state.statuses.exerciseMinutes}
                />
              </div>
            </div>
            <p className="font-mono text-[10px] tracking-[0.26em] text-faint">
              SUIT LOOP TELEMETRY · LINK STABLE
            </p>
          </div>
        </section>

        {/* --- Left column on desktop, late on mobile --- */}
        <CrewProfile
          t={state.t}
          className="order-8 lg:order-none lg:col-span-4 lg:col-start-1 lg:row-start-1"
        />

        <OrbitalContext className="order-9 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-3" />

        <Panel
          title="MISSION HEALTH"
          className="order-5 lg:order-none lg:col-span-4 lg:col-start-5 lg:row-start-1"
          action={
            <span className="font-mono text-[10px] tracking-[0.18em] text-faint">
              SIMULATED · ILLUSTRATIVE
            </span>
          }
        >
          <p className="font-mono text-6xl leading-none text-foreground">
            {state.score.score}
            <span className="text-xl text-muted"> / 100</span>
          </p>
          <p
            className={`mt-3 font-mono text-sm tracking-[0.3em] ${
              state.missionStatus === "CRITICAL"
                ? "text-critical"
                : state.missionStatus === "WARNING"
                  ? "text-warning"
                  : "text-accent"
            }`}
          >
            {state.missionStatus}
          </p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                state.missionStatus === "CRITICAL"
                  ? "bg-critical"
                  : state.missionStatus === "WARNING"
                    ? "bg-warning"
                    : "bg-accent"
              }`}
              style={{ width: `${state.score.score}%` }}
            />
          </div>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3">
            {(
              [
                ["OXYGEN", state.score.parameters.spo2],
                ["HEART RATE", state.score.parameters.heartRate],
                ["TEMPERATURE", state.score.parameters.temperature],
                ["SLEEP", state.score.parameters.sleepHours],
                ["EXERCISE", state.score.parameters.exerciseMinutes],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em]"
              >
                <span className="text-muted">{label}</span>
                <span className="text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Composite of cardiac, oxygenation, thermal, sleep and exercise
            indices. Illustrative value only.
          </p>
        </Panel>

        {/* --- Right column continued --- */}
        <Panel
          title="HEALTH GRAPH"
          className="order-6 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-3"
          action={
            <span className="font-mono text-[10px] tracking-[0.2em] text-accent">
              LIVE
            </span>
          }
        >
          <HealthGraph history={state.history} />
        </Panel>

        <Panel
          title="MISSION TIMELINE"
          className="order-7 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-2"
        >
          <Timeline events={state.events} />
        </Panel>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto w-full max-w-[1440px] px-4 py-3 font-mono text-[10px] tracking-[0.18em] text-faint sm:px-6">
          ASTRAL · CREW HEALTH INTELLIGENCE · ALL READINGS SIMULATED FOR
          DEMONSTRATION
        </p>
      </footer>
    </div>
  );
}

