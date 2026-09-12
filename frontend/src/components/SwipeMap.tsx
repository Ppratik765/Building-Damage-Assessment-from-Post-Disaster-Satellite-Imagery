"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  ImageOverlay,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Site, DamageGeoJSON, DamageTier } from "@/lib/types";
import { DAMAGE_COLORS, DAMAGE_LABELS } from "@/lib/types";

interface SwipeMapProps {
  site: Site;
  profile?: string;
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
  }, [map, bounds, onMapReady]);
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
}: {
  fraction: number;
  postOverlayRef: React.RefObject<L.ImageOverlay | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
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
        const clipX = Math.max(
          0,
          Math.min(imgRect.width, sliderX - imgRect.left)
        );
        postEl.style.clipPath = `inset(0 0 0 ${clipX}px)`;
      }
    }

    // Clip the Damage GeoJSON SVG if present
    const svgEl = containerRef.current.querySelector(
      ".leaflet-damagePane-pane svg, .leaflet-overlay-pane svg"
    ) as SVGElement | null;
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      if (svgRect.width > 0) {
        const clipX = Math.max(
          0,
          Math.min(svgRect.width, sliderX - svgRect.left)
        );
        svgEl.style.clipPath = `inset(0 0 0 ${clipX}px)`;
      }
    }
  }, [fraction, containerRef, postOverlayRef]);

  // Apply immediately when fraction changes
  useEffect(() => {
    applyClip();
  }, [applyClip]);

  // Listen to all map movements, zooms, and resizes
  useMapEvents({
    move: applyClip,
    zoom: applyClip,
    resize: applyClip,
    viewreset: applyClip,
  });

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

export default function SwipeMap({ site }: SwipeMapProps) {
  const [fraction, setFraction] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [damageData, setDamageData] = useState<DamageGeoJSON | null>(null);
  const [showDamage, setShowDamage] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const postOverlayRef = useRef<L.ImageOverlay | null>(null);

  const bounds: L.LatLngBoundsExpression = [
    [site.bounds[0][0], site.bounds[0][1]],
    [site.bounds[1][0], site.bounds[1][1]],
  ];

  // Load damage GeoJSON
  useEffect(() => {
    if (!site.damage_geojson) return;
    fetch(site.damage_geojson)
      .then((r) => r.json())
      .then((data: DamageGeoJSON) => setDamageData(data))
      .catch((err) => console.error("Failed to load damage data:", err));
  }, [site.damage_geojson]);

  // Swipe handlers measured against container bounds
  const handleSwipeMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = clientX - rect.left;
    const frac = Math.max(0.01, Math.min(0.99, x / rect.width));
    setFraction(frac);
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

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

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
  const handleZoomIn = () => mapInstance?.zoomIn();
  const handleZoomOut = () => mapInstance?.zoomOut();
  const handleResetBounds = () => {
    mapInstance?.fitBounds(bounds, { padding: [16, 16], maxZoom: 18 });
  };

  // GeoJSON polygon styling
  const geoJsonStyle = (feature: GeoJSON.Feature | undefined) => {
    const tier = (feature?.properties?.damage_tier as DamageTier) || "no-damage";
    const color = DAMAGE_COLORS[tier] || "#888";
    return {
      color,
      weight: 2,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: 0.45,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties;
    if (!props) return;
    const tier = (props.damage_tier as DamageTier) || "no-damage";
    const color = DAMAGE_COLORS[tier] || "#888";
    const label = DAMAGE_LABELS[tier] || tier;
    const confidence = props.confidence ? (props.confidence * 100).toFixed(1) : "—";

    layer.bindPopup(`
      <div style="font-family: var(--font-fira-code), monospace; min-width: 170px; padding: 4px 2px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color};
                      box-shadow: 0 0 10px ${color};"></div>
          <strong style="font-size: 13px; color: #f8fafc;">${label}</strong>
        </div>
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
          Building ID: <span style="color: #cbd5e1;">#${props.building_id ?? "—"}</span><br/>
          Confidence: <span style="color: ${color}; font-weight: 600;">${confidence}%</span>
        </div>
      </div>
    `);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl select-none overflow-hidden glass-card border border-slate-700/60 shadow-2xl"
    >
      {/* Map Viewport Container - Fixed responsive height, strictly contained */}
      <div className="w-full relative h-[440px] sm:h-[520px] md:h-[600px] lg:h-[660px] overflow-hidden rounded-2xl bg-slate-950">
        <MapContainer
          center={[site.center.lat, site.center.lng]}
          zoom={16}
          minZoom={12}
          maxZoom={22}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          scrollWheelZoom={!isDragging}
          doubleClickZoom={!isDragging}
          touchZoom={!isDragging}
          dragging={!isDragging}
        >
          <MapBridge bounds={bounds} onMapReady={setMapInstance} />

          {/* Pre-disaster imagery layer */}
          <ImageOverlay url={site.pre_image} bounds={bounds} zIndex={1} />

          {/* Post-disaster clipped imagery layer */}
          <ImageOverlay
            url={site.post_image}
            bounds={bounds}
            zIndex={2}
            ref={postOverlayRef}
          />

          <SwipeController
            fraction={fraction}
            postOverlayRef={postOverlayRef}
            containerRef={containerRef}
          />

          {/* Damage polygon overlays */}
          {showDamage && damageData && (
            <GeoJSON
              key={`damage-${site.id}-${damageData.features.length}`}
              data={damageData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
              pane="damagePane"
            />
          )}
        </MapContainer>

        {/* Top Badges (Pre vs Post) */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-[800]">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-slate-900/90 border border-cyan-500/40 text-cyan-300 backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Pre-Disaster</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-slate-900/90 border border-orange-500/40 text-orange-300 backdrop-blur-md shadow-lg pointer-events-auto">
            <span>Post-Disaster</span>
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-orange-400 animate-pulse" />
          </div>
        </div>

        {/* Floating Interactive Map Controls (Zoom In, Zoom Out, Recenter) */}
        <div className="absolute top-14 right-3 z-[850] flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in"
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center backdrop-blur-md shadow-lg transition-transform active:scale-95"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center backdrop-blur-md shadow-lg transition-transform active:scale-95"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M20 12H4"
              />
            </svg>
          </button>
          <button
            onClick={handleResetBounds}
            title="Reset to Full Scene"
            aria-label="Reset to full scene"
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center justify-center backdrop-blur-md shadow-lg transition-transform active:scale-95"
          >
            <svg
              className="w-4 h-4 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2v4m0 12v4M2 12h4m12 0h4m-7-7l4-4m-4 18l4 4M7 7L3 3m4 14l-4 4"
              />
            </svg>
          </button>
        </div>

        {/* Draggable Swipe Divider Handle (Anchored to container percentage) */}
        <div
          className="swipe-handle absolute top-0 bottom-0 z-[900] w-12 -ml-6 cursor-col-resize select-none pointer-events-auto touch-none"
          style={{ left: `${fraction * 100}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsDragging(true);
          }}
        >
          {/* Visual thin line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-gradient-to-b from-cyan-400 via-white to-orange-400 shadow-[0_0_14px_rgba(255,255,255,0.9)]" />

          {/* Floating circular knob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/95 border-2 border-white shadow-2xl flex items-center justify-center backdrop-blur-md transition-transform active:scale-110">
            <svg
              className="w-5 h-5 text-cyan-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8 9l-4 3 4 3m8-6l4 3-4 3"
              />
            </svg>
          </div>
        </div>

        {/* Bottom Control Bar: Damage Toggle & Legend Drawer */}
        <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2 pointer-events-none z-[850]">
          {/* Left: Collapsible Legend Drawer */}
          <div className="pointer-events-auto flex flex-col items-start gap-1">
            {showDamage && showLegend && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] sm:text-xs space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  Damage Legend
                </div>
                {(Object.entries(DAMAGE_COLORS) as [DamageTier, string][]).map(
                  ([tier, color]) => (
                    <div key={tier} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shadow-sm"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 6px ${color}60`,
                        }}
                      />
                      <span className="text-slate-300 font-medium">
                        {DAMAGE_LABELS[tier]}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            {showDamage && (
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-700/60 backdrop-blur-md shadow-md"
              >
                {showLegend ? "Hide Legend" : "Show Legend"}
              </button>
            )}
          </div>

          {/* Right: Damage Toggle Button */}
          <button
            onClick={() => setShowDamage(!showDamage)}
            className={`pointer-events-auto px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xl backdrop-blur-md flex items-center gap-2 border ${
              showDamage
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20"
                : "bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showDamage ? "bg-cyan-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span>{showDamage ? "Damage Layer ON" : "Damage Layer OFF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
