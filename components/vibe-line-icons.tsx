import type { ReactNode } from "react";
import { Handshake, BicepsFlexed, type LucideIcon } from "lucide-react";

/** Line vibes borrowed from lucide where it already has a good drawing. */
export const lineLucide: Record<string, LucideIcon> = {
  helping_hand: Handshake,
  strength: BicepsFlexed,
};

/**
 * Line-art vibes drawn with `currentColor`, so they pick up the card's text colour
 * (white on dark photo backgrounds, black on light themes). 64×64 grid, 2.4 stroke.
 */
export const lineGlyphs: Record<string, ReactNode> = {
  hug: (
    <>
      <circle cx="24" cy="15" r="5" />
      <circle cx="41" cy="16" r="5" />
      <path d="M14 50 v-14 c0-6 4-10 10-10 c4 0 6 2 8 4 c2-2 4-4 8-4 c6 0 10 4 10 10 v14" />
      <path d="M22 34 c4 4 8 6 12 6 c4 0 8-2 12-6" />
      <path d="M22 50 v-10 M42 50 v-10" />
    </>
  ),
  giving: (
    <>
      <path d="M10 42 h8 l10 6 h14 c3 0 3-4 0-4 h-9" />
      <path d="M18 42 v-8 h-8 v16 h8" />
      <path d="M28 44 h16 l12-6 c2-1 5 1 3 4 l-14 10 h-17" />
      <path d="M36 30 c-6-4-9-8-9-11.5 a4.5 4.5 0 0 1 9-1 a4.5 4.5 0 0 1 9 1 c0 3.5-3 7.5-9 11.5z" />
    </>
  ),
  mindfulness: (
    <>
      <path d="M26 56 v-8 c-8-3-12-10-12-18 c0-11 8-19 19-19 c10 0 17 7 17 16 c0 5-2 8-4 11 l3 6 h-6 v6 c0 3-3 5-6 5 h-2" />
      <path d="M32 33 c-3-2-4-5-3-8 c3 1 4 4 3 8z M32 33 c3-2 4-5 3-8 c-3 1-4 4-3 8z M32 33 c-4 0-7-2-8-5 c3-1 6 1 8 5z M32 33 c4 0 7-2 8-5 c-3-1-6 1-8 5z" />
    </>
  ),
  balance: (
    <>
      <path d="M32 10 v42 M22 52 h20 M14 20 h36" />
      <circle cx="32" cy="16" r="3" />
      <path d="M18 20 l-7 16 h14z M46 20 l-7 16 h14z" />
    </>
  ),
  calm: (
    <>
      <path d="M32 30 c-6-4-8-9-6-14 c5 2 8 7 6 14z" />
      <path d="M32 30 c2-4 4-8 5-11" />
      <ellipse cx="32" cy="36" rx="8" ry="2.5" />
      <path d="M16 42 c5 3 11 3 16 0 c5-3 11-3 16 0" />
      <path d="M10 50 c6 3 14 3 22 0 c8-3 16-3 22 0" />
    </>
  ),
  growth: (
    <>
      <path d="M32 46 v-16" />
      <path d="M32 34 c-8 0-12-5-12-12 c7 0 12 4 12 12z" />
      <path d="M32 30 c8 0 12-5 12-12 c-7 0-12 4-12 12z" />
      <path d="M12 46 c4-4 10-5 14-3 l6 3 h10 c3 0 3 4 0 4 h-8" />
      <path d="M34 50 h10 l10-6 c2-1 5 1 3 4 l-14 8 h-17 l-6-4 h-8" />
    </>
  ),
  wellness: (
    <>
      <path d="M32 52 C20 43 14 36 14 27 a9 9 0 0 1 18-2 a9 9 0 0 1 18 2 c0 9-6 16-18 25z" />
      <path d="M32 44 c-1-8 3-14 10-16 c1 7-3 13-10 16z" />
      <path d="M32 44 c2-5 5-9 8-12" />
    </>
  ),
  community: (
    <>
      <circle cx="32" cy="16" r="5" />
      <circle cx="15" cy="26" r="5" />
      <circle cx="49" cy="26" r="5" />
      <path d="M24 34 c0-5 4-8 8-8 c4 0 8 3 8 8" />
      <path d="M6 44 c0-5 4-8 9-8 c3 0 5 1 6 2" />
      <path d="M58 44 c0-5-4-8-9-8 c-3 0-5 1-6 2" />
      <path d="M20 54 c1-8 6-12 12-12 c6 0 11 4 12 12" />
    </>
  ),
  grateful: (
    <>
      <path d="M32 36 c-5-3.5-8-7-8-10.5 a4 4 0 0 1 8-1 a4 4 0 0 1 8 1 c0 3.5-3 7-8 10.5z" />
      <path d="M12 38 c2-6 6-8 10-6 l6 6 h8 l6-6 c4-2 8 0 10 6" />
      <path d="M12 38 v6 c0 6 6 10 12 10 h16 c6 0 12-4 12-10 v-6" />
      <path d="M32 8 v4 M20 12 l2.5 3 M44 12 l-2.5 3" />
    </>
  ),
  fresh_start: (
    <>
      <path d="M10 44 h44" />
      <path d="M20 44 a12 12 0 0 1 24 0" />
      <path d="M32 24 v-8 M18 30 l-4-4 M46 30 l4-4 M12 44 h-4 M56 44 h-4" />
      <path d="M40 54 v-6 c0-4 3-7 8-7 c0 4-3 7-8 7z" />
      <path d="M40 54 c0-3 2-5 4-6" />
    </>
  ),
  clarity: (
    <>
      <path d="M8 32 c8-11 16-16 24-16 c8 0 16 5 24 16 c-8 11-16 16-24 16 c-8 0-16-5-24-16z" />
      <path d="M26 30 l3-5 h6 l3 5 l-6 8z M26 30 h12 M29 25 l3 5 l3-5 M32 30 v8" />
    </>
  ),
  inner_peace: (
    <>
      <circle cx="32" cy="32" r="22" />
      <path d="M32 40 c-3-3-4-7-2-11 c3 2 4 6 2 11z M32 40 c3-3 4-7 2-11 c-3 2-4 6-2 11z" />
      <path d="M32 40 c-5 0-9-2-11-6 c4-1 8 1 11 6z M32 40 c5 0 9-2 11-6 c-4-1-8 1-11 6z" />
      <path d="M32 40 c-7 1-12-1-15-4 c5-1 10 0 15 4z M32 40 c7 1 12-1 15-4 c-5-1-10 0-15 4z" />
    </>
  ),
  home: (
    <>
      <path d="M12 30 l20-16 l20 16" />
      <path d="M17 27 v23 h30 v-23" />
      <path d="M32 44 c-4-3-6-6-6-8.5 a3 3 0 0 1 6-0.5 a3 3 0 0 1 6 0.5 c0 2.5-2 5.5-6 8.5z" />
    </>
  ),
  courage: (
    <>
      <path d="M32 54 c10-8 16-12 16-24 v-14 l-16-6 l-16 6 v14 c0 12 6 16 16 24z" />
      <path d="M32 20 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5-3 l-5.5 3 l1-6.5 l-4.5-4.5 l6-1z" />
    </>
  ),
};
