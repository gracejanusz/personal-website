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

// Each photo with a source crop (fractions) to trim screenshot chrome.
const PHOTOS = [
  { src: quiltSrc, crop: { x: 0, y: 0, w: 1, h: 1 } },
  { src: streaksSrc, crop: { x: 0, y: 0.075, w: 1, h: 0.88 } },
  { src: greenSrc, crop: { x: 0, y: 0, w: 1, h: 1 } },
  { src: terminalSrc, crop: { x: 0, y: 0, w: 1, h: 1 } },
  { src: bytesSrc, crop: { x: 0, y: 0, w: 1, h: 1 } },
  { src: lobsterSrc, crop: { x: 0, y: 0, w: 0.98, h: 1 } },
  { src: bandsSrc, crop: { x: 0, y: 0.016, w: 1, h: 0.984 } },
  { src: drawingSrc, crop: { x: 0, y: 0, w: 1, h: 1 } },
  { src: stretchedSrc, crop: { x: 0, y: 0.016, w: 1, h: 0.984 } },
  { src: collageSrc, crop: { x: 0, y: 0.016, w: 1, h: 0.984 } },
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

    const imgs = PHOTOS.map((p) => {
      const im = new Image();
      im.src = p.src;
      im.onload = () => draw();
      return im;
    });
    // one offscreen layer per photo: reveal mask, then photo composited into it
    const layers = PHOTOS.map(() => document.createElement("canvas"));

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
      for (const l of layers) {
        l.width = cv.width;
        l.height = cv.height;
      }
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

    function onDown(e: PointerEvent) {
      cv.focus({ preventScroll: true });
      const p = local(e);
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
      if (a !== active) {
        active = a;
        cv.style.cursor = a >= 0 ? "grab" : "default";
        draw();
      }
    }
    function onEnd(e: PointerEvent) {
      if (!drag) return;
      drag = null;
      const p = local(e);
      const h = find(p.x, p.y);
      active = h ? h.i : -1;
      cv.style.cursor = active >= 0 ? "grab" : "default";
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
        aria-label="Wavy vertical lines with colored bands between them. Drag a line sideways to open the gaps and reveal the photos behind. Press S for a new pattern."
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
