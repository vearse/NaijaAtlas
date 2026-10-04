"use client";

type Cue = "correct" | "wrong" | "combo" | "tick" | "start" | "finish" | "helper";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const CUES: Record<Cue, () => void> = {
  correct: () => {
    tone(660, 0, 0.12, "triangle");
    tone(990, 0.08, 0.18, "triangle");
  },
  wrong: () => {
    tone(200, 0, 0.18, "sawtooth", 0.06);
    tone(150, 0.12, 0.25, "sawtooth", 0.06);
  },
  combo: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.14, "triangle", 0.1)),
  tick: () => tone(1200, 0, 0.04, "square", 0.03),
  start: () => tone(880, 0, 0.2, "triangle"),
  helper: () => tone(740, 0, 0.1, "sine", 0.08),
  finish: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, "triangle", 0.1)),
};

/** Tiny synthesized sound effects — no audio assets to download. */
export function playSfx(cue: Cue, muted: boolean) {
  if (muted) return;
  try {
    CUES[cue]();
  } catch {
    /* audio unavailable */
  }
}
