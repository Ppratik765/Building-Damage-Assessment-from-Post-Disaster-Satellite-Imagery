"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** ← / → move between sites (ignored while typing or when a slider has focus). */
export default function SiteKeyboardNav({ prevHref, nextHref }: { prevHref?: string; nextHref?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [router, prevHref, nextHref]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (/input|textarea|select/i.test(target.tagName) || target.getAttribute("role") === "slider") return;
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
      else if (e.key === "ArrowRight" && nextHref) router.push(nextHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref]);

  return null;
}
