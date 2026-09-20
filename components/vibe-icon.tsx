import type { ReactNode } from "react";
import type { Vibe } from "@/lib/vibes";

type Palette = {
  from: string;
  to: string;
  petal: string;
  ring: string;
  glyph: string;
  glyphAccent?: string;
};

const palettes: Record<Vibe, Palette> = {
  heart: { from: "#ffd6dc", to: "#f0708a", petal: "#ffb3c1", ring: "#fff0f3", glyph: "#c2274a", glyphAccent: "#ffe6ea" },
  prayer: { from: "#fbe9c8", to: "#d9a05b", petal: "#f4cf8e", ring: "#fff6e6", glyph: "#7a4a17", glyphAccent: "#fff1d6" },
  mind_blown: { from: "#e5d9ff", to: "#8e63e8", petal: "#c9b3ff", ring: "#f5f0ff", glyph: "#3f2382", glyphAccent: "#ffd166" },
  sunshine: { from: "#fff2b3", to: "#f5a623", petal: "#ffd75e", ring: "#fffbe6", glyph: "#c96a00", glyphAccent: "#fff8d6" },
  rainbow: { from: "#e8f4ff", to: "#8fc7ff", petal: "#c4e2ff", ring: "#f4faff", glyph: "#e64e5e", glyphAccent: "#ffffff" },
  earth: { from: "#cfeee0", to: "#3f9a76", petal: "#9fd9be", ring: "#eefaf3", glyph: "#1f5f8b", glyphAccent: "#7fcf9a" },
  peace: { from: "#e0f0ff", to: "#6fa8dc", petal: "#b8d8f5", ring: "#f0f7ff", glyph: "#ffffff", glyphAccent: "#274d7a" },
  lotus: { from: "#ffe3ef", to: "#e07ab0", petal: "#ffb9d8", ring: "#fff2f8", glyph: "#ffffff", glyphAccent: "#ffd66b" },
  moon: { from: "#dfe3f7", to: "#5c68a8", petal: "#b7bfe8", ring: "#eef0fb", glyph: "#fff4c2", glyphAccent: "#ffffff" },
  sparkle: { from: "#fdf6d8", to: "#e6b84a", petal: "#f7dd8f", ring: "#fffbea", glyph: "#ffffff", glyphAccent: "#b8791a" },
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
        d="M31.2 17 c-2 3-6 12-6 19 c0 4 2.5 7.5 6 9 V17z"
        fill={p.glyph}
      />
      <path
        d="M32.8 17 c2 3 6 12 6 19 c0 4-2.5 7.5-6 9 V17z"
        fill={p.glyph}
      />
      <path d="M25.4 34 c-1.6 1-2.6 2.4-2.6 4.2 c0 1.6 1.2 2.6 2.6 3.2z" fill={p.glyph} />
      <path d="M38.6 34 c1.6 1 2.6 2.4 2.6 4.2 c0 1.6-1.2 2.6-2.6 3.2z" fill={p.glyph} />
      <path d="M32 18 V45" stroke={p.glyphAccent} strokeWidth="0.9" opacity="0.6" />
      <path d="M31.2 45 h1.6" stroke={p.glyph} strokeWidth="1.5" />
      <circle cx="32" cy="13" r="1.2" fill={p.glyphAccent} />
      <circle cx="26.5" cy="15" r="0.9" fill={p.glyphAccent} />
      <circle cx="37.5" cy="15" r="0.9" fill={p.glyphAccent} />
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
      <path d="M32 9 v4 M22 12 l2.4 3.2 M42 12 l-2.4 3.2 M15 21 l3.8 1 M49 21 l-3.8 1" stroke={p.glyphAccent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="18.5" cy="14" r="1.2" fill={p.glyphAccent} />
      <circle cx="45.5" cy="14" r="1.2" fill={p.glyphAccent} />
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
      />
      <path d="M31 30 c-1-5-4-8-8-9 c2 4 4 7 8 9z" fill={p.glyph} />
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

/**
 * Emoji-style "good vibes" badge: a soft gradient disc wrapped in a
 * mandala of petals, with a glyph in the centre.
 */
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
        <radialGradient id={`${uid}-disc`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={p.from} />
          <stop offset="1" stopColor={p.to} />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${uid}-disc)`} />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse
          key={`o${i}`}
          cx="32"
          cy="5.5"
          rx="3.2"
          ry="5.5"
          fill={p.petal}
          opacity="0.85"
          transform={`rotate(${i * 30} 32 32)`}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse
          key={`m${i}`}
          cx="32"
          cy="11"
          rx="1.6"
          ry="3"
          fill={p.ring}
          opacity="0.9"
          transform={`rotate(${i * 30 + 15} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="18.5" fill="none" stroke={p.ring} strokeWidth="1" opacity="0.8" />
      <circle cx="32" cy="32" r="16.5" fill="none" stroke={p.ring} strokeWidth="0.6" strokeDasharray="1.2 2.2" opacity="0.8" />
      {glyphs[vibe as Vibe](p)}
      <circle cx="32" cy="32" r="31" fill={`url(#${uid}-glow)`} />
      <ellipse cx="24" cy="18" rx="9" ry="5" fill="#ffffff" opacity="0.22" transform="rotate(-30 24 18)" />
    </svg>
  );
}
