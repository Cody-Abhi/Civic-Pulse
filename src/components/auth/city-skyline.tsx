/* eslint-disable no-restricted-syntax -- SVG illustration uses literal colours by design */
"use client";

/**
 * Animated smart-city skyline illustration for the auth hero.
 * Pure CSS + SVG — no external images. Lightweight, accessible.
 * Renders a futuristic night cityscape with glowing accents,
 * location pins, and network connection lines.
 *
 * This file is an SVG illustration and uses literal hex values
 * for illustration-specific colours (gradients, glows, building fills)
 * that have no semantic mapping in the design system tokens.
 */
export function CitySkyline({ className }: { className?: string }) {
  // Illustration palette — not semantic tokens
  const SKY_DARK = "#041824";
  const SKY_MID = "#06283D";
  const SKY_LIGHT = "#073B50";
  const SKY_BRIGHT = "#0A4D64";
  const ACCENT = "#20DCCB";
  const BUILDING_FAR = "#0B3F55";
  const BUILDING_MID = "#0A3549";
  const BUILDING_MAIN = "#0C4155";
  const BUILDING_TALL = "#0E4A60";
  const BUILDING_RIGHT = "#0B3F53";
  const BUILDING_RIGHT2 = "#0D4659";
  const WIN_DIM = "#FFFFFF";
  const TEAL_BRAND = "#0F766E";
  const LABEL_BG = "rgba(6,40,61,0.6)";
  const LABEL_BORDER = "rgba(32,220,203,0.3)";
  const ACCENT_15 = "rgba(32,220,203,0.15)";

  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY_DARK} />
            <stop offset="40%" stopColor={SKY_MID} />
            <stop offset="80%" stopColor={SKY_LIGHT} />
            <stop offset="100%" stopColor={SKY_BRIGHT} />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY_BRIGHT} stopOpacity="0.6" />
            <stop offset="100%" stopColor={SKY_MID} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.8" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect width="800" height="600" fill="url(#skyGrad)" />

        {/* Stars */}
        {[
          [120, 40], [240, 60], [380, 30], [500, 80], [650, 50],
          [720, 35], [80, 90], [160, 120], [350, 100], [560, 45],
          [700, 110], [450, 75], [300, 55], [620, 95],
        ].map(([cx, cy], i) => (
          <circle
            key={`star-${i}`}
            cx={cx}
            cy={cy}
            r={i % 3 === 0 ? 1.5 : 1}
            fill={WIN_DIM}
            opacity={0.3 + (i % 4) * 0.15}
          >
            <animate
              attributeName="opacity"
              values={`${0.2 + (i % 3) * 0.1};${0.5 + (i % 3) * 0.15};${0.2 + (i % 3) * 0.1}`}
              dur={`${3 + (i % 4)}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Atmospheric teal glow */}
        <ellipse cx="400" cy="400" rx="500" ry="200" fill="url(#glowGrad)" opacity="0.4" />

        {/* Buildings — far background */}
        <g opacity="0.3">
          <rect x="50" y="280" width="30" height="120" rx="2" fill={BUILDING_FAR} />
          <rect x="90" y="300" width="25" height="100" rx="2" fill={BUILDING_FAR} />
          <rect x="700" y="290" width="28" height="110" rx="2" fill={BUILDING_FAR} />
          <rect x="740" y="310" width="22" height="90" rx="2" fill={BUILDING_FAR} />
        </g>

        {/* Buildings — mid layer */}
        <g opacity="0.5">
          <rect x="130" y="250" width="40" height="150" rx="2" fill={BUILDING_MID} />
          <rect x="180" y="270" width="35" height="130" rx="2" fill={BUILDING_MID} />
          <rect x="580" y="260" width="38" height="140" rx="2" fill={BUILDING_MID} />
          <rect x="630" y="280" width="32" height="120" rx="2" fill={BUILDING_MID} />
        </g>

        {/* Main skyline */}
        <g>
          {/* Left tower */}
          <rect x="240" y="200" width="50" height="200" rx="3" fill={BUILDING_MAIN} />
          {[210, 225, 240, 255, 270].map((y, i) => (
            <g key={`lw-${i}`}>
              <rect x="245" y={y} width="8" height="6" rx="1" fill={ACCENT} opacity={0.3 + (i % 4) * 0.15} />
              <rect x="257" y={y} width="8" height="6" rx="1" fill={ACCENT} opacity={0.2 + (i % 3) * 0.2} />
              <rect x="269" y={y} width="8" height="6" rx="1" fill={WIN_DIM} opacity={0.05 + (i % 5) * 0.05} />
            </g>
          ))}

          {/* Tall center tower */}
          <rect x="320" y="160" width="55" height="240" rx="3" fill={BUILDING_TALL} />
          <rect x="330" y="155" width="35" height="15" rx="2" fill={BUILDING_TALL} />
          <rect x="346" y="135" width="3" height="25" fill={ACCENT} opacity="0.6" />
          <circle cx="347.5" cy="133" r="3" fill={ACCENT} opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          {[175, 190, 205, 220, 235, 250, 265, 280, 295, 310, 325, 340].map((y, i) => (
            <g key={`cw-${i}`}>
              <rect x="327" y={y} width="9" height="6" rx="1" fill={ACCENT} opacity={0.3 + (i % 4) * 0.15} />
              <rect x="340" y={y} width="9" height="6" rx="1" fill={ACCENT} opacity={0.2 + (i % 3) * 0.2} />
              <rect x="353" y={y} width="9" height="6" rx="1" fill={WIN_DIM} opacity={0.05 + (i % 5) * 0.05} />
            </g>
          ))}

          {/* Right cluster */}
          <rect x="400" y="230" width="45" height="170" rx="3" fill={BUILDING_MAIN} />
          <rect x="455" y="210" width="40" height="190" rx="3" fill={BUILDING_RIGHT2} />
          <rect x="505" y="250" width="35" height="150" rx="3" fill={BUILDING_RIGHT} />

          {[240, 255, 270, 285, 300, 315, 330].map((y, i) => (
            <g key={`rw-${i}`}>
              <rect x="408" y={y} width="8" height="5" rx="1" fill={ACCENT} opacity={0.3 + (i % 3) * 0.2} />
              <rect x="420" y={y} width="8" height="5" rx="1" fill={ACCENT} opacity={0.2 + (i % 4) * 0.15} />
            </g>
          ))}
          {[225, 240, 255, 270, 285, 300, 315, 330, 345].map((y, i) => (
            <g key={`rw2-${i}`}>
              <rect x="462" y={y} width="8" height="5" rx="1" fill={ACCENT} opacity={0.25 + (i % 3) * 0.2} />
              <rect x="475" y={y} width="8" height="5" rx="1" fill={WIN_DIM} opacity={0.05 + (i % 4) * 0.05} />
            </g>
          ))}
        </g>

        {/* Water / reflections */}
        <rect x="0" y="400" width="800" height="200" fill="url(#waterGrad)" />
        <g opacity="0.15">
          <rect x="250" y="410" width="40" height="80" rx="2" fill={ACCENT} />
          <rect x="330" y="410" width="45" height="100" rx="2" fill={ACCENT} />
          <rect x="410" y="410" width="35" height="70" rx="2" fill={ACCENT} />
          <rect x="460" y="410" width="30" height="90" rx="2" fill={ACCENT} />
        </g>

        {/* Teal waves */}
        <path d="M0 430 Q200 400 400 420 Q600 440 800 410 L800 600 L0 600Z" fill={TEAL_BRAND} opacity="0.15" />
        <path d="M0 450 Q200 430 400 445 Q600 460 800 440 L800 600 L0 600Z" fill={TEAL_BRAND} opacity="0.1" />

        {/* Network lines */}
        <g filter="url(#glow)" opacity="0.5">
          <path d="M265 195 Q350 150 480 200" stroke={ACCENT} strokeWidth="1" strokeDasharray="4 4" fill="none">
            <animate attributeName="stroke-dashoffset" values="0;-8" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M347 133 Q420 100 600 160" stroke={ACCENT} strokeWidth="1" strokeDasharray="4 4" fill="none">
            <animate attributeName="stroke-dashoffset" values="0;-8" dur="2.5s" repeatCount="indefinite" />
          </path>
          <path d="M480 200 Q550 180 620 220" stroke={ACCENT} strokeWidth="0.8" strokeDasharray="3 3" fill="none">
            <animate attributeName="stroke-dashoffset" values="0;-6" dur="3s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Location pins */}
        {[
          { x: 265, y: 185, delay: "0s" },
          { x: 480, y: 190, delay: "0.5s" },
          { x: 620, y: 210, delay: "1s" },
          { x: 347, y: 125, delay: "1.5s" },
        ].map((pin, i) => (
          <g key={`pin-${i}`}>
            <circle cx={pin.x} cy={pin.y} r="12" fill="url(#pinGlow)">
              <animate attributeName="r" values="10;15;10" dur="3s" begin={pin.delay} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" begin={pin.delay} repeatCount="indefinite" />
            </circle>
            <path
              d={`M${pin.x} ${pin.y + 8} C${pin.x} ${pin.y - 2} ${pin.x - 7} ${pin.y - 10} ${pin.x} ${pin.y - 14} C${pin.x + 7} ${pin.y - 10} ${pin.x} ${pin.y - 2} ${pin.x} ${pin.y + 8}Z`}
              fill={ACCENT}
              opacity="0.9"
            />
            <circle cx={pin.x} cy={pin.y - 8} r="2.5" fill={SKY_MID} />
          </g>
        ))}

        {/* Feature highlights */}
        {[
          { x: 200, y: 370, icon: "chart" as const, label: "Real-Time\nInsights" },
          { x: 400, y: 360, icon: "pin" as const, label: "Track Issues\non Map" },
          { x: 600, y: 370, icon: "bolt" as const, label: "Faster\nResolution" },
        ].map((feat, i) => (
          <g key={`feat-${i}`} opacity="0.9">
            <rect
              x={feat.x - 55} y={feat.y - 15} width="110" height="38" rx="19"
              fill={LABEL_BG} stroke={LABEL_BORDER} strokeWidth="1"
            />
            <circle cx={feat.x - 30} cy={feat.y + 4} r="10" fill={ACCENT_15} stroke={ACCENT} strokeWidth="1" />
            {feat.icon === "chart" && (
              <g stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round">
                <line x1={feat.x - 34} y1={feat.y + 8} x2={feat.x - 34} y2={feat.y} />
                <line x1={feat.x - 30} y1={feat.y + 8} x2={feat.x - 30} y2={feat.y + 2} />
                <line x1={feat.x - 26} y1={feat.y + 8} x2={feat.x - 26} y2={feat.y - 2} />
              </g>
            )}
            {feat.icon === "pin" && (
              <g>
                <path
                  d={`M${feat.x - 30} ${feat.y + 10} C${feat.x - 30} ${feat.y + 4} ${feat.x - 34} ${feat.y} ${feat.x - 30} ${feat.y - 3} C${feat.x - 26} ${feat.y} ${feat.x - 30} ${feat.y + 4} ${feat.x - 30} ${feat.y + 10}Z`}
                  fill={ACCENT} opacity="0.8"
                />
                <circle cx={feat.x - 30} cy={feat.y} r="1.5" fill={SKY_MID} />
              </g>
            )}
            {feat.icon === "bolt" && (
              <path
                d={`M${feat.x - 31} ${feat.y - 2} L${feat.x - 28} ${feat.y + 3} L${feat.x - 31} ${feat.y + 3} L${feat.x - 29} ${feat.y + 9}`}
                stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
            )}
            <text
              x={feat.x - 12} y={feat.y + 1}
              fill={WIN_DIM} fontSize="9"
              fontFamily="var(--font-geist-sans), system-ui, sans-serif" fontWeight="500"
            >
              {feat.label.split("\n").map((line, li) => (
                <tspan key={li} x={feat.x - 12} dy={li === 0 ? 0 : 11}>{line}</tspan>
              ))}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
