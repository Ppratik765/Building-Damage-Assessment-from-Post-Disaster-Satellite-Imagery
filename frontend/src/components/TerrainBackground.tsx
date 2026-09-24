"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport animated topographic map.
 *
 * A slowly drifting noise field is contoured with marching squares every
 * frame. The cursor raises a "hotspot" in the terrain whose highest rings
 * are drawn in the Joint Damage Scale colours, and scrolling drifts the
 * terrain for a parallax feel. Falls back to a single static frame when
 * the user prefers reduced motion, and pauses when the tab is hidden.
 */

type Noise2D = (x: number, y: number) => number;

function makeNoise(seed: number): Noise2D {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

  const grad = (h: number, x: number, y: number) => {
    switch (h & 7) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      case 4: return x;
      case 5: return -x;
      case 6: return y;
      default: return -y;
    }
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);

  return (x: number, y: number) => {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const X = fx & 255;
    const Y = fy & 255;
    const xf = x - fx;
    const yf = y - fy;
    const u = fade(xf);
    const v = fade(yf);
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    return lerp(
      lerp(grad(p[a], xf, yf), grad(p[b], xf - 1, yf), u),
      lerp(grad(p[a + 1], xf, yf - 1), grad(p[b + 1], xf - 1, yf - 1), u),
      v
    );
  };
}

// Edge ids: 0 top, 1 right, 2 bottom, 3 left
const SEGMENTS: number[][] = [
  [],
  [3, 2],
  [2, 1],
  [3, 1],
  [0, 1],
  [3, 0, 2, 1],
  [0, 2],
  [3, 0],
  [3, 0],
  [0, 2],
  [0, 1, 3, 2],
  [0, 1],
  [3, 1],
  [2, 1],
  [3, 2],
  [],
];

const BASE_LEVELS = Array.from({ length: 11 }, (_, i) => -0.75 + i * 0.15);
const HOT_LEVELS: { level: number; color: string }[] = [
  { level: 0.98, color: "34, 197, 94" },
  { level: 1.22, color: "234, 179, 8" },
  { level: 1.46, color: "249, 115, 22" },
  { level: 1.7, color: "239, 68, 68" },
];

export default function TerrainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noise = makeNoise(20260924);

    let width = 0;
    let height = 0;
    let cell = 26;
    let cols = 0;
    let rows = 0;
    let field = new Float32Array(0);

    // Pointer state (smoothed)
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, strength: 0, target: 0 };
    let lastMove = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      cell = width < 640 ? 32 : 26;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / cell) + 2;
      rows = Math.ceil(height / cell) + 2;
      field = new Float32Array(cols * rows);
    };

    const sample = (t: number) => {
      const scroll = window.scrollY * 0.22;
      const sigma2 = 2 * 150 * 150;
      const amp = 1.3 * pointer.strength;
      for (let j = 0; j < rows; j++) {
        const y = j * cell;
        for (let i = 0; i < cols; i++) {
          const x = i * cell;
          const wy = y + scroll;
          let v =
            noise(x * 0.0021 + t * 0.017, wy * 0.0021 - t * 0.011) * 0.82 +
            noise(x * 0.0054 - t * 0.024 + 40.3, wy * 0.0054 + t * 0.019 + 12.7) * 0.34;
          if (amp > 0.001) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            v += amp * Math.exp(-(dx * dx + dy * dy) / sigma2);
          }
          field[j * cols + i] = v;
        }
      }
    };

    const contour = (level: number) => {
      for (let j = 0; j < rows - 1; j++) {
        const y0 = j * cell;
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i];
          const b = field[j * cols + i + 1];
          const c = field[(j + 1) * cols + i + 1];
          const d = field[(j + 1) * cols + i];
          const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const segs = SEGMENTS[idx];
          const x0 = i * cell;
          for (let s = 0; s < segs.length; s += 2) {
            for (let e = 0; e < 2; e++) {
              const edge = segs[s + e];
              let px = x0;
              let py = y0;
              if (edge === 0) px = x0 + (cell * (level - a)) / (b - a);
              else if (edge === 1) {
                px = x0 + cell;
                py = y0 + (cell * (level - b)) / (c - b);
              } else if (edge === 2) {
                px = x0 + (cell * (level - d)) / (c - d);
                py = y0 + cell;
              } else py = y0 + (cell * (level - a)) / (d - a);
              if (e === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
          }
        }
      }
    };

    const draw = (t: number) => {
      sample(t);
      ctx.clearRect(0, 0, width, height);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      BASE_LEVELS.forEach((level, k) => {
        const isIndex = k % 3 === 1;
        ctx.beginPath();
        contour(level);
        ctx.lineWidth = isIndex ? 1.1 : 0.7;
        ctx.strokeStyle = isIndex ? "rgba(165, 184, 255, 0.13)" : "rgba(165, 184, 255, 0.06)";
        ctx.stroke();
      });

      if (pointer.strength > 0.02) {
        HOT_LEVELS.forEach(({ level, color }) => {
          ctx.beginPath();
          contour(level);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = `rgba(${color}, ${0.5 * pointer.strength})`;
          ctx.stroke();
        });
      }
    };

    resize();

    if (reduceMotion) {
      draw(0);
      const onResize = () => {
        resize();
        draw(0);
      };
      window.addEventListener("resize", onResize);
      canvas.style.opacity = "1";
      return () => window.removeEventListener("resize", onResize);
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      if (pointer.x < -9000) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
      pointer.target = 1;
      lastMove = performance.now();
    };
    const onPointerLeave = () => {
      pointer.target = 0;
    };

    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return; // ~30 fps is plenty for drifting terrain
      last = now;

      if (now - lastMove > 2600) pointer.target = 0;
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      pointer.strength += (pointer.target - pointer.strength) * 0.06;

      draw((now - start) / 1000);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);
    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-[1600ms] ease-out"
      />
      {/* Vignette so content always sits on calm ground */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,11,28,0.75)_100%)]" />
    </div>
  );
}
