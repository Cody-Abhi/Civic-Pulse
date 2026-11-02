/**
 * Geospatial primitives (§28, §30) — pure and dependency-free so the domain
 * layer stays self-contained. geohash + neighbours power the 9-cell duplicate
 * candidate retrieval; haversine is the distance gate; point-in-polygon maps a
 * coordinate to a ward.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (d: number): number => (d * Math.PI) / 180;

/** Great-circle distance in metres between two coordinates. */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Encode a coordinate to a geohash of the given precision (default 9). */
export function geohashEncode(lat: number, lng: number, precision = 9): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let hash = "";
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (hash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        idx = idx * 2 + 1;
        lngMin = mid;
      } else {
        idx *= 2;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        latMin = mid;
      } else {
        idx *= 2;
        latMax = mid;
      }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      hash += BASE32[idx] ?? "0";
      bit = 0;
      idx = 0;
    }
  }
  return hash;
}

const NEIGHBOUR = {
  n: ["p0r21436x8zb9dcf5h7kjnmqesgutwvy", "bc01fg45238967deuvhjyznpkmstqrwx"],
  s: ["14365h7k9dcfesgujnmqp0r2twvyx8zb", "238967debc01fg45kmstqrwxuvhjyznp"],
  e: ["bc01fg45238967deuvhjyznpkmstqrwx", "p0r21436x8zb9dcf5h7kjnmqesgutwvy"],
  w: ["238967debc01fg45kmstqrwxuvhjyznp", "14365h7k9dcfesgujnmqp0r2twvyx8zb"],
} as const;
const BORDER = {
  n: ["prxz", "bcfguvyz"],
  s: ["028b", "0145hjnp"],
  e: ["bcfguvyz", "prxz"],
  w: ["0145hjnp", "028b"],
} as const;

type Dir = "n" | "s" | "e" | "w";

function adjacent(hash: string, dir: Dir): string {
  const h = hash.toLowerCase();
  const last = h.charAt(h.length - 1);
  let parent = h.slice(0, -1);
  const type: 0 | 1 = h.length % 2 === 0 ? 0 : 1; // 0 even, 1 odd
  if (BORDER[dir][type].indexOf(last) !== -1 && parent !== "") {
    parent = adjacent(parent, dir);
  }
  const idx = NEIGHBOUR[dir][type].indexOf(last);
  return parent + (BASE32[idx] ?? "");
}

/** The 8 geohash cells surrounding `hash` (same precision). */
export function geohashNeighbors(hash: string): string[] {
  const n = adjacent(hash, "n");
  const s = adjacent(hash, "s");
  return [
    n,
    s,
    adjacent(hash, "e"),
    adjacent(hash, "w"),
    adjacent(n, "e"),
    adjacent(n, "w"),
    adjacent(s, "e"),
    adjacent(s, "w"),
  ];
}

/** The 9-cell block (self + neighbours) used for candidate retrieval (§28.3). */
export function geohashBlock(lat: number, lng: number, precision = 5): string[] {
  const self = geohashEncode(lat, lng, precision);
  return [self, ...geohashNeighbors(self)];
}

/** Ray-casting test: is [lng,lat] inside a single ring of GeoJSON [lng,lat] pairs. */
function inRing(lng: number, lat: number, ring: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i];
    const pj = ring[j];
    if (!pi || !pj) continue;
    const [xi, yi] = pi;
    const [xj, yj] = pj;
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Point-in-polygon for a GeoJSON Polygon: coordinates is an array of rings,
 * [0] = outer, [1..] = holes. Coordinates are [lng, lat].
 */
export function pointInPolygon(
  point: LatLng,
  polygon: ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
): boolean {
  const outer = polygon[0];
  if (!outer || !inRing(point.lng, point.lat, outer)) return false;
  for (let k = 1; k < polygon.length; k++) {
    const hole = polygon[k];
    if (hole && inRing(point.lng, point.lat, hole)) return false;
  }
  return true;
}

/** Bengaluru City Bounding Box (§30.1) */
export const BENGALURU_BOUNDS = {
  minLat: 12.75,
  maxLat: 13.25,
  minLng: 77.40,
  maxLng: 77.85,
} as const;

/**
 * Returns true if the coordinate falls strictly within Bengaluru metropolitan limits.
 */
export function isInsideBengaluru(point: LatLng): boolean {
  return (
    point.lat >= BENGALURU_BOUNDS.minLat &&
    point.lat <= BENGALURU_BOUNDS.maxLat &&
    point.lng >= BENGALURU_BOUNDS.minLng &&
    point.lng <= BENGALURU_BOUNDS.maxLng
  );
}

import wardsGeoJson from "./wards.json";

export interface WardGeometryPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface WardGeometryMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type WardGeometry = WardGeometryPolygon | WardGeometryMultiPolygon;

export interface RawWardFeature {
  type: "Feature";
  properties: {
    wardId: string;
    wardName: string;
    wardNo?: string | undefined;
  };
  geometry: WardGeometry;
}

export interface WardBoundaryFeature {
  wardId: string;
  wardName: string;
  wardNo?: string | undefined;
  geometry?: WardGeometry | undefined;
  coordinates: number[][][];
}

const rawWardFeatures = (wardsGeoJson as { features: RawWardFeature[] }).features;

/** Real Bengaluru ward definitions from DataMeet Municipal_Spatial_Data (CC BY 4.0) */
export const BENGALURU_WARDS: WardBoundaryFeature[] = rawWardFeatures.map((f) => ({
  wardId: f.properties.wardId,
  wardName: f.properties.wardName,
  wardNo: f.properties.wardNo,
  geometry: f.geometry,
  // Backwards compatibility for code expecting single outer ring polygon coordinates
  coordinates:
    f.geometry.type === "Polygon"
      ? f.geometry.coordinates
      : (f.geometry.coordinates[0] ?? []),
}));

export const PILOT_WARD_BOUNDARIES: WardBoundaryFeature[] = BENGALURU_WARDS;

export function findWardById(wardId: string): WardBoundaryFeature | null {
  return BENGALURU_WARDS.find((w) => w.wardId === wardId) || null;
}

export function getAllWards(): { wardId: string; wardName: string; wardNo: string }[] {
  return BENGALURU_WARDS.map((w) => ({
    wardId: w.wardId,
    wardName: w.wardName,
    wardNo: w.wardNo || "",
  }));
}

/**
 * Finds the corresponding BBMP ward for a given point using point-in-polygon.
 * Checks both Polygon and MultiPolygon geometries from DataMeet spatial boundaries.
 * Returns null if outside the mapped wards.
 */
export function findWardByPoint(
  point: LatLng,
  wards: WardBoundaryFeature[] = BENGALURU_WARDS,
): { wardId: string; wardName: string } | null {
  for (const ward of wards) {
    if (ward.geometry) {
      if (ward.geometry.type === "Polygon") {
        if (
          pointInPolygon(
            point,
            ward.geometry.coordinates as unknown as ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
          )
        ) {
          return { wardId: ward.wardId, wardName: ward.wardName };
        }
      } else if (ward.geometry.type === "MultiPolygon") {
        for (const poly of ward.geometry.coordinates) {
          if (
            pointInPolygon(
              point,
              poly as unknown as ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
            )
          ) {
            return { wardId: ward.wardId, wardName: ward.wardName };
          }
        }
      }
    } else if (ward.coordinates) {
      if (
        pointInPolygon(
          point,
          ward.coordinates as unknown as ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
        )
      ) {
        return { wardId: ward.wardId, wardName: ward.wardName };
      }
    }
  }
  return null;
}
