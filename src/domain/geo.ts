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

export interface WardBoundaryFeature {
  wardId: string;
  wardName: string;
  coordinates: number[][][];
}

/** Default pilot ward polygon definitions for client & server detection */
export const PILOT_WARD_BOUNDARIES: WardBoundaryFeature[] = [
  {
    wardId: "ward-150-bellandur",
    wardName: "Bellandur",
    coordinates: [[[77.655, 12.915], [77.695, 12.915], [77.705, 12.945], [77.665, 12.950], [77.655, 12.915]]],
  },
  {
    wardId: "ward-080-indiranagar",
    wardName: "Indiranagar",
    coordinates: [[[77.625, 12.960], [77.655, 12.960], [77.655, 12.985], [77.625, 12.985], [77.625, 12.960]]],
  },
  {
    wardId: "ward-151-koramangala",
    wardName: "Koramangala",
    coordinates: [[[77.610, 12.920], [77.640, 12.920], [77.645, 12.948], [77.610, 12.945], [77.610, 12.920]]],
  },
  {
    wardId: "ward-085-whitefield",
    wardName: "Whitefield",
    coordinates: [[[77.725, 12.948], [77.775, 12.948], [77.780, 12.990], [77.725, 12.990], [77.725, 12.948]]],
  },
  {
    wardId: "ward-174-hsr-layout",
    wardName: "HSR Layout",
    coordinates: [[[77.630, 12.898], [77.665, 12.898], [77.665, 12.925], [77.630, 12.925], [77.630, 12.898]]],
  },
  {
    wardId: "ward-045-malleshwaram",
    wardName: "Malleshwaram",
    coordinates: [[[77.555, 12.985], [77.585, 12.985], [77.585, 13.015], [77.555, 13.015], [77.555, 12.985]]],
  },
  {
    wardId: "ward-168-jayanagar",
    wardName: "Jayanagar",
    coordinates: [[[77.568, 12.915], [77.600, 12.915], [77.600, 12.945], [77.568, 12.945], [77.568, 12.915]]],
  },
  {
    wardId: "ward-007-hebbal",
    wardName: "Hebbal",
    coordinates: [[[77.578, 13.020], [77.618, 13.020], [77.618, 13.055], [77.578, 13.055], [77.578, 13.020]]],
  },
];

/**
 * Finds the corresponding BBMP ward for a given point using point-in-polygon.
 * Returns null if outside the mapped wards.
 */
export function findWardByPoint(
  point: LatLng,
  wards: WardBoundaryFeature[] = PILOT_WARD_BOUNDARIES,
): { wardId: string; wardName: string } | null {
  for (const ward of wards) {
    if (pointInPolygon(point, ward.coordinates as unknown as ReadonlyArray<ReadonlyArray<readonly [number, number]>>)) {
      return { wardId: ward.wardId, wardName: ward.wardName };
    }
  }
  return null;
}
