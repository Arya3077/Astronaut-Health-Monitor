// Short two-stage mission-control warning tone via Web Audio API.
// Supplementary only: if the browser blocks audio, the visual alert still works.

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!sharedCtx) sharedCtx = new Ctor();
    if (sharedCtx.state === "suspended") void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Call from a user gesture so the audio context is unlocked for later. */
export function primeAlertAudio(): void {
  getContext();
}

export function playAlertTone(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;

    // Stage 1: low, emphasized warning tone.
    // Brief gap, then stage 2: briefer higher confirmation tone.
    // ~1.2 s total, no looping.
    const notes: Array<{
      freq: number;
      start: number;
      dur: number;
      peak: number;
      type: OscillatorType;
    }> = [
      { freq: 392, start: 0, dur: 0.5, peak: 0.11, type: "triangle" },
      { freq: 880, start: 0.62, dur: 0.5, peak: 0.07, type: "sine" },
    ];

    const t0 = ctx.currentTime + 0.02;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, t0 + n.start);
      gain.gain.setValueAtTime(0.0001, t0 + n.start);
      gain.gain.exponentialRampToValueAtTime(n.peak, t0 + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.start + n.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + n.start);
      osc.stop(t0 + n.start + n.dur + 0.03);
    }
  } catch {
    // Audio unavailable — visual alert remains the source of truth.
  }
}
