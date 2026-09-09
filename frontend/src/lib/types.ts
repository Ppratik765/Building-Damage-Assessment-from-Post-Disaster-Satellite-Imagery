/** Types matching the DATA CONTRACT exactly. */

export interface DamageSummary {
  total_structures: number;
  no_damage: number;
  minor_damage: number;
  major_damage: number;
  destroyed: number;
}

export interface Site {
  id: string;
  name: string;
  source: "xbd_test" | "maxar_ood";
  center: { lat: number; lng: number };
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  pre_image: string;
  post_image: string;
  damage_geojson: string;
  summary: DamageSummary;
}

export interface Manifest {
  sites: Site[];
}

export interface DamageProperties {
  building_id: number;
  damage_tier: "no-damage" | "minor-damage" | "major-damage" | "destroyed";
  confidence: number;
}

export interface DamageFeature {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: DamageProperties;
}

export interface DamageGeoJSON {
  type: "FeatureCollection";
  features: DamageFeature[];
}

export type DamageTier = DamageProperties["damage_tier"];

export const DAMAGE_COLORS: Record<DamageTier, string> = {
  "no-damage": "#22c55e",
  "minor-damage": "#eab308",
  "major-damage": "#f97316",
  "destroyed": "#ef4444",
};

export const DAMAGE_LABELS: Record<DamageTier, string> = {
  "no-damage": "No Damage",
  "minor-damage": "Minor Damage",
  "major-damage": "Major Damage",
  "destroyed": "Destroyed",
};
