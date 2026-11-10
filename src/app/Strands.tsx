import { useEffect, useRef, useState } from "react";
import {
  brushLine,
  colorSound,
  diveSound,
  grabLine,
  isMusicOn,
  playChime,
  releaseLine,
  revealBloom,
  setMusic,
  stopAudio,
  unlockAudio,
} from "./strandsAudio";
import quiltSrc from "./strands/quilt.jpg";
import streaksSrc from "./strands/streaks.jpg";
import greenSrc from "./strands/green.jpg";
import terminalSrc from "./strands/terminal.jpg";
import bytesSrc from "./strands/bytes.jpg";
import lobsterSrc from "./strands/lobster.jpg";
import bandsSrc from "./strands/bands.jpg";
import drawingSrc from "./strands/drawing.jpg";
import stretchedSrc from "./strands/stretched.jpg";
import collageSrc from "./strands/collage.jpg";

const PAPER = "#f7f7f7";
const INK = "#111214";
const N = 76; // lines, fixed so one pattern can morph into the next
const B = N - 1; // colored bands between them
const R = 200; // rows along each line
const CH = 10; // rows per thickness chunk
const NP = R / CH; // thickness chunks
const SIGMA = 70; // rows that bend with the grabbed point
const MIN_GAP = 2; // px before lines start pushing each other
const REVEAL_PX = 28; // extra px a gap must open to fully show the photo
const LEVELS = 12; // reveal opacity steps (batched into one path each)
const WEIGHTS = [0.9, 1.1, 1.4, 1.8, 2.4, 3.2];

// A spot inside a photo (fractions of the cropped frame). Clicking a revealed
// photo swaps the region under the click (grown out to the image's own
// edges) for the photo its nearest spot opens; clicking that region again
// goes a level deeper.
type Spot = { x: number; y: number; w: number; h: number; label: string; open: number };

// Each photo with a source crop (fractions) to trim screenshot chrome.
const PHOTOS: { src: string; crop: { x: number; y: number; w: number; h: number }; spots: Spot[] }[] = [
  // 0 quilt
  {
    src: quiltSrc,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    spots: [
      { x: 0.44, y: 0.45, w: 0.26, h: 0.22, label: "the glitch underneath", open: 2 },
      { x: 0.5, y: 0, w: 0.32, h: 0.24, label: "a green patch", open: 5 },
    ],
  },
  // 1 streaks
  {
    src: streaksSrc,
    crop: { x: 0, y: 0.075, w: 1, h: 0.88 },
    spots: [{ x: 0.74, y: 0.62, w: 0.09, h: 0.2, label: "where the cursor was", open: 3 }],
  },
  // 2 green
  {
    src: greenSrc,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    spots: [{ x: 0.55, y: 0.64, w: 0.16, h: 0.09, label: "service", open: 1 }],
  },
  // 3 terminal
  {
    src: terminalSrc,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    spots: [
      { x: 0.58, y: 0.42, w: 0.12, h: 0.55, label: "the colour presets", open: 6 },
      { x: 0.04, y: 0.4, w: 0.26, h: 0.56, label: "what the terminal printed", open: 4 },
    ],
  },
  // 4 bytes
  {
    src: bytesSrc,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    spots: [{ x: 0, y: 0.04, w: 0.32, h: 0.09, label: "decoded", open: 2 }],
  },
  // 5 lobster
  {
    src: lobsterSrc,
    crop: { x: 0, y: 0, w: 0.98, h: 1 },
    spots: [{ x: 0.18, y: 0.1, w: 0.48, h: 0.3, label: "the face", open: 7 }],
  },
  // 6 bands
  {
    src: bandsSrc,
    crop: { x: 0, y: 0.016, w: 1, h: 0.984 },
    spots: [{ x: 0.62, y: 0, w: 0.1, h: 1, label: "pull this one", open: 8 }],
  },
  // 7 drawing
  {
    src: drawingSrc,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    spots: [{ x: 0.4, y: 0, w: 0.2, h: 1, label: "drawn into colour", open: 6 }],
  },
  // 8 stretched
  {
    src: stretchedSrc,
    crop: { x: 0, y: 0.016, w: 1, h: 0.984 },
    spots: [{ x: 0.2, y: 0.28, w: 0.28, h: 0.66, label: "what was behind", open: 9 }],
  },
  // 9 collage
  {
    src: collageSrc,
    crop: { x: 0, y: 0.016, w: 1, h: 0.984 },
    spots: [
      { x: 0.56, y: 0, w: 0.36, h: 0.9, label: "the quilt", open: 0 },
      { x: 0.2, y: 0.15, w: 0.36, h: 0.75, label: "the terminal", open: 3 },
    ],
  },
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Wave = { f: number; p: number; a: number }[];
type Layout = ReturnType<typeof buildLayout>;

// colour palettes the bands are shaded from, each a run of hand-picked stops
// from lightest to deepest (nothing paler than a soft pastel, so no white).
// The page opens on a random one; each reset or recolour moves to a different one.
const FAMILIES: { name: string; stops: string[] }[] = [
  { name: "pink", stops: ["#f7b6cd", "#f39ab9", "#eb7ea4", "#de6290", "#c84b7c"] },
  { name: "sunset", stops: ["#ffc2a8", "#ffa48f", "#f6868f", "#e46b90", "#c75590"] },
  { name: "coral", stops: ["#ffb8a6", "#ff9d88", "#f8806e", "#e96660", "#cf5157"] },
  { name: "apricot", stops: ["#ffcb9c", "#ffb577", "#f99d58", "#ee8443", "#d76e35"] },
  { name: "marigold", stops: ["#fde09a", "#fbcf6e", "#f6bd4c", "#eca635", "#d98f2a"] },
  { name: "sage", stops: ["#c9dbb5", "#b0ca99", "#97b680", "#7e9f68", "#688955"] },
  { name: "mint", stops: ["#ade6cf", "#88d7b9", "#64c6a1", "#48ae89", "#349373"] },
  { name: "lagoon", stops: ["#a5e0d6", "#80cfd0", "#5fb8cc", "#4b9dc6", "#3f83bb"] },
  { name: "sky", stops: ["#b0d7f6", "#8ec3f0", "#6eaee8", "#5597dc", "#4380c9"] },
  { name: "periwinkle", stops: ["#bec6f6", "#a5aff1", "#8d97e9", "#7880dd", "#666bcb"] },
  { name: "lavender", stops: ["#d0bff4", "#bba4ec", "#a68ae2", "#9273d6", "#7e5fc4"] },
  { name: "dusk", stops: ["#d9b8ee", "#d09bdc", "#d283c2", "#c96ba6", "#b0578e"] },
];

function hexHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (!d) return [0, 0, l * 100];
  const sat = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, sat * 100, l * 100];
}
const PALETTES = FAMILIES.map((f) => f.stops.map(hexHsl));

function buildLayout(seed: number, family = 0) {
  const rnd = rng(seed);
  const wave = (n: number): Wave =>
    Array.from({ length: n }, () => ({ f: 1.1 + rnd() * 2.6, p: rnd() * 6.283, a: 0.4 + rnd() * 0.6 }));
  const ev = (w: Wave, y: number) => w.reduce((v, k) => v + k.a * Math.sin(k.f * 6.283 * y + k.p), 0) / w.length;

  // clustered bundles, uneven gaps between them
  const base: number[] = [];
  const group: number[] = [];
  let x = 0;
  let g = 0;
  while (base.length < N) {
    const bundle = 2 + Math.floor(rnd() * 5);
    for (let s = 0; s < bundle && base.length < N; s++) {
      x += s === 0 ? 0.022 + rnd() * 0.038 : 0.006 + rnd() * 0.011;
      base.push(x);
      group.push(g);
    }
    g++;
  }
  const f = base[0];
  const l = base[N - 1];
  for (let b = 0; b < N; b++) base[b] = 0.02 + ((base[b] - f) / (l - f)) * 0.96;

  const shared = wave(4);
  const groupW: Wave[] = [];
  const ownW: Wave[] = [];
  for (let gi = 0; gi <= g; gi++) groupW.push(wave(3));
  for (let i = 0; i < N; i++) ownW.push(wave(3));

  const rows: Float32Array[] = [];
  for (let i = 0; i < N; i++) {
    const row = new Float32Array(R);
    for (let j = 0; j < R; j++) {
      const y = j / (R - 1);
      row[j] = base[i] + 0.016 * ev(shared, y) + 0.011 * ev(groupW[group[i]], y) + 0.0035 * ev(ownW[i], y);
    }
    rows.push(row);
  }
  for (let j = 0; j < R; j++)
    for (let i = 1; i < N; i++)
      if (rows[i][j] < rows[i - 1][j] + 0.0028) rows[i][j] = rows[i - 1][j] + 0.0028;

  const wLine: number[] = [];
  const aLine: number[] = [];
  const press: number[][] = [];
  for (let i = 0; i < N; i++) {
    const r = rnd();
    wLine.push(WEIGHTS[r < 0.3 ? 0 : r < 0.5 ? 1 : r < 0.72 ? 2 : r < 0.88 ? 3 : r < 0.96 ? 4 : 5]);
    aLine.push(0.55 + rnd() * 0.45);
    const pw = wave(3);
    const arr: number[] = [];
    for (let c = 0; c < NP; c++) arr.push(0.72 + 0.5 * (ev(pw, c / NP) + 0.5));
    press.push(arr);
  }

  const { hue, sat, lit } = shades(rnd, family);

  // which photo sits behind each gap: cycle by bundle so neighbouring
  // clusters reveal different images
  const photo: number[] = [];
  let p = Math.floor(rnd() * PHOTOS.length);
  for (let k = 0; k < B; k++) {
    if (group[k + 1] !== group[k]) p++;
    photo.push(p % PHOTOS.length);
  }

  return { rows, wLine, aLine, press, hue, sat, lit, photo };
}

// one color per gap, all shades of one family: the hue wanders a little
// around the family's own, lightness drifts along the page with the odd
// deeper or paler band
function shades(rnd: () => number, family: number) {
  const pal = PALETTES[family % PALETTES.length];
  const top = pal.length - 1;
  const hue: number[] = [];
  const sat: number[] = [];
  const lit: number[] = [];
  // where along the palette each band sits: wanders slowly so neighbours are
  // related, with the odd jump to the deepest stop as an accent
  let shade = rnd() * top;
  for (let k = 0; k < B; k++) {
    shade = Math.max(0, Math.min(top, shade + (rnd() - 0.5) * 1.3));
    const at = rnd() < 0.07 ? top : shade;
    const i = Math.min(top - 1, Math.floor(at));
    const t = at - i;
    const [h0, s0, l0] = pal[i];
    const [h1, s1, l1] = pal[i + 1];
    const dh = ((h1 - h0 + 540) % 360) - 180;
    hue.push((h0 + dh * t + (rnd() - 0.5) * 4 + 360) % 360);
    sat.push(s0 + (s1 - s0) * t);
    lit.push(Math.min(84, l0 + (l1 - l0) * t + (rnd() - 0.5) * 3));
  }
  return { hue, sat, lit };
}

const FADE_MS = 420; // crossfade when a region swaps photos
const BOX = 220; // px, regions never grow past this square around the click
const MIN_AREA = 1600; // px², loosen the colour match until a region is at least this big
const TOLS = [14, 22, 32, 46, 64, 90]; // colour distances tried, tightest first
const ZOOM = 1.8; // each level deeper zooms in this much more around the click
// a swapped region: the gap it was clicked in, its outline as an alpha mask
// over a box, the photo inside, and that photo drawn into the outline
// (redrawn on resize)
type Patch = {
  gap: number;
  x: number; y: number; w: number; h: number;
  alpha: Uint8Array;
  mask: HTMLCanvasElement;
  img: HTMLCanvasElement;
  k: number; d: number; fx: number; fy: number;
  at: number;
  text?: boolean; // a strip of swapped letters, not a photo region
  hop?: Hop; // letters moving into their new places
};
// letters trading places: while it plays, the strip shows as it was, each
// swapped span is cleared to its background colour, and the pieces glide to
// their new spots, one hopping over the top and the other ducking under
type Hop = {
  before: HTMLCanvasElement; // the strip before swapping (device px)
  spans: { x0: number; x1: number; bg: string }[]; // cleared while moving (device px, strip-relative)
  moves: { img: HTMLCanvasElement; from: number; to: number; arc: number }[]; // strip-relative device px; arc in css px
};
const SWAP_MS = 460; // how long letters take to trade places

const BTN = 34; // px, corner buttons

const btnStyle: React.CSSProperties = {
  width: BTN,
  height: BTN,
  borderRadius: "50%",
  border: `1.5px solid ${INK}`,
  background: PAPER,
  color: INK,
  display: "grid",
  placeItems: "center",
  padding: 0,
  cursor: "pointer",
};

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={btnStyle}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

export default function Strands() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actions = useRef({ reset: () => {}, recolor: () => {} });
  const [music, setMusicState] = useState(isMusicOn);

  useEffect(() => {
    document.title = "Strands";
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;

    let family = Math.floor(Math.random() * FAMILIES.length); // a random palette to start
    const layout = buildLayout(20261025, family);
    let pos = layout.rows.map((a) => Float32Array.from(a));
    // resting shape the gaps are measured against; photos show where a gap
    // has opened wider than this
    let rest = layout.rows.map((a) => Float32Array.from(a));
    let curW = layout.wLine.slice();
    let curA = layout.aLine.slice();
    let curP = layout.press.map((a) => a.slice());
    let curH = layout.hue.slice();
    let curS = layout.sat.slice();
    let curL = layout.lit.slice();
    let photo = layout.photo.slice();
    // swapped regions, later ones on top
    const patches: Patch[] = [];
    let fadeAnim = 0;

    const imgs = PHOTOS.map((p) => {
      const im = new Image();
      im.src = p.src;
      im.onload = () => draw();
      return im;
    });
    // one offscreen layer per photo: reveal mask, then photo composited into it
    const layers = PHOTOS.map(() => document.createElement("canvas"));
    // swapped regions, each clipped to the gap it belongs to
    const tileLayer = document.createElement("canvas");

    let W = 0;
    let H = 0;
    let dpr = 1;
    let active = -1;

    function size() {
      dpr = window.devicePixelRatio || 1;
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      for (const l of [...layers, tileLayer]) {
        l.width = cv.width;
        l.height = cv.height;
      }

      // swapped letters were cut from the old layout's pixels, so drop them
      for (let n = patches.length - 1; n >= 0; n--) if (patches[n].text) patches.splice(n, 1);
      for (const pa of patches) paint(pa);
      draw();
    }

    function drawCover(c: CanvasRenderingContext2D, k: number) {
      const im = imgs[k];
      const { crop } = PHOTOS[k];
      const sw = im.naturalWidth * crop.w;
      const sh = im.naturalHeight * crop.h;
      const s = Math.max(W / sw, H / sh);
      const dw = sw * s;
      const dh = sh * s;
      c.drawImage(im, im.naturalWidth * crop.x, im.naturalHeight * crop.y, sw, sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }

    // photo k zoomed ZOOM^d around (fx, fy), as the cover image is everywhere else
    function drawZoomed(c: CanvasRenderingContext2D, k: number, d: number, fx: number, fy: number) {
      const z = ZOOM ** d;
      c.translate(fx, fy);
      c.scale(z, z);
      c.translate(-fx, -fy);
      drawCover(c, k);
    }

    // fill a patch's outline with its photo
    function paint(pa: Patch) {
      const c = pa.img.getContext("2d")!;
      pa.img.width = Math.round(pa.w * dpr);
      pa.img.height = Math.round(pa.h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.drawImage(pa.mask, 0, 0, pa.w, pa.h);
      c.globalCompositeOperation = "source-in";
      c.imageSmoothingEnabled = pa.d < 2; // deeper levels go blocky
      c.translate(-pa.x, -pa.y);
      drawZoomed(c, pa.k, pa.d, pa.fx, pa.fy);
    }


    // where gap i is pulled open far enough to show its photo
    function gapPath(i: number) {
      const dy = H / (R - 1);
      const path = new Path2D();
      const a = pos[i];
      const b = pos[i + 1];
      for (let j = 0; j < R - 1; j++) {
        const open = (b[j] - a[j] - (rest[i + 1][j] - rest[i][j])) * W;
        if (open <= REVEAL_PX * 0.3) continue;
        path.moveTo(a[j] * W, j * dy);
        path.lineTo(b[j] * W, j * dy);
        path.lineTo(b[j + 1] * W, (j + 1) * dy + 0.5);
        path.lineTo(a[j + 1] * W, (j + 1) * dy + 0.5);
        path.closePath();
      }
      return path;
    }

    function drawTiles() {
      // a region goes once its gap no longer shows where it was clicked,
      // e.g. a neighbouring gap has been stretched over it
      for (let n = patches.length - 1; n >= 0; n--)
        if (gapAt(patches[n].fx, patches[n].fy) !== patches[n].gap) patches.splice(n, 1);
      const t = tileLayer.getContext("2d")!;
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.clearRect(0, 0, tileLayer.width, tileLayer.height);
      if (!patches.length) return false;
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      const now = performance.now();
      const clips = new Map<number, Path2D>();
      for (const pa of patches) {
        if (!clips.has(pa.gap)) clips.set(pa.gap, gapPath(pa.gap));
        t.save();
        t.clip(clips.get(pa.gap)!);
        if (pa.text) {
          const u = (now - pa.at) / SWAP_MS;
          if (pa.hop && u < 1) drawHop(t, pa, pa.hop, u);
          else t.drawImage(pa.img, pa.x, pa.y, pa.w, pa.h);
          t.restore();
          continue;
        }
        t.globalAlpha = Math.min(1, (now - pa.at) / FADE_MS);
        t.drawImage(pa.img, pa.x, pa.y, pa.w, pa.h);
        t.restore();
      }
      return true;
    }

    function drawHop(t: CanvasRenderingContext2D, pa: Patch, hop: Hop, u: number) {
      const e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; // ease in-out
      t.drawImage(hop.before, pa.x, pa.y, pa.w, pa.h);
      for (const sp of hop.spans) {
        t.fillStyle = sp.bg;
        t.fillRect(pa.x + sp.x0 / dpr, pa.y, (sp.x1 - sp.x0) / dpr, pa.h);
      }
      const lift = Math.sin(Math.PI * e);
      for (const m of hop.moves) {
        const xx = pa.x + (m.from + (m.to - m.from) * e) / dpr;
        t.drawImage(m.img, xx, pa.y - m.arc * lift, m.img.width / dpr, pa.h);
      }
    }

    function drawReveals() {
      const dy = H / (R - 1);
      layers.forEach((layer, k) => {
        const c = layer.getContext("2d")!;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.globalCompositeOperation = "source-over";
        c.clearRect(0, 0, W, H);
        if (!imgs[k].complete || !imgs[k].naturalWidth) return;

        // bucket each gap segment by how far it has opened, one path per bucket
        const buckets: Path2D[] = Array.from({ length: LEVELS }, () => new Path2D());
        let any = false;
        for (let i = 0; i < B; i++) {
          if (photo[i] !== k) continue;
          const a = pos[i];
          const b = pos[i + 1];
          const a0 = rest[i];
          const b0 = rest[i + 1];
          for (let j = 0; j < R - 1; j++) {
            const open = ((b[j] - a[j] - (b0[j] - a0[j]) + (b[j + 1] - a[j + 1]) - (b0[j + 1] - a0[j + 1])) / 2) * W;
            if (open <= 1) continue;
            const t = Math.min(1, open / REVEAL_PX);
            const lvl = Math.min(LEVELS - 1, Math.floor(t * t * (3 - 2 * t) * LEVELS));
            if (lvl === 0) continue;
            const p = buckets[lvl];
            const y0 = j * dy;
            const y1 = (j + 1) * dy + 0.5;
            p.moveTo(a[j] * W, y0);
            p.lineTo(b[j] * W, y0);
            p.lineTo(b[j + 1] * W, y1);
            p.lineTo(a[j + 1] * W, y1);
            p.closePath();
            any = true;
          }
        }
        if (!any) return;
        c.fillStyle = "#000";
        for (let l = 1; l < LEVELS; l++) {
          c.globalAlpha = l / (LEVELS - 1);
          c.fill(buckets[l]);
        }
        c.globalAlpha = 1;
        c.globalCompositeOperation = "source-in";
        drawCover(c, k);
      });
    }

    // a colour change in progress: new colours pour along each band like
    // threads on a loom, alternate bands from opposite ends, each starting a
    // little later or earlier than its neighbours so the front weaves about
    let weave: {
      fromH: number[]; fromS: number[]; fromL: number[];
      toH: number[]; toS: number[]; toL: number[];
      front: Float32Array; // 0 = untouched, 1 = fully changed
      down: boolean[]; // pours top-to-bottom, else bottom-to-top
    } | null = null;
    const hsl = (h: number, s: number, l: number) => `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;

    function bandFill(k: number): string | CanvasGradient {
      const wv = weave;
      const f = wv ? wv.front[k] : 1;
      if (!wv || f <= 0 || f >= 1) return hsl(curH[k], curS[k], curL[k]);
      const from = hsl(wv.fromH[k], wv.fromS[k], wv.fromL[k]);
      const to = hsl(wv.toH[k], wv.toS[k], wv.toL[k]);
      const E = 0.07; // soft edge, fraction of the height
      const g = f * (1 + 2 * E) - E;
      const c01 = (v: number) => Math.max(0, Math.min(1, v));
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      if (wv.down[k]) {
        grad.addColorStop(0, to);
        grad.addColorStop(c01(g - E), to);
        grad.addColorStop(c01(g + E), from);
        grad.addColorStop(1, from);
      } else {
        const q = 1 - g;
        grad.addColorStop(0, from);
        grad.addColorStop(c01(q - E), from);
        grad.addColorStop(c01(q + E), to);
        grad.addColorStop(1, to);
      }
      return grad;
    }

    function draw() {
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, W, H);
      const dy = H / (R - 1);

      // colored gaps first
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let k = 0; k < B; k++) {
        const a = pos[k];
        const bq = pos[k + 1];
        ctx.beginPath();
        ctx.moveTo(a[0] * W, 0);
        for (let j = 1; j < R; j++) ctx.lineTo(a[j] * W, j * dy);
        for (let j = R - 1; j >= 0; j--) ctx.lineTo(bq[j] * W, j * dy);
        ctx.closePath();
        const col = bandFill(k);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.stroke(); // hides seams between bands
      }

      // the sides outside the first and last lines take their neighbouring
      // band's colour, so there's no paper showing at the edges
      for (const [line, k, edge] of [[0, 0, 0], [N - 1, B - 1, W]] as const) {
        const p = pos[line];
        ctx.beginPath();
        ctx.moveTo(edge, 0);
        for (let j = 0; j < R; j++) ctx.lineTo(p[j] * W, j * dy);
        ctx.lineTo(edge, H);
        ctx.closePath();
        const col = bandFill(k);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // photos where gaps have been pulled open
      drawReveals();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const l of layers) ctx.drawImage(l, 0, 0);
      if (drawTiles()) ctx.drawImage(tileLayer, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // each line's colour: a deep shade of the bands either side
      const lineH: number[] = [];
      const lineS: number[] = [];
      for (let i = 0; i < N; i++) {
        const l = Math.max(0, i - 1);
        const r = Math.min(B - 1, i);
        lineH.push(lerpHue(curH[l], curH[r], 0.5));
        lineS.push(Math.min(90, (curS[l] + curS[r]) / 2 + 10));
      }

      // lines on top: lines that used to be fainter are lighter shades
      ctx.lineCap = "butt";
      for (let i = 0; i < N; i++) {
        const on = i === active;
        const depth = (1 - curA[i]) / 0.45; // 0 = darkest line, 1 = lightest
        const lit = on ? 16 : 20 + depth * 26;
        ctx.strokeStyle = `hsl(${lineH[i].toFixed(1)} ${lineS[i].toFixed(1)}% ${lit.toFixed(1)}%)`;
        ctx.globalAlpha = on ? 1 : 0.92;
        const p = pos[i];
        for (let c = 0; c < NP; c++) {
          ctx.lineWidth = curW[i] * curP[i][c] + (on ? 1 : 0);
          ctx.beginPath();
          const j0 = c * CH;
          const j1 = Math.min(R - 1, j0 + CH);
          ctx.moveTo(p[j0] * W, j0 * dy);
          for (let j = j0 + 1; j <= j1; j++) ctx.lineTo(p[j] * W, j * dy);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // ---- morph into a new pattern: lines settle from the top down, like rope ----
    let anim = 0;
    let colorAnim = 0;
    let morphTo: Layout | null = null; // the pattern being morphed into, if any
    let seedTick = 1;
    const D_SPREAD = 0.3;
    const D_ROW = 0.24;
    const D_DUR = 0.62;
    const U_END = D_SPREAD + D_ROW + D_DUR;

    function ease(t: number) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const k = t - 1;
      return 1 + 1.9 * k * k * k + 0.9 * k * k; // settles with a small overshoot
    }
    function lerpHue(a: number, b: number, t: number) {
      const d = ((b - a + 540) % 360) - 180; // travel the short way round
      return (a + d * t + 360) % 360;
    }

    function adopt(to: Layout) {
      pos = to.rows.map((a) => Float32Array.from(a));
      rest = to.rows.map((a) => Float32Array.from(a));
      curW = to.wLine.slice();
      curA = to.aLine.slice();
      curP = to.press.map((a) => a.slice());
      curH = to.hue.slice();
      curS = to.sat.slice();
      curL = to.lit.slice();
      photo = to.photo.slice();
      patches.length = 0;
    }

    // the region of what's on screen around (px, py): flood fill out from the
    // click through similar colours, loosening the match until it's big enough
    function regionAt(px: number, py: number) {
      const w = Math.min(BOX, Math.floor(W));
      const h = Math.min(BOX, Math.floor(H));
      const x = Math.round(Math.max(0, Math.min(W - w, px - w / 2)));
      const y = Math.round(Math.max(0, Math.min(H - h, py - h / 2)));
      const work = document.createElement("canvas");
      work.width = w;
      work.height = h;
      const wc = work.getContext("2d", { willReadFrequently: true })!;
      wc.drawImage(cv, x * dpr, y * dpr, w * dpr, h * dpr, 0, 0, w, h);
      const px0 = wc.getImageData(0, 0, w, h).data;
      const seed = Math.min(h - 1, Math.round(py - y)) * w + Math.min(w - 1, Math.round(px - x));
      const sr = px0[seed * 4];
      const sg = px0[seed * 4 + 1];
      const sb = px0[seed * 4 + 2];
      const alpha = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      for (const tol of TOLS) {
        alpha.fill(0);
        const t2 = tol * tol;
        let head = 0;
        let tail = 0;
        queue[tail++] = seed;
        alpha[seed] = 255;
        while (head < tail) {
          const q = queue[head++];
          const qx = q % w;
          for (const n of [q - 1, q + 1, q - w, q + w]) {
            if (n < 0 || n >= w * h || alpha[n] || (n === q - 1 && qx === 0) || (n === q + 1 && qx === w - 1)) continue;
            const dr = px0[n * 4] - sr;
            const dg = px0[n * 4 + 1] - sg;
            const db = px0[n * 4 + 2] - sb;
            if (dr * dr + dg * dg + db * db > t2) continue;
            alpha[n] = 255;
            queue[tail++] = n;
          }
        }
        if (tail >= MIN_AREA) break;
      }
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const md = new ImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        md.data[i * 4 + 3] = alpha[i];
      }
      mask.getContext("2d")!.putImageData(md, 0, 0);
      return { x, y, w, h, alpha, mask };
    }

    // ---- letters swapping places ----
    // no OCR: text is found as rows of small, high-contrast, letter-sized
    // blobs of similar height and even spacing. Swapping two characters
    // reorders three vertical slices of the line: [A][between][B] becomes
    // [B][between][A], so nothing has to be repainted or guessed at.

    function blur1(src: Float32Array, w: number, h: number, r: number): Float32Array {
      let a: Float32Array = src;
      const tmp = new Float32Array(w * h);
      for (let pass = 0; pass < 2; pass++) {
        const out = new Float32Array(w * h);
        for (let y = 0; y < h; y++) {
          let acc = 0;
          for (let x = -r; x <= r; x++) acc += a[y * w + Math.max(0, Math.min(w - 1, x))];
          for (let x = 0; x < w; x++) {
            tmp[y * w + x] = acc / (2 * r + 1);
            acc += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)];
          }
        }
        for (let x = 0; x < w; x++) {
          let acc = 0;
          for (let y = -r; y <= r; y++) acc += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
          for (let y = 0; y < h; y++) {
            out[y * w + x] = acc / (2 * r + 1);
            acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
          }
        }
        a = out;
      }
      return a;
    }

    type Glyph = { l: number; t: number; r: number; b: number; area: number };

    function swapLetters(gap: number, px: number, py: number) {
      if (!imgs[photo[gap]].naturalWidth) return false;
      const w = Math.min(320, Math.floor(W));
      const h = Math.min(160, Math.floor(H));
      const x = Math.round(Math.max(0, Math.min(W - w, px - w / 2)));
      const y = Math.round(Math.max(0, Math.min(H - h, py - h / 2)));
      const sw = Math.round(w * dpr);
      const sh = Math.round(h * dpr);
      const n = sw * sh;

      // what's showing in this gap here (photo + earlier swaps), at full res
      const work = document.createElement("canvas");
      work.width = sw;
      work.height = sh;
      const wc = work.getContext("2d", { willReadFrequently: true })!;
      wc.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
      drawCover(wc, photo[gap]);
      for (const pa of patches) if (pa.gap === gap) wc.drawImage(pa.img, pa.x, pa.y, pa.w, pa.h);
      wc.setTransform(1, 0, 0, 1, 0, 0);
      const im = wc.getImageData(0, 0, sw, sh);
      const d = im.data;

      // ink: pixels well off their local background
      const L = new Float32Array(n);
      for (let i = 0; i < n; i++) L[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      const bg = blur1(L, sw, sh, Math.max(4, Math.round(9 * dpr)));
      const T = 34;
      // only what's actually showing in this gap counts
      const vis = document.createElement("canvas");
      vis.width = sw;
      vis.height = sh;
      const vc = vis.getContext("2d", { willReadFrequently: true })!;
      vc.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
      vc.fill(gapPath(gap));
      const shown = vc.getImageData(0, 0, sw, sh).data;
      // text is the opposite of its background: light on dark, dark on light
      let bgSum = 0;
      let cnt = 0;
      for (let i = 0; i < n; i++) {
        if (shown[i * 4 + 3] <= 127) continue;
        bgSum += bg[i];
        cnt++;
      }
      if (!cnt) return false;
      const sign = bgSum / cnt < 128 ? 1 : -1;
      const ink = new Uint8Array(n);
      for (let i = 0; i < n; i++) if (shown[i * 4 + 3] > 127 && sign * (L[i] - bg[i]) > T) ink[i] = 1;

      // blobs (8-connected)
      const seen = new Uint8Array(n);
      const q = new Int32Array(n);
      let blobs: Glyph[] = [];
      for (let s0 = 0; s0 < n; s0++) {
        if (!ink[s0] || seen[s0]) continue;
        let head = 0;
        let tail = 0;
        q[tail++] = s0;
        seen[s0] = 1;
        const g: Glyph = { l: s0 % sw, r: s0 % sw, t: (s0 / sw) | 0, b: (s0 / sw) | 0, area: 0 };
        while (head < tail) {
          const c = q[head++];
          const cx = c % sw;
          const cy = (c / sw) | 0;
          g.area++;
          if (cx < g.l) g.l = cx;
          if (cx > g.r) g.r = cx;
          if (cy < g.t) g.t = cy;
          if (cy > g.b) g.b = cy;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue;
              const m = ny * sw + nx;
              if (ink[m] && !seen[m]) {
                seen[m] = 1;
                q[tail++] = m;
              }
            }
        }
        blobs.push(g);
        if (blobs.length > 6000) return false; // noise, not text
      }
      // join dots and accents onto the letter below/above them
      blobs.sort((a, b) => a.l - b.l);
      for (let a = 0; a < blobs.length; a++) {
        const A = blobs[a];
        if (!A.area) continue;
        for (let b = a + 1; b < blobs.length && blobs[b].l <= A.r; b++) {
          const Bb = blobs[b];
          if (!Bb.area) continue;
          const ov = Math.min(A.r, Bb.r) - Math.max(A.l, Bb.l) + 1;
          const vgap = Math.max(A.t, Bb.t) - Math.min(A.b, Bb.b);
          const hh = Math.max(A.b - A.t, Bb.b - Bb.t) + 1;
          if (ov >= 0.5 * Math.min(A.r - A.l + 1, Bb.r - Bb.l + 1) && vgap < 0.5 * hh) {
            A.l = Math.min(A.l, Bb.l);
            A.r = Math.max(A.r, Bb.r);
            A.t = Math.min(A.t, Bb.t);
            A.b = Math.max(A.b, Bb.b);
            A.area += Bb.area;
            Bb.area = 0;
          }
        }
      }
      const minH = 5 * dpr;
      const maxH = 44 * dpr;
      blobs = blobs.filter((g) => {
        const gh = g.b - g.t + 1;
        const gw = g.r - g.l + 1;
        const fill = g.area / (gh * gw);
        // only letters that are actually showing in this gap
        const vis = gapAt(x + (g.l + g.r) / 2 / dpr, y + (g.t + g.b) / 2 / dpr) === gap;
        return g.area > 0 && gh >= minH && gh <= maxH && gw <= 2.4 * gh && fill > 0.12 && fill < 0.95 && vis;
      });
      if (blobs.length < 3) return false;

      // rows of similar-height blobs, split where the spacing jumps
      blobs.sort((a, b) => (a.t + a.b) / 2 - (b.t + b.b) / 2);
      const rows: { cy: number; h: number; gs: Glyph[] }[] = [];
      for (const g of blobs) {
        const gh = g.b - g.t + 1;
        const gc = (g.t + g.b) / 2;
        const row = rows.find((r) => Math.abs(gc - r.cy) < 0.45 * r.h && gh > 0.45 * r.h && gh < 2.2 * r.h);
        if (row) {
          row.gs.push(g);
          row.cy += (gc - row.cy) / row.gs.length;
          row.h += (gh - row.h) / row.gs.length;
        } else rows.push({ cy: gc, h: gh, gs: [g] });
      }
      const lines: Glyph[][] = [];
      for (const r of rows) {
        r.gs.sort((a, b) => a.l - b.l);
        let cur: Glyph[] = [];
        for (const g of r.gs) {
          if (cur.length && g.l - cur[cur.length - 1].r > 1.6 * r.h) {
            if (cur.length >= 3) lines.push(cur);
            cur = [];
          }
          cur.push(g);
        }
        if (cur.length >= 3) lines.push(cur);
      }
      // text has fairly even letter heights; noise doesn't
      const textLike = lines.filter((ln) => {
        const hs = ln.map((g) => g.b - g.t + 1);
        const mean = hs.reduce((a, b) => a + b, 0) / hs.length;
        const sd = Math.sqrt(hs.reduce((a, b) => a + (b - mean) ** 2, 0) / hs.length);
        return sd / mean < 0.45;
      });
      if (!textLike.length) return false;

      // the line nearest the click, if the click is on or right by it
      const cpx = (px - x) * dpr;
      const cpy = (py - y) * dpr;
      let line: Glyph[] | null = null;
      let bd = Infinity;
      for (const ln of textLike) {
        const l = ln[0].l;
        const r = ln[ln.length - 1].r;
        const t = Math.min(...ln.map((g) => g.t));
        const b = Math.max(...ln.map((g) => g.b));
        const dx = Math.max(l - cpx, 0, cpx - r);
        const dy = Math.max(t - cpy, 0, cpy - b);
        const dist = Math.hypot(dx, dy);
        if (dist < bd) {
          bd = dist;
          line = ln;
        }
      }
      if (!line) return false;
      const top = Math.max(0, Math.min(...line.map((g) => g.t)) - Math.round(2 * dpr));
      const bot = Math.min(sh - 1, Math.max(...line.map((g) => g.b)) + Math.round(2 * dpr));
      if (bd > (bot - top) + 14 * dpr) return false;

      // a few swaps near the click: neighbours, now and then one letter over
      let c0 = 0;
      for (let k = 1; k < line.length; k++)
        if (Math.abs((line[k].l + line[k].r) / 2 - cpx) < Math.abs((line[c0].l + line[c0].r) / 2 - cpx)) c0 = k;
      const lo = Math.max(0, c0 - 5);
      const hi = Math.min(line.length - 1, c0 + 5);
      const want = Math.min(1 + Math.floor(Math.random() * 3), Math.floor((hi - lo + 1) / 2));
      const used = new Uint8Array(line.length);
      const pad = 1;
      let ux0 = Infinity;
      let ux1 = -Infinity;
      let done = 0;
      const rowBuf = new Uint8ClampedArray(sw * 4);
      const orig = new Uint8ClampedArray(d);
      const bh = bot - top + 1;
      const hopArc = (bh / dpr) * 0.55;
      type Span = { x0: number; x1: number; bg: string };
      type Move = { img: HTMLCanvasElement; from: number; to: number; arc: number };
      const spans: Span[] = [];
      const moves: Move[] = [];
      // a vertical slice of the line (original pixels) as its own canvas
      const slice = (x0: number, x1: number) => {
        const c = document.createElement("canvas");
        c.width = Math.max(1, x1 - x0);
        c.height = bh;
        const id = new ImageData(c.width, bh);
        for (let yy = 0; yy < bh; yy++) {
          const row = (top + yy) * sw * 4;
          id.data.set(orig.subarray(row + x0 * 4, row + x1 * 4), yy * c.width * 4);
        }
        c.getContext("2d")!.putImageData(id, 0, 0);
        return c;
      };
      // the background behind the letters in a span: average of non-ink pixels
      const bgOf = (x0: number, x1: number) => {
        let r = 0, g = 0, b = 0, k = 0;
        for (let yy = top; yy <= bot; yy++)
          for (let xx = x0; xx < x1; xx++) {
            const i = yy * sw + xx;
            if (ink[i]) continue;
            r += orig[i * 4];
            g += orig[i * 4 + 1];
            b += orig[i * 4 + 2];
            k++;
          }
        if (!k) return "rgb(0,0,0)";
        return `rgb(${Math.round(r / k)},${Math.round(g / k)},${Math.round(b / k)})`;
      };
      for (let tries = 0; tries < 30 && done < want; tries++) {
        const a = lo + Math.floor(Math.random() * (hi - lo + 1));
        const b = a + (Math.random() < 0.75 ? 1 : 2);
        if (b > hi) continue;
        let free = true;
        for (let k = a; k <= b; k++) if (used[k]) free = false;
        if (!free) continue;
        const A = line[a];
        const Bg = line[b];
        const a0 = Math.max(0, A.l - pad);
        const a1 = A.r + 1 + pad;
        const b0 = Bg.l - pad;
        const b1 = Math.min(sw, Bg.r + 1 + pad);
        if (a1 > b0) continue; // touching letters: can't cut cleanly
        const wa = a1 - a0;
        const wm = b0 - a1;
        const wb = b1 - b0;
        // for the animation: A hops over, B ducks under, whatever's
        // between slides along if the two are different widths
        spans.push({ x0: a0, x1: b1, bg: bgOf(a0, b1) });
        moves.push({ img: slice(a0, a1), from: a0, to: a0 + wb + wm, arc: hopArc });
        moves.push({ img: slice(b0, b1), from: b0, to: a0, arc: -hopArc * 0.6 });
        if (wm > 0) moves.push({ img: slice(a1, b0), from: a1, to: a0 + wb, arc: 0 });
        // [A][M][B] -> [B][M][A], row by row across the line's band
        for (let yy = top; yy <= bot; yy++) {
          const row = yy * sw * 4;
          rowBuf.set(d.subarray(row + a0 * 4, row + b1 * 4), 0);
          d.set(rowBuf.subarray((wa + wm) * 4, (wa + wm + wb) * 4), row + a0 * 4);
          d.set(rowBuf.subarray(wa * 4, (wa + wm) * 4), row + (a0 + wb) * 4);
          d.set(rowBuf.subarray(0, wa * 4), row + (a0 + wb + wm) * 4);
        }
        for (let k = a; k <= b; k++) used[k] = 1;
        ux0 = Math.min(ux0, a0);
        ux1 = Math.max(ux1, b1);
        done++;
      }
      if (!done) return false;

      // just the changed strip becomes an overlay on the photo
      wc.putImageData(im, 0, 0);
      const cw = ux1 - ux0;
      const chh = bot - top + 1;
      const img = document.createElement("canvas");
      img.width = cw;
      img.height = chh;
      img.getContext("2d")!.drawImage(work, ux0, top, cw, chh, 0, 0, cw, chh);
      const before = document.createElement("canvas");
      before.width = cw;
      before.height = chh;
      wc.putImageData(new ImageData(orig, sw, sh), 0, 0);
      before.getContext("2d")!.drawImage(work, ux0, top, cw, chh, 0, 0, cw, chh);
      const hop: Hop = {
        before,
        spans: spans.map((sp) => ({ ...sp, x0: sp.x0 - ux0, x1: sp.x1 - ux0 })),
        moves: moves.map((m) => ({ ...m, from: m.from - ux0, to: m.to - ux0 })),
      };
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pa: Patch = {
        gap,
        x: x + ux0 / dpr,
        y: y + top / dpr,
        w: cw / dpr,
        h: chh / dpr,
        alpha: new Uint8Array(0),
        mask: img,
        img,
        k: photo[gap],
        d: 0,
        fx: px,
        fy: py,
        at: still ? -Infinity : performance.now(),
        text: true,
        hop,
      };
      patches.push(pa);
      diveSound(1);
      cancelAnimationFrame(fadeAnim);
      const step = () => {
        draw();
        if (performance.now() - pa.at < SWAP_MS) fadeAnim = requestAnimationFrame(step);
        else pa.hop = undefined; // done: just the final strip from here on
      };
      step();
      return true;
    }

    // the topmost swapped region under a point
    function patchAt(px: number, py: number) {
      for (let n = patches.length - 1; n >= 0; n--) {
        const pa = patches[n];
        if (pa.text) continue;
        const u = Math.floor(px - pa.x);
        const v = Math.floor(py - pa.y);
        if (u >= 0 && v >= 0 && u < pa.w && v < pa.h && pa.alpha[v * pa.w + u]) return pa;
      }
      return null;
    }

    // swap the region under a point one level deeper, crossfading in place
    function swapRegion(i: number, px: number, py: number) {
      const under = patchAt(px, py);
      const d = under ? under.d : 0;
      const k = under ? under.k : photo[i];
      // undo the zoom of what's showing to find where in photo k the click landed
      const z = ZOOM ** d;
      const fx = under ? under.fx : px;
      const fy = under ? under.fy : py;
      const spot = spotAt(k, fx + (px - fx) / z, fy + (py - fy) / z);
      if (!spot) return;
      diveSound(d + 1);
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pa: Patch = {
        gap: i,
        ...regionAt(px, py),
        img: document.createElement("canvas"),
        k: spot.open,
        d: d + 1,
        fx: px,
        fy: py,
        at: still ? -Infinity : performance.now(),
      };
      paint(pa);
      patches.push(pa);
      cancelAnimationFrame(fadeAnim);
      const step = () => {
        draw();
        if (performance.now() - pa.at < FADE_MS) fadeAnim = requestAnimationFrame(step);
      };
      step();
    }

    // the spot of photo k under a point (photos cover the canvas), else the nearest one
    function spotAt(k: number, px: number, py: number) {
      const im = imgs[k];
      const { crop, spots } = PHOTOS[k];
      const sw = im.naturalWidth * crop.w;
      const sh = im.naturalHeight * crop.h;
      const s = Math.max(W / sw, H / sh);
      const u = (px - (W - sw * s) / 2) / (sw * s);
      const v = (py - (H - sh * s) / 2) / (sh * s);
      let best: Spot | null = null;
      let bd = Infinity;
      for (const sp of spots) {
        if (u >= sp.x && u <= sp.x + sp.w && v >= sp.y && v <= sp.y + sp.h) return sp;
        const d = Math.hypot(u - (sp.x + sp.w / 2), v - (sp.y + sp.h / 2));
        if (d < bd) {
          bd = d;
          best = sp;
        }
      }
      return best;
    }

    function nextFamily() {
      // a different colour family each time, never the same one twice in a row
      family = (family + 1 + Math.floor(Math.random() * (FAMILIES.length - 1))) % FAMILIES.length;
      return family;
    }

    // new colours, same lines: shades sweep across the page left to right
    function recolor() {
      colorSound();
      const to = shades(rng((Date.now() ^ (seedTick++ * 2654435761)) | 0), nextFamily());
      if (morphTo) {
        // mid-morph: retarget it, it reads these as it goes
        morphTo.hue = to.hue;
        morphTo.sat = to.sat;
        morphTo.lit = to.lit;
        return;
      }
      cancelAnimationFrame(colorAnim);
      weave = null;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        curH = to.hue;
        curS = to.sat;
        curL = to.lit;
        draw();
        return;
      }
      // each band's start time: a couple of slow waves across the page plus
      // a little jitter, so the change wanders rather than sweeping
      const ph = Math.random() * 6.283;
      const ph2 = Math.random() * 6.283;
      const off: number[] = [];
      const down: boolean[] = [];
      const flip = Math.random() < 0.5;
      for (let i = 0; i < B; i++) {
        const w = 0.5 + 0.32 * Math.sin(i * 0.19 + ph) + 0.13 * Math.sin(i * 0.53 + ph2);
        off.push(Math.max(0, Math.min(1, w + (Math.random() - 0.5) * 0.1)));
        down.push((i % 2 === 0) !== flip);
      }
      weave = {
        fromH: curH.slice(), fromS: curS.slice(), fromL: curL.slice(),
        toH: to.hue, toS: to.sat, toL: to.lit,
        front: new Float32Array(B),
        down,
      };
      const wv = weave;
      const T = 1700;
      const SPREAD = 0.55; // share of the time between the first and last band starting
      const t0 = performance.now();
      const step = (now: number) => {
        const u = (now - t0) / T;
        for (let i = 0; i < B; i++) {
          const m = Math.max(0, Math.min(1, (u - SPREAD * off[i]) / (1 - SPREAD)));
          const e = m * m * (3 - 2 * m);
          wv.front[i] = e;
          // the lines between bands blend along with them
          curH[i] = lerpHue(wv.fromH[i], to.hue[i], e);
          curS[i] = wv.fromS[i] + (to.sat[i] - wv.fromS[i]) * e;
          curL[i] = wv.fromL[i] + (to.lit[i] - wv.fromL[i]) * e;
        }
        if (u >= 1) weave = null;
        draw();
        if (u < 1) colorAnim = requestAnimationFrame(step);
      };
      colorAnim = requestAnimationFrame(step);
    }

    function newPattern() {
      playChime();
      cancelAnimationFrame(anim);
      cancelAnimationFrame(colorAnim);
      weave = null;
      drag = null;
      active = -1;
      cv.style.cursor = "default";

      const to = buildLayout((Date.now() ^ (seedTick++ * 2654435761)) | 0, nextFamily());
      const fromPos = pos.map((a) => Float32Array.from(a));
      const fromRest = rest.map((a) => Float32Array.from(a));
      const fromW = curW.slice();
      const fromA = curA.slice();
      const fromP = curP.map((a) => a.slice());
      const fromH = curH.slice();
      const fromS = curS.slice();
      const fromL = curL.slice();

      const rnd = rng(seedTick * 77731);
      const delay: number[] = [];
      for (let i = 0; i < N; i++) delay.push(rnd() * D_SPREAD);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        adopt(to);
        draw();
        return;
      }

      morphTo = to;
      const T = 1500;
      const t0 = performance.now();
      const step = (now: number) => {
        const u = ((now - t0) / T) * U_END;
        for (let i = 0; i < N; i++) {
          const head = (u - delay[i]) / D_DUR;
          for (let j = 0; j < R; j++) {
            const e = ease(head - (D_ROW * (j / (R - 1))) / D_DUR);
            pos[i][j] = fromPos[i][j] + (to.rows[i][j] - fromPos[i][j]) * e;
            // rest moves in step, so any pulled-open gaps close as it settles
            rest[i][j] = fromRest[i][j] + (to.rows[i][j] - fromRest[i][j]) * e;
          }
          const m = Math.max(0, Math.min(1, head));
          curW[i] = fromW[i] + (to.wLine[i] - fromW[i]) * m;
          curA[i] = fromA[i] + (to.aLine[i] - fromA[i]) * m;
          for (let c = 0; c < NP; c++) curP[i][c] = fromP[i][c] + (to.press[i][c] - fromP[i][c]) * m;
        }
        for (let i = 0; i < B; i++) {
          const m = Math.max(0, Math.min(1, (u - delay[i]) / D_DUR));
          curH[i] = lerpHue(fromH[i], to.hue[i], m);
          curS[i] = fromS[i] + (to.sat[i] - fromS[i]) * m;
          curL[i] = fromL[i] + (to.lit[i] - fromL[i]) * m;
        }
        draw();
        if (u < U_END) anim = requestAnimationFrame(step);
        else {
          morphTo = null;
          adopt(to);
          draw();
        }
      };
      step(t0);
    }

    // ---- dragging ----
    let drag: {
      i: number;
      r: number;
      startX: number;
      S: Float32Array[];
      lastX: number; // where the last brush sound played
      lastT: number;
      open: boolean; // a gap beside the line is pulled wide enough to show its photo
    } | null = null;
    const BRUSH_PX = 22; // px of drag between soft plucks
    const local = (e: PointerEvent | MouseEvent) => {
      const b = cv.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    function find(px: number, py: number) {
      const j = Math.max(0, Math.min(R - 1, Math.round((py / H) * (R - 1))));
      let best = -1;
      let bd = 18;
      for (let i = 0; i < N; i++) {
        const d = Math.abs(pos[i][j] * W - px);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best < 0 ? null : { i: best, r: j };
    }

    // the gap whose photo is showing at a point, if it's pulled open enough
    function gapAt(px: number, py: number) {
      const j = Math.max(0, Math.min(R - 1, Math.round((py / H) * (R - 1))));
      for (let i = 0; i < B; i++) {
        const a = pos[i][j] * W;
        const b = pos[i + 1][j] * W;
        if (px < a || px >= b) continue;
        const open = (pos[i + 1][j] - pos[i][j] - (rest[i + 1][j] - rest[i][j])) * W;
        return open >= REVEAL_PX * 0.6 && imgs[photo[i]].naturalWidth ? i : -1;
      }
      return -1;
    }

    // how far the gaps either side of line i have opened past rest at row r, px
    function gapOpen(i: number, r: number) {
      let m = 0;
      for (const g of [i - 1, i]) {
        if (g < 0 || g >= B) continue;
        m = Math.max(m, (pos[g + 1][r] - pos[g][r] - (rest[g + 1][r] - rest[g][r])) * W);
      }
      return m;
    }

    function dragSounds(x: number) {
      if (!drag) return;
      const dx = x - drag.lastX;
      if (Math.abs(dx) >= BRUSH_PX) {
        const now = performance.now();
        brushLine(dx, Math.abs(dx) / Math.max(1, now - drag.lastT) * 16);
        drag.lastX = x;
        drag.lastT = now;
      }
      const o = gapOpen(drag.i, drag.r);
      if (!drag.open && o >= REVEAL_PX) {
        drag.open = true;
        revealBloom();
      } else if (drag.open && o < REVEAL_PX * 0.4) drag.open = false;
    }

    function apply(D: number) {
      if (!drag) return;
      const gap = MIN_GAP / Math.max(W, 1);
      const { S, i: i0, r: r0 } = drag;
      for (let j = 0; j < R; j++) {
        const t = (j - r0) / SIGMA;
        pos[i0][j] = S[i0][j] + D * Math.exp(-0.5 * t * t);
        for (let k = i0 + 1; k < N; k++) pos[k][j] = Math.max(S[k][j], pos[k - 1][j] + gap);
        for (let k = i0 - 1; k >= 0; k--) pos[k][j] = Math.min(S[k][j], pos[k + 1][j] - gap);
      }
    }

    let downAt: { x: number; y: number } | null = null;
    const CLICK_PX = 5;

    function onDown(e: PointerEvent) {
      unlockAudio();
      cv.focus({ preventScroll: true });
      const p = local(e);
      downAt = p;
      const h = find(p.x, p.y);
      if (!h) return;
      cancelAnimationFrame(anim);
      cv.setPointerCapture(e.pointerId);
      drag = {
        i: h.i,
        r: h.r,
        startX: p.x,
        S: pos.map((a) => Float32Array.from(a)),
        lastX: p.x,
        lastT: performance.now(),
        open: gapOpen(h.i, h.r) >= REVEAL_PX,
      };
      grabLine(pos[h.i][h.r]);
      active = h.i;
      cv.style.cursor = "grabbing";
      draw();
      e.preventDefault();
    }
    function onMove(e: PointerEvent) {
      const p = local(e);
      if (drag) {
        apply((Math.max(0, Math.min(W, p.x)) - drag.startX) / W);
        dragSounds(p.x);
        draw();
        return;
      }
      const h = find(p.x, p.y);
      const a = h ? h.i : -1;
      cv.style.cursor = gapAt(p.x, p.y) >= 0 ? "pointer" : a >= 0 ? "grab" : "default";
      if (a !== active) {
        active = a;
        draw();
      }
    }
    function onEnd(e: PointerEvent) {
      const p = local(e);
      // a press that barely moved on a revealed photo swaps the region under it
      const tap = downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) < CLICK_PX;
      downAt = null;
      if (tap) {
        const i = gapAt(p.x, p.y);
        if (i >= 0 && !swapLetters(i, p.x, p.y)) swapRegion(i, p.x, p.y);
      }
      if (!drag) return;
      if (!tap) releaseLine();
      drag = null;
      const h = find(p.x, p.y);
      active = h ? h.i : -1;
      cv.style.cursor = gapAt(p.x, p.y) >= 0 ? "pointer" : active >= 0 ? "grab" : "default";
      draw();
    }
    function onLeave() {
      if (!drag && active !== -1) {
        active = -1;
        draw();
      }
    }
    // double-click empty space for a new pattern
    function onDbl(e: MouseEvent) {
      const p = local(e);
      if (!find(p.x, p.y)) newPattern();
    }
    function onKey(e: KeyboardEvent) {
      unlockAudio();
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        newPattern();
      }
    }

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onEnd);
    cv.addEventListener("pointercancel", onEnd);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("dblclick", onDbl);
    window.addEventListener("keydown", onKey);
    actions.current = {
      reset: () => {
        unlockAudio();
        newPattern();
      },
      recolor: () => {
        unlockAudio();
        recolor();
      },
    };
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    cv.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(anim);
      cancelAnimationFrame(fadeAnim);
      cancelAnimationFrame(colorAnim);
      ro.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onEnd);
      cv.removeEventListener("pointercancel", onEnd);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("dblclick", onDbl);
      window.removeEventListener("keydown", onKey);
      for (const im of imgs) im.onload = null;
      stopAudio();
    };
  }, []);

  return (
    <div style={{ background: PAPER, minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Wavy vertical lines with colored bands between them. Drag a line sideways to open the gaps and reveal the photos behind; click a photo to swap the shape under the pointer for a piece of another, deeper each click. Press S for a new pattern."
        style={{
          width: "100%",
          height: "max(100vh, 640px)",
          display: "block",
          touchAction: "none",
          cursor: "default",
          background: PAPER,
          outline: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          display: "flex",
          gap: 8,
        }}
      >
        <IconButton label="New pattern (S)" onClick={() => actions.current.reset()}>
          <path d="M13 8a5 5 0 1 1-1.6-3.7" />
          <path d="M13 2.2v3h-3" />
        </IconButton>
        <IconButton label="New colours" onClick={() => actions.current.recolor()}>
          <path d="M8 1.8C8 1.8 3.5 6.6 3.5 9.7a4.5 4.5 0 0 0 9 0C12.5 6.6 8 1.8 8 1.8z" />
          <path d="M6 10.2a2 2 0 0 0 2 1.8" />
        </IconButton>
        <IconButton
          label={music ? "Music off" : "Music on"}
          onClick={() => {
            const on = !music;
            setMusic(on);
            setMusicState(on);
          }}
        >
          <path d="M6 12V3l7-1.5V10.5" />
          <circle cx="4.2" cy="12" r="1.8" fill="currentColor" />
          <circle cx="11.2" cy="10.5" r="1.8" fill="currentColor" />
          {!music && <path d="M2 2l12 12" strokeWidth="1.6" />}
        </IconButton>
      </div>
    </div>
  );
}
