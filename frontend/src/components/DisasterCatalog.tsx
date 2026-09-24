"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Flame, LayoutGrid, Search, Waves, Wind, X, CircleDot } from "lucide-react";
import type { DamageSummary, DataProfile, Manifest } from "@/lib/types";
import { PROFILES } from "@/lib/types";
import SiteCard from "@/components/SiteCard";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import SeverityBar from "@/components/SeverityBar";
import AnimatedNumber from "@/components/AnimatedNumber";
import { CATEGORY_LABELS, categoryOf, cleanName, damagedCount, siteLabel, type Category } from "./siteFormat";

interface DisasterCatalogProps {
  manifests: {
    data: Manifest;
    data1: Manifest;
  };
  initialProfile?: DataProfile;
}

type SortKey = "order" | "buildings" | "damage";

const CATEGORY_ICONS: Record<Category | "all", typeof Waves> = {
  all: LayoutGrid,
  flood: Waves,
  earthquake: Activity,
  wind: Wind,
  fire: Flame,
  other: CircleDot,
};

export default function DisasterCatalog({ manifests, initialProfile = "data" }: DisasterCatalogProps) {
  const searchParams = useSearchParams();

  const profileParam = (searchParams.get("profile") as DataProfile) || initialProfile;
  const validProfile: DataProfile = profileParam in PROFILES ? profileParam : "data";
  const [currentProfile, setCurrentProfile] = useState<DataProfile>(validProfile);

  useEffect(() => {
    if (profileParam in PROFILES && profileParam !== currentProfile) {
      setCurrentProfile(profileParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileParam]);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [onlyWithBuildings, setOnlyWithBuildings] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const sites = (manifests[currentProfile] || manifests.data).sites;

  // Reset the category if it doesn't exist in the newly selected profile
  useEffect(() => {
    if (category !== "all" && !sites.some((s) => categoryOf(s) === category)) setCategory("all");
  }, [sites, category]);

  // Press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const aggregate: DamageSummary = useMemo(
    () =>
      sites.reduce(
        (acc, s) => ({
          total_structures: acc.total_structures + (s.summary?.total_structures || 0),
          no_damage: acc.no_damage + (s.summary?.no_damage || 0),
          minor_damage: acc.minor_damage + (s.summary?.minor_damage || 0),
          major_damage: acc.major_damage + (s.summary?.major_damage || 0),
          destroyed: acc.destroyed + (s.summary?.destroyed || 0),
        }),
        { total_structures: 0, no_damage: 0, minor_damage: 0, major_damage: 0, destroyed: 0 }
      ),
    [sites]
  );

  const categories = useMemo(() => {
    const counts = new Map<Category, number>();
    sites.forEach((s) => counts.set(categoryOf(s), (counts.get(categoryOf(s)) || 0) + 1));
    return Array.from(counts.entries());
  }, [sites]);

  const filteredSites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = sites.filter((site) => {
      if (onlyWithBuildings && site.summary.total_structures === 0) return false;
      if (category !== "all" && categoryOf(site) !== category) return false;
      if (!q) return true;
      const haystack = [cleanName(site.name), site.id, site.disaster_type, site.disaster_name, site.location_name, siteLabel(site).event]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    if (sort === "buildings") return [...list].sort((a, b) => b.summary.total_structures - a.summary.total_structures);
    if (sort === "damage")
      return [...list].sort(
        (a, b) => damagedCount(b.summary) - damagedCount(a.summary) || b.summary.destroyed - a.summary.destroyed
      );
    return list;
  }, [sites, searchQuery, category, sort, onlyWithBuildings]);

  const clearAll = () => {
    setSearchQuery("");
    setCategory("all");
    setOnlyWithBuildings(false);
  };

  return (
    <div className="space-y-10">
      {/* Heading + dataset switch */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <h2 className="type-display text-4xl text-paper sm:text-5xl">Browse the sites</h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentProfile}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-base leading-relaxed text-haze"
            >
              {PROFILES[currentProfile].description}.
            </motion.p>
          </AnimatePresence>
        </div>
        <ProfileSwitcher
          currentProfile={currentProfile}
          onProfileChange={setCurrentProfile}
          siteCounts={{ data: manifests.data.sites.length, data1: manifests.data1.sites.length }}
          className="self-start lg:self-auto"
        />
      </div>

      {/* Dataset-wide damage distribution */}
      <div className="panel rounded-[22px] p-5 sm:p-6">
        <SeverityBar key={currentProfile} summary={aggregate} height="h-3" />
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {[
            { label: "Scenes", value: sites.length, color: "text-paper" },
            { label: "Buildings found", value: aggregate.total_structures, color: "text-paper" },
            { label: "Damaged", value: damagedCount(aggregate), color: "text-damage-major" },
            { label: "Destroyed", value: aggregate.destroyed, color: "text-damage-destroyed" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-haze">{stat.label}</dt>
              <dd className={`type-wide mt-1 text-3xl font-semibold ${stat.color}`}>
                <AnimatedNumber value={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {([["all", sites.length], ...categories] as [Category | "all", number][]).map(([id, count]) => {
            const Icon = CATEGORY_ICONS[id];
            const active = category === id;
            return (
              <button
                key={id}
                onClick={() => setCategory(id)}
                aria-pressed={active}
                className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active ? "text-ink" : "text-haze hover:text-paper"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="category-pill"
                    className="absolute inset-0 rounded-full bg-signal"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative h-4 w-4" aria-hidden />
                <span className="relative whitespace-nowrap">{id === "all" ? "All" : CATEGORY_LABELS[id]}</span>
                <span className={`tabular relative text-xs ${active ? "text-ink/60" : "text-faint"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-line/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2.5 self-start rounded-full py-1 text-sm text-haze hover:text-paper">
            <input
              type="checkbox"
              checked={onlyWithBuildings}
              onChange={(e) => setOnlyWithBuildings(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-signal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal">
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper transition-transform duration-300 ${
                  onlyWithBuildings ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </span>
            Only scenes with buildings
          </label>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort sites"
              className="panel shrink-0 cursor-pointer appearance-none rounded-full py-2 pl-3.5 pr-8 text-sm text-paper focus:outline-none focus-visible:outline-2 focus-visible:outline-signal"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E9AC0' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="order">Catalog order</option>
              <option value="damage">Most damaged first</option>
              <option value="buildings">Most buildings first</option>
            </select>

            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search sites"
                aria-label="Search sites"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="panel w-full rounded-full py-2 pl-10 pr-10 text-sm text-paper placeholder:text-faint focus:border-signal/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-haze hover:text-paper"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-2xs text-faint sm:block">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredSites.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredSites.map((site, i) => (
              <motion.div
                key={`${currentProfile}-${site.id}`}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  layout: { type: "spring", stiffness: 380, damping: 36 },
                  default: { duration: 0.35, delay: Math.min(i, 9) * 0.035, ease: [0.22, 1, 0.36, 1] },
                }}
              >
                <SiteCard site={site} profile={currentProfile} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="panel rounded-[22px] px-6 py-16 text-center">
          <p className="type-wide text-lg font-semibold text-paper">No sites match these filters</p>
          <p className="mt-1 text-sm text-haze">
            {searchQuery ? `Nothing in this dataset mentions “${searchQuery}”.` : "Try another disaster type or dataset."}
          </p>
          <button
            onClick={clearAll}
            className="mt-5 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-white"
          >
            Clear search and filters
          </button>
        </div>
      )}
    </div>
  );
}
