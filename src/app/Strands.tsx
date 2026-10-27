import { useEffect, useRef } from "react";
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

function buildLayout(seed: number) {
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

  // one color per gap: a hue that drifts along the page and now and then jumps
  const hue: number[] = [];
  const sat: number[] = [];
  const lit: number[] = [];
  let h = rnd() * 360;
  for (let k = 0; k < B; k++) {
    const step = rnd() < 0.13 ? 55 + rnd() * 125 : 4 + rnd() * 17;
    h = (h + step * (rnd() < 0.25 ? -1 : 1) + 360) % 360;
    hue.push(h);
    sat.push(26 + rnd() * 44);
    lit.push(rnd() < 0.1 ? 90 + rnd() * 6 : 61 + rnd() * 25);
  }

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
};

export default function Strands() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.title = "Strands";
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;

    const layout = buildLayout(20261025);
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
        t.globalAlpha = Math.min(1, (now - pa.at) / FADE_MS);
        t.drawImage(pa.img, pa.x, pa.y, pa.w, pa.h);
        t.restore();
      }
      return true;
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
        const col = `hsl(${curH[k].toFixed(1)} ${curS[k].toFixed(1)}% ${curL[k].toFixed(1)}%)`;
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.stroke(); // hides seams between bands
      }

      // photos where gaps have been pulled open
      drawReveals();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const l of layers) ctx.drawImage(l, 0, 0);
      if (drawTiles()) ctx.drawImage(tileLayer, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ink on top
      ctx.strokeStyle = INK;
      ctx.lineCap = "butt";
      for (let i = 0; i < N; i++) {
        const on = i === active;
        ctx.globalAlpha = on ? 1 : curA[i];
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

    // the topmost swapped region under a point
    function patchAt(px: number, py: number) {
      for (let n = patches.length - 1; n >= 0; n--) {
        const pa = patches[n];
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

    function newPattern() {
      cancelAnimationFrame(anim);
      drag = null;
      active = -1;
      cv.style.cursor = "default";

      const to = buildLayout((Date.now() ^ (seedTick++ * 2654435761)) | 0);
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
          adopt(to);
          draw();
        }
      };
      step(t0);
    }

    // ---- dragging ----
    let drag: { i: number; r: number; startX: number; S: Float32Array[] } | null = null;
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
      cv.focus({ preventScroll: true });
      const p = local(e);
      downAt = p;
      const h = find(p.x, p.y);
      if (!h) return;
      cancelAnimationFrame(anim);
      cv.setPointerCapture(e.pointerId);
      drag = { i: h.i, r: h.r, startX: p.x, S: pos.map((a) => Float32Array.from(a)) };
      active = h.i;
      cv.style.cursor = "grabbing";
      draw();
      e.preventDefault();
    }
    function onMove(e: PointerEvent) {
      const p = local(e);
      if (drag) {
        apply((Math.max(0, Math.min(W, p.x)) - drag.startX) / W);
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
        if (i >= 0) swapRegion(i, p.x, p.y);
      }
      if (!drag) return;
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
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    cv.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(anim);
      cancelAnimationFrame(fadeAnim);
      ro.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onEnd);
      cv.removeEventListener("pointercancel", onEnd);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("dblclick", onDbl);
      window.removeEventListener("keydown", onKey);
      for (const im of imgs) im.onload = null;
    };
  }, []);

  return (
    <div style={{ background: PAPER, minHeight: "100vh" }}>
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
    </div>
  );
}
