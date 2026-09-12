import { promises as fs } from "fs";
import path from "path";
import type { Manifest, Site, DataProfile } from "./types";

/**
 * Loads the manifest for a specific data profile ('data' or 'data1').
 */
export async function getManifest(profile: DataProfile = "data"): Promise<Manifest> {
  const folder = profile === "data1" ? "data1" : "data";
  const filePath = path.join(process.cwd(), "public", folder, "manifest.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read manifest for profile ${profile} from ${filePath}:`, err);
    return { sites: [] };
  }
}

/**
 * Finds a specific site by id within a data profile.
 */
export async function getSite(
  id: string,
  profile: DataProfile = "data"
): Promise<{ site?: Site; profile: DataProfile }> {
  const manifest = await getManifest(profile);
  const site = manifest.sites.find((s) => s.id === id);

  // If not found in requested profile, try falling back to the other profile
  if (!site) {
    const otherProfile: DataProfile = profile === "data" ? "data1" : "data";
    const otherManifest = await getManifest(otherProfile);
    const fallbackSite = otherManifest.sites.find((s) => s.id === id);
    if (fallbackSite) {
      return { site: fallbackSite, profile: otherProfile };
    }
  }

  return { site, profile };
}

/**
 * Generates all unique site IDs across both profiles for Next.js static generation.
 */
export async function getAllSiteParams(): Promise<{ id: string }[]> {
  const [m0, m1] = await Promise.all([
    getManifest("data"),
    getManifest("data1"),
  ]);
  const ids = new Set<string>();
  m0.sites.forEach((s) => ids.add(s.id));
  m1.sites.forEach((s) => ids.add(s.id));
  return Array.from(ids).map((id) => ({ id }));
}
