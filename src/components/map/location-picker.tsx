"use client";

import * as React from "react";
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isInsideBengaluru, findWardByPoint, findWardById, getAllWards, type LatLng } from "@/domain/geo";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface LocationPickerProps {
  value: LatLng;
  onChange: (value: LatLng, wardId?: string | null, wardName?: string | null) => void;
  selectedWardId?: string | null;
  landmark?: string;
  onLandmarkChange?: (landmark: string) => void;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  selectedWardId,
  landmark = "",
  onLandmarkChange,
  className,
}: LocationPickerProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<MapLibreMap | null>(null);
  const markerRef = React.useRef<MapLibreMarker | null>(null);

  const [geolocating, setGeolocating] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [accuracy, setAccuracy] = React.useState<number | null>(null);
  const [webGlSupported, setWebGlSupported] = React.useState(true);

  const isInside = isInsideBengaluru(value);
  const detectedWard = React.useMemo(() => findWardByPoint({ lat: value.lat, lng: value.lng }), [value.lat, value.lng]);

  // Handle coord nudge via keyboard
  const nudgeCoordinates = (dLat: number, dLng: number) => {
    const nextLat = Number((value.lat + dLat).toFixed(5));
    const nextLng = Number((value.lng + dLng).toFixed(5));
    const nextPoint = { lat: nextLat, lng: nextLng };
    const nextWard = findWardByPoint(nextPoint);
    onChange(nextPoint, nextWard?.wardId, nextWard?.wardName);

    if (markerRef.current) {
      markerRef.current.setLngLat([nextLng, nextLat]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([nextLng, nextLat]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const STEP = 0.0002; // ~22 meters
    if (e.key === "ArrowUp") {
      e.preventDefault();
      nudgeCoordinates(STEP, 0);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nudgeCoordinates(-STEP, 0);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudgeCoordinates(0, -STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nudgeCoordinates(0, STEP);
    }
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeolocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        const nextLat = Number(pos.coords.latitude.toFixed(5));
        const nextLng = Number(pos.coords.longitude.toFixed(5));
        setAccuracy(Math.round(pos.coords.accuracy));

        const nextPoint = { lat: nextLat, lng: nextLng };
        const nextWard = findWardByPoint(nextPoint);
        onChange(nextPoint, nextWard?.wardId, nextWard?.wardName);

        if (markerRef.current) {
          markerRef.current.setLngLat([nextLng, nextLat]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: [nextLng, nextLat], zoom: 15 });
        }
      },
      (err) => {
        setGeolocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Please drag the pin on the map instead.");
        } else {
          setGeoError("Unable to retrieve device position. Please position pin manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Initialize MapLibre
  React.useEffect(() => {
    let map: MapLibreMap | null = null;
    let marker: MapLibreMarker | null = null;
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current) return;

      try {
        const { Map, Marker, NavigationControl, setWorkerUrl } = await import("maplibre-gl");
        try {
          setWorkerUrl("/maplibre-gl-worker.mjs");
        } catch {
          // ignore if already configured
        }

        map = new Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [value.lng, value.lat],
          zoom: 14,
          attributionControl: false,
        });

        map.addControl(new NavigationControl({ showCompass: false }), "top-right");

        marker = new Marker({
          draggable: true,
          color: "rgb(15, 118, 110)", // Modern Civic Minimalism Teal
        })
          .setLngLat([value.lng, value.lat])
          .addTo(map);

        marker.on("dragend", () => {
          if (!marker) return;
          const lngLat = marker.getLngLat();
          const nextPt = {
            lat: Number(lngLat.lat.toFixed(5)),
            lng: Number(lngLat.lng.toFixed(5)),
          };
          const nextWard = findWardByPoint(nextPt);
          onChange(nextPt, nextWard?.wardId, nextWard?.wardName);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } catch (err) {
        console.warn("MapLibre initialization fallback:", err);
        if (isMounted) setWebGlSupported(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (marker) marker.remove();
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      {/* Geolocation & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={geolocating}
          className="gap-2 text-xs"
        >
          <Navigation className={`h-3.5 w-3.5 text-primary ${geolocating ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>{geolocating ? "Locating device..." : "Use my current location"}</span>
        </Button>

        {accuracy !== null && (
          <span className="text-xs text-muted">
            Accuracy: ±{accuracy}m
          </span>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="font-mono bg-surface-muted px-2 py-0.5 rounded border border-border">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        </div>
      </div>

      {geoError && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>{geoError}</span>
        </div>
      )}

      {!isInside && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <span className="font-medium">
            Selected location is outside Bengaluru municipal boundary. Please pan inside the city.
          </span>
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative h-64 w-full rounded-md border border-border overflow-hidden bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Map location picker. Use arrow keys to nudge pin."
      >
        <div ref={mapContainerRef} className="h-full w-full" />

        {!webGlSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface p-4 text-center text-xs text-muted">
            <MapPin className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
            <p className="font-medium text-ink">Interactive map unavailable</p>
            <p>Using manual coordinates and landmark verification.</p>
          </div>
        )}

        {/* Nudge Instruction Badge */}
        <div className="absolute bottom-2 left-2 pointer-events-none rounded bg-surface/90 backdrop-blur-xs border border-border px-2 py-1 text-[11px] text-ink-muted shadow-xs flex items-center gap-1.5">
          <span>Click &amp; drag pin · Arrow keys nudge ±20m</span>
        </div>
      </div>

      {/* Ward & Landmark Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {detectedWard ? (
          <div className="flex flex-col gap-1 rounded-md border border-border bg-surface p-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Detected BBMP Ward
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-ink">
                {detectedWard.wardName}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-md border border-amber-300 bg-amber-50/70 p-3">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
              Unmatched Ward Boundary
            </span>
            <p className="text-xs text-amber-900">
              Point is on an unmapped boundary. Please pick your ward:
            </p>
            <select
              id="picker-manual-ward"
              value={selectedWardId || ""}
              onChange={(e) => {
                const wid = e.target.value;
                const wObj = findWardById(wid);
                onChange(value, wid || null, wObj?.wardName || null);
              }}
              className="mt-1 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Select BBMP Ward --</option>
              {getAllWards().map((w) => (
                <option key={w.wardId} value={w.wardId}>
                  {w.wardNo ? `Ward ${w.wardNo} - ` : ""}{w.wardName}
                </option>
              ))}
            </select>
          </div>
        )}

        {onLandmarkChange && (
          <div className="flex flex-col gap-1">
            <label htmlFor="picker-landmark" className="text-xs font-semibold text-muted uppercase tracking-wider">
              Landmark / Directions (Optional)
            </label>
            <input
              id="picker-landmark"
              type="text"
              maxLength={120}
              value={landmark}
              onChange={(e) => onLandmarkChange(e.target.value)}
              placeholder="e.g. Opposite Gate 2, Metro Pillar 140"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
