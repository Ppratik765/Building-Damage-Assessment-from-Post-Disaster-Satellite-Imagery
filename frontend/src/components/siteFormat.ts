/**
 * Display-only helpers. Nothing here changes the data: manifests and GeoJSON
 * are read exactly as they are, these functions only decide how to show them.
 */
import type { Site, DamageSummary, DamageTier } from "@/lib/types";

/** "Train/Images/Socal Fire" -> "Socal Fire" */
export function cleanName(raw: string): string {
  const lastSegment = raw.split("/").pop() ?? raw;
  return lastSegment.replace(/\s+/g, " ").trim();
}

export interface SiteLabel {
  /** The disaster event, e.g. "Jajarkot Earthquake, Nepal" */
  event: string;
  /** The area within the event, e.g. "Sector 1201" or "Area 3" */
  title: string;
  /** One-line version for page titles */
  full: string;
}

export function siteLabel(site: Site): SiteLabel {
  const name = cleanName(site.name);

  if (site.disaster_name && name.startsWith(site.disaster_name)) {
    const rest = name.slice(site.disaster_name.length).replace(/^[\s,–—-]+/, "").trim();
    if (rest) return { event: site.disaster_name, title: rest, full: `${rest}, ${site.disaster_name}` };
  }

  const bracketed = name.match(/^(.*?)\s*\(([^()]+)\)$/);
  if (bracketed) {
    const [, event, title] = bracketed;
    return { event, title, full: `${title}, ${event}` };
  }

  const event = site.source === "xbd_test" ? "xBD benchmark" : "Satellite scene";
  return { event, title: name, full: name };
}

export function sourceLabel(site: Site): string {
  if (site.source === "xbd_test") return "xView2 / xBD test set";
  if (site.source === "maxar_ood") return "Maxar Open Data";
  return "Satellite scene";
}

/** Several manifest entries use (0, 0) as a placeholder centre. */
export function hasRealCoords(site: Site): boolean {
  return !(site.center.lat === 0 && site.center.lng === 0);
}

export function formatCoords(site: Site): string {
  const { lat, lng } = site.center;
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export function damagedCount(summary: DamageSummary): number {
  return summary.minor_damage + summary.major_damage + summary.destroyed;
}

export type Category = "flood" | "earthquake" | "wind" | "fire" | "other";

export const CATEGORY_LABELS: Record<Category, string> = {
  flood: "Floods",
  earthquake: "Earthquakes",
  wind: "Wind and storms",
  fire: "Wildfires",
  other: "Other",
};

export function categoryOf(site: Site): Category {
  const text = `${site.disaster_type ?? ""} ${site.disaster_name ?? ""} ${site.name}`.toLowerCase();
  if (/flood|glof|water|tsunami/.test(text)) return "flood";
  if (/earthquake|quake|jajarkot/.test(text)) return "earthquake";
  if (/hurricane|typhoon|cyclone|storm|tornado|wind/.test(text)) return "wind";
  if (/fire/.test(text)) return "fire";
  return "other";
}

export const TIER_ORDER: DamageTier[] = ["no-damage", "minor-damage", "major-damage", "destroyed"];

export const TIER_SUMMARY_KEY: Record<DamageTier, keyof DamageSummary> = {
  "no-damage": "no_damage",
  "minor-damage": "minor_damage",
  "major-damage": "major_damage",
  destroyed: "destroyed",
};

export const TIER_SHORT: Record<DamageTier, string> = {
  "no-damage": "Intact",
  "minor-damage": "Minor",
  "major-damage": "Major",
  destroyed: "Destroyed",
};
