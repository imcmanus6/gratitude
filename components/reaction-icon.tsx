import {
  Bird,
  Brain,
  Earth,
  Flower,
  Hand,
  HandHeart,
  Heart,
  PartyPopper,
  Rainbow,
  Sparkles,
  Sun,
  type LucideProps,
} from "lucide-react";
import type { ReactionKind } from "@/lib/reactions";

const icons: Record<ReactionKind, React.ComponentType<LucideProps>> = {
  heart: Heart,
  thanks: HandHeart,
  prayer: Hand,
  mind_blown: Brain,
  sunshine: Sun,
  rainbow: Rainbow,
  earth: Earth,
  peace: Bird,
  sparkle: Sparkles,
  bloom: Flower,
  celebrate: PartyPopper,
};

/** Kinds whose glyph reads well when filled in the "on" state. */
const fillable = new Set<string>(["heart", "sunshine", "bloom"]);

export function ReactionIcon({
  kind,
  active,
  ...props
}: { kind: string; active?: boolean } & LucideProps) {
  const Icon = icons[kind as ReactionKind] ?? Heart;
  return (
    <Icon
      fill={active && fillable.has(kind) ? "currentColor" : "none"}
      {...props}
    />
  );
}
