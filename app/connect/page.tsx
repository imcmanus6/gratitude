"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Streamlined sign-up / sign-in page designed to be embedded (iframe) by a
 * partner such as Briefly: /connect?client=briefly&redirect_uri=…&state=…
 * On success the browser is sent to redirect_uri with a short-lived code.
 */
const CLIENTS: Record<string, string> = { briefly: "Briefly" };

function Connect() {
  const params = useSearchParams();
  const client = params.get("client") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const state = params.get("state") || "";
  const clientName = CLIENTS[client];
  const [mode, setMode] = useState<"signup" | "signin">(
    params.get("mode") === "signin" ? "signin" : "signup",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(true);
  const [google, setGoogle] = useState(false);
  const [framed, setFramed] = useState(false);
  const [googleTab, setGoogleTab] = useState(false);
  const returnPath = `/connect?${new URLSearchParams({ client, redirect_uri: redirectUri, ...(state ? { state } : {}) })}`;

  const authorize = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/v1/connect/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client,
        redirect_uri: redirectUri,
        state,
        ...body,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data as { redirect?: string; verificationRequired?: boolean };
  };

  useEffect(() => {
    setFramed(window.top !== window);
    if (params.get("auth_error"))
      setError("Google sign-in didn't complete. Please try again or use email.");
    if (!clientName || !redirectUri) {
      setChecking(false);
      return;
    }
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setGoogle(!!p?.google))
      .catch(() => {});
    authorize({})
      .then((d) => {
        if (d.redirect) location.assign(d.redirect);
        else setChecking(false);
      })
      .catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!clientName || !redirectUri)
    return (
      <main className="connect">
        <h1 className="serif">Gratitude Circles</h1>
        <p className="error">
          This connection link is missing or invalid. Please start again from
          the app you came from.
        </p>
      </main>
    );

  return (
    <main className="connect">
      <p className="connect-kicker">Connect to {clientName}</p>
      <h1 className="serif">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="connect-sub">
        {clientName} will be able to read and add your gratitude entries. You
        can disconnect at any time.
      </p>
      <div className="connect-tabs" role="tablist">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={mode === m ? "active" : ""}
            onClick={() => {
              setMode(m);
              setError("");
              setNotice("");
            }}
          >
            {m === "signup" ? "Sign up" : "Sign in"}
          </button>
        ))}
      </div>
      {google && !notice && (
        <form
          className="connect-social"
          action="/api/auth/social/google/start"
          method="post"
          target={framed ? "_blank" : undefined}
          onSubmit={() => framed && setGoogleTab(true)}
        >
          <input type="hidden" name="intent" value="login" />
          <input type="hidden" name="returnPath" value={returnPath} />
          <button className="social-button google" type="submit" disabled={checking}>
            <img src="/brand/google-g.png" width="20" height="20" alt="" />
            <span>Continue with Google</span>
          </button>
          {googleTab && (
            <p className="connect-hint" role="status">
              Finish with Google in the new tab — {clientName} will update here
              automatically.
            </p>
          )}
          <div className="auth-divider">or use email</div>
        </form>
      )}
      {notice ? (
        <div className="connect-notice" role="status">
          <p>{notice}</p>
          <button
            type="button"
            className="button primary"
            onClick={() => {
              setMode("signin");
              setNotice("");
            }}
          >
            I&apos;ve confirmed — sign in
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              const d = await authorize({
                mode,
                name: form.get("name") || undefined,
                email: form.get("email"),
                password: form.get("password"),
              });
              if (d.redirect) {
                location.assign(d.redirect);
                return;
              }
              if (d.verificationRequired)
                setNotice(
                  mode === "signup"
                    ? "Check your inbox and tap the confirmation link, then come back here to finish connecting."
                    : "Please confirm your email first — we sent you a link when you signed up.",
                );
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "signup" && (
            <>
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={60}
                disabled={checking}
              />
            </>
          )}
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            disabled={checking}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? 10 : 1}
            maxLength={128}
            disabled={checking}
          />
          {mode === "signup" && (
            <p className="connect-hint">At least 10 characters.</p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy || checking}>
            {checking
              ? "One moment…"
              : busy
                ? "Connecting…"
                : mode === "signup"
                  ? "Create account & connect"
                  : "Sign in & connect"}
          </button>
        </form>
      )}
      <p className="connect-foot">
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <button
          type="button"
          className="text-button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<main className="connect" />}>
      <Connect />
    </Suspense>
  );
}
