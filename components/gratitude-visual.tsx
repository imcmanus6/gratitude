"use client";
import { useState, ReactNode } from "react";
import { cardAppearance } from "@/lib/card-themes";
import { vibeName, isLineVibe } from "@/lib/vibes";
import { VibeIcon } from "./vibe-icon";
export function GratitudeVisual({
  body,
  theme = "linen",
  image,
  generated = false,
  vibe = null,
  preview = false,
  header,
  footer,
}: {
  body: string;
  header?: ReactNode;
  footer?: ReactNode;
  theme?: string;
  image?: string | null;
  generated?: boolean;
  vibe?: string | null;
  preview?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const look = cardAppearance(theme, image);
  const hasImage = !!look.image && failedImage !== look.image;
  const long = body.length > 360;
  const display = long && !expanded ? body.slice(0, 340).trimEnd() + "…" : body;
  return (
    <div
      className={`gratitude-visual ${preview ? "is-preview" : ""} ${hasImage ? "has-image" : ""} ${expanded ? "is-expanded" : ""}`}
      style={{ background: look.background, color: look.foreground }}
      data-theme={theme}
    >
      {hasImage && (
        <img
          className="gratitude-background"
          src={look.image!}
          alt=""
          onError={() => setFailedImage(look.image!)}
          loading="lazy"
        />
      )}
      {hasImage && <div className="gratitude-scrim" />}
      <div className="gratitude-visual-content">
        {header}
        <div className="gratitude-center">
          <p
            className={`gratitude-words ${display.length > 220 ? "long" : ""}`}
          >
            {display || "The little thing you’re grateful for…"}
          </p>
          {vibe && (
            <div
              className={`gratitude-vibe ${isLineVibe(vibe) ? "is-line" : ""}`}
              role="img"
              aria-label={vibeName(vibe)}
            >
              <VibeIcon vibe={vibe} size={preview ? 56 : 68} />
            </div>
          )}
        </div>
        {long && !preview && (
          <button
            type="button"
            className="card-read-more"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Read the full gratitude"}
          </button>
        )}
        {footer}
      </div>
      {(generated && theme === "photo") || theme === "woodland" ? (
        <span className="ai-image-label">AI background</span>
      ) : null}
    </div>
  );
}
