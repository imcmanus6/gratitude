"use client";
import { FormEvent, useEffect, useState } from "react";
import { NaiLockup } from "@/components/nai-lockup";

const CLIENT_NAMES: Record<string, string> = { briefly: "Briefly" };

async function post(url: string, data: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

/**
 * Partner consent page: /connect?client=briefly&redirect_uri=...&state=...
 * Sign in (or sign up) if needed, then "Allow" hands a one-time code back to
 * the partner's redirect_uri. Opened in a small popup by the partner app.
 */
export default function ConnectPage() {
  const [params, setParams] = useState<{
    client: string;
    redirectUri: string;
    state: string;
  } | null>(null);
  const [account, setAccount] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    setParams({
      client: url.searchParams.get("client") || "",
      redirectUri: url.searchParams.get("redirect_uri") || "",
      state: url.searchParams.get("state") || "",
    });
    fetch("/api/state")
      .then(async (r) => {
        if (!r.ok) return null;
        const s = await r.json();
        return s?.user ? { name: s.user.name, email: s.user.email } : null;
      })
      .catch(() => null)
      .then((u) => {
        setAccount(u);
        setChecked(true);
      });
  }, []);

  const clientName = params ? CLIENT_NAMES[params.client] : undefined;

  async function auth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await post("/api/auth", {
        action: mode,
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      });
      if (result.verificationRequired) {
        setNotice(
          "Please confirm your email (check your inbox), then sign in here to continue.",
        );
        setMode("login");
        return;
      }
      const s = await (await fetch("/api/state")).json();
      setAccount({ name: s.user.name, email: s.user.email });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function allow() {
    if (!params) return;
    setBusy(true);
    setError("");
    try {
      const { redirect } = await post("/api/v1/connect/authorize", {
        client: params.client,
        redirect_uri: params.redirectUri,
        state: params.state,
      });
      window.location.assign(redirect);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function cancel() {
    if (!params?.redirectUri) return window.close();
    try {
      const url = new URL(params.redirectUri);
      url.searchParams.set("error", "access_denied");
      if (params.state) url.searchParams.set("state", params.state);
      window.location.assign(url.toString());
    } catch {
      window.close();
    }
  }

  async function switchAccount() {
    await post("/api/auth", { action: "logout" }).catch(() => {});
    setAccount(null);
  }

  return (
    <main
      className="auth"
      style={{ maxWidth: 440, margin: "40px auto", padding: 24 }}
    >
      <NaiLockup variant="dark" size="sm" />
      {!params || !checked ? (
        <p className="mt-6">Loading…</p>
      ) : !clientName || !params.redirectUri ? (
        <>
          <h1 className="serif mt-6">Connection request not recognised</h1>
          <p>
            This link is missing the app details. Please try again from the app.
          </p>
        </>
      ) : !account ? (
        <>
          <div className="eyebrow mt-6">
            CONNECT TO {clientName.toUpperCase()}
          </div>
          <h1 className="serif">
            {mode === "signup"
              ? "Create your Gratitude account"
              : "Sign in to Gratitude"}
          </h1>
          <p>
            {clientName} would like to save gratitude entries to your Gratitude
            journal. Sign in or create a free account to continue.
          </p>
          <form onSubmit={auth}>
            {mode === "signup" && (
              <>
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  required
                  maxLength={60}
                  autoComplete="name"
                />
              </>
            )}
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 10 : 1}
              maxLength={128}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
            {notice && <p className="mt-2">{notice}</p>}
            {error && (
              <p className="mt-2" style={{ color: "#a33" }}>
                {error}
              </p>
            )}
            <button className="button primary mt-4" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
          <p className="mt-4">
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <button
              type="button"
              className="link"
              style={{
                background: "none",
                border: 0,
                padding: 0,
                color: "inherit",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create a free account"}
            </button>
          </p>
          <p className="mt-2">
            <button
              type="button"
              className="link"
              style={{
                background: "none",
                border: 0,
                padding: 0,
                color: "inherit",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
              onClick={cancel}
            >
              Cancel
            </button>
          </p>
        </>
      ) : (
        <>
          <div className="eyebrow mt-6">
            CONNECT TO {clientName.toUpperCase()}
          </div>
          <h1 className="serif">
            Allow {clientName} to use your Gratitude journal?
          </h1>
          <p>
            Signed in as <strong>{account.name}</strong> ({account.email}).{" "}
            <button
              type="button"
              className="link"
              style={{
                background: "none",
                border: 0,
                padding: 0,
                color: "inherit",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
              onClick={switchAccount}
            >
              Not you?
            </button>
          </p>
          <ul>
            <li>Write new gratitude entries (private, or to your circles)</li>
            <li>See your recent entries and circles</li>
          </ul>
          <p>
            {clientName} never sees your password. You can disconnect at any
            time from {clientName}.
          </p>
          {error && (
            <p className="mt-2" style={{ color: "#a33" }}>
              {error}
            </p>
          )}
          <div className="mt-4" style={{ display: "flex", gap: 12 }}>
            <button className="button primary" onClick={allow} disabled={busy}>
              {busy ? "Connecting…" : "Allow"}
            </button>
            <button className="button" onClick={cancel} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      )}
    </main>
  );
}
