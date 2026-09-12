import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import StatCards from "@/components/StatCards";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { getSite, getManifest, getAllSiteParams } from "@/lib/data";
import type { DataProfile } from "@/lib/types";

// Leaflet needs browser DOM — disable SSR
const SwipeMap = dynamic(() => import("@/components/SwipeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[55vh] min-h-[380px] sm:h-[540px] md:h-[620px] lg:h-[700px] rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg
          className="w-8 h-8 animate-spin text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-sm font-mono text-cyan-300">
          Loading satellite imagery tile...
        </span>
      </div>
    </div>
  ),
});

interface SitePageProps {
  params: { id: string };
  searchParams?: { profile?: string };
}

export async function generateStaticParams() {
  return await getAllSiteParams();
}

export async function generateMetadata({
  params,
  searchParams,
}: SitePageProps): Promise<Metadata> {
  const profile: DataProfile =
    searchParams?.profile === "data1" ? "data1" : "data";
  const { site } = await getSite(params.id, profile);

  if (!site) {
    return {
      title: "Site Not Found — Damage Assessment",
      description: "Disaster scene not found.",
    };
  }

  return {
    title: `${site.name} — Damage Assessment`,
    description: `Disaster damage assessment for ${site.name}: ${site.summary.total_structures} structures analyzed.`,
  };
}

export default async function SitePage({
  params,
  searchParams,
}: SitePageProps) {
  const requestedProfile: DataProfile =
    searchParams?.profile === "data1" ? "data1" : "data";

  const { site, profile: activeProfile } = await getSite(
    params.id,
    requestedProfile
  );

  if (!site) {
    notFound();
  }

  const [manifest, dataManifest, data1Manifest] = await Promise.all([
    getManifest(activeProfile),
    getManifest("data"),
    getManifest("data1"),
  ]);

  const sites = manifest.sites;
  const currentIndex = sites.findIndex((s) => s.id === site.id);
  const siteNum = currentIndex >= 0 ? currentIndex + 1 : 1;
  const totalSites = sites.length;

  const prevSite =
    currentIndex > 0
      ? sites[currentIndex - 1]
      : sites[sites.length - 1];
  const nextSite =
    currentIndex >= 0 && currentIndex < sites.length - 1
      ? sites[currentIndex + 1]
      : sites[0];

  const sourceBadge =
    activeProfile === "data1"
      ? "Maxar Open Data (Real Satellite)"
      : site.source === "xbd_test"
      ? "xView2 Benchmark"
      : "Real-World Satellite Scene";

  const disasterBadge =
    site.disaster_name || site.disaster_type || "Disaster Event";

  return (
    <main className="min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Back link & breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/?profile=${activeProfile}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-colors group"
            >
              <svg
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Catalog</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>/</span>
              <span className="text-slate-300 font-semibold">{site.id}</span>
            </div>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center gap-2">
            <ProfileSwitcher
              currentProfile={activeProfile}
              siteCounts={{
                data: dataManifest.sites.length,
                data1: data1Manifest.sites.length,
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Site Header Banner & Quick Cycler */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {site.id}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  {sourceBadge}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {disasterBadge}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight break-words">
                {site.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {site.center.lat.toFixed(4)}°N, {site.center.lng.toFixed(4)}°{site.center.lng >= 0 ? "E" : "W"}
                </span>
                <span>•</span>
                <span>{site.summary.total_structures} Structures Analyzed</span>
              </div>
            </div>

            {/* Next / Prev Site Cycler Controls */}
            {prevSite && nextSite && (
              <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <Link
                  href={`/site/${prevSite.id}?profile=${activeProfile}`}
                  title={`Previous Site: ${prevSite.name}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Prev</span>
                </Link>

                <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 text-center min-w-[70px]">
                  {siteNum} / {totalSites}
                </div>

                <Link
                  href={`/site/${nextSite.id}?profile=${activeProfile}`}
                  title={`Next Site: ${nextSite.name}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Interactive Split-View Slider • Pan & Zoom freely across imagery</span>
            </span>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
              Double-click or pinch to zoom
            </span>
          </div>

          <SwipeMap site={site} profile={activeProfile} />
        </div>

        {/* Damage Stats Grid */}
        <div className="space-y-2">
          <div className="text-xs uppercase font-mono tracking-widest text-slate-400 px-1">
            Structure Damage Classification
          </div>
          <StatCards summary={site.summary} />
        </div>

        {/* Bottom Navigation for Mobile */}
        {prevSite && nextSite && (
          <div className="flex sm:hidden items-center justify-between gap-3 pt-2">
            <Link
              href={`/site/${prevSite.id}?profile=${activeProfile}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-200"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous Site</span>
            </Link>

            <Link
              href={`/site/${nextSite.id}?profile=${activeProfile}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-200"
            >
              <span>Next Site</span>
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
