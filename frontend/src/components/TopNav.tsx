import Link from "next/link";

export const REPO_URL = "https://github.com/Ppratik765/Building-Damage-Assessment-from-Post-Disaster-Satellite-Imagery";

/** Before/after glyph: a frame split diagonally, left half filled. */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="bm-spectrum" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="0.4" stopColor="#eab308" />
          <stop offset="0.7" stopColor="#f97316" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="26" height="26" rx="7" fill="none" stroke="#E8ECF6" strokeWidth="2" />
      <path d="M10 3h9L10 29H10a7 7 0 0 1-7-7V10a7 7 0 0 1 7-7Z" fill="#A5B8FF" opacity="0.9" />
      <path d="M19 3 10 29" stroke="url(#bm-spectrum)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-transparent">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="Building Damage Assessment, home">
          <BrandMark />
          <span className="type-wide hidden text-[0.95rem] font-semibold text-paper sm:block">
            Building Damage Assessment
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <a href="#sites" className="rounded-full px-3 py-2 text-haze transition-colors hover:text-paper">
            Sites
          </a>
          <a href="#how-it-works" className="hidden rounded-full px-3 py-2 text-haze transition-colors hover:text-paper sm:block">
            How it works
          </a>
          <a href="#model" className="rounded-full px-3 py-2 text-haze transition-colors hover:text-paper">
            Results
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-haze transition-colors hover:bg-deep hover:text-paper"
            aria-label="Source code on GitHub"
          >
            <GitHubIcon />
          </a>
        </div>
      </nav>
    </header>
  );
}
