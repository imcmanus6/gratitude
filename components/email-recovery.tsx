"use client";
import { useState } from "react";
export function EmailRecovery() {
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setAction("forgot");
            setMessage("");
          }}
        >
          Forgot password?
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setAction("resend");
            setMessage("");
          }}
        >
          Resend confirmation
        </button>
      </div>
      {action && (
        <form
          className="mt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get("email");
            setBusy(true);
            setMessage("");
            try {
              const res = await fetch("/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, email }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setMessage(data.message);
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="recovery-email">Your account email</label>
          <input
            id="recovery-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
          />
          <button className="button" disabled={busy}>
            {busy
              ? "One moment…"
              : action === "forgot"
                ? "Send reset link"
                : "Send confirmation email"}
          </button>
          <p className="field-help">
            For email and password accounts. Manage Apple or Google sign-in with
            that provider.
          </p>
          <p role="status">{message}</p>
        </form>
      )}
    </div>
  );
}
