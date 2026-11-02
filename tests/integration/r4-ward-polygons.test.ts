import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  findWardByPoint,
  findWardById,
  getAllWards,
  isInsideBengaluru,
  BENGALURU_WARDS,
  type LatLng,
} from "@/domain/geo";

describe("Milestone 4 (R4): Real Bengaluru Ward Polygons from DataMeet (PRD-§17.1, PRD-§17.2)", () => {
  const publicGeoPath = path.resolve(process.cwd(), "public/geo/wards.geojson");
  const serverGeoPath = path.resolve(process.cwd(), "src/server/geo/wards.json");

  describe("1. GeoJSON Asset Quota & Integrity (≤ 600 KB, CC BY 4.0)", () => {
    it("public/geo/wards.geojson exists and is strictly <= 600 KB", () => {
      expect(fs.existsSync(publicGeoPath)).toBe(true);
      const stat = fs.statSync(publicGeoPath);
      const sizeKb = stat.size / 1024;
      expect(sizeKb).toBeLessThanOrEqual(600);
      expect(sizeKb).toBeGreaterThan(50); // Ensure non-empty real dataset
    });

    it("src/server/geo/wards.json exists and is strictly <= 600 KB", () => {
      expect(fs.existsSync(serverGeoPath)).toBe(true);
      const stat = fs.statSync(serverGeoPath);
      const sizeKb = stat.size / 1024;
      expect(sizeKb).toBeLessThanOrEqual(600);
      expect(sizeKb).toBeGreaterThan(50);
    });

    it("contains exactly 198 DataMeet BBMP wards", () => {
      const data = JSON.parse(fs.readFileSync(serverGeoPath, "utf8"));
      expect(data.type).toBe("FeatureCollection");
      expect(Array.isArray(data.features)).toBe(true);
      expect(data.features.length).toBe(198);
      expect(BENGALURU_WARDS.length).toBe(198);
      expect(getAllWards().length).toBe(198);
    });
  });

  describe("2. Boundary Matching & Point-in-Polygon", () => {
    it("resolves Bellandur coordinates to ward-150-bellandur", () => {
      const bellandurPt: LatLng = { lat: 12.9304, lng: 77.6784 };
      const ward = findWardByPoint(bellandurPt);
      expect(ward).not.toBeNull();
      expect(ward?.wardId).toBe("ward-150-bellandur");
      expect(ward?.wardName).toBe("Bellandur");
    });

    it("resolves Indiranagar coordinates to ward-080-indiranagar", () => {
      const indiranagarPt: LatLng = { lat: 12.9719, lng: 77.6412 };
      const ward = findWardByPoint(indiranagarPt);
      expect(ward).not.toBeNull();
      expect(ward?.wardId).toBe("ward-080-indiranagar");
      expect(ward?.wardName).toBe("Indiranagar");
    });

    it("resolves Koramangala coordinates to ward-151-koramangala", () => {
      const koramangalaPt: LatLng = { lat: 12.9340, lng: 77.6200 };
      const ward = findWardByPoint(koramangalaPt);
      expect(ward).not.toBeNull();
      expect(ward?.wardId).toBe("ward-151-koramangala");
      expect(ward?.wardName).toBe("Koramangala");
    });

    it("returns null for unmatched coordinates and NEVER defaults to Bellandur", () => {
      // Coordinate in Bannerghatta outskirts (inside bounding box but outside 198 BBMP ward polygons)
      const unmatchedPt: LatLng = { lat: 12.7800, lng: 77.4500 };
      const ward = findWardByPoint(unmatchedPt);
      expect(ward).toBeNull();

      // Outside city coordinates
      const delhiPt: LatLng = { lat: 28.6139, lng: 77.2090 };
      expect(isInsideBengaluru(delhiPt)).toBe(false);
      expect(findWardByPoint(delhiPt)).toBeNull();
    });
  });

  describe("3. Lookup & Dropdown Helpers", () => {
    it("findWardById returns the correct ward or null", () => {
      const bellandur = findWardById("ward-150-bellandur");
      expect(bellandur).not.toBeNull();
      expect(bellandur?.wardName).toBe("Bellandur");

      const unknown = findWardById("ward-999-unknown");
      expect(unknown).toBeNull();
    });

    it("getAllWards returns sorted list with ward numbers and names", () => {
      const allWards = getAllWards();
      expect(allWards.length).toBe(198);
      const sample = allWards[0];
      expect(sample?.wardId).toBeDefined();
      expect(sample?.wardName).toBeDefined();
      expect(sample?.wardNo).toBeDefined();
    });
  });

  describe("4. Attribution Documentation on /about", () => {
    it("about page credits DataMeet Municipal_Spatial_Data and CC BY 4.0", () => {
      const aboutPath = path.resolve(process.cwd(), "src/app/about/page.tsx");
      const content = fs.readFileSync(aboutPath, "utf8");
      expect(content).toContain("DataMeet Municipal_Spatial_Data");
      expect(content).toContain("CC BY 4.0");
    });
  });
});
