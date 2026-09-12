"use client";
import { useEffect, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { AppState } from "@/lib/types";
export function InvitePeople({
  data,
  open,
  onboarding,
  onClose,
  onUpdate,
}: {
  data: AppState;
  open: boolean;
  onboarding: boolean;
  onClose: () => void;
  onUpdate: (data: AppState) => void;
}) {
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (open) {
      setSelected("");
      setCreating(false);
      setMessage("");
    }
  }, [open]);
  const circle = data.circles.find((c) => c.id === selected);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/${circle ? `?invite=${circle.invite}` : ""}`
      : "";
  async function update(payload: Record<string, unknown>) {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const next = await res.json();
    if (!res.ok) throw new Error(next.error);
    onUpdate(next);
    return next;
  }
  async function finish() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (onboarding) await update({ action: "completeOnboarding" });
      onClose();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) void finish();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="serif text-3xl">
            {onboarding
              ? "Good things are better shared."
              : "Invite your people."}
          </DialogTitle>
          <DialogDescription>
            {onboarding
              ? "Invite friends to Gratitude Circles, or create a circle to share together. Both are optional."
              : "Share Gratitude Circles with anyone. No circle needed."}
          </DialogDescription>
        </DialogHeader>
        {!!data.circles.length && (
          <>
            <label htmlFor="invite-people-circle">Choose a circle</label>
            <select
              id="invite-people-circle"
              disabled={busy}
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setCreating(false);
                setMessage("");
              }}
            >
              <option value="">Gratitude Circles — general invitation</option>
              {data.circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        )}
        {creating ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setBusy(true);
              setMessage("");
              try {
                const next = await update({
                  action: "createCircle",
                  name: form.get("name"),
                  kind: "friends",
                });
                setSelected(next.result.circleId);
                setCreating(false);
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="first-circle-name">Give your circle a name</label>
            <input
              id="first-circle-name"
              name="name"
              required
              maxLength={80}
              placeholder="Family, close friends, little joys…"
              disabled={busy}
            />
            <button className="button primary" disabled={busy}>
              {busy ? "Creating…" : "Create circle"}
            </button>
          </form>
        ) : (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setCreating(true);
              setSelected("");
              setMessage("");
            }}
          >
            Create a new circle
          </button>
        )}
        {!creating && (
          <div>
            <h2 className="serif text-xl">
              {circle
                ? `Invite people to ${circle.name}`
                : "Invite people to Gratitude Circles"}
            </h2>
            <p className="field-help">
              {circle
                ? "Anyone with this link can join this circle. Share it with people you trust."
                : "This link opens the app so they can start their own gratitude practice."}
            </p>
            <label htmlFor="invite-people-link">Invitation link</label>
            <input
              id="invite-people-link"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
            />
            <div className="modal-actions">
              <button
                className="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setMessage(
                      "Invitation copied. Paste it into a message or email.",
                    );
                  } catch {
                    setMessage("Select and copy the invitation link above.");
                  }
                }}
              >
                <Copy />
                Copy invitation
              </button>
              {typeof navigator !== "undefined" && !!navigator.share && (
                <button
                  className="button primary"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: circle
                          ? `Join ${circle.name}`
                          : "Join Gratitude Circles",
                        text: circle
                          ? `Join me in ${circle.name} on Gratitude Circles.`
                          : "Join me on Gratitude Circles — a little place to notice the good.",
                        url: link,
                      });
                      setMessage("Invitation handed to your sharing app.");
                    } catch (e) {
                      if ((e as Error).name !== "AbortError")
                        setMessage(
                          "Copy the invitation link to share it instead.",
                        );
                    }
                  }}
                >
                  <Share2 />
                  Share invitation
                </button>
              )}
            </div>
            <p className="field-help">
              Send it through WhatsApp, a text message, email or another app.
              Nothing is sent automatically.
            </p>
          </div>
        )}
        {message && (
          <p role="status" className="field-help">
            {message}
          </p>
        )}
        <button
          className="button"
          disabled={busy}
          onClick={() => void finish()}
        >
          {onboarding
            ? circle
              ? "Continue to my feed"
              : "Skip for now"
            : "Done"}
        </button>
        {onboarding && (
          <p className="field-help text-center">
            You can always invite people from the logo menu.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
