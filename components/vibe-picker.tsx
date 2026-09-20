"use client";
import { VIBES } from "@/lib/vibes";
import { VibeIcon } from "./vibe-icon";

export function VibePicker({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (vibe: string | null) => void;
}) {
  return (
    <div className="vibe-picker">
      <p className="field-label">Add a good-vibes icon (optional)</p>
      <div className="vibe-options" role="radiogroup" aria-label="Good-vibes icon">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className="vibe-option vibe-none"
          onClick={() => onSelect(null)}
        >
          <span className="vibe-none-mark" aria-hidden="true">–</span>
          <span>None</span>
        </button>
        {VIBES.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={value === v.id}
            className="vibe-option"
            onClick={() => onSelect(value === v.id ? null : v.id)}
          >
            <VibeIcon vibe={v.id} size={48} />
            <span>{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
