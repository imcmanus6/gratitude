import type { ReactNode } from "react";
import type { Vibe } from "@/lib/vibes";
import { lineGlyphs, lineLucide } from "./vibe-line-icons";

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
  cat: { glyph: "#f0a04b", glyphAccent: "#ffd9b3", shadow: "#c97a2a" },
  dog: { glyph: "#c98a55", glyphAccent: "#f3dcc1", shadow: "#9a6538" },
  family: { glyph: "#f28c8c", glyphAccent: "#6fa8dc", shadow: "#d96b6b" },
  happy: { glyph: "#f6c65b", glyphAccent: "#3b2a1a", shadow: "#f5a623" },
  joy: { glyph: "#f6c65b", glyphAccent: "#3b2a1a", shadow: "#f5a623" },
  tree_of_life: { glyph: "#5aa35c", glyphAccent: "#8a5a30", shadow: "#3d7a40" },
  mandala: { glyph: "#7b6bd6", glyphAccent: "#f2b134", shadow: "#5a4bb0" },
  nature: { glyph: "#6fbf73", glyphAccent: "#fff3bf", shadow: "#3f8f45" },
};

const glyphs: Record<Vibe, (p: Palette) => ReactNode> = {
  heart: (p) => (
    <>
      <path
        d="M32 44 C22 37 17 32 17 26 a7.5 7.5 0 0 1 15-1.5 a7.5 7.5 0 0 1 15 1.5 c0 6-5 11-15 18z"
        fill={p.glyph}
      />
      <ellipse
        cx="25.5"
        cy="25"
        rx="3"
        ry="2"
        fill={p.glyphAccent}
        opacity="0.7"
        transform="rotate(-30 25.5 25)"
      />
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
      <path
        d="M27.4 25.5 c-2.6 1.6-4.3 4.2-4.6 7.2 c-0.1 1.4 1.5 1.9 2.2 0.7 c0.8-1.6 1.6-3.3 3.2-4.5z"
        fill={p.glyph}
      />
      <path
        d="M36.6 25.5 c2.6 1.6 4.3 4.2 4.6 7.2 c0.1 1.4-1.5 1.9-2.2 0.7 c-0.8-1.6-1.6-3.3-3.2-4.5z"
        fill={p.glyph}
      />
      <path
        d="M32 17.5 V41"
        stroke={p.glyphAccent}
        strokeWidth="0.9"
        opacity="0.8"
      />
      <path
        d="M29.6 20 c-1 3-1.8 6-2.1 9 M34.4 20 c1 3 1.8 6 2.1 9"
        stroke={p.glyphAccent}
        strokeWidth="0.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M32 10.5 v2.6 M26 12.5 l1.4 2.2 M38 12.5 l-1.4 2.2"
        stroke="#f2b134"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
  mind_blown: (p) => (
    <>
      <path d="M21.6 29 A12 12 0 1 0 42.4 29 Z" fill={p.glyph} />
      <path
        d="M23.2 15 A11.5 11.5 0 0 1 40.8 15 L40.8 17.6 L23.2 17.6 Z"
        fill={p.glyph}
      />
      <circle cx="26" cy="24" r="3.6" fill="#ff7a3d" />
      <circle cx="38" cy="24" r="3.6" fill="#ff7a3d" />
      <circle cx="32" cy="22.5" r="4.2" fill="#ff5a3d" />
      <circle cx="29" cy="25.5" r="3" fill="#ffc233" />
      <circle cx="35" cy="25.5" r="3" fill="#ffc233" />
      <circle cx="32" cy="24" r="2" fill="#fff0a8" />
      <path
        d="M17.5 21 l2.4-1.6 M46.5 21 l-2.4-1.6 M19.5 13.5 l1.6 2.2 M44.5 13.5 l-1.6 2.2"
        stroke="#ff7a3d"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="27.2" cy="34" r="3.2" fill="#ffffff" />
      <circle cx="36.8" cy="34" r="3.2" fill="#ffffff" />
      <circle cx="27.6" cy="34.4" r="1.7" fill="#3b2a1a" />
      <circle cx="37.2" cy="34.4" r="1.7" fill="#3b2a1a" />
      <path
        d="M24.5 30.2 c1.5-1 3.5-1 5 0 M34.5 30.2 c1.5-1 3.5-1 5 0"
        stroke="#b07a2a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="41" rx="2.8" ry="3.4" fill="#3b2a1a" />
      <ellipse cx="32" cy="42.4" rx="1.6" ry="1.4" fill="#d9534f" />
    </>
  ),
  pot_of_gold: (p) => (
    <>
      <ellipse cx="26" cy="46" rx="3" ry="1.4" fill={p.glyph} />
      <ellipse cx="38" cy="46" rx="3" ry="1.4" fill={p.glyph} />
      <path
        d="M21 30 c-2.5 9 2 15.5 11 15.5 c9 0 13.5-6.5 11-15.5z"
        fill={p.glyph}
      />
      <path
        d="M23.5 33 c-0.5 5 1.5 9 5 10.5"
        stroke="#5a5a5a"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
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
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="3"
          fill={p.glyphAccent}
          stroke="#d49a1d"
          strokeWidth="0.7"
        />
      ))}
      <path
        d="M22 18 c0.4 2 1 2.6 2.8 3 c-1.8 0.4-2.4 1-2.8 3 c-0.4-2-1-2.6-2.8-3 c1.8-0.4 2.4-1 2.8-3z"
        fill="#fff0a8"
      />
      <path
        d="M43 15 c0.5 2.5 1.2 3.2 3.5 3.7 c-2.3 0.5-3 1.2-3.5 3.7 c-0.5-2.5-1.2-3.2-3.5-3.7 c2.3-0.5 3-1.2 3.5-3.7z"
        fill="#fff0a8"
      />
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
          <path
            d="M32 29 V21"
            stroke={p.glyphAccent}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      ))}
      <path
        d="M32 34 c0.8 4.5 3.2 8 6.5 11"
        stroke="#3d8b40"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
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
      {["#e64e5e", "#f5a623", "#f4d35e", "#5fbf7a", "#4f8fd9", "#8e63e8"].map(
        (c, i) => (
          <path
            key={c}
            d={`M${20 + i * 2} 38 a${12 - i * 2} ${12 - i * 2} 0 0 1 ${24 - i * 4} 0`}
            stroke={c}
            strokeWidth="2.1"
            fill="none"
            strokeLinecap="round"
          />
        ),
      )}
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
      <ellipse
        cx="27"
        cy="25"
        rx="3"
        ry="1.8"
        fill="#ffffff"
        opacity="0.35"
        transform="rotate(-35 27 25)"
      />
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
      <path
        d="M31 30 c-1-5-4-8-8-9 c2 4 4 7 8 9z"
        fill={p.glyph}
        stroke={p.glyphAccent}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M26 39 c2 2 5 3 8 3"
        stroke={p.glyphAccent}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="39" cy="24.6" r="0.9" fill={p.glyphAccent} />
      <path
        d="M40 22 c2-2 3-3 4-6 c-2 1-4 2-5 4"
        stroke="#7fcf9a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  lotus: (p) => (
    <>
      <path
        d="M32 42 c-6-3-8-9-6-16 c4 3 6 7 6 16z"
        fill={p.glyph}
        opacity="0.9"
      />
      <path
        d="M32 42 c6-3 8-9 6-16 c-4 3-6 7-6 16z"
        fill={p.glyph}
        opacity="0.9"
      />
      <path d="M32 42 c-3-6-3-13 0-20 c3 7 3 14 0 20z" fill={p.glyph} />
      <path
        d="M32 42 c-8-2-12-7-13-12 c6 0 11 4 13 12z"
        fill={p.glyph}
        opacity="0.75"
      />
      <path
        d="M32 42 c8-2 12-7 13-12 c-6 0-11 4-13 12z"
        fill={p.glyph}
        opacity="0.75"
      />
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
      <path
        d="M32 18 c1.5 8 4 10.5 12 12 c-8 1.5-10.5 4-12 12 c-1.5-8-4-10.5-12-12 c8-1.5 10.5-4 12-12z"
        fill={p.glyph}
      />
      <path
        d="M32 24 c0.8 4.5 2.5 6.5 6 8 c-3.5 1.5-5.2 3.5-6 8 c-0.8-4.5-2.5-6.5-6-8 c3.5-1.5 5.2-3.5 6-8z"
        fill={p.glyphAccent}
        opacity="0.6"
      />
      <path
        d="M43 19 c0.5 2.5 1.2 3.2 3.5 3.7 c-2.3 0.5-3 1.2-3.5 3.7 c-0.5-2.5-1.2-3.2-3.5-3.7 c2.3-0.5 3-1.2 3.5-3.7z"
        fill={p.glyph}
      />
      <path
        d="M21 40 c0.4 2 1 2.6 2.8 3 c-1.8 0.4-2.4 1-2.8 3 c-0.4-2-1-2.6-2.8-3 c1.8-0.4 2.4-1 2.8-3z"
        fill={p.glyph}
      />
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
      <ellipse
        cx="24"
        cy="21.5"
        rx="3"
        ry="1.8"
        fill="#ffffff"
        opacity="0.4"
        transform="rotate(-30 24 21.5)"
      />
    </>
  ),
  food: (p) => (
    <>
      <path
        d="M22 18 c-1.5 2.5 1.5 3.5 0 6.5 M32 15 c-1.5 2.5 1.5 3.5 0 6.5 M42 18 c-1.5 2.5 1.5 3.5 0 6.5"
        stroke="#c7b8a8"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path d="M17 30 c0 9 6 15 15 15 c9 0 15-6 15-15z" fill={p.glyph} />
      <path
        d="M17 30 h30 v-1.6 c0-1.3-1-2.4-2.4-2.4 h-25.2 c-1.4 0-2.4 1.1-2.4 2.4z"
        fill="#f28a5c"
      />
      <ellipse cx="32" cy="27.5" rx="12.5" ry="2.4" fill={p.glyphAccent} />
      <path
        d="M22 27.5 c3-2.8 6-2.8 8-1 c2-2 5-2 8 0.5 c1.5 1 3 1 4 0.5"
        stroke="#f2b134"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="27" cy="26.4" r="1.5" fill="#6fbf73" />
      <circle cx="37.5" cy="26.6" r="1.5" fill="#6fbf73" />
      <path
        d="M20 34 c0 4 2.5 7.5 6 9"
        stroke="#ffffff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
      <ellipse cx="32" cy="46" rx="7" ry="1.6" fill={p.glyph} />
    </>
  ),
  beauty: (p) => (
    <>
      <path
        d="M31 30 c-5-8-12-10-14.5-7.5 c-2.5 2.5-0.5 8 4.5 10.5 c-4 1-6 5-4 8 c2 3 7 2 10-1.5 c1.5-2 3-5.5 4-9.5z"
        fill={p.glyph}
      />
      <path
        d="M33 30 c5-8 12-10 14.5-7.5 c2.5 2.5 0.5 8-4.5 10.5 c4 1 6 5 4 8 c-2 3-7 2-10-1.5 c-1.5-2-3-5.5-4-9.5z"
        fill={p.glyph}
      />
      <path
        d="M30 29 c-3-4.5-7-6-8.5-4.5 c-1.5 1.5 0 4.5 3.5 6z M34 29 c3-4.5 7-6 8.5-4.5 c1.5 1.5 0 4.5-3.5 6z"
        fill={p.glyphAccent}
        opacity="0.85"
      />
      <circle cx="24" cy="36.5" r="1.8" fill={p.glyphAccent} opacity="0.85" />
      <circle cx="40" cy="36.5" r="1.8" fill={p.glyphAccent} opacity="0.85" />
      <ellipse cx="32" cy="32" rx="1.7" ry="8" fill="#4a3d5c" />
      <path
        d="M31.5 24.5 c-1-2.5-2.5-4-4-4.5 M32.5 24.5 c1-2.5 2.5-4 4-4.5"
        stroke="#4a3d5c"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="27.3" cy="19.8" r="0.9" fill="#4a3d5c" />
      <circle cx="36.7" cy="19.8" r="0.9" fill="#4a3d5c" />
    </>
  ),
  cat: (p) => (
    <>
      <path d="M20 30 l-2-12 l9 6z M44 30 l2-12 l-9 6z" fill={p.glyph} />
      <path d="M21 27 l-1-6 l4.5 3.5z M43 27 l1-6 l-4.5 3.5z" fill="#f7c9c9" />
      <circle cx="32" cy="32" r="13" fill={p.glyph} />
      <ellipse cx="32" cy="37" rx="7" ry="5" fill={p.glyphAccent} />
      <ellipse cx="26.5" cy="30" rx="2" ry="2.6" fill="#3c7a3a" />
      <ellipse cx="37.5" cy="30" rx="2" ry="2.6" fill="#3c7a3a" />
      <ellipse cx="26.5" cy="30" rx="0.7" ry="2.2" fill="#1a1a1a" />
      <ellipse cx="37.5" cy="30" rx="0.7" ry="2.2" fill="#1a1a1a" />
      <path d="M30.5 34.5 h3 l-1.5 1.8z" fill="#e07a8a" />
      <path
        d="M32 36.3 v1.5 M32 37.8 c-1 1.5-2.5 1.5-3.5 0.5 M32 37.8 c1 1.5 2.5 1.5 3.5 0.5"
        stroke="#5a3a1a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 35 h-7 M22 37.5 l-6.5 1.5 M42 35 h7 M42 37.5 l6.5 1.5"
        stroke="#5a3a1a"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </>
  ),
  dog: (p) => (
    <>
      <path
        d="M22 24 c-5 0-7 7-6 14 c0.5 3 4 4 6 2z M42 24 c5 0 7 7 6 14 c-0.5 3-4 4-6 2z"
        fill="#8a5a30"
      />
      <circle cx="32" cy="32" r="13" fill={p.glyph} />
      <path
        d="M32 19.5 c-4 0-7 3-8.5 6 l8.5 3 l8.5-3 c-1.5-3-4.5-6-8.5-6z"
        fill={p.glyphAccent}
        opacity="0.5"
      />
      <ellipse cx="32" cy="38" rx="7.5" ry="6" fill={p.glyphAccent} />
      <circle cx="26.5" cy="30" r="2.2" fill="#2a1a10" />
      <circle cx="37.5" cy="30" r="2.2" fill="#2a1a10" />
      <circle cx="27.2" cy="29.3" r="0.7" fill="#ffffff" />
      <circle cx="38.2" cy="29.3" r="0.7" fill="#ffffff" />
      <ellipse cx="32" cy="36" rx="3" ry="2.2" fill="#2a1a10" />
      <path
        d="M32 38 v2 M32 40 c-1.5 2-3.5 2-4.5 0.5 M32 40 c1.5 2 3.5 2 4.5 0.5"
        stroke="#2a1a10"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M33.5 41.5 c0 2.5 1.5 3.8 3 3.3 c1.2-0.4 1-2.5-0.5-3.6z"
        fill="#e57a8a"
      />
    </>
  ),
  family: (p) => (
    <>
      <circle cx="22" cy="22" r="5" fill="#f3c9a6" />
      <path
        d="M22 28 c-6 0-8 5-8 11 h16 c0-6-2-11-8-11z"
        fill={p.glyphAccent}
      />
      <circle cx="42" cy="22" r="5" fill="#e0a882" />
      <path d="M42 28 c-6 0-8 5-8 11 h16 c0-6-2-11-8-11z" fill={p.glyph} />
      <circle cx="32" cy="32" r="3.8" fill="#f7d9bd" />
      <path
        d="M32 36.5 c-4.5 0-6 3.5-6 7.5 h12 c0-4-1.5-7.5-6-7.5z"
        fill="#f6cf5a"
      />
      <path
        d="M17 20 c1-4 4-5 6-4.5 c1.5-1 3.5-0.5 4 1.5 c-1 1-2 1.2-3 1 c-2 1-5 1-7 2z"
        fill="#6b4a2a"
      />
      <path
        d="M37 21 c0.5-4 3-6 5.5-6 c2.5 0 4.5 2 4.5 5 c-1.5-1-3-1.5-5-1.5 c-2 0-3.5 1-5 2.5z"
        fill="#3a2a1a"
      />
      <path
        d="M28.3 31 c0.5-2.5 2-3.5 3.7-3.5 c1.7 0 3.2 1 3.7 3.5 c-1.2-0.8-2.4-1-3.7-1 c-1.3 0-2.5 0.2-3.7 1z"
        fill="#8a5a30"
      />
      <path
        d="M32 19 c1.2-2.4 4-2.4 4.6 0 c0.4 1.8-1.8 3.6-4.6 5.4 c-2.8-1.8-5-3.6-4.6-5.4 c0.6-2.4 3.4-2.4 4.6 0z"
        fill="#e0566b"
      />
    </>
  ),
  happy: (p) => (
    <>
      <circle cx="32" cy="32" r="13.5" fill={p.glyph} />
      <ellipse cx="25" cy="28" rx="2.4" ry="3.2" fill={p.glyphAccent} />
      <ellipse cx="39" cy="28" rx="2.4" ry="3.2" fill={p.glyphAccent} />
      <path d="M22.5 34.5 c2.5 8 16.5 8 19 0z" fill={p.glyphAccent} />
      <path
        d="M25 37.5 c3.5 3.5 10.5 3.5 14 0 c-3.5-1-10.5-1-14 0z"
        fill="#e5635f"
      />
      <circle cx="21.5" cy="34.5" r="2.4" fill="#ff8f8f" opacity="0.6" />
      <circle cx="42.5" cy="34.5" r="2.4" fill="#ff8f8f" opacity="0.6" />
      <ellipse
        cx="27"
        cy="22"
        rx="3.5"
        ry="1.8"
        fill="#ffffff"
        opacity="0.45"
        transform="rotate(-25 27 22)"
      />
    </>
  ),
  joy: (p) => (
    <>
      <circle cx="32" cy="32" r="13.5" fill={p.glyph} />
      <path
        d="M21.5 30 c1.5-3.5 5.5-3.5 7 0 M35.5 30 c1.5-3.5 5.5-3.5 7 0"
        stroke={p.glyphAccent}
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M23 33.5 c3 8 15 8 18 0z" fill={p.glyphAccent} />
      <path
        d="M24.5 33.5 h15 c-0.5 1.6-1.5 2.4-2.5 2.4 h-10 c-1 0-2-0.8-2.5-2.4z"
        fill="#ffffff"
      />
      <path
        d="M27 38.5 c2.5 2.5 7.5 2.5 10 0 c-2.5-0.8-7.5-0.8-10 0z"
        fill="#e5635f"
      />
      <circle cx="21" cy="35" r="2.4" fill="#ff8f8f" opacity="0.6" />
      <circle cx="43" cy="35" r="2.4" fill="#ff8f8f" opacity="0.6" />
      <path
        d="M14 22 l2.4 2.4 M13 27 h3 M50 22 l-2.4 2.4 M51 27 h-3 M32 13 v3"
        stroke="#f2b134"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M46 40 c1.6 2.6 0.8 5-1.4 5 c-2.2 0-3-2.4-1.4-5 c0.6-1 1-1.8 1.4-2.8 c0.4 1 0.8 1.8 1.4 2.8z"
        fill="#6fa8dc"
      />
    </>
  ),
  tree_of_life: (p) => (
    <>
      <circle
        cx="32"
        cy="32"
        r="16"
        fill="none"
        stroke={p.glyphAccent}
        strokeWidth="1.3"
        opacity="0.6"
      />
      <path
        d="M32 47 c-1.4-4-1.4-8-0.8-12 M32 47 c1.4-4 1.4-8 0.8-12"
        stroke={p.glyphAccent}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M31 35 c-3-2-6-2-8 1 M33 35 c3-2 6-2 8 1 M31.5 33 c-2-3-2-6-1-9 M32.5 33 c2-3 2-6 1-9 M31 34 c-4-1-6 1-8-3 M33 34 c4-1 6 1 8-3"
        stroke={p.glyphAccent}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 47 c3-1.5 7-1.5 10 0 c3-1.5 7-1.5 10 0"
        stroke={p.glyphAccent}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="32" cy="22" r="5" fill={p.glyph} />
      <circle cx="24.5" cy="25.5" r="4.4" fill={p.glyph} />
      <circle cx="39.5" cy="25.5" r="4.4" fill={p.glyph} />
      <circle cx="21" cy="32" r="3.8" fill="#4d9350" />
      <circle cx="43" cy="32" r="3.8" fill="#4d9350" />
      <circle cx="27" cy="31" r="3.6" fill="#7cc47f" />
      <circle cx="37" cy="31" r="3.6" fill="#7cc47f" />
      <circle cx="32" cy="28.5" r="3.2" fill="#8fd192" />
      <circle cx="28" cy="24" r="1.2" fill="#f28c8c" />
      <circle cx="36.5" cy="23" r="1.2" fill="#f28c8c" />
      <circle cx="41" cy="30" r="1.1" fill="#f28c8c" />
    </>
  ),
  mandala: (p) => (
    <>
      <circle
        cx="32"
        cy="32"
        r="16"
        fill="none"
        stroke={p.glyph}
        strokeWidth="1.2"
        opacity="0.5"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(0 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(45 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(90 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(135 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(180 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(225 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(270 32 32)"
      />
      <ellipse
        cx="32"
        cy="21"
        rx="3.2"
        ry="8"
        fill={p.glyph}
        opacity="0.9"
        transform="rotate(315 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(22.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(67.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(112.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(157.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(202.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(247.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(292.5 32 32)"
      />
      <ellipse
        cx="32"
        cy="23.5"
        rx="2.4"
        ry="5.5"
        fill="#e07ab0"
        opacity="0.9"
        transform="rotate(337.5 32 32)"
      />
      <circle cx="32" cy="32" r="6" fill={p.glyphAccent} />
      <circle cx="32" cy="32" r="3" fill="#fff3bf" />
      <circle
        cx="32"
        cy="32"
        r="9.5"
        fill="none"
        stroke="#fff3bf"
        strokeWidth="1"
        opacity="0.8"
      />
    </>
  ),
  nature: (p) => (
    <>
      <path
        d="M32 47 V30"
        stroke="#5a8a3a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M31.5 24 c-9-1-14 5-15 12 c7 1 12-3 15-12z" fill={p.glyph} />
      <path d="M32.5 24 c9-1 14 5 15 12 c-7 1-12-3-15-12z" fill="#4d9a52" />
      <path
        d="M32 30 c-3 1-6 3-9 6 M32 30 c3 1 6 3 9 6"
        stroke={p.glyphAccent}
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path d="M32 26 c-4-4-4-9 0-12 c4 3 4 8 0 12z" fill="#8fd192" />
      <path
        d="M32 25 V16"
        stroke={p.glyphAccent}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="44" cy="23" r="3" fill="#f2b134" />
      <path
        d="M44 18.2 v1.4 M48.8 23 h-1.4 M47.4 19.6 l-1 1 M40.6 19.6 l1 1"
        stroke="#f2b134"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
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
  const Lucide = lineLucide[vibe];
  if (Lucide) {
    return (
      <Lucide
        size={size}
        strokeWidth={1.8}
        className={className}
        aria-hidden="true"
        focusable="false"
      />
    );
  }
  const line = lineGlyphs[vibe];
  if (line) {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {line}
      </svg>
    );
  }
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
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.4"
            floodColor={p.shadow}
            floodOpacity="0.45"
          />
        </filter>
      </defs>
      <g
        filter={`url(#${uid}-glow)`}
        transform="translate(32 32) scale(1.55) translate(-32 -32)"
      >
        {glyphs[vibe as Vibe](p)}
      </g>
    </svg>
  );
}
