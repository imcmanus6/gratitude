"use client";
import { VIBES, LINE_VIBES } from "@/lib/vibes";
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
      <div role="radiogroup" aria-label="Good-vibes icon">
        <div className="vibe-options">
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            className="vibe-option vibe-none"
            onClick={() => onSelect(null)}
          >
            <span className="vibe-none-mark" aria-hidden="true">
              –
            </span>
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
        <p className="field-hint">
          Line icons take on your card&apos;s text colour.
        </p>
        <div className="vibe-options">
          {LINE_VIBES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={value === v.id}
              className="vibe-option vibe-line"
              onClick={() => onSelect(value === v.id ? null : v.id)}
            >
              <VibeIcon vibe={v.id} size={48} />
              <span>{v.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
