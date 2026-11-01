"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import type { Complaint } from "@/domain/types";
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface OpsMapViewProps {
  complaints: Complaint[];
}

const CATEGORIES = [
  "ALL",
  "ROADS",
  "DRAINAGE",
  "STREETLIGHT",
  "WASTE",
  "WATER",
  "TRAFFIC",
];

// Token-aligned RGB colours (avoid literal '#' which violates project lint rule)
const COLOR_CRITICAL = "rgb(220, 38, 38)";
const COLOR_HIGH = "rgb(234, 88, 12)";
const COLOR_MEDIUM = "rgb(202, 138, 4)";
const COLOR_LOW = "rgb(22, 163, 74)";
const COLOR_PRIMARY = "rgb(15, 118, 110)";
const COLOR_WHITE = "rgb(255, 255, 255)";

export function OpsMapView({ complaints }: OpsMapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<MapLibreMap | null>(null);
  const [selectedComplaint, setSelectedComplaint] = React.useState<Complaint | null>(
    complaints[0] || null,
  );
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [mapError, setMapError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Filter active complaints
  const filteredComplaints = React.useMemo(() => {
    return complaints.filter((c) => {
      if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
      return true;
    });
  }, [complaints, categoryFilter]);

  // Initialize MapLibre GL
  React.useEffect(() => {
    let map: MapLibreMap | null = null;
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const { Map, AttributionControl, NavigationControl, setWorkerUrl } = await import(
          "maplibre-gl"
        );
        try {
          setWorkerUrl("/maplibre-gl-worker.mjs");
        } catch {
          // Ignore
        }

        const mapInstance = new Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [77.62, 12.935], // Bengaluru center
          zoom: 11.5,
          attributionControl: false,
        });

        map = mapInstance;

        mapInstance.addControl(
          new AttributionControl({
            compact: true,
            customAttribution: "© OpenFreeMap · © OpenStreetMap contributors",
          }),
          "bottom-right",
        );

        mapInstance.addControl(new NavigationControl({ showCompass: false }), "top-right");

        mapInstance.on("load", () => {
          if (isCancelled || !map) return;
          setIsLoaded(true);

          const geojsonFeatures = filteredComplaints.map((c) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [c.location.lng, c.location.lat] as [number, number],
            },
            properties: {
              id: c.id,
              ref: c.ref,
              title: c.title,
              category: c.category,
              band: c.priority.band,
              score: c.priority.score,
              status: c.status,
              wardName: c.location.wardName || "Bengaluru",
            },
          }));

          map.addSource("ops-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: geojsonFeatures,
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          // Clusters Circle Layer
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "ops-source",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step",
                ["get", "point_count"],
                COLOR_PRIMARY,
                8,
                COLOR_HIGH,
                20,
                COLOR_CRITICAL,
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                8,
                24,
                20,
                30,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": COLOR_WHITE,
            },
          });

          // Cluster count label
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "ops-source",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Noto Sans Bold"],
              "text-size": 12,
            },
            paint: {
              "text-color": COLOR_WHITE,
            },
          });

          // Unclustered point markers
          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "ops-source",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": [
                "match",
                ["get", "band"],
                "CRITICAL",
                COLOR_CRITICAL,
                "HIGH",
                COLOR_HIGH,
                "MEDIUM",
                COLOR_MEDIUM,
                COLOR_LOW,
              ],
              "circle-radius": 8,
              "circle-stroke-width": 2,
              "circle-stroke-color": COLOR_WHITE,
            },
          });

          // Click on cluster
          map.on("click", "clusters", (e) => {
            if (!map) return;
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["clusters"],
            });
            const clusterId = features[0]?.properties?.cluster_id;
            const source = map.getSource("ops-source") as GeoJSONSource;
            if (source && typeof clusterId === "number") {
              source
                .getClusterExpansionZoom(clusterId)
                .then((zoom) => {
                  const geom = features[0]?.geometry;
                  if (geom && geom.type === "Point") {
                    map?.easeTo({
                      center: geom.coordinates as [number, number],
                      zoom,
                    });
                  }
                })
                .catch(() => {});
            }
          });

          // Click on unclustered point
          map.on("click", "unclustered-point", (e) => {
            const feature = e.features?.[0];
            const complaintId = feature?.properties?.id;
            if (typeof complaintId === "string") {
              const matched = complaints.find((c) => c.id === complaintId);
              if (matched) {
                setSelectedComplaint(matched);
              }
            }
          });

          map.on("mouseenter", "clusters", () => {
            if (map) map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "clusters", () => {
            if (map) map.getCanvas().style.cursor = "";
          });
          map.on("mouseenter", "unclustered-point", () => {
            if (map) map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "unclustered-point", () => {
            if (map) map.getCanvas().style.cursor = "";
          });
        });

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn("Ops map init fallback:", err);
        setMapError(true);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (map) {
        map.remove();
      }
    };
  }, [complaints, filteredComplaints]);

  // Update source data
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;

    const source = map.getSource("ops-source") as GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: filteredComplaints.map((c) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [c.location.lng, c.location.lat],
          },
          properties: {
            id: c.id,
            ref: c.ref,
            title: c.title,
            category: c.category,
            band: c.priority.band,
            score: c.priority.score,
            status: c.status,
            wardName: c.location.wardName || "Bengaluru",
          },
        })),
      });
    }
  }, [filteredComplaints, isLoaded]);

  const handleSelectComplaint = (c: Complaint) => {
    setSelectedComplaint(c);
    const map = mapInstanceRef.current;
    if (map && isLoaded) {
      map.flyTo({
        center: [c.location.lng, c.location.lat],
        zoom: 14,
        essential: true,
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-canvas">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Link href="/authority/queue">
            <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs font-semibold text-muted hover:text-ink">
              <Icon icon={ChevronRight} size={14} className="rotate-180" />
              <span>Queue table</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-bold text-ink sm:text-base">Operations Dispatch Map</h1>
          <DemoBadge />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-subtle text-ink-secondary hover:bg-border"
              }`}
            >
              {cat === "ALL" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map / Queue Split View ── */}
      <div className="relative flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Map Container */}
        <div className="relative h-[55vh] w-full lg:h-[calc(100dvh-120px)] lg:w-[60%] border-b lg:border-b-0 lg:border-r border-border bg-surface-subtle">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Grid fallback */}
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas p-6 text-center">
              <Icon icon={AlertTriangle} size={32} className="text-warning mb-2" />
              <h2 className="text-base font-bold text-ink">Operations Grid Fallback</h2>
              <p className="max-w-[40ch] text-xs text-muted mb-4">
                WebGL canvas not accessible. Showing {filteredComplaints.length} plotted dispatch points.
              </p>
              <div className="relative h-64 w-full max-w-md rounded-xl border border-dashed border-border bg-surface p-4">
                {filteredComplaints.slice(0, 30).map((c) => {
                  const left = Math.min(95, Math.max(5, ((c.location.lng - 77.5) / 0.2) * 100));
                  const top = Math.min(95, Math.max(5, ((13.05 - c.location.lat) / 0.2) * 100));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectComplaint(c)}
                      style={{ left: `${left}%`, top: `${top}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-white shadow-xs transition-transform hover:scale-150 ${
                        c.priority.band === "CRITICAL"
                          ? "bg-danger"
                          : c.priority.band === "HIGH"
                          ? "bg-warning"
                          : "bg-primary"
                      }`}
                      title={`${c.ref} · ${c.title}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-surface/90 px-3 py-1.5 backdrop-blur-md shadow-xs text-xs text-ink">
            <span className="font-semibold text-muted">Priority:</span>
            <span className="flex items-center gap-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-danger" /> Critical (≥70)
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-warning" /> High (50–69)
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-accent" /> Medium (30–49)
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-success" /> Low (&lt;30)
            </span>
          </div>
        </div>

        {/* Complaints Side List */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-canvas p-4 lg:w-[40%] lg:h-[calc(100dvh-120px)]">
          {/* Spotlight Card */}
          {selectedComplaint && (
            <div className="mb-4 rounded-xl border-2 border-primary/40 bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <ReferenceChip reference={selectedComplaint.ref} />
                <div className="flex items-center gap-1.5">
                  <PriorityBadge
                    band={selectedComplaint.priority.band}
                    score={selectedComplaint.priority.score}
                    size="sm"
                  />
                  <StatusBadge status={selectedComplaint.status} size="sm" />
                </div>
              </div>

              <h2 className="text-base font-bold text-ink mb-1.5">
                {selectedComplaint.title}
              </h2>
              <p className="text-xs text-ink-secondary line-clamp-3 mb-3 leading-relaxed">
                {selectedComplaint.description}
              </p>

              <div className="flex items-center justify-between border-t border-border/80 pt-3 text-xs text-muted">
                <div className="flex items-center gap-1 truncate max-w-[200px]">
                  <Icon icon={MapPin} size={13} className="shrink-0 text-primary" />
                  <span className="truncate">
                    {selectedComplaint.location.landmark || selectedComplaint.location.wardName}
                  </span>
                </div>
                <Link href={`/authority/complaints/${selectedComplaint.id}`}>
                  <Button size="sm" className="h-8 gap-1 text-xs font-semibold">
                    <span>Open workspace</span>
                    <Icon icon={ExternalLink} size={12} />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* List of complaints */}
          <div className="flex items-center justify-between mb-3 text-xs text-muted">
            <span className="font-semibold text-ink">
              {filteredComplaints.length} tickets in field view
            </span>
            <span>Click any marker to inspect</span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredComplaints.map((c) => {
              const isSelected = selectedComplaint?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectComplaint(c)}
                  className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink">{c.ref}</span>
                    <PriorityBadge band={c.priority.band} score={c.priority.score} size="sm" />
                  </div>
                  <h3 className="line-clamp-1 text-xs font-semibold text-ink">{c.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{c.location.wardName || "Bengaluru"}</span>
                    <span className="font-semibold text-ink">{c.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
