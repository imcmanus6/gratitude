"use client";
import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { REACTIONS, reactionLabel, type PostReaction } from "@/lib/reactions";
import { ReactionIcon } from "./reaction-icon";

/**
 * Reactions left on a gratitude: a heart button is always present, other
 * kinds appear once used, and the picker offers the full good-vibes set.
 */
export function ReactionBar({
  reactions,
  busy,
  onReact,
}: {
  reactions: PostReaction[];
  busy: boolean;
  onReact: (kind: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const byKind = new Map(reactions.map((r) => [r.kind, r]));
  const shown = REACTIONS.filter(
    (r) => r.kind === "heart" || (byKind.get(r.kind)?.count ?? 0) > 0,
  );

  return (
    <>
      {shown.map(({ kind, label }) => {
        const r = byKind.get(kind);
        const mine = !!r?.mine;
        return (
          <button
            key={kind}
            disabled={busy}
            className={mine ? "on" : ""}
            aria-label={mine ? `Remove ${label.toLowerCase()}` : `Send ${label.toLowerCase()}`}
            aria-pressed={mine}
            title={label}
            onClick={() => onReact(kind)}
          >
            <ReactionIcon kind={kind} active={mine} />
            {r?.count || <span className="sr-only">{label}</span>}
          </button>
        );
      })}
      <span className="reaction-picker" ref={wrap}>
        <button
          disabled={busy}
          aria-label="More reactions"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <SmilePlus />
        </button>
        {open && (
          <div className="reaction-menu" role="menu">
            {REACTIONS.map(({ kind }) => {
              const mine = !!byKind.get(kind)?.mine;
              return (
                <button
                  key={kind}
                  role="menuitem"
                  className={mine ? "on" : ""}
                  aria-label={reactionLabel(kind)}
                  title={reactionLabel(kind)}
                  onClick={() => {
                    onReact(kind);
                    setOpen(false);
                  }}
                >
                  <ReactionIcon kind={kind} active={mine} />
                </button>
              );
            })}
          </div>
        )}
      </span>
    </>
  );
}
