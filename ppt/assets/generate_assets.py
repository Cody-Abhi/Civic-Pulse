import os
import time
from playwright.sync_api import sync_playwright

output_diagrams = "ppt/assets/diagrams"
output_illustrations = "ppt/assets/illustrations"
os.makedirs(output_diagrams, exist_ok=True)
os.makedirs(output_illustrations, exist_ok=True)

# 1. Five-step flow SVG (Slide 2)
# Width 1100, Height 420
s2_flow_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 420" width="1100" height="420" style="background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#172B36" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- Step Cards Container -->
  <!-- Step 1 -->
  <g transform="translate(20, 20)">
    <rect width="190" height="360" rx="14" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#shadow)"/>
    <rect width="190" height="6" rx="3" fill="#0F766E"/>
    <circle cx="36" cy="42" r="16" fill="#E6F1F0"/>
    <text x="36" y="47" font-size="14" font-weight="700" fill="#0F766E" text-anchor="middle">1</text>
    <text x="64" y="47" font-size="13" font-weight="700" fill="#0F766E" letter-spacing="0.5">CITIZEN</text>
    
    <text x="24" y="90" font-size="18" font-weight="700" fill="#172B36">Report</text>
    <text x="24" y="118" font-size="13" fill="#475569" line-height="1.4">
      <tspan x="24" dy="0">Free-text narrative,</tspan>
      <tspan x="24" dy="20">GPS pin, and optional</tspan>
      <tspan x="24" dy="20">on-ground photo.</tspan>
    </text>

    <g transform="translate(24, 210)">
      <rect width="142" height="74" rx="8" fill="#F5F8F7" stroke="#E3E9EA" stroke-width="1"/>
      <text x="14" y="26" font-size="11" font-weight="600" fill="#172B36">"Broken streetlight</text>
      <text x="14" y="44" font-size="11" font-weight="600" fill="#172B36">near bus shelter"</text>
      <text x="14" y="62" font-size="10" fill="#64748B">Ward 150 · 18:42 IST</text>
    </g>

    <rect x="24" y="306" width="142" height="28" rx="6" fill="#E6F1F0"/>
    <text x="95" y="324" font-size="11" font-weight="600" fill="#0F766E" text-anchor="middle">Step 1 of 5</text>
  </g>

  <!-- Arrow 1->2 -->
  <path d="M 218 190 L 234 190" stroke="#0F766E" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="234,185 242,190 234,195" fill="#0F766E"/>

  <!-- Step 2 -->
  <g transform="translate(242, 20)">
    <rect width="190" height="360" rx="14" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#shadow)"/>
    <rect width="190" height="6" rx="3" fill="#0F766E"/>
    <circle cx="36" cy="42" r="16" fill="#E6F1F0"/>
    <text x="36" y="47" font-size="14" font-weight="700" fill="#0F766E" text-anchor="middle">2</text>
    <text x="64" y="47" font-size="13" font-weight="700" fill="#0F766E" letter-spacing="0.5">GEMINI AI</text>
    
    <text x="24" y="90" font-size="18" font-weight="700" fill="#172B36">Understand</text>
    <text x="24" y="118" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Extracts category,</tspan>
      <tspan x="24" dy="20">severity (1-5), and</tspan>
      <tspan x="24" dy="20">brief summary JSON.</tspan>
    </text>

    <g transform="translate(24, 210)">
      <rect width="142" height="74" rx="8" fill="#EEF0FB" stroke="#D3D8F0" stroke-width="1"/>
      <text x="14" y="24" font-size="10" font-weight="700" fill="#3B49DF">CATEGORY</text>
      <text x="14" y="40" font-size="12" font-weight="700" fill="#172B36">STREETLIGHT</text>
      <text x="14" y="60" font-size="10" fill="#475569">Severity 3/5 · Safety flag</text>
    </g>

    <rect x="24" y="306" width="142" height="28" rx="6" fill="#EEF0FB"/>
    <text x="95" y="324" font-size="11" font-weight="600" fill="#3B49DF" text-anchor="middle">Structured JSON</text>
  </g>

  <!-- Arrow 2->3 -->
  <path d="M 440 190 L 456 190" stroke="#0F766E" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="456,185 464,190 456,195" fill="#0F766E"/>

  <!-- Step 3 -->
  <g transform="translate(464, 20)">
    <rect width="190" height="360" rx="14" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#shadow)"/>
    <rect width="190" height="6" rx="3" fill="#0F766E"/>
    <circle cx="36" cy="42" r="16" fill="#E6F1F0"/>
    <text x="36" y="47" font-size="14" font-weight="700" fill="#0F766E" text-anchor="middle">3</text>
    <text x="64" y="47" font-size="13" font-weight="700" fill="#0F766E" letter-spacing="0.5">RADAR</text>
    
    <text x="24" y="90" font-size="18" font-weight="700" fill="#172B36">Deduplicate</text>
    <text x="24" y="118" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Scans 500m &amp; 30d.</tspan>
      <tspan x="24" dy="20">Citizen adds voice;</tspan>
      <tspan x="24" dy="20">engineer confirms.</tspan>
    </text>

    <g transform="translate(24, 210)">
      <rect width="142" height="74" rx="8" fill="#FBF0E0" stroke="#FDE68A" stroke-width="1"/>
      <text x="14" y="24" font-size="10" font-weight="700" fill="#92400E">DUPLICATE RADAR</text>
      <text x="14" y="42" font-size="11" font-weight="700" fill="#172B36">Match found: 42 m</text>
      <text x="14" y="60" font-size="10" font-weight="600" fill="#0F766E">Tapped "Add my voice"</text>
    </g>

    <rect x="24" y="306" width="142" height="28" rx="6" fill="#FBF0E0"/>
    <text x="95" y="324" font-size="11" font-weight="600" fill="#92400E" text-anchor="middle">No queue bloating</text>
  </g>

  <!-- Arrow 3->4 -->
  <path d="M 662 190 L 678 190" stroke="#0F766E" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="678,185 686,190 678,195" fill="#0F766E"/>

  <!-- Step 4 -->
  <g transform="translate(686, 20)">
    <rect width="190" height="360" rx="14" fill="#FFFFFF" stroke="#0F766E" stroke-width="2" filter="url(#shadow)"/>
    <rect width="190" height="6" rx="3" fill="#0F766E"/>
    <circle cx="36" cy="42" r="16" fill="#0F766E"/>
    <text x="36" y="47" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">4</text>
    <text x="64" y="47" font-size="13" font-weight="700" fill="#0F766E" letter-spacing="0.5">ALGORITHM</text>
    
    <text x="24" y="90" font-size="18" font-weight="700" fill="#172B36">Prioritise</text>
    <text x="24" y="118" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Transparent 0-100</tspan>
      <tspan x="24" dy="20">Priority Receipt with</tspan>
      <tspan x="24" dy="20">7 weighted factors.</tspan>
    </text>

    <g transform="translate(24, 210)">
      <rect width="142" height="74" rx="8" fill="#FCEBEA" stroke="#FCA5A5" stroke-width="1"/>
      <text x="14" y="24" font-size="10" font-weight="700" fill="#B42318">PRIORITY SCORE</text>
      <text x="14" y="48" font-size="24" font-weight="800" fill="#DC2626">70 <tspan font-size="13" font-weight="600">/ 100</tspan></text>
      <text x="14" y="64" font-size="10" font-weight="700" fill="#B42318">CRITICAL BAND</text>
    </g>

    <rect x="24" y="306" width="142" height="28" rx="6" fill="#0F766E"/>
    <text x="95" y="324" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Priority Receipt</text>
  </g>

  <!-- Arrow 4->5 -->
  <path d="M 884 190 L 900 190" stroke="#0F766E" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="900,185 908,190 900,195" fill="#0F766E"/>

  <!-- Step 5 -->
  <g transform="translate(908, 20)">
    <rect width="170" height="360" rx="14" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#shadow)"/>
    <rect width="170" height="6" rx="3" fill="#15803D"/>
    <circle cx="36" cy="42" r="16" fill="#E8F6EE"/>
    <text x="36" y="47" font-size="14" font-weight="700" fill="#15803D" text-anchor="middle">5</text>
    <text x="64" y="47" font-size="13" font-weight="700" fill="#15803D" letter-spacing="0.5">AUTHORITY</text>
    
    <text x="24" y="90" font-size="18" font-weight="700" fill="#172B36">Resolve</text>
    <text x="24" y="118" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Ranked dispatch;</tspan>
      <tspan x="24" dy="20">SLA timer tracking;</tspan>
      <tspan x="24" dy="20">citizen informed.</tspan>
    </text>

    <g transform="translate(20, 210)">
      <rect width="130" height="74" rx="8" fill="#E8F6EE" stroke="#A7F3D0" stroke-width="1"/>
      <text x="12" y="24" font-size="10" font-weight="700" fill="#15803D">STATUS</text>
      <text x="12" y="42" font-size="12" font-weight="700" fill="#15803D">RESOLVED</text>
      <text x="12" y="60" font-size="10" fill="#172B36">Asha notified · Fixed</text>
    </g>

    <rect x="20" y="306" width="130" height="28" rx="6" fill="#E8F6EE"/>
    <text x="85" y="324" font-size="11" font-weight="600" fill="#15803D" text-anchor="middle">Loop Closed</text>
  </g>
</svg>
"""

# 2. Priority Receipt SVG (Slide 3 - The Signature Visual)
# Worked Example E1 = 70 / CRITICAL from src/domain/priority.ts
# Width 880, Height 460
s3_receipt_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 460" width="880" height="460" style="background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="receiptShadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#172B36" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Ledger Card Container -->
  <rect x="10" y="10" width="860" height="440" rx="14" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#receiptShadow)"/>

  <!-- Top Header / Barcode styling -->
  <path d="M 10 24 Q 10 10 24 10 L 856 10 Q 870 10 870 24 L 870 70 L 10 70 Z" fill="#172B36"/>
  
  <text x="32" y="38" font-size="12" font-weight="700" fill="#20DCCB" letter-spacing="1.5">CIVICPULSE PRIORITY RECEIPT §29</text>
  <text x="32" y="56" font-size="11" fill="#FFFFFF" opacity="0.75" font-family="'Geist Mono', 'SF Mono', Consolas, monospace">REF: CP-BLR-2026-0842 · WARD 150 (BELLANDUR) · WORKED EXAMPLE E1</text>
  
  <rect x="740" y="24" width="105" height="32" rx="6" fill="#DC2626"/>
  <text x="792" y="45" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">CRITICAL</text>

  <!-- Score Summary Header -->
  <g transform="translate(32, 90)">
    <text x="0" y="28" font-size="14" font-weight="600" fill="#64748B">CATEGORY</text>
    <text x="0" y="52" font-size="18" font-weight="700" fill="#172B36">DRAINAGE (OPEN DRAIN NEAR SCHOOL)</text>
    
    <text x="600" y="20" font-size="12" font-weight="600" fill="#64748B" text-anchor="right">TOTAL PRIORITY SCORE</text>
    <text x="600" y="54" font-size="38" font-weight="800" fill="#172B36">70 <tspan font-size="18" font-weight="600" fill="#64748B">/ 100</tspan></text>
  </g>

  <!-- Line items divider -->
  <line x1="32" y1="160" x2="848" y2="160" stroke="#E3E9EA" stroke-width="1.5" stroke-dasharray="4 4"/>

  <!-- Table Header -->
  <g transform="translate(32, 180)" font-size="11" font-weight="700" fill="#64748B" letter-spacing="0.5">
    <text x="0" y="0">FACTOR KEY &amp; WEIGHT</text>
    <text x="240" y="0">GROUND-TRUTH DETAIL &amp; CONDITIONS</text>
    <text x="660" y="0" text-anchor="end">CALCULATED CONTRIBUTION</text>
  </g>

  <!-- Line Item 1: S -->
  <g transform="translate(32, 205)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Severity (S) <tspan font-weight="500" fill="#64748B">· 25%</tspan></text>
    <text x="240" y="0" fill="#475569">Base severity 4 of 5 (factor 0.75)</text>
    <text x="660" y="0" font-weight="700" fill="#172B36" text-anchor="end">+18.75 pts</text>
  </g>

  <!-- Line Item 2: H -->
  <g transform="translate(32, 230)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Safety Hazard (H) <tspan font-weight="500" fill="#64748B">· 20%</tspan></text>
    <text x="240" y="0" fill="#B42318" font-weight="600">Risk reported: INJURY_RISK (factor 1.0)</text>
    <text x="660" y="0" font-weight="700" fill="#DC2626" text-anchor="end">+20.00 pts</text>
  </g>

  <!-- Line Item 3: R -->
  <g transform="translate(32, 255)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Reports (R) <tspan font-weight="500" fill="#64748B">· 15%</tspan></text>
    <text x="240" y="0" fill="#475569">4 independent reporters (u=3, ln(4)/ln(11) = 0.578)</text>
    <text x="660" y="0" font-weight="700" fill="#172B36" text-anchor="end">+8.67 pts</text>
  </g>

  <!-- Line Item 4: D -->
  <g transform="translate(32, 280)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Waiting Time (D) <tspan font-weight="500" fill="#64748B">· 15%</tspan></text>
    <text x="240" y="0" fill="#475569">20 h elapsed of 48 h SLA target (factor 0.208)</text>
    <text x="660" y="0" font-weight="700" fill="#172B36" text-anchor="end">+3.13 pts</text>
  </g>

  <!-- Line Item 5: A -->
  <g transform="translate(32, 305)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Affected Scale (A) <tspan font-weight="500" fill="#64748B">· 10%</tspan></text>
    <text x="240" y="0" fill="#475569">School / arterial pedestrian zone (scale 1.0)</text>
    <text x="660" y="0" font-weight="700" fill="#172B36" text-anchor="end">+10.00 pts</text>
  </g>

  <!-- Line Item 6: G -->
  <g transform="translate(32, 330)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Hotspot Density (G) <tspan font-weight="500" fill="#64748B">· 10%</tspan></text>
    <text x="240" y="0" fill="#475569">4 other open complaints within 500 m (factor 0.40)</text>
    <text x="660" y="0" font-weight="700" fill="#172B36" text-anchor="end">+4.00 pts</text>
  </g>

  <!-- Line Item 7: T -->
  <g transform="translate(32, 355)" font-size="13">
    <text x="0" y="0" font-weight="700" fill="#172B36">Season (T) <tspan font-weight="500" fill="#64748B">· 5%</tspan></text>
    <text x="240" y="0" fill="#475569">Monsoon season sensitive (November, factor 1.0)</text>
    <text x="660" y="0" font-weight="700" fill="#172B36" text-anchor="end">+5.00 pts</text>
  </g>

  <!-- Bottom Divider -->
  <line x1="32" y1="375" x2="848" y2="375" stroke="#172B36" stroke-width="1.5"/>

  <!-- Footer Formula Verification -->
  <g transform="translate(32, 405)">
    <text x="0" y="0" font-size="11" font-weight="600" fill="#64748B">Pre-rounding sum: 69.55 pts → roundHalfUp() = 70</text>
    <text x="0" y="16" font-size="11" fill="#0F766E" font-weight="600">Deterministic TypeScript (§29 pure function) · Gemini has zero scoring weight</text>
    <text x="816" y="8" font-size="14" font-weight="800" fill="#DC2626" text-anchor="end">FINAL: 70 [CRITICAL]</text>
  </g>
</svg>
"""

# 3. Three Pillars SVG (Slide 3 top cards)
# Width 1100, Height 180
s3_three_pillars_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 180" width="1100" height="180" style="background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="pShadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#172B36" flood-opacity="0.05"/>
    </filter>
  </defs>

  <!-- Pillar 1 -->
  <g transform="translate(10, 10)">
    <rect width="345" height="155" rx="12" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#pShadow)"/>
    <circle cx="36" cy="36" r="18" fill="#EEF0FB"/>
    <path d="M 28 36 L 44 36 M 36 28 L 36 44" stroke="#3B49DF" stroke-width="2" stroke-linecap="round"/>
    <text x="66" y="34" font-size="16" font-weight="700" fill="#172B36">1. Gemini AI Reads</text>
    <text x="66" y="50" font-size="11" font-weight="600" fill="#3B49DF">Advisory understanding</text>
    <text x="24" y="86" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Extracts category, summary &amp; hazards.</tspan>
      <tspan x="24" dy="20">Strict JSON output. Keyword fallback</tspan>
      <tspan x="24" dy="20">guarantees 100% uptime if offline.</tspan>
    </text>
  </g>

  <!-- Pillar 2 -->
  <g transform="translate(375, 10)">
    <rect width="345" height="155" rx="12" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5" filter="url(#pShadow)"/>
    <circle cx="36" cy="36" r="18" fill="#FBF0E0"/>
    <circle cx="36" cy="36" r="8" fill="none" stroke="#CA8A04" stroke-width="2"/>
    <text x="66" y="34" font-size="16" font-weight="700" fill="#172B36">2. Duplicate Radar</text>
    <text x="66" y="50" font-size="11" font-weight="600" fill="#CA8A04">Nearby similarity</text>
    <text x="24" y="86" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Scans 500 m &amp; 30 days via embeddings.</tspan>
      <tspan x="24" dy="20">Citizens tap "Add my voice"; engineers</tspan>
      <tspan x="24" dy="20">confirm links. Zero auto-merging.</tspan>
    </text>
  </g>

  <!-- Pillar 3 -->
  <g transform="translate(740, 10)">
    <rect width="345" height="155" rx="12" fill="#FFFFFF" stroke="#0F766E" stroke-width="1.8" filter="url(#pShadow)"/>
    <circle cx="36" cy="36" r="18" fill="#E6F1F0"/>
    <path d="M 28 36 L 34 42 L 44 30" stroke="#0F766E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <text x="66" y="34" font-size="16" font-weight="700" fill="#172B36">3. Priority Receipt</text>
    <text x="66" y="50" font-size="11" font-weight="600" fill="#0F766E">Auditable deterministic code</text>
    <text x="24" y="86" font-size="13" fill="#475569">
      <tspan x="24" dy="0">Itemised 0-100 score from 7 factors.</tspan>
      <tspan x="24" dy="20">Formulaic TypeScript (§29). Gemini</tspan>
      <tspan x="24" dy="20">has zero weight in the score.</tspan>
    </text>
  </g>
</svg>
"""

# 4. Architecture Strip SVG (Slide 5)
# Width 1100, Height 140
s5_architecture_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 140" width="1100" height="140" style="background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <rect x="5" y="5" width="1090" height="130" rx="14" fill="#FFFFFF" stroke="#E3E9EA" stroke-width="1.5"/>

  <!-- Step 1: Frontend -->
  <g transform="translate(30, 25)">
    <rect width="180" height="90" rx="8" fill="#F5F8F7" stroke="#E3E9EA" stroke-width="1"/>
    <text x="16" y="26" font-size="11" font-weight="700" fill="#0F766E">FRONTEND</text>
    <text x="16" y="48" font-size="14" font-weight="700" fill="#172B36">Next.js 16</text>
    <text x="16" y="68" font-size="11" fill="#475569">React 19 · Tailwind v4</text>
    <text x="16" y="82" font-size="10" fill="#64748B">Geist Sans &amp; Radix UI</text>
  </g>

  <path d="M 220 70 L 240 70" stroke="#0F766E" stroke-width="2" stroke-linecap="round"/>

  <!-- Step 2: Auth & DB -->
  <g transform="translate(245, 25)">
    <rect width="185" height="90" rx="8" fill="#F5F8F7" stroke="#E3E9EA" stroke-width="1"/>
    <text x="16" y="26" font-size="11" font-weight="700" fill="#0F766E">BACKEND &amp; DATA</text>
    <text x="16" y="48" font-size="14" font-weight="700" fill="#172B36">Firebase Spark</text>
    <text x="16" y="68" font-size="11" fill="#475569">Auth + Firestore Admin</text>
    <text x="16" y="82" font-size="10" fill="#15803D" font-weight="600">Free Tier · 0 client writes</text>
  </g>

  <path d="M 440 70 L 460 70" stroke="#0F766E" stroke-width="2" stroke-linecap="round"/>

  <!-- Step 3: AI Intelligence -->
  <g transform="translate(465, 25)">
    <rect width="185" height="90" rx="8" fill="#EEF0FB" stroke="#D3D8F0" stroke-width="1"/>
    <text x="16" y="26" font-size="11" font-weight="700" fill="#3B49DF">AI REASONING</text>
    <text x="16" y="48" font-size="14" font-weight="700" fill="#172B36">Gemini 2.5 Flash</text>
    <text x="16" y="68" font-size="11" fill="#475569">Google AI Studio Free</text>
    <text x="16" y="82" font-size="10" fill="#3B49DF" font-weight="600">Deterministic fallback</text>
  </g>

  <path d="M 660 70 L 680 70" stroke="#0F766E" stroke-width="2" stroke-linecap="round"/>

  <!-- Step 4: Maps & Geo -->
  <g transform="translate(685, 25)">
    <rect width="185" height="90" rx="8" fill="#F5F8F7" stroke="#E3E9EA" stroke-width="1"/>
    <text x="16" y="26" font-size="11" font-weight="700" fill="#0F766E">GEOSPATIAL TILES</text>
    <text x="16" y="48" font-size="14" font-weight="700" fill="#172B36">OpenFreeMap</text>
    <text x="16" y="68" font-size="11" fill="#475569">MapLibre GL + DataMeet</text>
    <text x="16" y="82" font-size="10" fill="#15803D" font-weight="600">100% Free · No API key</text>
  </g>

  <path d="M 880 70 L 900 70" stroke="#0F766E" stroke-width="2" stroke-linecap="round"/>

  <!-- Step 5: Hosting & Edge -->
  <g transform="translate(905, 25)">
    <rect width="165" height="90" rx="8" fill="#E6F1F0" stroke="#0F766E" stroke-width="1.2"/>
    <text x="16" y="26" font-size="11" font-weight="700" fill="#0F766E">DEPLOYMENT</text>
    <text x="16" y="48" font-size="14" font-weight="700" fill="#172B36">Vercel Hobby</text>
    <text x="16" y="68" font-size="11" fill="#475569">Edge + Serverless</text>
    <text x="16" y="82" font-size="10" font-weight="700" fill="#0F766E">₹0 / month total</text>
  </g>
</svg>
"""

# Write SVG files
with open(os.path.join(output_diagrams, "s2_flow_5step.svg"), "w", encoding="utf-8") as f:
    f.write(s2_flow_svg)

with open(os.path.join(output_illustrations, "s3_priority_receipt.svg"), "w", encoding="utf-8") as f:
    f.write(s3_receipt_svg)

with open(os.path.join(output_diagrams, "s3_three_pillars.svg"), "w", encoding="utf-8") as f:
    f.write(s3_three_pillars_svg)

with open(os.path.join(output_diagrams, "s5_architecture_strip.svg"), "w", encoding="utf-8") as f:
    f.write(s5_architecture_svg)

print("SVG files written successfully.")

# Convert SVGs to high-res PNGs using Playwright
def convert_svgs_to_png():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        renders = [
            ("s2_flow_5step", s2_flow_svg, 1100, 420, output_diagrams),
            ("s3_priority_receipt", s3_receipt_svg, 880, 460, output_illustrations),
            ("s3_three_pillars", s3_three_pillars_svg, 1100, 180, output_diagrams),
            ("s5_architecture_strip", s5_architecture_svg, 1100, 140, output_diagrams),
        ]
        
        for name, svg_content, width, height, out_folder in renders:
            page = browser.new_page(
                viewport={"width": width, "height": height},
                device_scale_factor=2
            )
            html = f"<!DOCTYPE html><html><body style='margin:0;padding:0;background:transparent;overflow:hidden;'>{svg_content}</body></html>"
            page.set_content(html)
            page.wait_for_timeout(500)
            target_path = os.path.join(out_folder, f"{name}.png")
            page.screenshot(path=target_path, omit_background=True)
            print(f"Rendered {target_path} at 2x scale.")

        browser.close()

if __name__ == "__main__":
    convert_svgs_to_png()

