"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
type Plan = {
  circles: {
    id: string;
    name: string;
    otherPosts: number;
    members: { id: string; name: string }[];
  }[];
  hasPassword: boolean;
  demo: boolean;
  verified: boolean;
  providers: { name: string; enabled: boolean }[];
};
export function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false),
    [step, setStep] = useState(0),
    [plan, setPlan] = useState<Plan | null>(null),
    [choices, setChoices] = useState<Record<string, string>>({}),
    [reason, setReason] = useState(""),
    [comment, setComment] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (new URLSearchParams(location.search).has("delete_account")) {
      setOpen(true);
      setStep(1);
      history.replaceState(null, "", location.pathname);
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/account")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) setPlan(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [open]);
  async function download() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account?export=1");
      if (!res.ok) throw Error("Could not download your data.");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-gratitude-data.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choices, reason, comment, password, confirm }),
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      setPassword("");
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="settings-card">
      <h2 className="serif">Delete account</h2>
      <p>Permanently remove your account and your gratitudes.</p>
      <button
        className="text-button"
        onClick={() => {
          setOpen(true);
          setStep(0);
          setError("");
          setPassword("");
          setConfirm("");
        }}
      >
        Delete my account
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) {
            setOpen(value);
            setPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === 0
                ? "What’s making you think about leaving?"
                : "Before you delete your account"}
            </DialogTitle>
            <DialogDescription>
              {step === 0
                ? "Optional feedback. You can skip this and continue."
                : "Review what will be removed and verify it’s you."}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {step === 0 ? (
            <>
              <label htmlFor="departure-reason">Reason (optional)</label>
              <select
                id="departure-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Choose a reason…</option>
                <option value="not_using">I’m not using it enough</option>
                <option value="privacy">Privacy concerns</option>
                <option value="notifications">Too many notifications</option>
                <option value="broken">Something isn’t working</option>
                <option value="other">Something else</option>
              </select>
              <label htmlFor="departure-comment">
                Anything else? (optional)
              </label>
              <textarea
                id="departure-comment"
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <p className="field-help">
                Feedback is stored separately from your account. Please leave
                out personal information.
              </p>
              <div className="flex gap-3">
                <button
                  className="button"
                  onClick={() => {
                    setReason("");
                    setComment("");
                    setStep(1);
                  }}
                >
                  Skip
                </button>
                <button className="button" onClick={() => setStep(1)}>
                  Continue
                </button>
              </div>
            </>
          ) : !plan ? (
            <p>Loading your account…</p>
          ) : (
            <>
              <p>
                Your profile, connected sign-ins, login sessions, all your
                gratitudes (including public and personal thank-yous), uploads,
                comments, reactions, memberships and invitations will be
                deleted.
              </p>
              <p className="field-help">
                Other people’s downloads and screenshots cannot be recalled.
                Data is removed from the active app database. Backup retention
                has not yet been configured for this app.
              </p>
              <button className="button" onClick={download} disabled={busy}>
                Download my data first
              </button>
              {plan.circles.map((c) => (
                <div className="direct-recipient" key={c.id}>
                  <label htmlFor={`delete-${c.id}`}>{c.name}</label>
                  <select
                    id={`delete-${c.id}`}
                    value={choices[c.id] || ""}
                    onChange={(e) =>
                      setChoices({ ...choices, [c.id]: e.target.value })
                    }
                  >
                    <option value="">
                      Choose what happens to this circle…
                    </option>
                    {c.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        Transfer ownership to {m.name}
                      </option>
                    ))}
                    <option value="delete">Delete this circle</option>
                  </select>
                  {choices[c.id] === "delete" && (
                    <p className="field-help">
                      This removes the circle, its sessions and other members’
                      entries shared only here. Entries also shared elsewhere
                      and private/public entries are preserved. {c.otherPosts}{" "}
                      other members’ entries are currently associated with this
                      circle.
                    </p>
                  )}
                </div>
              ))}
              {plan.demo ? (
                <p className="field-help">
                  This deletes your demo account. No password is required.
                </p>
              ) : plan.verified ? (
                <p>Identity verified. Confirm within five minutes.</p>
              ) : (
                <>
                  {plan.hasPassword && (
                    <>
                      <label htmlFor="delete-password">
                        Confirm your password
                      </label>
                      <input
                        id="delete-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </>
                  )}
                  {plan.providers.map((p) => (
                    <form
                      key={p.name}
                      method="post"
                      action={`/api/auth/social/${p.name}/start`}
                    >
                      <input type="hidden" name="intent" value="delete" />
                      <button className="button" disabled={!p.enabled}>
                        Verify with {p.name}
                      </button>
                    </form>
                  ))}
                  {!plan.hasPassword &&
                    !plan.providers.some((p) => p.enabled) && (
                      <p role="alert">
                        Your sign-in provider needs to be connected before
                        identity verification is available.
                      </p>
                    )}
                </>
              )}
              <label htmlFor="delete-confirm">Type DELETE to confirm</label>
              <input
                id="delete-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
              />
              <div className="flex gap-3">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => {
                    setOpen(false);
                    setPassword("");
                  }}
                >
                  Keep my account
                </button>
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    confirm !== "DELETE" ||
                    plan.circles.some((c) => !choices[c.id]) ||
                    (!plan.demo && !plan.verified && !password)
                  }
                  onClick={remove}
                >
                  {busy ? "Deleting…" : "Permanently delete account"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
