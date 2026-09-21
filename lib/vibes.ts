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

export type Vibe = (typeof VIBES)[number]["id"];

export function validVibe(value: unknown): value is Vibe {
  return typeof value === "string" && VIBES.some((v) => v.id === value);
}

export function vibeName(id: string): string {
  return VIBES.find((v) => v.id === id)?.name ?? id;
}
