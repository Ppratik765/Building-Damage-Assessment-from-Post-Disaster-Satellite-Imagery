"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, ImageOverlay, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Minus, MoveHorizontal, Pause, Play, Plus, Scan } from "lucide-react";
import type { Site, DamageGeoJSON, DamageTier } from "@/lib/types";
import { DAMAGE_COLORS, DAMAGE_LABELS } from "@/lib/types";
import { TIER_ORDER } from "./siteFormat";

interface SwipeMapProps {
  site: Site;
  profile?: string;
  showDamage?: boolean;
  onToggleDamage?: () => void;
  visibleTiers?: DamageTier[];
  georeferenced?: boolean;
}

/** Component to fit map bounds to the site on mount and expose map ref */
function MapBridge({
  bounds,
  onMapReady,
}: {
  bounds: L.LatLngBoundsExpression;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("damagePane")) {
      const pane = map.createPane("damagePane");
      pane.style.zIndex = "450";
    }
    onMapReady(map);
    map.fitBounds(bounds, { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

/** Reports cursor position and zoom for the readout. */
function Telemetry({ onChange }: { onChange: (t: { lat?: number; lng?: number; zoom: number }) => void }) {
  const map = useMapEvents({
    mousemove: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng, zoom: map.getZoom() }),
    mouseout: () => onChange({ zoom: map.getZoom() }),
    zoomend: () => onChange({ zoom: map.getZoom() }),
  });
  useEffect(() => onChange({ zoom: map.getZoom() }), [map, onChange]);
  return null;
}

/**
 * Clips the post-disaster image overlay and damage GeoJSON SVG
 * based on the screen-space position of the slider handle.
 * This ensures the slider stays firmly accessible in the container
 * while allowing full pan and zoom around the satellite imagery.
 */
function SwipeController({
  fraction,
  postOverlayRef,
  containerRef,
  layersKey,
}: {
  fraction: number;
  postOverlayRef: React.RefObject<L.ImageOverlay | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Changes whenever the damage layer is added, removed or filtered */
  layersKey: string;
}) {
  const applyClip = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;

    // Screen-space X of the vertical divider line
    const sliderX = containerRect.left + fraction * containerRect.width;

    // Clip the post-disaster ImageOverlay
    const postEl = postOverlayRef.current?.getElement();
    if (postEl) {
      const imgRect = postEl.getBoundingClientRect();
      if (imgRect.width > 0) {
        const clipX = Math.max(0, Math.min(imgRect.width, sliderX - imgRect.left));
        postEl.style.clipPath = `inset(0 0 0 ${clipX}px)`;
      }
    }

    // Clip the Damage GeoJSON SVG if present
    const svgEl = containerRef.current.querySelector(
      ".leaflet-damage-pane svg, .leaflet-overlay-pane svg"
    ) as SVGElement | null;
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      if (svgRect.width > 0) {
        const clipX = Math.max(0, Math.min(svgRect.width, sliderX - svgRect.left));
        svgEl.style.clipPath = `inset(0 0 0 ${clipX}px)`;
      }
    }
  }, [fraction, containerRef, postOverlayRef]);

  // Apply immediately when fraction changes
  useEffect(() => {
    applyClip();
  }, [applyClip]);

  // Leaflet repositions the vector SVG after moveend/zoomend, so re-clip on the next frame too
  const applyClipDeferred = useCallback(() => {
    requestAnimationFrame(() => {
      applyClip();
      requestAnimationFrame(applyClip);
    });
  }, [applyClip]);

  // Listen to all map movements, zooms, and resizes
  useMapEvents({
    move: applyClip,
    zoom: applyClip,
    resize: applyClipDeferred,
    viewreset: applyClipDeferred,
    moveend: applyClipDeferred,
    zoomend: applyClipDeferred,
    layeradd: applyClipDeferred,
  });

  // The damage SVG is created or redrawn when its layer changes
  useEffect(() => {
    applyClipDeferred();
  }, [layersKey, applyClipDeferred]);

  // Ensure clip applies when the overlay image finishes loading
  useEffect(() => {
    const postEl = postOverlayRef.current?.getElement();
    if (postEl) {
      postEl.addEventListener("load", applyClip);
      applyClip();
      return () => postEl.removeEventListener("load", applyClip);
    }
    const interval = setInterval(applyClip, 100);
    const timeout = setTimeout(() => clearInterval(interval), 1500);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [applyClip, postOverlayRef]);

  return null;
}

function popupHtml(tier: DamageTier, buildingId: number | string, confidence?: number) {
  const color = DAMAGE_COLORS[tier] || "#888";
  const label = DAMAGE_LABELS[tier] || tier;
  const pct = typeof confidence === "number" ? Math.round(confidence * 1000) / 10 : null;
  return `
    <div style="min-width: 190px; font-family: 'Archivo Variable', system-ui, sans-serif;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="width:10px; height:10px; border-radius:999px; background:${color}; box-shadow:0 0 12px ${color};"></span>
        <strong style="font-size:14px; color:#E8ECF6; font-stretch:115%;">${label}</strong>
      </div>
      <div style="margin-top:8px; font-size:12px; color:#8E9AC0;">Building <span style="color:#E8ECF6; font-family:'IBM Plex Mono', monospace;">#${buildingId}</span></div>
      ${
        pct === null
          ? ""
          : `<div style="margin-top:8px; font-size:12px; color:#8E9AC0; display:flex; justify-content:space-between;">
               <span>Model confidence</span><span style="color:#E8ECF6; font-family:'IBM Plex Mono', monospace;">${pct}%</span>
             </div>
             <div style="margin-top:5px; height:4px; border-radius:4px; background:#22305C; overflow:hidden;">
               <div style="width:${pct}%; height:100%; background:${color};"></div>
             </div>`
      }
    </div>`;
}

export default function SwipeMap({
  site,
  showDamage: showDamageProp,
  onToggleDamage,
  visibleTiers = TIER_ORDER,
  georeferenced = true,
}: SwipeMapProps) {
  const [fraction, setFraction] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [damageData, setDamageData] = useState<DamageGeoJSON | null>(null);
  const [internalShowDamage, setInternalShowDamage] = useState(true);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [telemetry, setTelemetry] = useState<{ lat?: number; lng?: number; zoom: number }>({ zoom: 16 });

  const showDamage = showDamageProp ?? internalShowDamage;
  const toggleDamage = onToggleDamage ?? (() => setInternalShowDamage((v) => !v));

  const containerRef = useRef<HTMLDivElement>(null);
  const postOverlayRef = useRef<L.ImageOverlay | null>(null);

  const bounds: L.LatLngBoundsExpression = useMemo(
    () => [
      [site.bounds[0][0], site.bounds[0][1]],
      [site.bounds[1][0], site.bounds[1][1]],
    ],
    [site.bounds]
  );

  // Load damage GeoJSON
  useEffect(() => {
    if (!site.damage_geojson) return;
    let cancelled = false;
    fetch(site.damage_geojson)
      .then((r) => r.json())
      .then((data: DamageGeoJSON) => !cancelled && setDamageData(data))
      .catch((err) => console.error("Failed to load damage data:", err));
    return () => {
      cancelled = true;
    };
  }, [site.damage_geojson]);

  // Auto sweep: glide the divider back and forth
  useEffect(() => {
    if (!sweeping) return;
    let raf = 0;
    let phase = Math.asin(Math.max(-1, Math.min(1, (fraction - 0.5) / 0.4)));
    let last = performance.now();
    const tick = (now: number) => {
      phase += ((now - last) / 1000) * 0.9;
      last = now;
      setFraction(0.5 + 0.4 * Math.sin(phase));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweeping]);

  // Swipe handlers measured against container bounds
  const handleSwipeMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = clientX - rect.left;
    setFraction(Math.max(0.01, Math.min(0.99, x / rect.width)));
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleSwipeMove(e.clientX);
      }
    },
    [isDragging, handleSwipeMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        if (e.cancelable) e.preventDefault();
        handleSwipeMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleSwipeMove]
  );

  const stopDragging = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDragging);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", stopDragging);
      window.addEventListener("touchcancel", stopDragging);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, stopDragging]);

  // Map action buttons
  const handleZoomIn = useCallback(() => mapInstance?.zoomIn(), [mapInstance]);
  const handleZoomOut = useCallback(() => mapInstance?.zoomOut(), [mapInstance]);
  const handleResetBounds = useCallback(() => {
    mapInstance?.flyToBounds(bounds, { padding: [16, 16], maxZoom: 18, duration: 0.8 });
  }, [mapInstance, bounds]);

  // Keyboard: S sweep, R reset, +/- zoom, [ ] nudge divider
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === "s") setSweeping((v) => !v);
      else if (k === "r") handleResetBounds();
      else if (k === "+" || k === "=") handleZoomIn();
      else if (k === "-" || k === "_") handleZoomOut();
      else if (k === "[") {
        setSweeping(false);
        setFraction((f) => Math.max(0.01, f - 0.05));
      } else if (k === "]") {
        setSweeping(false);
        setFraction((f) => Math.min(0.99, f + 0.05));
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleResetBounds, handleZoomIn, handleZoomOut]);

  const onHandleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.15 : 0.03;
    if (e.key === "ArrowLeft") setFraction((f) => Math.max(0.01, f - step));
    else if (e.key === "ArrowRight") setFraction((f) => Math.min(0.99, f + step));
    else if (e.key === "Home") setFraction(0.01);
    else if (e.key === "End") setFraction(0.99);
    else return;
    e.preventDefault();
    e.stopPropagation(); // don't also switch sites
    setSweeping(false);
  };

  // GeoJSON polygon styling (memoised so per-frame re-renders don't restyle every polygon)
  const geoJsonStyle = useCallback((feature: GeoJSON.Feature | undefined): L.PathOptions => {
    const tier = (feature?.properties?.damage_tier as DamageTier) || "no-damage";
    const color = DAMAGE_COLORS[tier] || "#888";
    return { color, weight: 2, opacity: 0.95, fillColor: color, fillOpacity: 0.4 };
  }, []);

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const props = feature.properties;
      if (!props) return;
      const tier = (props.damage_tier as DamageTier) || "no-damage";
      layer.bindPopup(popupHtml(tier, props.building_id ?? "—", props.confidence), {
        closeButton: true,
        // keep popups clear of the control column and the bottom bar
        autoPanPaddingTopLeft: L.point(24, 64),
        autoPanPaddingBottomRight: L.point(84, 96),
      });
      const path = layer as L.Path;
      path.on({
        mouseover: () => {
          path.setStyle({ weight: 3.5, fillOpacity: 0.72 });
          path.bringToFront();
        },
        mouseout: () => path.setStyle(geoJsonStyle(feature)),
      });
    },
    [geoJsonStyle]
  );

  const tierFilter = useCallback(
    (feature: GeoJSON.Feature) =>
      visibleTiers.includes(((feature.properties?.damage_tier as DamageTier) || "no-damage") as DamageTier),
    [visibleTiers]
  );

  const percent = Math.round(fraction * 100);
  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-xl bg-ink/80 text-paper ring-1 ring-signal/15 backdrop-blur-md transition hover:bg-deep hover:ring-signal/40 active:scale-95";

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-frame bg-ink shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] ring-1 ring-signal/15"
    >
      <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden lg:h-[72vh] lg:max-h-[820px]">
        <MapContainer
          center={[site.center.lat, site.center.lng]}
          zoom={16}
          minZoom={12}
          maxZoom={22}
          zoomSnap={0.25}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={90}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={!isDragging}
          doubleClickZoom={!isDragging}
          touchZoom={!isDragging}
          dragging={!isDragging}
          keyboard={false}
        >
          <MapBridge bounds={bounds} onMapReady={setMapInstance} />
          <Telemetry onChange={setTelemetry} />

          {/* Pre-disaster imagery layer */}
          <ImageOverlay url={site.pre_image} bounds={bounds} zIndex={1} />

          {/* Post-disaster clipped imagery layer */}
          <ImageOverlay url={site.post_image} bounds={bounds} zIndex={2} ref={postOverlayRef} />

          <SwipeController
            fraction={fraction}
            postOverlayRef={postOverlayRef}
            containerRef={containerRef}
            layersKey={`${showDamage}-${damageData?.features.length ?? 0}-${visibleTiers.join(",")}`}
          />

          {/* Damage polygon overlays */}
          {showDamage && damageData && (
            <GeoJSON
              key={`damage-${site.id}-${damageData.features.length}-${visibleTiers.join(",")}`}
              data={damageData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
              filter={tierFilter}
              pane="damagePane"
            />
          )}
        </MapContainer>

        {/* Before / after labels */}
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[800] flex items-center justify-between text-xs font-medium sm:inset-x-5 sm:top-5">
          <span className="rounded-full bg-ink/80 px-3 py-1.5 text-paper backdrop-blur-md">Before</span>
          <span className="mr-14 rounded-full bg-ink/80 px-3 py-1.5 text-paper backdrop-blur-md">After</span>
        </div>

        {/* Map controls */}
        <div className="absolute right-4 top-4 z-[850] flex flex-col gap-2 sm:right-5 sm:top-5">
          <button onClick={handleZoomIn} title="Zoom in (+)" aria-label="Zoom in" className={iconBtn}>
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={handleZoomOut} title="Zoom out (−)" aria-label="Zoom out" className={iconBtn}>
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={handleResetBounds} title="Fit the whole scene (R)" aria-label="Fit the whole scene" className={iconBtn}>
            <Scan className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSweeping((v) => !v)}
            title={sweeping ? "Stop the sweep (S)" : "Sweep the divider automatically (S)"}
            aria-label={sweeping ? "Stop the automatic sweep" : "Sweep the divider automatically"}
            aria-pressed={sweeping}
            className={`${iconBtn} ${sweeping ? "!bg-signal !text-ink" : ""}`}
          >
            {sweeping ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        {/* Divider */}
        <div
          className="absolute bottom-0 top-0 z-[900] -ml-6 w-12 cursor-col-resize touch-none select-none"
          style={{ left: `${fraction * 100}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setSweeping(false);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setSweeping(false);
            setIsDragging(true);
          }}
        >
          <div className="spectrum-line-v absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2 shadow-[0_0_16px_rgba(255,255,255,0.55)]" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Before and after divider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent}% before, ${100 - percent}% after`}
            onKeyDown={onHandleKeyDown}
            className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-ink/85 backdrop-blur-md transition-transform duration-200 ${
              isDragging ? "scale-110" : "hover:scale-105"
            }`}
          >
            <MoveHorizontal className="h-5 w-5 text-paper" />
          </div>
        </div>

        {/* Bottom bar: readout + detections toggle */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[850] flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
          <div className="tabular rounded-xl bg-ink/80 px-3 py-2 font-mono text-2xs leading-relaxed text-haze backdrop-blur-md">
            <div>
              zoom <span className="text-paper">{telemetry.zoom.toFixed(1)}</span>
            </div>
            {georeferenced && telemetry.lat !== undefined && telemetry.lng !== undefined ? (
              <div className="text-paper">
                {telemetry.lat.toFixed(5)}, {telemetry.lng.toFixed(5)}
              </div>
            ) : (
              <div className="hidden sm:block">{georeferenced ? "hover the map for coordinates" : "not georeferenced"}</div>
            )}
          </div>

          <button
            onClick={toggleDamage}
            aria-pressed={showDamage}
            title="Show or hide the model's detections (D)"
            className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium ring-1 backdrop-blur-md transition ${
              showDamage ? "bg-paper text-ink ring-paper" : "bg-ink/80 text-haze ring-signal/20 hover:text-paper"
            }`}
          >
            <Layers className="h-4 w-4" />
            {showDamage ? "Detections on" : "Detections off"}
          </button>
        </div>
      </div>
    </div>
  );
}
