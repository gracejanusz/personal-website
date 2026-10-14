// The radio on /madd. It stays hidden until a music search is clicked, and each
// music search unlocks one song. To give a song real audio, put the file in
// public/audio/ and set `src` to its path (e.g. "/audio/montgomery-gentry.mp3").
// Until then, the song plays a synthesized placeholder loop.
import { getAudio, noise } from "./maddSound";

export type Song = {
  query: string; // the search that unlocks it
  freq: string; // shown on the dial
  src: string | null;
  // Placeholder loop: chords as frequencies, seconds per chord, oscillator type
  chords: number[][];
  beat: number;
  wave: OscillatorType;
};

export const songs: Song[] = [
  {
    query: "montgomery gentry albums",
    freq: "88.1",
    src: null,
    chords: [[196, 247, 294], [262, 330, 392], [294, 370, 440], [196, 247, 294]],
    beat: 1.6,
    wave: "sawtooth",
  },
  {
    query: "britney spears and husband fighting",
    freq: "94.7",
    src: null,
    chords: [[262, 311, 392], [208, 262, 311], [311, 392, 466], [233, 294, 349]],
    beat: 1,
    wave: "square",
  },
  {
    query: "david lee roth",
    freq: "101.5",
    src: null,
    chords: [[165, 247, 330], [220, 330, 440], [247, 370, 494], [220, 330, 440]],
    beat: 0.8,
    wave: "sawtooth",
  },
  {
    query: "american idol",
    freq: "106.3",
    src: null,
    chords: [[175, 220, 262], [147, 175, 220], [233, 294, 349], [262, 330, 392]],
    beat: 2,
    wave: "triangle",
  },
];

export const songByQuery = new Map(songs.map((s) => [s.query, s]));

let bus: GainNode | null = null;
let muted = false;
let stopCurrent: (() => void) | null = null;

// Everything on the radio goes through a narrow band-pass so it sounds like it
// is coming out of a small speaker.
function radioBus() {
  const { ctx, master } = getAudio();
  if (!bus) {
    bus = ctx.createGain();
    bus.gain.value = muted ? 0 : 1;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 280;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    bus.connect(hp).connect(lp).connect(master);
  }
  return { ctx, bus };
}

function playStatic(seconds: number) {
  const { ctx, bus } = radioBus();
  const t = ctx.currentTime;
  const n = noise(ctx, seconds);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.linearRampToValueAtTime(0, t + seconds);
  n.connect(g).connect(bus);
  n.start(t);
}

function playPlaceholder(song: Song) {
  const { ctx, bus } = radioBus();
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.8);
  out.connect(bus);
  let i = 0;
  let next = ctx.currentTime + 0.05;
  const schedule = () => {
    // Keep about a second of chords queued ahead
    while (next < ctx.currentTime + 1) {
      for (const f of song.chords[i % song.chords.length]) {
        const o = ctx.createOscillator();
        o.type = song.wave;
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, next);
        g.gain.linearRampToValueAtTime(0.06, next + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, next + song.beat * 0.95);
        o.connect(g).connect(out);
        o.start(next);
        o.stop(next + song.beat);
      }
      next += song.beat;
      i++;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 250);
  return () => {
    window.clearInterval(timer);
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    window.setTimeout(() => out.disconnect(), 600);
  };
}

function playFile(song: Song) {
  const { ctx, bus } = radioBus();
  const el = new Audio(song.src!);
  el.loop = true;
  const src = ctx.createMediaElementSource(el);
  const g = ctx.createGain();
  g.gain.value = 0.6;
  src.connect(g).connect(bus);
  let fallback: (() => void) | null = null;
  // A missing or unplayable file falls back to the placeholder loop
  el.play().catch(() => (fallback = playPlaceholder(song)));
  return () => {
    el.pause();
    g.disconnect();
    fallback?.();
  };
}

// Tune to a song (or null for off), with a burst of static in between
export function tuneTo(song: Song | null) {
  stopCurrent?.();
  stopCurrent = null;
  playStatic(song ? 0.7 : 0.25);
  if (!song) return;
  const timer = window.setTimeout(() => {
    stopCurrent = song.src ? playFile(song) : playPlaceholder(song);
  }, 600);
  stopCurrent = () => window.clearTimeout(timer);
}

export function setRadioMuted(value: boolean) {
  muted = value;
  if (!bus) return;
  const { ctx } = getAudio();
  bus.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
}
