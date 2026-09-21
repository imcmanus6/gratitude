/** Good-vibes icons an author can attach to a gratitude. Stored in posts.vibe. */
export const VIBES = [
  { id: "heart", name: "Heart" },
  { id: "prayer", name: "Prayer" },
  { id: "mind_blown", name: "Mind blown" },
  { id: "sunshine", name: "Sunshine" },
  { id: "rainbow", name: "Rainbow" },
  { id: "earth", name: "Earth" },
  { id: "peace", name: "Peace" },
  { id: "lotus", name: "Lotus" },
  { id: "moon", name: "Moonlight" },
  { id: "sparkle", name: "Sparkle" },
  { id: "pot_of_gold", name: "Pot of gold" },
  { id: "clover", name: "Lucky clover" },
  { id: "health", name: "Health" },
  { id: "food", name: "Good food" },
  { id: "beauty", name: "Beauty" },
  { id: "cat", name: "Cat" },
  { id: "dog", name: "Dog" },
  { id: "family", name: "Family" },
  { id: "happy", name: "Happy" },
  { id: "joy", name: "Joy" },
  { id: "tree_of_life", name: "Tree of life" },
  { id: "mandala", name: "Mandala" },
  { id: "nature", name: "Nature" },
] as const;

/** Line-art vibes drawn in the card's text colour (see components/vibe-line-icons.tsx). */
export const LINE_VIBES = [
  { id: "hug", name: "Hug" },
  { id: "helping_hand", name: "Helping hand" },
  { id: "giving", name: "Giving" },
  { id: "grateful", name: "Grateful" },
  { id: "community", name: "Community" },
  { id: "home", name: "Home" },
  { id: "mindfulness", name: "Mindfulness" },
  { id: "inner_peace", name: "Inner peace" },
  { id: "calm", name: "Calm" },
  { id: "balance", name: "Balance" },
  { id: "clarity", name: "Clarity" },
  { id: "wellness", name: "Wellness" },
  { id: "growth", name: "Growth" },
  { id: "strength", name: "Strength" },
  { id: "courage", name: "Courage" },
  { id: "fresh_start", name: "Fresh start" },
] as const;

export const ALL_VIBES = [...VIBES, ...LINE_VIBES];

export type Vibe = (typeof VIBES)[number]["id"];
export type LineVibe = (typeof LINE_VIBES)[number]["id"];

export function validVibe(value: unknown): value is Vibe | LineVibe {
  return typeof value === "string" && ALL_VIBES.some((v) => v.id === value);
}

export function vibeName(id: string): string {
  return ALL_VIBES.find((v) => v.id === id)?.name ?? id;
}

export function isLineVibe(id: string): id is LineVibe {
  return LINE_VIBES.some((v) => v.id === id);
}
