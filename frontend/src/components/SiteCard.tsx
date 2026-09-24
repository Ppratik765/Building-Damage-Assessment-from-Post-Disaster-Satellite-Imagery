"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, MapPinOff } from "lucide-react";
import type { Site, DataProfile } from "@/lib/types";
import SeverityBar from "./SeverityBar";
import { formatCoords, hasRealCoords, siteLabel } from "./siteFormat";

interface SiteCardProps {
  site: Site;
  profile?: DataProfile;
  priority?: boolean;
}

export default function SiteCard({ site, profile = "data", priority = false }: SiteCardProps) {
  const { summary } = site;
  const label = siteLabel(site);
  const cardRef = useRef<HTMLElement>(null);
  const [scrub, setScrub] = useState<number | null>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const onMediaMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    setScrub(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
  };

  const scrubbing = scrub !== null;

  return (
    <Link
      href={`/site/${site.id}?profile=${profile}`}
      id={`site-card-${profile}-${site.id}`}
      className="group block h-full rounded-[22px] focus-visible:outline-offset-4"
      aria-label={`${label.full}: ${summary.total_structures} buildings, ${summary.destroyed} destroyed`}
    >
      <article
        ref={cardRef}
        onPointerMove={onPointerMove}
        className="spotlight panel flex h-full flex-col overflow-hidden rounded-[22px] transition-[background-color] duration-300 group-hover:bg-deep/90"
      >
        {/* Media: hover scrubs between before (left) and after (right) */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-ink"
          onPointerMove={onMediaMove}
          onPointerLeave={() => setScrub(null)}
        >
          <Image
            src={site.post_image}
            alt={`After: ${label.full}`}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div
            className="absolute inset-0"
            style={{
              clipPath: scrubbing ? `inset(0 ${100 - (scrub ?? 0)}% 0 0)` : "inset(0 100% 0 0)",
              transition: scrubbing ? "none" : "clip-path 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <Image
              src={site.pre_image}
              alt={`Before: ${label.full}`}
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          </div>

          {scrubbing && (
            <div
              aria-hidden
              className="spectrum-line-v pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
              style={{ left: `${scrub}%` }}
            />
          )}

          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-3 top-3 flex justify-between text-2xs font-medium text-paper transition-opacity duration-300 ${
              scrubbing ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="rounded-full bg-ink/75 px-2 py-0.5 backdrop-blur">Before</span>
            <span className="rounded-full bg-ink/75 px-2 py-0.5 backdrop-blur">After</span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 text-xs">
            <span className="tabular rounded-full bg-ink/75 px-2.5 py-1 text-paper backdrop-blur">
              {summary.total_structures > 0
                ? `${summary.total_structures} building${summary.total_structures === 1 ? "" : "s"}`
                : "No buildings detected"}
            </span>
            {summary.destroyed > 0 && (
              <span className="tabular rounded-full bg-damage-destroyed/90 px-2.5 py-1 font-semibold text-white">
                {summary.destroyed} destroyed
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="truncate text-xs text-haze">{label.event}</p>
            <h3 className="type-wide mt-0.5 truncate text-lg font-semibold text-paper transition-colors group-hover:text-white">
              {label.title}
            </h3>
          </div>

          <div className="mt-auto space-y-3">
            <SeverityBar summary={summary} />
            <div className="flex items-center justify-between gap-2 font-mono text-2xs text-faint">
              <span>{site.id}</span>
              {hasRealCoords(site) ? (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  {formatCoords(site)}
                </span>
              ) : (
                <span className="flex items-center gap-1" title="The manifest has no real coordinates for this scene">
                  <MapPinOff className="h-3 w-3 shrink-0" aria-hidden />
                  Not georeferenced
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
