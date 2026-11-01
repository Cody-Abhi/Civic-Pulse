import { describe, it, expect } from "vitest";
import {
  haversineM,
  geohashEncode,
  geohashNeighbors,
  geohashBlock,
  pointInPolygon,
} from "./geo";

describe("haversineM", () => {
  it("≈111195 m for 1° of longitude at the equator", () => {
    expect(Math.round(haversineM({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }))).toBe(111195);
  });
  it("is zero for identical points", () => {
    expect(haversineM({ lat: 12.97, lng: 77.59 }, { lat: 12.97, lng: 77.59 })).toBe(0);
  });
  it("is symmetric", () => {
    const a = { lat: 12.9, lng: 77.5 };
    const b = { lat: 12.95, lng: 77.6 };
    expect(haversineM(a, b)).toBeCloseTo(haversineM(b, a), 6);
  });
});

describe("geohashEncode", () => {
  it("matches the canonical example", () => {
    expect(geohashEncode(57.64911, 10.40744, 11)).toBe("u4pruydqqvj");
  });
  it("respects precision", () => {
    expect(geohashEncode(57.64911, 10.40744, 5)).toBe("u4pru");
  });
});

describe("geohash neighbours / block", () => {
  const center = geohashEncode(12.9716, 77.5946, 5);
  it("returns 8 distinct neighbours", () => {
    const n = geohashNeighbors(center);
    expect(n).toHaveLength(8);
    expect(new Set(n).size).toBe(8);
    expect(n.every((c) => c.length === 5)).toBe(true);
    expect(n).not.toContain(center);
  });
  it("block is 9 cells including the centre", () => {
    const block = geohashBlock(12.9716, 77.5946, 5);
    expect(block).toHaveLength(9);
    expect(new Set(block).size).toBe(9);
    expect(block[0]).toBe(center);
  });
  it("a point 300 m away shares the 9-cell block", () => {
    const a = { lat: 12.9716, lng: 77.5946 };
    // ~300 m east
    const b = { lat: 12.9716, lng: 77.5946 + 0.00277 };
    const block = geohashBlock(a.lat, a.lng, 5);
    expect(block).toContain(geohashEncode(b.lat, b.lng, 5));
  });
});

describe("pointInPolygon", () => {
  const square: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0],
  ];
  it("detects inside / outside", () => {
    expect(pointInPolygon({ lat: 5, lng: 5 }, [square])).toBe(true);
    expect(pointInPolygon({ lat: 15, lng: 15 }, [square])).toBe(false);
  });
  it("excludes points in a hole", () => {
    const hole: ReadonlyArray<readonly [number, number]> = [
      [4, 4],
      [4, 6],
      [6, 6],
      [6, 4],
      [4, 4],
    ];
    expect(pointInPolygon({ lat: 5, lng: 5 }, [square, hole])).toBe(false);
    expect(pointInPolygon({ lat: 1, lng: 1 }, [square, hole])).toBe(true);
  });
});
