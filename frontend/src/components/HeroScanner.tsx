"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, MoveHorizontal } from "lucide-react";
import type { DamageGeoJSON, DamageTier, DataProfile, Site } from "@/lib/types";
import { DAMAGE_COLORS } from "@/lib/types";
import { siteLabel } from "./siteFormat";

export interface HeroScene {
  site: Site;
  profile: DataProfile;
}

interface Detection {
  id: number;
  tier: DamageTier;
  cx: number;
  cy: number;
  points: string;
}

const SCENE_DURATION = 14000;
const SWEEP_AMPLITUDE = 0.36;

function toDetections(site: Site, geo: DamageGeoJSON): Detection[] {
  const [[south, west], [north, east]] = site.bounds;
  const w = east - west || 1;
  const h = north - south || 1;
  return geo.features
    .filter((f) => f.geometry?.type === "Polygon" && f.geometry.coordinates?.[0]?.length)
    .map((f, i) => {
      const ring = f.geometry.coordinates[0];
      let sx = 0;
      let sy = 0;
      const pts = ring.map(([lng, lat]) => {
        const x = ((lng - west) / w) * 1000;
        const y = ((north - lat) / h) * 1000;
        sx += x;
        sy += y;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return {
        id: f.properties?.building_id ?? i,
        tier: (f.properties?.damage_tier as DamageTier) ?? "no-damage",
        cx: sx / ring.length,
        cy: sy / ring.length,
        points: pts.join(" "),
      };
    });
}

export default function HeroScanner({ scenes }: { scenes: HeroScene[] }) {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.3 });

  const [index, setIndex] = useState(0);
  const [detections, setDetections] = useState<Record<string, Detection[]>>({});
  const [interacting, setInteracting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [percent, setPercent] = useState(50);

  const frac = useMotionValue(0.5);
  const clip = useTransform(frac, (f) => `inset(0 0 0 ${(f * 100).toFixed(2)}%)`);
  const left = useTransform(frac, (f) => `${(f * 100).toFixed(2)}%`);
  useMotionValueEvent(frac, "change", (f) => setPercent(Math.round(f * 100)));

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scene = scenes[index];
  const label = useMemo(() => (scene ? siteLabel(scene.site) : null), [scene]);

  // Load detections for the active scene (cached per site)
  useEffect(() => {
    if (!scene) return;
    const key = `${scene.profile}:${scene.site.id}`;
    if (detections[key]) return;
    let cancelled = false;
    fetch(scene.site.damage_geojson)
      .then((r) => r.json())
      .then((geo: DamageGeoJSON) => {
        if (!cancelled) setDetections((d) => ({ ...d, [key]: toDetections(scene.site, geo) }));
      })
      .catch(() => {
        if (!cancelled) setDetections((d) => ({ ...d, [key]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [scene, detections]);

  // Idle auto-sweep: the divider glides back and forth until someone takes over
  useEffect(() => {
    if (reduceMotion || interacting || !inView) return;
    let raf = 0;
    let phase = Math.asin(Math.max(-1, Math.min(1, (frac.get() - 0.5) / SWEEP_AMPLITUDE)));
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      phase += dt * 0.55;
      const target = 0.5 + SWEEP_AMPLITUDE * Math.sin(phase);
      frac.set(frac.get() + (target - frac.get()) * 0.08);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, interacting, inView, frac]);

  // Advance to the next scene while nobody is interacting
  useEffect(() => {
    if (reduceMotion || interacting || !inView || scenes.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % scenes.length), SCENE_DURATION);
    return () => clearTimeout(t);
  }, [index, reduceMotion, interacting, inView, scenes.length]);

  const takeOver = useCallback((releaseAfter = 1600) => {
    setInteracting(true);
    setHasInteracted(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setInteracting(false), releaseAfter);
  }, []);

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const moveTo = useCallback(
    (clientX: number) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      frac.set(Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width)));
    },
    [frac]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.15 : 0.05;
    if (e.key === "ArrowLeft") frac.set(Math.max(0.02, frac.get() - step));
    else if (e.key === "ArrowRight") frac.set(Math.min(0.98, frac.get() + step));
    else if (e.key === "Home") frac.set(0.02);
    else if (e.key === "End") frac.set(0.98);
    else return;
    e.preventDefault();
    takeOver(4000);
  };

  if (!scene || !label) return null;
  const activeKey = `${scene.profile}:${scene.site.id}`;
  const activeDetections = detections[activeKey];
  const { summary } = scene.site;

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison. Use the arrow keys to move the divider."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}% before, ${100 - percent}% after`}
        onKeyDown={onKeyDown}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons > 0) {
            moveTo(e.clientX);
            takeOver();
          }
        }}
        onPointerDown={(e) => {
          moveTo(e.clientX);
          takeOver(2400);
        }}
        className="group relative aspect-square w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-frame bg-deep shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] ring-1 ring-signal/15"
      >
        {/* Image stacks for every scene, crossfaded so switching never flashes */}
        {scenes.map((s, i) => (
          <motion.div
            key={`${s.profile}:${s.site.id}`}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === index ? 1 : 0, scale: i === index ? 1 : 1.04 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden={i !== index}
          >
            <Image
              src={s.site.pre_image}
              alt={`Before the disaster: ${siteLabel(s.site).full}`}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 620px, 100vw"
              className="object-cover"
              draggable={false}
            />
            <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
              <Image
                src={s.site.post_image}
                alt={`After the disaster: ${siteLabel(s.site).full}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 620px, 100vw"
                className="object-cover"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        ))}

        {/* Model detections, visible on the "after" side only */}
        <motion.svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ clipPath: clip }}
          aria-hidden
        >
          <AnimatePresence mode="wait">
            {activeDetections && (
              <motion.g key={activeKey} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {activeDetections.map((d, i) => {
                  const color = DAMAGE_COLORS[d.tier] ?? "#fff";
                  const severe = d.tier === "destroyed" || d.tier === "major-damage";
                  return (
                    <motion.g
                      key={`${d.id}-${i}`}
                      initial={{ opacity: 0, scale: 2.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + Math.min(i, 80) * 0.012, duration: 0.5, ease: "easeOut" }}
                    >
                      <polygon
                        points={d.points}
                        fill={color}
                        fillOpacity={0.35}
                        stroke={color}
                        strokeWidth={1.4}
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle
                        cx={d.cx}
                        cy={d.cy}
                        r={severe ? 9 : 6}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                        opacity={0.9}
                      />
                      {severe && !reduceMotion && (
                        <circle
                          cx={d.cx}
                          cy={d.cy}
                          r={9}
                          fill="none"
                          stroke={color}
                          strokeWidth={1.2}
                          vectorEffect="non-scaling-stroke"
                        >
                          <animate attributeName="r" values="9;26" dur="2.2s" begin={`${(i % 7) * 0.3}s`} repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0" dur="2.2s" begin={`${(i % 7) * 0.3}s`} repeatCount="indefinite" />
                        </circle>
                      )}
                    </motion.g>
                  );
                })}
              </motion.g>
            )}
          </AnimatePresence>
        </motion.svg>

        {/* Scene frame */}
        <div aria-hidden className="reg-marks pointer-events-none absolute inset-4 opacity-80" />

        {/* Divider */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 -ml-px w-[2px]"
          style={{ left }}
        >
          <div className="spectrum-line-v absolute inset-0 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-ink/80 backdrop-blur-md transition-transform duration-300 group-active:scale-110">
            <MoveHorizontal className="h-5 w-5 text-paper" strokeWidth={2} />
          </div>
        </motion.div>

        {/* Side labels */}
        <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex justify-between text-xs font-medium sm:inset-x-7 sm:top-7">
          <span className="rounded-full bg-ink/75 px-3 py-1.5 text-paper backdrop-blur-md">Before</span>
          <span className="rounded-full bg-ink/75 px-3 py-1.5 text-paper backdrop-blur-md">After, with detections</span>
        </div>

        {/* First-visit hint */}
        <AnimatePresence>
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center"
            >
              <span className="rounded-full bg-ink/80 px-3.5 py-1.5 text-xs text-paper backdrop-blur-md">
                Move across the image to compare
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption + scene picker */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="min-w-0"
          >
            <p className="truncate text-sm text-haze">{label.event}</p>
            <p className="type-wide truncate text-lg font-semibold text-paper">{label.title}</p>
            <p className="tabular mt-0.5 text-sm text-haze">
              {summary.total_structures} buildings found
              {summary.destroyed > 0 && (
                <>
                  , <span className="text-damage-destroyed">{summary.destroyed} destroyed</span>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="flex gap-2" role="tablist" aria-label="Choose a scene">
            {scenes.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={`${s.profile}:${s.site.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-label={siteLabel(s.site).full}
                  onClick={() => setIndex(i)}
                  className={`relative h-12 w-12 overflow-hidden rounded-xl ring-1 transition-all duration-300 ${
                    active ? "ring-signal" : "opacity-60 ring-signal/15 hover:opacity-100"
                  }`}
                >
                  <Image src={s.site.post_image} alt="" fill sizes="48px" className="object-cover" />
                  {active && !reduceMotion && !interacting && inView && scenes.length > 1 && (
                    <motion.span
                      key={`progress-${index}`}
                      className="spectrum-line absolute inset-x-0 bottom-0 h-[3px] origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: SCENE_DURATION / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <Link
            href={`/site/${scene.site.id}?profile=${scene.profile}`}
            className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-white"
          >
            Open this site
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
