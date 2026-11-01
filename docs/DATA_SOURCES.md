# Data Sources & Attributions

CivicPulse AI is an **independent civic-tech prototype — not affiliated with
any government body.** All on-screen KPIs in the demo are computed live from
**synthetic data labelled "Demo data"**. Real-world figures appear only where
cited below.

## Geographic data

| Dataset | Use | Source | Licence |
|---------|-----|--------|---------|
| Bengaluru (BBMP) ward boundaries | `geo/wards.geojson`, ward point-in-polygon, hotspots | DataMeet Community Maps | **CC BY 4.0** — attribution required |
| City boundary | `geo/city-boundary.geojson` | DataMeet / OpenStreetMap | CC BY 4.0 / ODbL |
| Base map tiles | MapLibre GL JS basemap | **OpenFreeMap** public instance | Free, no key; **attribution required** on map |
| Street/landmark geocoding (P1) | Reverse geocoding proxy | Nominatim (OpenStreetMap) | ODbL; **usage policy** ≤1 req/s, caching, attribution — flagged feature only |

## Real-world reference statistics (cited, not stored as app data)

| Figure | Source |
|--------|--------|
| 126,974 BBMP grievances (Jan–19 Jun 2025); category mix; resolution gaps | OpenCity — *Decoding Bengaluru's Civic Complaints 2025* |
| CPGRAMS disposals / pendency | DD India (Aug 2026); PIB (PRID 2203903) |
| Road accident risk on poor roads | MoRTH, *Road Accidents in India 2023* |
| MSW generation/collection/treatment | CPCB MSW Annual Report 2020–21 |

These are used only on the Problem/Data slide and About page, each with its
source link. CivicPulse makes **no real-world impact claims**.

## Synthetic demo data

- Generated deterministically by `scripts/seed/generate.ts` → `fixtures/seed/*.json` (committed).
- Every synthetic document carries `isSynthetic: true` and renders a **"Demo data"** badge.
- 240 complaints across categories/wards, plus labelled `duplicate-pairs.json` and `classifier-labels.json` for evaluation.
- Demo reset deletes **only** `isSynthetic` documents.

## Attribution shown in-product

- Map: "© OpenFreeMap · © OpenStreetMap contributors" (and Nominatim when P1 geocoding is on).
- Footer on every page: "Independent prototype. Not affiliated with any government body."
- Ward boundaries: "Ward boundaries © DataMeet (CC BY 4.0)".
