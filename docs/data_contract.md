# DATA CONTRACT

This is the ONLY thing the notebook and frontend need to agree on. Neither
half should assume anything else about the other.

## `frontend/public/data/manifest.json`

```json
{
  "sites": [
    {
      "id": "site_001",
      "name": "Human-readable site name",
      "source": "xbd_test" | "maxar_ood",
      "center": { "lat": 0.0, "lng": 0.0 },
      "bounds": [[south, west], [north, east]],
      "pre_image": "/data/site_001/pre.png",
      "post_image": "/data/site_001/post.png",
      "damage_geojson": "/data/site_001/damage.geojson",
      "summary": {
        "total_structures": 0,
        "no_damage": 0,
        "minor_damage": 0,
        "major_damage": 0,
        "destroyed": 0
      }
    }
  ]
}
```

## `damage.geojson` per site

A standard GeoJSON `FeatureCollection` of `Polygon` features, each with:

```json
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "properties": {
    "building_id": 0,
    "damage_tier": "no-damage" | "minor-damage" | "major-damage" | "destroyed",
    "confidence": 0.0
  }
}
```

## `pre.png` / `post.png`

Standard RGB PNGs, any resolution, georeferenced only via the `bounds` field
in manifest.json (simple rectangular fit — this is a demo, not a GIS product,
so exact reprojection accuracy is not required).
