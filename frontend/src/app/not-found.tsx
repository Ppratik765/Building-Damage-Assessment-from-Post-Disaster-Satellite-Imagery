import Link from "next/link";
import { BrandMark } from "@/components/TopNav";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
      <BrandMark className="h-10 w-10" />
      <h1 className="type-display mt-8 text-[clamp(2.6rem,7vw,4.5rem)] text-paper">Nothing was imaged here.</h1>
      <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-haze">
        This page isn’t part of the catalog. The scene may have been renamed, or the link has a typo.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href="/#sites"
          className="inline-flex h-12 items-center rounded-full bg-signal px-6 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-paper"
        >
          Browse all sites
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full px-5 text-[0.95rem] font-medium text-paper ring-1 ring-signal/25 transition-colors hover:bg-deep"
        >
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
