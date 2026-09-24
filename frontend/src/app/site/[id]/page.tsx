import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import SiteExplorer from "@/components/SiteExplorer";
import SiteKeyboardNav from "@/components/SiteKeyboardNav";
import { BrandMark } from "@/components/TopNav";
import { getSite, getManifest, getAllSiteParams } from "@/lib/data";
import type { DataProfile } from "@/lib/types";
import { CATEGORY_LABELS, categoryOf, siteLabel, sourceLabel } from "@/components/siteFormat";

interface SitePageProps {
  params: { id: string };
  searchParams?: { profile?: string };
}

export async function generateStaticParams() {
  return await getAllSiteParams();
}

export async function generateMetadata({ params, searchParams }: SitePageProps): Promise<Metadata> {
  const profile: DataProfile = searchParams?.profile === "data1" ? "data1" : "data";
  const { site } = await getSite(params.id, profile);

  if (!site) {
    return {
      title: "Site Not Found — Damage Assessment",
      description: "Disaster scene not found.",
    };
  }

  const label = siteLabel(site);
  return {
    title: `${label.full} — Damage Assessment`,
    description: `Disaster damage assessment for ${label.full}: ${site.summary.total_structures} structures analyzed.`,
  };
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const requestedProfile: DataProfile = searchParams?.profile === "data1" ? "data1" : "data";

  const { site, profile: activeProfile } = await getSite(params.id, requestedProfile);

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

  const prevSite = currentIndex > 0 ? sites[currentIndex - 1] : sites[sites.length - 1];
  const nextSite = currentIndex >= 0 && currentIndex < sites.length - 1 ? sites[currentIndex + 1] : sites[0];
  const prevHref = prevSite ? `/site/${prevSite.id}?profile=${activeProfile}` : undefined;
  const nextHref = nextSite ? `/site/${nextSite.id}?profile=${activeProfile}` : undefined;

  const label = siteLabel(site);
  const category = categoryOf(site);

  return (
    <main className="min-h-screen pb-20">
      <SiteKeyboardNav prevHref={prevHref} nextHref={nextHref} />

      {/* Top bar */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Home" className="rounded-lg">
              <BrandMark />
            </Link>
            <Link
              href={`/?profile=${activeProfile}#sites`}
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm text-haze ring-1 ring-line transition-colors hover:text-paper hover:ring-signal/40"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              All sites
            </Link>
          </div>
          <ProfileSwitcher
            currentProfile={activeProfile}
            size="sm"
            className="w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none"
            siteCounts={{ data: dataManifest.sites.length, data1: data1Manifest.sites.length }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6 sm:px-6 sm:pt-10">
        {/* Title block */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="rise text-base text-haze" style={{ animationDelay: "60ms" }}>
              {label.event}
            </p>
            <h1
              className="rise type-display mt-2 break-words text-[clamp(2.4rem,6vw,4.5rem)] text-paper"
              style={{ animationDelay: "140ms" }}
            >
              {label.title}
            </h1>
            <div className="rise mt-4 flex flex-wrap gap-2 text-xs" style={{ animationDelay: "240ms" }}>
              <span className="rounded-full px-3 py-1 text-paper ring-1 ring-line">{sourceLabel(site)}</span>
              {category !== "other" && (
                <span className="rounded-full px-3 py-1 text-paper ring-1 ring-line">
                  {CATEGORY_LABELS[category].replace(/s$/, "")}
                </span>
              )}
              <span className="rounded-full px-3 py-1 font-mono text-haze ring-1 ring-line">{site.id}</span>
            </div>
          </div>

          {prevSite && nextSite && (
            <nav aria-label="Other sites" className="rise flex shrink-0 items-center gap-2" style={{ animationDelay: "300ms" }}>
              <Link
                href={prevHref!}
                title={`Previous: ${siteLabel(prevSite).full} (←)`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-paper ring-1 ring-line transition hover:bg-deep hover:ring-signal/40 active:scale-95"
                aria-label={`Previous site: ${siteLabel(prevSite).full}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <span className="tabular min-w-[4.5rem] text-center text-sm text-haze">
                <span className="text-paper">{siteNum}</span> of {totalSites}
              </span>
              <Link
                href={nextHref!}
                title={`Next: ${siteLabel(nextSite).full} (→)`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-paper ring-1 ring-line transition hover:bg-deep hover:ring-signal/40 active:scale-95"
                aria-label={`Next site: ${siteLabel(nextSite).full}`}
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </nav>
          )}
        </div>

        <SiteExplorer site={site} profile={activeProfile} />

        {/* Up next */}
        {nextSite && nextSite.id !== site.id && (
          <Link
            href={nextHref!}
            className="group panel mt-4 flex items-center justify-between gap-4 rounded-[22px] p-5 transition-colors hover:bg-deep/90 sm:p-6"
          >
            <div className="min-w-0">
              <p className="text-sm text-haze">Up next</p>
              <p className="type-wide mt-1 truncate text-xl font-semibold text-paper">{siteLabel(nextSite).full}</p>
              <p className="tabular mt-1 text-sm text-haze">
                {nextSite.summary.total_structures > 0
                  ? `${nextSite.summary.total_structures} buildings, ${nextSite.summary.destroyed} destroyed`
                  : "No buildings detected"}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-transform duration-300 group-hover:translate-x-1">
              <ChevronRight className="h-5 w-5" />
            </span>
          </Link>
        )}
      </div>
    </main>
  );
}
