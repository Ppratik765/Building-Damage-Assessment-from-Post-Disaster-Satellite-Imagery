"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  ImageOverlay,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Site, DamageGeoJSON, DamageTier } from "@/lib/types";
import { DAMAGE_COLORS, DAMAGE_LABELS } from "@/lib/types";

interface SwipeMapProps {
  site: Site;
}

/** Component to fit map bounds to the site on mount */
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, bounds]);
  return null;
}

/** Custom clip-path swipe on the post image overlay */
function SwipeController({
  position,
  postOverlayRef,
}: {
  position: number;
  postOverlayRef: React.RefObject<L.ImageOverlay | null>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!postOverlayRef.current) return;
    const el = postOverlayRef.current.getElement();
    if (!el) return;
    // clip-path: inset(top right bottom left)
    // We clip from the left side based on swipe position
    el.style.clipPath = `inset(0 0 0 ${position}%)`;
  }, [position, postOverlayRef, map]);

  return null;
}

export default function SwipeMap({ site }: SwipeMapProps) {
  const [swipePosition, setSwipePosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [damageData, setDamageData] = useState<DamageGeoJSON | null>(null);
  const [showDamage, setShowDamage] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const postOverlayRef = useRef<L.ImageOverlay | null>(null);

  const bounds: L.LatLngBoundsExpression = [
    [site.bounds[0][0], site.bounds[0][1]],
    [site.bounds[1][0], site.bounds[1][1]],
  ];

  // Load damage GeoJSON
  useEffect(() => {
    fetch(site.damage_geojson)
      .then((r) => r.json())
      .then((data: DamageGeoJSON) => setDamageData(data))
      .catch((err) => console.error("Failed to load damage data:", err));
  }, [site.damage_geojson]);

  // Swipe handlers
  const handleSwipeMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSwipePosition(pct);
    },
    []
  );

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
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, stopDragging]);

  // GeoJSON styling
  const geoJsonStyle = (feature: GeoJSON.Feature | undefined) => {
    const tier = feature?.properties?.damage_tier as DamageTier;
    const color = DAMAGE_COLORS[tier] || "#888";
    return {
      color,
      weight: 2,
      opacity: 0.9,
      fillColor: color,
      fillOpacity: 0.35,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties;
    if (!props) return;
    const tier = props.damage_tier as DamageTier;
    const color = DAMAGE_COLORS[tier] || "#888";
    const label = DAMAGE_LABELS[tier] || tier;
    const confidence = (props.confidence * 100).toFixed(1);

    layer.bindPopup(`
      <div style="font-family: var(--font-fira-code), monospace; min-width: 160px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color};
                      box-shadow: 0 0 8px ${color}80;"></div>
          <strong style="font-size: 13px;">${label}</strong>
        </div>
        <div style="font-size: 11px; color: #94a3b8;">
          Building #${props.building_id}<br/>
          Confidence: <span style="color: ${color};">${confidence}%</span>
        </div>
      </div>
    `);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Map */}
      <div className="w-full h-[500px] md:h-[600px] lg:h-[700px] rounded-xl overflow-hidden border border-slate-700/50">
        <MapContainer
          center={[site.center.lat, site.center.lng]}
          zoom={16}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
          dragging={!isDragging}
          scrollWheelZoom={!isDragging}
        >
          <FitBounds bounds={bounds} />

          {/* Pre-disaster (bottom layer) */}
          <ImageOverlay url={site.pre_image} bounds={bounds} zIndex={1} />

          {/* Post-disaster (top layer, clipped) */}
          <ImageOverlay
            url={site.post_image}
            bounds={bounds}
            zIndex={2}
            ref={postOverlayRef}
          />

          <SwipeController
            position={swipePosition}
            postOverlayRef={postOverlayRef}
          />

          {/* Damage overlay */}
          {showDamage && damageData && (
            <GeoJSON
              key={`damage-${site.id}`}
              data={damageData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </div>

      {/* Swipe divider */}
      <div
        className="swipe-handle absolute top-0 bottom-0 z-[1000]"
        style={{ left: `${swipePosition}%`, transform: "translateX(-50%)" }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="swipe-line absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-white/80 transition-all" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 border-2 border-white/80 flex items-center justify-center backdrop-blur-sm">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div
        className="absolute top-4 left-4 z-[900] px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
        style={{
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(34, 211, 238, 0.3)",
          color: "#22d3ee",
          backdropFilter: "blur(8px)",
        }}
      >
        Pre-Disaster
      </div>
      <div
        className="absolute top-4 right-4 z-[900] px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
        style={{
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(249, 115, 22, 0.3)",
          color: "#f97316",
          backdropFilter: "blur(8px)",
        }}
      >
        Post-Disaster
      </div>

      {/* Damage toggle */}
      <button
        onClick={() => setShowDamage(!showDamage)}
        className="absolute bottom-4 right-4 z-[900] px-4 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: showDamage
            ? "rgba(34, 211, 238, 0.15)"
            : "rgba(15, 23, 42, 0.85)",
          border: `1px solid ${
            showDamage ? "rgba(34, 211, 238, 0.4)" : "rgba(148, 163, 184, 0.2)"
          }`,
          color: showDamage ? "#22d3ee" : "#94a3b8",
          backdropFilter: "blur(8px)",
        }}
      >
        {showDamage ? "🛡️ Damage On" : "🛡️ Damage Off"}
      </button>

      {/* Legend */}
      {showDamage && (
        <div
          className="absolute bottom-4 left-4 z-[900] p-3 rounded-lg text-xs space-y-1.5"
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          {(Object.entries(DAMAGE_COLORS) as [DamageTier, string][]).map(
            ([tier, color]) => (
              <div key={tier} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}40`,
                  }}
                />
                <span className="text-slate-300">{DAMAGE_LABELS[tier]}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
