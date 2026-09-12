import Link from "next/link";
import type { Site, DataProfile } from "@/lib/types";
import { DAMAGE_COLORS } from "@/lib/types";

interface SiteCardProps {
  site: Site;
  profile?: DataProfile;
}

export default function SiteCard({ site, profile = "data" }: SiteCardProps) {
  const { summary } = site;
  const total = Math.max(1, summary.total_structures);

  const barSegments = [
    { key: "no_damage", count: summary.no_damage, color: DAMAGE_COLORS["no-damage"], label: "Intact" },
    { key: "minor", count: summary.minor_damage, color: DAMAGE_COLORS["minor-damage"], label: "Minor" },
    { key: "major", count: summary.major_damage, color: DAMAGE_COLORS["major-damage"], label: "Major" },
    { key: "destroyed", count: summary.destroyed, color: DAMAGE_COLORS["destroyed"], label: "Destroyed" },
  ];

  // Clean disaster display label
  const displayDisaster = site.disaster_name || site.disaster_type || (
    site.source === "xbd_test" ? "xView2 Benchmark" : "Satellite Scene"
  );

  return (
    <Link
      href={`/site/${site.id}?profile=${profile}`}
      id={`site-card-${profile}-${site.id}`}
      className="block group"
    >
      <div className="glass-card rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3.5 h-full transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:-translate-y-1">
        {/* Header & Badges */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90 font-mono">
              {displayDisaster}
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1 mt-0.5">
              {site.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {site.center.lat.toFixed(4)}°, {site.center.lng.toFixed(4)}°
              </span>
            </p>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 font-mono flex-shrink-0">
            {site.id}
          </span>
        </div>

        {/* Thumbnail preview if available */}
        <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
          <img
            src={site.post_image}
            alt={site.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-slate-300">
            <span className="bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm font-mono">
              {summary.total_structures} structures
            </span>
            {summary.destroyed > 0 && (
              <span className="bg-red-950/80 text-red-300 border border-red-800/50 px-2 py-0.5 rounded backdrop-blur-sm font-semibold">
                {summary.destroyed} destroyed
              </span>
            )}
          </div>
        </div>

        {/* Damage proportion bar */}
        <div className="space-y-1 mt-0.5">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-800/80 gap-0.5">
            {barSegments.map((seg) => (
              <div
                key={seg.key}
                style={{
                  width: `${(seg.count / total) * 100}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.label}: ${seg.count}`}
              />
            ))}
          </div>
        </div>

        {/* Numeric stats grid */}
        <div className="grid grid-cols-4 gap-1 text-center bg-slate-900/50 rounded-xl p-2 border border-slate-800/60 mt-auto">
          {barSegments.map((seg) => (
            <div key={seg.key} className="flex flex-col items-center">
              <span className="font-mono text-xs sm:text-sm font-bold" style={{ color: seg.color }}>
                {seg.count}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 tracking-tight">
                {seg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Action Link Footer */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">
          <span className="font-medium">Inspect Satellite Swipe</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
