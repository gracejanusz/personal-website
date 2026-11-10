// Sound for /strands: a tuned wind-chime cascade when the pattern changes, and
// a quiet generated ambient bed (slow pad chords + sparse high bells) under it.
// Both are in D major and share one reverb so they sit in the same room.
import chimesSrc from "./strands/chimes.mp3";
import keySrc from "./strands/key.mp3";

const MUSIC_VOL = 0.05; // master level of the ambient bed, kept low
const CHIME_VOL = 0.5; // tuned chime cascade
const SHIMMER_VOL = 0.12; // the original chime sample, low, as air on top
const KEY_VOL = 0.32; // the keyboard click, softened
const SFX_VOL = 0.5; // plucks, reveal blooms, region swaps
const CHORD_S = 10; // seconds per pad chord

// D major-ish, airy voicings that sit under the chimes (MIDI notes)
const CHORDS = [
  [50, 57, 64, 66, 69], // Dadd9
  [47, 54, 62, 64, 66], // Bm(add9)
  [43, 50, 57, 59, 66], // Gmaj7
  [45, 52, 57, 61, 64], // A
];
const BELLS = [74, 76, 78, 81, 83, 86, 88]; // D major pentatonic, up high
const STRINGS = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74, 76, 78]; // pentatonic, the lines' range

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

let ctx: AudioContext | null = null;
let master: GainNode | null = null; // music level (0 when music is off)
let bus: AudioNode | null = null; // music: filter -> reverb
let room: AudioNode | null = null; // shared reverb, always audible
let dryOut: AudioNode | null = null;
let sample: AudioBuffer | null = null;
let keySample: AudioBuffer | null = null;
let timer = 0;
let chordIx = 0;
let musicOn = true;

function impulse(c: AudioContext, seconds: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  return buf;
}

function setup() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 5);
  const wet = ctx.createGain();
  wet.gain.value = 0.7;
  verb.connect(wet).connect(ctx.destination);
  const dry = ctx.createGain();
  dry.gain.value = 0.45;
  dry.connect(ctx.destination);
  room = verb;
  dryOut = dry;

  master = ctx.createGain();
  master.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  lp.Q.value = 0.3;
  lp.connect(master);
  master.connect(verb);
  master.connect(dry);
  bus = lp;

  const c = ctx;
  fetch(chimesSrc)
    .then((r) => r.arrayBuffer())
    .then((b) => c.decodeAudioData(b))
    .then((b) => (sample = b))
    .catch(() => {});
  fetch(keySrc)
    .then((r) => r.arrayBuffer())
    .then((b) => c.decodeAudioData(b))
    .then((b) => (keySample = b))
    .catch(() => {});
  return ctx;
}

function padNote(c: AudioContext, m: number, t: number, dur: number) {
  const g = c.createGain();
  const peak = m < 48 ? 0.16 : 0.11;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + dur * 0.4);
  g.gain.setValueAtTime(peak, t + dur * 0.6);
  g.gain.linearRampToValueAtTime(0, t + dur * 1.3);
  g.connect(bus!);
  for (const [type, cents] of [["sine", -5], ["triangle", 6]] as const) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = hz(m);
    o.detune.value = cents;
    o.connect(g);
    o.start(t);
    o.stop(t + dur * 1.3 + 0.1);
  }
}

function bell(c: AudioContext, m: number, t: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
  g.connect(bus!);
  for (const [mult, lvl] of [[1, 1], [2.76, 0.25]]) {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = "sine";
    o.frequency.value = hz(m) * mult;
    og.gain.value = lvl;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 3.6);
  }
}

function tick() {
  const c = ctx;
  if (!c || !musicOn) return;
  const t = c.currentTime + 0.05;
  for (const m of CHORDS[chordIx % CHORDS.length]) padNote(c, m, t, CHORD_S);
  chordIx++;
  // a few scattered bells across the chord
  const n = Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) bell(c, BELLS[Math.floor(Math.random() * BELLS.length)], t + 1 + Math.random() * (CHORD_S - 2));
  timer = window.setTimeout(tick, CHORD_S * 1000);
}

function fadeTo(v: number, s: number) {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(v, now + s);
}

// call from a user gesture; starts the music the first time (if it's on)
export function unlockAudio() {
  const c = setup();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  if (musicOn && !timer) {
    fadeTo(MUSIC_VOL, 4);
    tick();
  }
}

export function setMusic(on: boolean) {
  musicOn = on;
  const c = setup();
  if (!c) return;
  if (on) {
    if (c.state === "suspended") c.resume();
    fadeTo(MUSIC_VOL, 2.5);
    if (!timer) tick();
  } else {
    fadeTo(0, 1.2);
    clearTimeout(timer);
    timer = 0;
  }
}

export function isMusicOn() {
  return musicOn;
}

// one struck chime tube: a few inharmonic partials, the upper ones dying first
function tube(c: AudioContext, out: AudioNode, m: number, t: number, vel: number) {
  const f = hz(m);
  const decay = 2.2 + (90 - m) * 0.12; // lower tubes ring longer
  for (const [ratio, amp, dk] of [[1, 1, 1], [2.76, 0.32, 0.45], [5.4, 0.12, 0.22], [8.93, 0.05, 0.12]]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f * ratio;
    o.detune.value = (Math.random() - 0.5) * 6;
    const end = t + decay * dk;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel * amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(end + 0.05);
  }
}

// a breeze through the chimes: a loose run of notes from the current chord
// and the D pentatonic, louder in the middle, then a couple of late stragglers
export function playChime() {
  const c = setup();
  if (!c || !room || !dryOut) return;
  if (c.state === "suspended") c.resume();
  const t0 = c.currentTime + 0.02;

  const out = c.createGain();
  out.gain.value = CHIME_VOL;
  const tone = c.createBiquadFilter(); // soften the attack so it's not glassy
  tone.type = "lowpass";
  tone.frequency.value = 5200;
  out.connect(tone);
  tone.connect(room);
  const dry = c.createGain();
  dry.gain.value = 0.5;
  tone.connect(dry).connect(dryOut);

  const chord = CHORDS[(chordIx + CHORDS.length - 1) % CHORDS.length].map((m) => m + 24);
  const pool = [...BELLS, ...chord.filter((m) => m <= 90)];
  const n = 6 + Math.floor(Math.random() * 4);
  let t = t0;
  let prev = -1;
  for (let i = 0; i < n; i++) {
    let m = pool[Math.floor(Math.random() * pool.length)];
    if (m === prev) m = pool[(pool.indexOf(m) + 2) % pool.length];
    prev = m;
    const swell = Math.sin(Math.PI * ((i + 0.5) / n));
    tube(c, out, m, t, 0.05 + 0.1 * swell * (0.7 + Math.random() * 0.3));
    t += 0.07 + Math.random() * 0.16 + (i > n - 3 ? 0.35 : 0);
  }

  if (sample) {
    const s = c.createBufferSource();
    s.buffer = sample;
    const g = c.createGain();
    g.gain.value = SHIMMER_VOL;
    s.connect(g).connect(room);
    s.start(t0);
  }
}

// ---- interaction sounds: all D pentatonic, through the shared room ----

let lastPluck = 0;
let lastNote = -1;

// a per-call output into the room (wet + a little dry)
function sfx(c: AudioContext, level: number, dryMix = 0.6, wetMix = 1) {
  const g = c.createGain();
  g.gain.value = level * SFX_VOL;
  const w = c.createGain();
  w.gain.value = wetMix;
  g.connect(w).connect(room!);
  const d = c.createGain();
  d.gain.value = dryMix;
  g.connect(d).connect(dryOut!);
  return g;
}

function ready() {
  const c = ctx;
  if (!c || !room || !dryOut || c.state !== "running") return null;
  return c;
}

// a soft plucked string: triangle through a closing lowpass
function pluckNote(c: AudioContext, out: AudioNode, m: number, t: number, vel: number) {
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.value = hz(m);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.5;
  lp.frequency.setValueAtTime(hz(m) * 6, t);
  lp.frequency.exponentialRampToValueAtTime(hz(m) * 1.2, t + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + 1.7);
}

// grabbing a line: its own note, by where it sits across the page (0..1)
export function grabLine(x: number) {
  const c = ready();
  if (!c) return;
  const ix = Math.max(0, Math.min(STRINGS.length - 1, Math.round(x * (STRINGS.length - 1))));
  lastNote = ix;
  pluckNote(c, sfx(c, 0.5), STRINGS[ix], c.currentTime + 0.005, 0.5);
}

// dragging: lines brushing past each other, a quiet step up or down the scale
export function brushLine(dir: number, speed: number) {
  const c = ready();
  if (!c) return;
  const now = performance.now();
  if (now - lastPluck < 70) return;
  lastPluck = now;
  if (lastNote < 0) lastNote = Math.floor(STRINGS.length / 2);
  lastNote = Math.max(0, Math.min(STRINGS.length - 1, lastNote + (dir > 0 ? 1 : -1)));
  if (lastNote === 0 || lastNote === STRINGS.length - 1) lastNote = Math.floor(STRINGS.length / 2);
  const vel = 0.12 + Math.min(0.2, speed * 0.01);
  pluckNote(c, sfx(c, 0.5), STRINGS[lastNote], c.currentTime + 0.005, vel);
}

// letting go: a low, soft settle on the root
export function releaseLine() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  const out = sfx(c, 0.35, 0.3);
  for (const m of [38, 45]) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(m);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(m === 38 ? 0.35 : 0.15, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 1.3);
  }
}

// a photo opening up behind a gap: a breath of filtered air and an open fifth
export function revealBloom() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  const out = sfx(c, 0.6, 0.35);

  const len = Math.floor(c.sampleRate * 1.6);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const n = c.createBufferSource();
  n.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2.5;
  bp.frequency.setValueAtTime(600, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.7);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(0.12, t + 0.35);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  n.connect(bp).connect(ng).connect(out);
  n.start(t);
  n.stop(t + 1.6);

  const root = [62, 66, 69, 71][Math.floor(Math.random() * 4)];
  for (const [m, a] of [[root, 0.1], [root + 7, 0.07], [root + 12, 0.04]]) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(m);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 2.3);
  }
}

// clicking into a photo: the recorded key press, rounded off (top end
// rolled off, a little room on it) and a touch lower each level deeper
export function diveSound(depth: number) {
  const c = ready();
  if (!c || !keySample) return;
  const t = c.currentTime + 0.005;
  const lv = Math.min(6, Math.max(0, depth - 1));

  const src = c.createBufferSource();
  src.buffer = keySample;
  src.playbackRate.value = (1 - lv * 0.035) * (0.96 + Math.random() * 0.08);

  const lp = c.createBiquadFilter(); // take the sharp clack off
  lp.type = "lowpass";
  lp.frequency.value = 3800 - lv * 300;
  lp.Q.value = 0.4;
  const shelf = c.createBiquadFilter(); // a bit more body
  shelf.type = "lowshelf";
  shelf.frequency.value = 300;
  shelf.gain.value = 3;
  const g = c.createGain(); // soften the very first transient
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(KEY_VOL, t + 0.004);

  // mostly dry: just a touch of the room so it doesn't feel pasted on
  src.connect(lp).connect(shelf).connect(g).connect(sfx(c, 1, 2, 0.12));
  src.start(t, 0.035, 0.3); // just the one keystroke in the file
}

// new colours: two threads of notes weaving past each other, one climbing
// in soft plucks and one falling in chimes, over a warm swell and a breath
// of air, about as long as the colours take to weave across the page
export function colorSound() {
  const c = setup(); // works on the very first press too
  if (!c || !room || !dryOut) return;
  if (c.state === "suspended") c.resume();
  const t = c.currentTime + 0.03;
  const out = sfx(c, 0.85, 0.7);

  // the two threads, alternating
  const up = [62, 64, 66, 69, 71, 74, 76, 78];
  const down = [88, 86, 83, 81, 78, 76, 74, 71];
  const shift = Math.floor(Math.random() * 2) * 2; // a little variety each time
  const STEP = 0.105;
  for (let i = 0; i < 8; i++) {
    const swell = Math.sin(Math.PI * ((i + 0.5) / 8));
    pluckNote(c, out, up[i], t + i * 2 * STEP, 0.12 + 0.16 * swell);
    tube(c, out, down[(i + shift) % down.length], t + (i * 2 + 1) * STEP, 0.035 + 0.06 * swell);
  }

  // a warm low swell under it: D and A
  for (const [m, a] of [[50, 0.07], [57, 0.05]]) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(m);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 2.5);
  }

  // a breath of air sweeping up through it
  const len = Math.floor(c.sampleRate * 1.8);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const nz = c.createBufferSource();
  nz.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.8;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(4200, t + 1.5);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(0.05, t + 0.7);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.75);
  nz.connect(bp).connect(ng).connect(out);
  nz.start(t);
  nz.stop(t + 1.8);
}

export function stopAudio() {
  clearTimeout(timer);
  timer = 0;
  if (ctx) ctx.close();
  ctx = null;
  master = null;
  bus = null;
  room = null;
  dryOut = null;
  sample = null;
}
