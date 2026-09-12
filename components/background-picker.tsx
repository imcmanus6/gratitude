"use client";
import { useEffect, useRef, useState } from "react";
import { CARD_THEMES } from "@/lib/card-themes";
export function BackgroundPicker({
  body,
  theme,
  photo,
  onSelect,
  onGenerated,
  onBusy,
}: {
  body: string;
  theme: string;
  photo: string | null;
  onSelect: (theme: string) => void;
  onGenerated: (id: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [show, setShow] = useState(false),
    [context, setContext] = useState(""),
    [style, setStyle] = useState("photo"),
    [enabled, setEnabled] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [candidate, setCandidate] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      onBusy(false);
    },
    [onBusy],
  );
  async function open() {
    setShow(!show);
    if (show) return;
    setContext(body.slice(0, 1500));
    try {
      const res = await fetch("/api/image-generation");
      const data = await res.json();
      setEnabled(data.enabled);
      setReason(
        data.reason === "demo"
          ? "Create your own account to generate a new image. Try the woodland sample here."
          : "AI image creation is not connected yet. Try the woodland sample, a colour or your own photo.",
      );
    } catch {
      setReason("Image creation is unavailable right now.");
    }
  }
  async function generate() {
    setBusy(true);
    onBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const res = await fetch("/api/image-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          style,
          consent: true,
          requestId: crypto.randomUUID(),
        }),
        signal: controller.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCandidate(data.id);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <section className="background-picker">
      <p className="field-label">Give your gratitude a background</p>
      <div className="background-swatches">
        {CARD_THEMES.map((t) => (
          <button
            type="button"
            key={t.id}
            title={t.name}
            aria-label={`${t.name} background`}
            aria-pressed={theme === t.id}
            onClick={() => onSelect(t.id)}
            style={{ background: t.background, color: t.foreground }}
          >
            {t.id === "woodland" ? "✧" : theme === t.id ? "✓" : ""}
            <span>{t.name}</span>
          </button>
        ))}
        {photo && (
          <button
            type="button"
            aria-pressed={theme === "photo"}
            onClick={() => onSelect("photo")}
          >
            My photo
          </button>
        )}
      </div>
      <button
        type="button"
        className="button"
        onClick={open}
        aria-expanded={show}
      >
        ✧ Make an image for me
      </button>
      {show && (
        <div className="ai-controls">
          {!enabled ? (
            <p className="field-help">{reason || "Checking image creation…"}</p>
          ) : (
            <>
              <label>
                What should inspire the image?
                <textarea
                  value={context}
                  maxLength={1500}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Image style
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="photo">Natural photography</option>
                  <option value="watercolour">Watercolour</option>
                  <option value="abstract">Soft abstract</option>
                </select>
              </label>
              <p className="field-help">
                Creating an image sends only the words above to OpenAI. Edit out
                anything personal first. You’ll preview the image before using
                it.
              </p>
              <button
                type="button"
                className="button"
                disabled={busy || !context.trim()}
                onClick={generate}
              >
                {busy
                  ? "Creating your background…"
                  : candidate
                    ? "Try another image"
                    : "Create background"}
              </button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          {candidate && (
            <div>
              <img
                className="ai-candidate"
                src={`/api/media/${candidate}`}
                alt="AI background preview"
              />
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => {
                  onGenerated(candidate);
                  setShow(false);
                }}
              >
                Use this background
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
