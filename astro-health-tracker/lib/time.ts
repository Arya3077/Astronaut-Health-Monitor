// Mission-time utilities. ASTRAL runs on simulated mission elapsed time (MET),
// never on the user's real clock for simulation logic.

export const SECONDS_PER_DAY = 86400;

/** Mission elapsed time (seconds) matching Day 127, 14:32:00 MET. */
export const MISSION_START_T =
  127 * SECONDS_PER_DAY + 14 * 3600 + 32 * 60;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Mission day number derived from elapsed seconds. */
export function getMissionDay(t: number): number {
  return Math.floor(t / SECONDS_PER_DAY);
}

/** Hours elapsed within the current mission day. */
export function dayTimeParts(t: number): {
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = Math.max(0, Math.floor(t));
  const day = Math.floor(total / SECONDS_PER_DAY);
  const rem = total % SECONDS_PER_DAY;
  return {
    day,
    hours: Math.floor(rem / 3600),
    minutes: Math.floor((rem % 3600) / 60),
    seconds: rem % 60,
  };
}

/** e.g. "MET 127:14:32" (mission day : hh:mm). */
export function formatMET(t: number): string {
  const p = dayTimeParts(t);
  return `MET ${p.day}:${pad(p.hours)}:${pad(p.minutes)}`;
}

/** e.g. "MET 127:14:32:07" (mission day : hh:mm:ss). */
export function formatMETSeconds(t: number): string {
  const p = dayTimeParts(t);
  return `MET ${p.day}:${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
}

/** Compact wall-style clock within the mission day, e.g. "14:32:07". */
export function formatClock(t: number): string {
  const p = dayTimeParts(t);
  return `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
}

/** Timestamp used in the timeline, e.g. "MET 127:14:32". */
export function formatTimestamp(t: number): string {
  return formatMET(t);
}
