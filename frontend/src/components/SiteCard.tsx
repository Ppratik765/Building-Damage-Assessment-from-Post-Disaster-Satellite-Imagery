import Link from "next/link";
import type { Site } from "@/lib/types";
import { DAMAGE_COLORS } from "@/lib/types";

interface SiteCardProps {
  site: Site;
}

export default function SiteCard({ site }: SiteCardProps) {
  const { summary } = site;
  const total = summary.total_structures || 1;

  const barSegments = [
    { key: "no_damage", count: summary.no_damage, color: DAMAGE_COLORS["no-damage"] },
    { key: "minor", count: summary.minor_damage, color: DAMAGE_COLORS["minor-damage"] },
    { key: "major", count: summary.major_damage, color: DAMAGE_COLORS["major-damage"] },
    { key: "destroyed", count: summary.destroyed, color: DAMAGE_COLORS["destroyed"] },
  ];

  return (
    <Link href={`/site/${site.id}`} id={`site-card-${site.id}`}>
      <div className="glass-card p-5 md:p-6 cursor-pointer group h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-accent-cyan transition-colors truncate">
              {site.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {site.center.lat.toFixed(4)}°, {site.center.lng.toFixed(4)}°
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {site.id}
            </span>
          </div>
        </div>

        {/* Damage bar */}
        <div className="damage-bar">
          {barSegments.map((seg) => (
            <div
              key={seg.key}
              style={{
                width: `${(seg.count / total) * 100}%`,
                backgroundColor: seg.color,
              }}
            />
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-1 text-center">
          <div>
            <div className="font-mono text-sm font-bold text-accent-cyan">
              {summary.total_structures}
            </div>
            <div className="text-[10px] text-slate-500">Total</div>
          </div>
          {barSegments.map((seg) => (
            <div key={seg.key}>
              <div
                className="font-mono text-sm font-bold"
                style={{ color: seg.color }}
              >
                {seg.count}
              </div>
              <div className="text-[10px] text-slate-500">
                {seg.key === "no_damage"
                  ? "OK"
                  : seg.key === "minor"
                  ? "Min"
                  : seg.key === "major"
                  ? "Maj"
                  : "Des"}
              </div>
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex justify-end mt-auto">
          <svg
            className="w-5 h-5 text-slate-600 group-hover:text-accent-cyan transition-all group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
