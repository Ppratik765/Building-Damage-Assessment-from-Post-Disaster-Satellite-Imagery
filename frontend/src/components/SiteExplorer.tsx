"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import type { DamageTier, DataProfile, Site } from "@/lib/types";
import { DAMAGE_COLORS, DAMAGE_LABELS, PROFILES } from "@/lib/types";
import SeverityBar from "./SeverityBar";
import AnimatedNumber from "./AnimatedNumber";
import {
  TIER_ORDER,
  TIER_SUMMARY_KEY,
  damagedCount,
  formatCoords,
  hasRealCoords,
  siteLabel,
  sourceLabel,
} from "./siteFormat";

// Leaflet needs browser DOM, so no SSR
const SwipeMap = dynamic(() => import("@/components/SwipeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[62vh] min-h-[420px] w-full items-center justify-center rounded-frame bg-deep/60 ring-1 ring-signal/15 lg:h-[72vh] lg:max-h-[820px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border border-line" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-signal" />
        </div>
        <span className="text-sm text-haze">Loading the satellite tiles</span>
      </div>
    </div>
  ),
});

const SHORTCUTS: [string, string][] = [
  ["← →", "Previous or next site"],
  ["[ ]", "Nudge the divider"],
  ["S", "Sweep the divider automatically"],
  ["D", "Show or hide detections"],
  ["1 – 4", "Show or hide a damage tier"],
  ["R", "Fit the whole scene"],
  ["+ −", "Zoom in or out"],
  ["?", "Show these shortcuts"],
];

interface SiteExplorerProps {
  site: Site;
  profile: DataProfile;
}

export default function SiteExplorer({ site, profile }: SiteExplorerProps) {
  const [showDamage, setShowDamage] = useState(true);
  const [visibleTiers, setVisibleTiers] = useState<DamageTier[]>(TIER_ORDER);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { summary } = site;
  const total = summary.total_structures;
  const damaged = damagedCount(summary);
  const label = siteLabel(site);

  const toggleTier = useCallback((tier: DamageTier) => {
    setShowDamage(true);
    setVisibleTiers((current) =>
      current.includes(tier) ? current.filter((t) => t !== tier) : TIER_ORDER.filter((t) => t === tier || current.includes(t))
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(target.tagName)) return;
      if (e.key === "?") setShowShortcuts((v) => !v);
      else if (e.key === "Escape") setShowShortcuts(false);
      else if (e.key.toLowerCase() === "d") setShowDamage((v) => !v);
      else if (["1", "2", "3", "4"].includes(e.key)) toggleTier(TIER_ORDER[Number(e.key) - 1]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTier]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-8">
        <SwipeMap
          key={`${profile}:${site.id}`}
          site={site}
          profile={profile}
          showDamage={showDamage}
          onToggleDamage={() => setShowDamage((v) => !v)}
          visibleTiers={visibleTiers}
          georeferenced={hasRealCoords(site)}
        />
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        {/* What the model found */}
        <section className="panel rounded-[22px] p-5 sm:p-6" aria-labelledby="findings-heading">
          <h2 id="findings-heading" className="text-sm text-haze">
            What the model found
          </h2>
          {total > 0 ? (
            <>
              <p className="type-wide mt-2 text-4xl font-semibold text-paper">
                <AnimatedNumber value={total} /> <span className="text-xl text-haze">buildings</span>
              </p>
              <p className="mt-1 text-sm text-haze">
                <span className="tabular text-paper">{Math.round((damaged / total) * 100)}%</span> show some damage,{" "}
                <span className="tabular text-damage-destroyed">{summary.destroyed}</span> destroyed
              </p>

              <SeverityBar summary={summary} height="h-3" className="mt-5" />

              <ul className="mt-5 space-y-1.5">
                {TIER_ORDER.map((tier, i) => {
                  const count = summary[TIER_SUMMARY_KEY[tier]];
                  const on = showDamage && visibleTiers.includes(tier);
                  const share = total ? (count / total) * 100 : 0;
                  return (
                    <li key={tier}>
                      <button
                        onClick={() => toggleTier(tier)}
                        aria-pressed={on}
                        title={`Show or hide ${DAMAGE_LABELS[tier].toLowerCase()} on the map (${i + 1})`}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-line/40 ${
                          on ? "" : "opacity-45"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-[4px] ring-2 ring-offset-2 ring-offset-deep transition-all"
                          style={{
                            backgroundColor: on ? DAMAGE_COLORS[tier] : "transparent",
                            // @ts-expect-error CSS custom property for the ring colour
                            "--tw-ring-color": DAMAGE_COLORS[tier],
                          }}
                        />
                        <span className="flex-1 text-sm text-paper">{DAMAGE_LABELS[tier]}</span>
                        <span className="relative hidden h-1 w-16 overflow-hidden rounded-full bg-line sm:block">
                          <motion.span
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ backgroundColor: DAMAGE_COLORS[tier] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${share}%` }}
                            transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </span>
                        <span className="tabular w-8 text-right text-sm font-semibold text-paper">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 px-3 text-xs text-faint">Select a tier to show or hide it on the map.</p>
            </>
          ) : (
            <div className="mt-3">
              <p className="type-wide text-xl font-semibold text-paper">No buildings detected</p>
              <p className="mt-2 text-sm leading-relaxed text-haze">
                The model found no structures in this scene, so there is nothing to grade. The imagery is still here to
                compare.
              </p>
            </div>
          )}
        </section>

        {/* Scene details */}
        <section className="panel rounded-[22px] p-5 sm:p-6" aria-labelledby="scene-heading">
          <h2 id="scene-heading" className="text-sm text-haze">
            About this scene
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            {[
              ["Event", label.event],
              ["Dataset", PROFILES[profile].shortName],
              ["Imagery", sourceLabel(site)],
              ["Location", hasRealCoords(site) ? formatCoords(site) : "Not georeferenced in the manifest"],
              ["Scene ID", site.id],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line/50 pb-3 last:border-0 last:pb-0">
                <dt className="text-haze">{k}</dt>
                <dd className={`text-right text-paper ${k === "Location" || k === "Scene ID" ? "font-mono text-xs leading-5" : ""}`}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <button
          onClick={() => setShowShortcuts(true)}
          className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-haze ring-1 ring-line transition-colors hover:text-paper hover:ring-signal/40 lg:inline-flex"
        >
          <Keyboard className="h-4 w-4" />
          Keyboard shortcuts
          <kbd className="rounded border border-line px-1.5 font-mono text-2xs text-faint">?</kbd>
        </button>
      </aside>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <button aria-label="Close" className="absolute inset-0 bg-ink/80 backdrop-blur-md" onClick={() => setShowShortcuts(false)} />
            <motion.div
              initial={{ y: 16, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="panel relative w-full max-w-md rounded-[22px] p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="type-wide text-lg font-semibold text-paper">Keyboard shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  aria-label="Close"
                  autoFocus
                  className="flex h-9 w-9 items-center justify-center rounded-full text-haze hover:bg-line/50 hover:text-paper"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-4 space-y-2.5">
                {SHORTCUTS.map(([keys, what]) => (
                  <div key={keys} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-haze">{what}</dt>
                    <dd>
                      <kbd className="rounded-md border border-line bg-ink px-2 py-0.5 font-mono text-xs text-paper">{keys}</kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
