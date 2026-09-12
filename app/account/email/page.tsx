"use client";
import { useEffect, useState } from "react";
export default function EmailLink() {
  const [token, setToken] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    setToken(params.get("token") || "");
    setPurpose(params.get("purpose") || "");
    history.replaceState({}, "", location.pathname);
  }, []);
  return (
    <main
      className="auth"
      style={{ maxWidth: 440, margin: "60px auto", padding: 24 }}
    >
      <h1 className="serif">
        {purpose === "reset" ? "Choose a new password" : "Confirm your email"}
      </h1>
      {!done && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (
              purpose === "reset" &&
              form.get("password") !== form.get("confirm")
            ) {
              setMessage("Your passwords don't match.");
              return;
            }
            setBusy(true);
            setMessage("");
            try {
              const res = await fetch("/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: purpose,
                  token,
                  password: form.get("password"),
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setDone(true);
              setToken("");
              setMessage(
                purpose === "reset"
                  ? "Password updated. Please sign in with your new password."
                  : "Email confirmed. You can now sign in.",
              );
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {purpose === "reset" && (
            <>
              <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={128}
              />
              <label htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={128}
              />
            </>
          )}
          <button
            className="button primary"
            disabled={busy || !token || !["verify", "reset"].includes(purpose)}
          >
            {busy
              ? "One moment…"
              : purpose === "reset"
                ? "Save new password"
                : "Confirm email"}
          </button>
        </form>
      )}
      <p role="status" className="mt-4">
        {message ||
          (!token && !done
            ? "Open the link in your confirmation or reset email."
            : "")}
      </p>
      <a className="button mt-4" href="/?signin=1">
        Back to sign in
      </a>
    </main>
  );
}
