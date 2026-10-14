// Small Web Audio synths for the /madd story chapters. Everything is generated
// in the browser, so there are no audio files to load.
import type { SoundName } from "./maddStory";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: GainNode | null = null;

export function noise(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

function env(c: AudioContext, out: AudioNode, t: number, attack: number, hold: number, release: number, peak: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  g.connect(out);
  return g;
}

function tone(c: AudioContext, out: AudioNode, type: OscillatorType, freq: number, t: number, dur: number, peak: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(env(c, out, t, 0.01, dur * 0.6, dur * 0.4, peak));
  o.start(t);
  o.stop(t + dur + 0.05);
}

const synths: Record<SoundName, (c: AudioContext, out: AudioNode, t: number) => void> = {
  // Static hopping between stations, then it settles on a warm chord
  radio(c, out, t) {
    const n = noise(c, 2.4);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 3;
    for (let i = 0; i < 8; i++) bp.frequency.setValueAtTime(400 + Math.random() * 3000, t + i * 0.22);
    n.connect(bp).connect(env(c, out, t, 0.05, 1.6, 0.4, 0.25));
    n.start(t);
    for (let i = 0; i < 4; i++) tone(c, out, "triangle", 200 + Math.random() * 600, t + 0.2 + i * 0.4, 0.15, 0.05);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;
    lp.connect(out);
    for (const f of [196, 247, 294, 392]) tone(c, lp, "sawtooth", f, t + 1.8, 2.2, 0.04);
  },
  // A bike starting up and revving
  engine(c, out, t) {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(35, t);
    o.frequency.linearRampToValueAtTime(55, t + 0.6);
    o.frequency.exponentialRampToValueAtTime(140, t + 1.6);
    o.frequency.exponentialRampToValueAtTime(45, t + 3);
    const lfo = c.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.5;
    const am = c.createGain();
    am.gain.value = 0.5;
    lfo.connect(lfoGain).connect(am.gain);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    o.connect(am).connect(lp).connect(env(c, out, t, 0.2, 2.2, 0.8, 0.35));
    o.start(t);
    lfo.start(t);
    o.stop(t + 3.3);
    lfo.stop(t + 3.3);
  },
  // Clock-like ticking
  ticks(c, out, t) {
    for (let i = 0; i < 8; i++) {
      const n = noise(c, 0.03);
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2500;
      n.connect(hp).connect(env(c, out, t + i * 0.5, 0.001, 0.005, 0.03, i % 2 ? 0.15 : 0.25));
      n.start(t + i * 0.5);
    }
  },
  // Tiny feet across a cage floor
  scurry(c, out, t) {
    let at = t;
    for (let i = 0; i < 26; i++) {
      at += 0.02 + Math.random() * 0.07;
      const n = noise(c, 0.02);
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3500 + Math.random() * 3000;
      n.connect(hp).connect(env(c, out, at, 0.001, 0.003, 0.015, 0.12 + Math.random() * 0.1));
      n.start(at);
    }
  },
  // An 8-bit game jingle
  chiptune(c, out, t) {
    const notes = [523, 659, 784, 1047, 784, 659, 523, 587, 698, 880, 1175, 880];
    notes.forEach((f, i) => tone(c, out, "square", f, t + i * 0.1, 0.09, 0.05));
    tone(c, out, "square", 1047, t + notes.length * 0.1, 0.4, 0.05);
  },
  // Slow lub-dub
  heartbeat(c, out, t) {
    for (let i = 0; i < 4; i++) {
      const beat = t + i * 0.9;
      for (const [dt, peak] of [[0, 0.6], [0.22, 0.4]] as const) {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(70, beat + dt);
        o.frequency.exponentialRampToValueAtTime(40, beat + dt + 0.15);
        o.connect(env(c, out, beat + dt, 0.01, 0.03, 0.15, peak));
        o.start(beat + dt);
        o.stop(beat + dt + 0.25);
      }
    }
  },
  // Wind rising and falling
  wind(c, out, t) {
    const n = noise(c, 5);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(250, t);
    lp.frequency.linearRampToValueAtTime(900, t + 2);
    lp.frequency.linearRampToValueAtTime(350, t + 4.5);
    n.connect(lp).connect(env(c, out, t, 1.5, 1.5, 1.8, 0.3));
    n.start(t);
  },
  // One low, slowly fading interval
  hollow(c, out, t) {
    tone(c, out, "sine", 110, t, 4, 0.2);
    tone(c, out, "sine", 164.8, t + 0.4, 3.6, 0.1);
    tone(c, out, "sine", 220, t + 0.8, 3.2, 0.05);
  },
};

// Shared audio context, also used by the radio. Created on first use, which is
// always inside a click so the browser allows sound.
export function getAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  void ctx.resume();
  return { ctx, master: master! };
}

export function playSound(name: SoundName) {
  const { ctx, master } = getAudio();
  // Fade out whatever is still playing so sounds don't pile up
  const t = ctx.currentTime;
  if (current) {
    current.gain.setValueAtTime(current.gain.value, t);
    current.gain.linearRampToValueAtTime(0, t + 0.3);
    const old = current;
    setTimeout(() => old.disconnect(), 400);
  }
  current = ctx.createGain();
  current.connect(master);
  synths[name](ctx, current, t + 0.05);
}
