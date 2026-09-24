import { getManifest } from "@/lib/data";
import type { DataProfile } from "@/lib/types";
import { DAMAGE_COLORS } from "@/lib/types";
import DisasterCatalog from "@/components/DisasterCatalog";
import HeroScanner, { type HeroScene } from "@/components/HeroScanner";
import Pipeline from "@/components/Pipeline";
import ModelGallery from "@/components/ModelGallery";
import TopNav, { BrandMark, GitHubIcon, REPO_URL } from "@/components/TopNav";
import { TIER_ORDER, TIER_SHORT } from "@/components/siteFormat";

interface HomePageProps {
  searchParams?: { profile?: string };
}

const HEADLINE = ["Every", "building,", "before", "and", "after."];

const HERO_PICKS: [DataProfile, string][] = [
  ["data", "site_015"], // Nepal Floods 2024, Area 4
  ["data", "site_002"], // Hurricane Matthew (xBD)
  ["data1", "site_010"], // Jajarkot Earthquake, Sector 1013
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const [dataManifest, data1Manifest] = await Promise.all([getManifest("data"), getManifest("data1")]);

  const initialProfile: DataProfile = searchParams?.profile === "data1" ? "data1" : "data";

  const allScenes: HeroScene[] = [
    ...dataManifest.sites.map((site) => ({ site, profile: "data" as DataProfile })),
    ...data1Manifest.sites.map((site) => ({ site, profile: "data1" as DataProfile })),
  ].filter((s) => s.site.summary.total_structures > 0);

  // Hand-picked for the hero: full image coverage, three different events.
  // Falls back to the busiest scenes if the manifests change.
  const picked = HERO_PICKS.map(([profile, id]) =>
    allScenes.find((s) => s.profile === profile && s.site.id === id)
  ).filter((s): s is HeroScene => Boolean(s));
  const heroScenes =
    picked.length >= 2
      ? picked
      : [...allScenes].sort((a, b) => b.site.summary.total_structures - a.site.summary.total_structures).slice(0, 3);

  return (
    <>
      <TopNav />
      <main className="pb-16">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:pt-14">
          <div className="lg:col-span-6 xl:col-span-5">
            <h1 className="type-display text-[clamp(2.8rem,6vw,4.75rem)] text-paper">
              {HEADLINE.map((word, i) => (
                <span key={word} className="rise mr-[0.22em] inline-block" style={{ animationDelay: `${120 + i * 90}ms` }}>
                  {word}
                </span>
              ))}
            </h1>
            <p
              className="rise mt-7 max-w-[46ch] text-lg leading-relaxed text-haze"
              style={{ animationDelay: "650ms" }}
            >
              A Siamese U-Net compares satellite tiles captured before and after a disaster, outlines every building it
              finds and grades the damage. Move across the image to see what changed.
            </p>

            <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "780ms" }}>
              <a
                href="#sites"
                className="inline-flex h-12 items-center rounded-full bg-signal px-6 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-paper"
              >
                Browse all sites
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center rounded-full px-5 text-[0.95rem] font-medium text-paper ring-1 ring-signal/25 transition-colors hover:bg-deep hover:ring-signal/50"
              >
                How the model works
              </a>
            </div>

            {/* Key for the colours used on every map */}
            <div className="rise mt-12 max-w-sm" style={{ animationDelay: "900ms" }}>
              <p className="text-sm text-haze">Damage is graded on the xBD Joint Damage Scale</p>
              <div className="mt-3 grid grid-cols-4 gap-1">
                {TIER_ORDER.map((tier) => (
                  <div key={tier}>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: DAMAGE_COLORS[tier] }} />
                    <p className="mt-2 text-xs text-paper">{TIER_SHORT[tier]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rise mx-auto w-full max-w-[640px] lg:col-span-6 lg:max-w-none xl:col-span-7 xl:pl-6" style={{ animationDelay: "300ms" }}>
            <HeroScanner scenes={heroScenes} />
          </div>
        </section>

        {/* Catalog */}
        <section id="sites" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-8 sm:px-6">
          <DisasterCatalog manifests={{ data: dataManifest, data1: data1Manifest }} initialProfile={initialProfile} />
        </section>

        {/* Pipeline */}
        <section id="how-it-works" className="mx-auto mt-36 max-w-7xl scroll-mt-24 px-4 sm:px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="type-display text-4xl text-paper sm:text-5xl">How the model sees change</h2>
            <p className="mt-4 text-lg leading-relaxed text-haze">
              Trained on the xBD benchmark, the network reads two images at once and learns what a damaged building looks
              like compared with its former self.
            </p>
          </div>
          <Pipeline />
        </section>

        {/* Results */}
        <section id="model" className="mx-auto mt-36 max-w-7xl scroll-mt-24 px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="type-display text-4xl text-paper sm:text-5xl">How it performed</h2>
            <p className="mt-4 text-lg leading-relaxed text-haze">
              Both figures come straight out of the training notebook’s evaluation run. Select one to see it full size.
            </p>
          </div>
          <ModelGallery />
        </section>
      </main>

      <footer className="mx-auto mt-24 max-w-7xl px-4 pb-12 sm:px-6">
        <div className="flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-6 w-6" />
            <p className="text-sm text-haze">
              Built on the xBD dataset and Maxar Open Data imagery with a PyTorch Siamese U-Net.
            </p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm text-haze ring-1 ring-line transition-colors hover:text-paper hover:ring-signal/40"
          >
            <GitHubIcon />
            View the source
          </a>
        </div>
      </footer>
    </>
  );
}
