import type { ReactNode } from "react";
import type { Vibe } from "@/lib/vibes";

type Palette = {
  glyph: string;
  glyphAccent: string;
  shadow: string;
};

const palettes: Record<Vibe, Palette> = {
  heart: { glyph: "#e04a6b", glyphAccent: "#ffd9e1", shadow: "#f0708a" },
  prayer: { glyph: "#c98a4b", glyphAccent: "#fff1d6", shadow: "#d9a05b" },
  mind_blown: { glyph: "#7b5be0", glyphAccent: "#ffd166", shadow: "#8e63e8" },
  sunshine: { glyph: "#f2a21c", glyphAccent: "#fff3bf", shadow: "#f5a623" },
  rainbow: { glyph: "#e64e5e", glyphAccent: "#ffffff", shadow: "#8fc7ff" },
  earth: { glyph: "#2f7fb8", glyphAccent: "#6fcf8a", shadow: "#3f9a76" },
  peace: { glyph: "#f4f7fb", glyphAccent: "#5b8fc4", shadow: "#6fa8dc" },
  lotus: { glyph: "#ee8fbe", glyphAccent: "#ffd66b", shadow: "#e07ab0" },
  moon: { glyph: "#f6d76b", glyphAccent: "#8f9be0", shadow: "#5c68a8" },
  sparkle: { glyph: "#f3c14e", glyphAccent: "#fff6d6", shadow: "#e6b84a" },
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
      <path
        d="M31.4 16 c-1.2 1.5-2.6 4.5-3.2 7.5 c-2.4 1.8-4.8 5.2-5.2 9.5 c-0.3 3.6 1.4 6.5 3.6 8 c1.2 0.8 2.9 1.4 4.8 1.6 V16z"
        fill={p.glyph}
      />
      <path
        d="M32.6 16 c1.2 1.5 2.6 4.5 3.2 7.5 c2.4 1.8 4.8 5.2 5.2 9.5 c0.3 3.6-1.4 6.5-3.6 8 c-1.2 0.8-2.9 1.4-4.8 1.6 V16z"
        fill={p.glyph}
      />
      <path d="M28 24.5 c-2.6 1-4.6 3-5.4 5.4 c-0.3 1.2 1.2 1.6 2 0.8 c1.1-1.2 2.4-2.1 3.8-2.6z" fill={p.glyph} />
      <path d="M36 24.5 c2.6 1 4.6 3 5.4 5.4 c0.3 1.2-1.2 1.6-2 0.8 c-1.1-1.2-2.4-2.1-3.8-2.6z" fill={p.glyph} />
      <path d="M32 17 V42" stroke={p.glyphAccent} strokeWidth="0.8" opacity="0.7" />
      <path d="M26.6 41 c1.6 1.2 3.4 1.9 5.4 2.1 c2-0.2 3.8-0.9 5.4-2.1 c-0.3 2.6-2.4 4.5-5.4 4.6 c-3-0.1-5.1-2-5.4-4.6z" fill={p.glyphAccent} />
      <path d="M32 10 v2.5 M25.5 12.5 l1.4 2.2 M38.5 12.5 l-1.4 2.2" stroke={p.glyph} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  mind_blown: (p) => (
    <>
      <path
        d="M23 46 c0-6 0-9 1-12 c-2-2-3-5-3-8 a11 11 0 0 1 22 0 c0 3-1 6-3 8 c1 3 1 6 1 12z"
        fill={p.glyph}
      />
      <path
        d="M25 25 c0-3 2-5 4-4.5 c1-2 4-2 5 0 c2-1 4 1 4 3.5 c1.5 1 1.5 3.5 0 4.5 c0 2-2 3.5-4 3 c-1 1.5-4 1.5-5 0 c-2 0.5-4-1-4-3 c-1.5-1-1.5-2.5 0-3.5z"
        fill={p.glyphAccent}
        opacity="0.95"
      />
      <path d="M29 24 c1 1 1 3 0 4 M32 22 v9 M35 24 c-1 1-1 3 0 4" stroke={p.glyph} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M32 13 v3.5 M23.5 15 l2.2 2.8 M40.5 15 l-2.2 2.8 M17.5 22 l3.5 1 M46.5 22 l-3.5 1" stroke={p.glyphAccent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="16.5" r="1.1" fill={p.glyphAccent} />
      <circle cx="44" cy="16.5" r="1.1" fill={p.glyphAccent} />
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
