import type { ReactNode } from "react";
import type { Vibe } from "@/lib/vibes";

type Palette = {
  glyph: string;
  glyphAccent: string;
  shadow: string;
};

const palettes: Record<Vibe, Palette> = {
  heart: { glyph: "#e04a6b", glyphAccent: "#ffd9e1", shadow: "#f0708a" },
  prayer: { glyph: "#f3c48f", glyphAccent: "#c9853f", shadow: "#d9a05b" },
  mind_blown: { glyph: "#f6c65b", glyphAccent: "#3b2a1a", shadow: "#f5a623" },
  sunshine: { glyph: "#f2a21c", glyphAccent: "#fff3bf", shadow: "#f5a623" },
  rainbow: { glyph: "#e64e5e", glyphAccent: "#ffffff", shadow: "#8fc7ff" },
  earth: { glyph: "#2f7fb8", glyphAccent: "#6fcf8a", shadow: "#3f9a76" },
  peace: { glyph: "#f4f7fb", glyphAccent: "#5b8fc4", shadow: "#6fa8dc" },
  lotus: { glyph: "#ee8fbe", glyphAccent: "#ffd66b", shadow: "#e07ab0" },
  moon: { glyph: "#f6d76b", glyphAccent: "#8f9be0", shadow: "#5c68a8" },
  sparkle: { glyph: "#f3c14e", glyphAccent: "#fff6d6", shadow: "#e6b84a" },
  pot_of_gold: { glyph: "#333333", glyphAccent: "#f5c542", shadow: "#8a6d1f" },
  clover: { glyph: "#4caf50", glyphAccent: "#e8f5e9", shadow: "#3d8b40" },
  health: { glyph: "#3fb37f", glyphAccent: "#ffffff", shadow: "#2f8f63" },
  food: { glyph: "#e8623c", glyphAccent: "#fff3e0", shadow: "#c9502e" },
  beauty: { glyph: "#c96bd6", glyphAccent: "#ff9ec4", shadow: "#a44fb3" },
};

const glyphs: Record<Vibe, (p: Palette) => ReactNode> = {
  heart: (p) => (
    <>
      <path
        d="M32 44 C22 37 17 32 17 26 a7.5 7.5 0 0 1 15-1.5 a7.5 7.5 0 0 1 15 1.5 c0 6-5 11-15 18z"
        fill={p.glyph}
      />
      <ellipse cx="25.5" cy="25" rx="3" ry="2" fill={p.glyphAccent} opacity="0.7" transform="rotate(-30 25.5 25)" />
    </>
  ),
  prayer: (p) => (
    <>
      <path d="M22.5 39.5 l8 3.6 l-2.6 5.6 l-8-3.6z" fill="#6b8fd6" />
      <path d="M41.5 39.5 l-8 3.6 l2.6 5.6 l8-3.6z" fill="#6b8fd6" />
      <path d="M22.5 39.5 l8 3.6 l-0.9 1.9 l-8-3.6z" fill="#8aa8e6" />
      <path d="M41.5 39.5 l-8 3.6 l0.9 1.9 l8-3.6z" fill="#8aa8e6" />
      <path
        d="M31.6 16.5 c-1.8 2.6-4.6 8-5.4 13.5 c-0.6 4.2 0.6 8.5 5.4 11.5z"
        fill={p.glyph}
      />
      <path
        d="M32.4 16.5 c1.8 2.6 4.6 8 5.4 13.5 c0.6 4.2-0.6 8.5-5.4 11.5z"
        fill={p.glyph}
      />
      <path d="M27.4 25.5 c-2.6 1.6-4.3 4.2-4.6 7.2 c-0.1 1.4 1.5 1.9 2.2 0.7 c0.8-1.6 1.6-3.3 3.2-4.5z" fill={p.glyph} />
      <path d="M36.6 25.5 c2.6 1.6 4.3 4.2 4.6 7.2 c0.1 1.4-1.5 1.9-2.2 0.7 c-0.8-1.6-1.6-3.3-3.2-4.5z" fill={p.glyph} />
      <path d="M32 17.5 V41" stroke={p.glyphAccent} strokeWidth="0.9" opacity="0.8" />
      <path d="M29.6 20 c-1 3-1.8 6-2.1 9 M34.4 20 c1 3 1.8 6 2.1 9" stroke={p.glyphAccent} strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M32 10.5 v2.6 M26 12.5 l1.4 2.2 M38 12.5 l-1.4 2.2" stroke="#f2b134" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  mind_blown: (p) => (
    <>
      <path d="M21.6 29 A12 12 0 1 0 42.4 29 Z" fill={p.glyph} />
      <path d="M23.2 15 A11.5 11.5 0 0 1 40.8 15 L40.8 17.6 L23.2 17.6 Z" fill={p.glyph} />
      <circle cx="26" cy="24" r="3.6" fill="#ff7a3d" />
      <circle cx="38" cy="24" r="3.6" fill="#ff7a3d" />
      <circle cx="32" cy="22.5" r="4.2" fill="#ff5a3d" />
      <circle cx="29" cy="25.5" r="3" fill="#ffc233" />
      <circle cx="35" cy="25.5" r="3" fill="#ffc233" />
      <circle cx="32" cy="24" r="2" fill="#fff0a8" />
      <path d="M17.5 21 l2.4-1.6 M46.5 21 l-2.4-1.6 M19.5 13.5 l1.6 2.2 M44.5 13.5 l-1.6 2.2" stroke="#ff7a3d" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="27.2" cy="34" r="3.2" fill="#ffffff" />
      <circle cx="36.8" cy="34" r="3.2" fill="#ffffff" />
      <circle cx="27.6" cy="34.4" r="1.7" fill="#3b2a1a" />
      <circle cx="37.2" cy="34.4" r="1.7" fill="#3b2a1a" />
      <path d="M24.5 30.2 c1.5-1 3.5-1 5 0 M34.5 30.2 c1.5-1 3.5-1 5 0" stroke="#b07a2a" strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="41" rx="2.8" ry="3.4" fill="#3b2a1a" />
      <ellipse cx="32" cy="42.4" rx="1.6" ry="1.4" fill="#d9534f" />
    </>
  ),
  pot_of_gold: (p) => (
    <>
      <ellipse cx="26" cy="46" rx="3" ry="1.4" fill={p.glyph} />
      <ellipse cx="38" cy="46" rx="3" ry="1.4" fill={p.glyph} />
      <path d="M21 30 c-2.5 9 2 15.5 11 15.5 c9 0 13.5-6.5 11-15.5z" fill={p.glyph} />
      <path d="M23.5 33 c-0.5 5 1.5 9 5 10.5" stroke="#5a5a5a" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="32" cy="30" rx="12.5" ry="3.4" fill="#4a4a4a" />
      <ellipse cx="32" cy="29.4" rx="10.5" ry="2.2" fill="#2a2a2a" />
      {[
        [25.5, 27.5],
        [38.5, 27.5],
        [32, 24.5],
        [28.5, 29],
        [35.5, 29],
        [29, 25.5],
        [35, 25.5],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={p.glyphAccent} stroke="#d49a1d" strokeWidth="0.7" />
      ))}
      <path d="M22 18 c0.4 2 1 2.6 2.8 3 c-1.8 0.4-2.4 1-2.8 3 c-0.4-2-1-2.6-2.8-3 c1.8-0.4 2.4-1 2.8-3z" fill="#fff0a8" />
      <path d="M43 15 c0.5 2.5 1.2 3.2 3.5 3.7 c-2.3 0.5-3 1.2-3.5 3.7 c-0.5-2.5-1.2-3.2-3.5-3.7 c2.3-0.5 3-1.2 3.5-3.7z" fill="#fff0a8" />
    </>
  ),
  clover: (p) => (
    <>
      {[0, 90, 180, 270].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 32 32)`}>
          <path
            d="M32 30 C29 27.5 24.5 25.5 24.5 21.5 a4 4 0 0 1 7.5-1.5 a4 4 0 0 1 7.5 1.5 c0 4-4.5 6-7.5 8.5z"
            fill={p.glyph}
          />
          <path d="M32 29 V21" stroke={p.glyphAccent} strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
        </g>
      ))}
      <path d="M32 34 c0.8 4.5 3.2 8 6.5 11" stroke="#3d8b40" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  sunshine: (p) => (
    <>
      <circle cx="32" cy="32" r="8.5" fill={p.glyph} />
      <circle cx="32" cy="32" r="6" fill={p.glyphAccent} opacity="0.55" />
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d="M32 17 l2 5 h-4z"
          fill={p.glyph}
          transform={`rotate(${i * 45} 32 32)`}
        />
      ))}
    </>
  ),
  rainbow: (p) => (
    <>
      {["#e64e5e", "#f5a623", "#f4d35e", "#5fbf7a", "#4f8fd9", "#8e63e8"].map((c, i) => (
        <path
          key={c}
          d={`M${20 + i * 2} 38 a${12 - i * 2} ${12 - i * 2} 0 0 1 ${24 - i * 4} 0`}
          stroke={c}
          strokeWidth="2.1"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <ellipse cx="21" cy="38.5" rx="4" ry="2.6" fill={p.glyphAccent} />
      <ellipse cx="43" cy="38.5" rx="4" ry="2.6" fill={p.glyphAccent} />
    </>
  ),
  earth: (p) => (
    <>
      <circle cx="32" cy="32" r="12" fill={p.glyph} />
      <path
        d="M24 26 c3-3 7-3 9 0 c1 2 0 4-2 5 c-2 1-1 4 1 5 c1 1 0 3-2 3 c-3 0-6-3-6-7 c0-2 0-4 0-6z M36 22 c3 1 6 4 7 7 c-2 1-4 0-5-1 c-1-1-3-1-3-3 c0-1 0-2 1-3z M39 36 c2 0 4 1 3 3 c-1 2-3 3-5 3 c-1-2 0-5 2-6z"
        fill={p.glyphAccent}
      />
      <ellipse cx="27" cy="25" rx="3" ry="1.8" fill="#ffffff" opacity="0.35" transform="rotate(-35 27 25)" />
    </>
  ),
  peace: (p) => (
    <>
      <path
        d="M22 36 c4-1 8-3 10-6 c1-2 1-5 4-7 c2-1 4 0 5 2 l4 1 l-3 1.5 c0 4-4 8-9 9 c-3 1-6 1-11 0z"
        fill={p.glyph}
        stroke={p.glyphAccent}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M31 30 c-1-5-4-8-8-9 c2 4 4 7 8 9z" fill={p.glyph} stroke={p.glyphAccent} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M26 39 c2 2 5 3 8 3" stroke={p.glyphAccent} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="39" cy="24.6" r="0.9" fill={p.glyphAccent} />
      <path d="M40 22 c2-2 3-3 4-6 c-2 1-4 2-5 4" stroke="#7fcf9a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  lotus: (p) => (
    <>
      <path d="M32 42 c-6-3-8-9-6-16 c4 3 6 7 6 16z" fill={p.glyph} opacity="0.9" />
      <path d="M32 42 c6-3 8-9 6-16 c-4 3-6 7-6 16z" fill={p.glyph} opacity="0.9" />
      <path d="M32 42 c-3-6-3-13 0-20 c3 7 3 14 0 20z" fill={p.glyph} />
      <path d="M32 42 c-8-2-12-7-13-12 c6 0 11 4 13 12z" fill={p.glyph} opacity="0.75" />
      <path d="M32 42 c8-2 12-7 13-12 c-6 0-11 4-13 12z" fill={p.glyph} opacity="0.75" />
      <circle cx="32" cy="38" r="1.8" fill={p.glyphAccent} />
    </>
  ),
  moon: (p) => (
    <>
      <path d="M36 20 a12 12 0 1 0 8 20 a10 10 0 0 1 -8 -20z" fill={p.glyph} />
      <circle cx="24" cy="24" r="1.2" fill={p.glyphAccent} />
      <circle cx="21" cy="34" r="0.9" fill={p.glyphAccent} />
      <circle cx="42" cy="20" r="0.8" fill={p.glyphAccent} />
    </>
  ),
  sparkle: (p) => (
    <>
      <path d="M32 18 c1.5 8 4 10.5 12 12 c-8 1.5-10.5 4-12 12 c-1.5-8-4-10.5-12-12 c8-1.5 10.5-4 12-12z" fill={p.glyph} />
      <path d="M32 24 c0.8 4.5 2.5 6.5 6 8 c-3.5 1.5-5.2 3.5-6 8 c-0.8-4.5-2.5-6.5-6-8 c3.5-1.5 5.2-3.5 6-8z" fill={p.glyphAccent} opacity="0.6" />
      <path d="M43 19 c0.5 2.5 1.2 3.2 3.5 3.7 c-2.3 0.5-3 1.2-3.5 3.7 c-0.5-2.5-1.2-3.2-3.5-3.7 c2.3-0.5 3-1.2 3.5-3.7z" fill={p.glyph} />
      <path d="M21 40 c0.4 2 1 2.6 2.8 3 c-1.8 0.4-2.4 1-2.8 3 c-0.4-2-1-2.6-2.8-3 c1.8-0.4 2.4-1 2.8-3z" fill={p.glyph} />
    </>
  ),
  health: (p) => (
    <>
      <path
        d="M32 45 C21 37.5 16 32 16 25.5 a8.5 8.5 0 0 1 16-2 a8.5 8.5 0 0 1 16 2 c0 6.5-5 12-16 19.5z"
        fill={p.glyph}
      />
      <path
        d="M19 30 h6 l2.5-5 l3.5 10 l3-7 l2 3.5 h9"
        stroke={p.glyphAccent}
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="21.5" rx="3" ry="1.8" fill="#ffffff" opacity="0.4" transform="rotate(-30 24 21.5)" />
    </>
  ),
  food: (p) => (
    <>
      <path d="M22 18 c-1.5 2.5 1.5 3.5 0 6.5 M32 15 c-1.5 2.5 1.5 3.5 0 6.5 M42 18 c-1.5 2.5 1.5 3.5 0 6.5" stroke="#c7b8a8" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M17 30 c0 9 6 15 15 15 c9 0 15-6 15-15z" fill={p.glyph} />
      <path d="M17 30 h30 v-1.6 c0-1.3-1-2.4-2.4-2.4 h-25.2 c-1.4 0-2.4 1.1-2.4 2.4z" fill="#f28a5c" />
      <ellipse cx="32" cy="27.5" rx="12.5" ry="2.4" fill={p.glyphAccent} />
      <path d="M22 27.5 c3-2.8 6-2.8 8-1 c2-2 5-2 8 0.5 c1.5 1 3 1 4 0.5" stroke="#f2b134" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="27" cy="26.4" r="1.5" fill="#6fbf73" />
      <circle cx="37.5" cy="26.6" r="1.5" fill="#6fbf73" />
      <path d="M20 34 c0 4 2.5 7.5 6 9" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.4" />
      <ellipse cx="32" cy="46" rx="7" ry="1.6" fill={p.glyph} />
    </>
  ),
  beauty: (p) => (
    <>
      <path d="M31 30 c-5-8-12-10-14.5-7.5 c-2.5 2.5-0.5 8 4.5 10.5 c-4 1-6 5-4 8 c2 3 7 2 10-1.5 c1.5-2 3-5.5 4-9.5z" fill={p.glyph} />
      <path d="M33 30 c5-8 12-10 14.5-7.5 c2.5 2.5 0.5 8-4.5 10.5 c4 1 6 5 4 8 c-2 3-7 2-10-1.5 c-1.5-2-3-5.5-4-9.5z" fill={p.glyph} />
      <path d="M30 29 c-3-4.5-7-6-8.5-4.5 c-1.5 1.5 0 4.5 3.5 6z M34 29 c3-4.5 7-6 8.5-4.5 c1.5 1.5 0 4.5-3.5 6z" fill={p.glyphAccent} opacity="0.85" />
      <circle cx="24" cy="36.5" r="1.8" fill={p.glyphAccent} opacity="0.85" />
      <circle cx="40" cy="36.5" r="1.8" fill={p.glyphAccent} opacity="0.85" />
      <ellipse cx="32" cy="32" rx="1.7" ry="8" fill="#4a3d5c" />
      <path d="M31.5 24.5 c-1-2.5-2.5-4-4-4.5 M32.5 24.5 c1-2.5 2.5-4 4-4.5" stroke="#4a3d5c" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="27.3" cy="19.8" r="0.9" fill="#4a3d5c" />
      <circle cx="36.7" cy="19.8" r="0.9" fill="#4a3d5c" />
    </>
  ),
};

/** Emoji-style "good vibes" illustration: a soft, rounded glyph with a gentle glow. */
export function VibeIcon({
  vibe,
  size = 48,
  className,
}: {
  vibe: string;
  size?: number;
  className?: string;
}) {
  const p = palettes[vibe as Vibe];
  if (!p) return null;
  const uid = `vibe-${vibe}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor={p.shadow} floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${uid}-glow)`} transform="translate(32 32) scale(1.55) translate(-32 -32)">
        {glyphs[vibe as Vibe](p)}
      </g>
    </svg>
  );
}
