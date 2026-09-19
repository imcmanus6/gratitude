/** Good-vibes reactions people can leave on a gratitude. `kind` is stored in reactions.kind. */
export const REACTIONS = [
  { kind: "heart", label: "Heart" },
  { kind: "thanks", label: "Grateful" },
  { kind: "prayer", label: "Prayer" },
  { kind: "mind_blown", label: "Mind blown" },
  { kind: "sunshine", label: "Sunshine" },
  { kind: "rainbow", label: "Rainbow" },
  { kind: "earth", label: "Earth" },
  { kind: "peace", label: "Peace" },
  { kind: "sparkle", label: "Sparkle" },
  { kind: "bloom", label: "Bloom" },
  { kind: "celebrate", label: "Celebrate" },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]["kind"];

export const REACTION_KINDS: readonly string[] = REACTIONS.map((r) => r.kind);

export function isReactionKind(kind: unknown): kind is ReactionKind {
  return typeof kind === "string" && REACTION_KINDS.includes(kind);
}

export function reactionLabel(kind: string): string {
  return REACTIONS.find((r) => r.kind === kind)?.label ?? kind;
}

export type PostReaction = { kind: string; count: number; mine: number };
