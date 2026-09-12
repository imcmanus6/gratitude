"use client";
import { useEffect, useState } from "react";

// Apple is paused until developer enrolment; keep its implementation for later.
const visibleProviders: ("apple" | "google")[] = [
  // "apple",
  "google",
];

export function SocialLogin({
  link = false,
  demo = false,
}: {
  link?: boolean;
  demo?: boolean;
}) {
  const [providers, setProviders] = useState<{
    apple: boolean;
    google: boolean;
    linked: string[];
  } | null>(null);
  const [returnPath, setReturnPath] = useState("/");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    let current = true;
    fetch("/api/auth/providers")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((value) => {
        if (current) setProviders(value);
      })
      .catch(() => {
        if (current)
          setProviders({
            apple: false,
            google: false,
            linked: [],
          });
      });
    const invite = new URLSearchParams(window.location.search).get("invite");
    setReturnPath(invite ? `/?invite=${encodeURIComponent(invite)}` : "/");
    return () => {
      current = false;
    };
  }, []);
  return (
    <div className="social-options">
      {visibleProviders.map((provider) => {
        const linked = providers?.linked.includes(provider);
        const enabled = !!providers?.[provider] && !demo;
        const name =
          provider === "google"
            ? "Google"
            : provider === "apple"
              ? "Apple"
              : "Facebook";
        return (
          <form
            action={`/api/auth/social/${provider}/start`}
            method="post"
            key={provider}
            onSubmit={() => setSubmitting(true)}
          >
            <input
              type="hidden"
              name="intent"
              value={link ? "link" : "login"}
            />
            <input type="hidden" name="returnPath" value={returnPath} />
            <button
              className={`social-button ${provider}`}
              type="submit"
              disabled={!enabled || linked || submitting}
            >
              {provider === "apple" ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M17.05 12.54c.03 3.27 2.87 4.35 2.9 4.36-.02.08-.45 1.56-1.49 3.09-.9 1.32-1.83 2.63-3.3 2.66-1.44.03-1.91-.86-3.56-.86-1.64 0-2.16.83-3.53.89-1.42.05-2.5-1.43-3.41-2.74C2.8 17.25 1.4 12.31 3.3 8.98a5.28 5.28 0 0 1 4.47-2.71c1.4-.03 2.72.95 3.57.95.85 0 2.45-1.17 4.13-1a5.03 5.03 0 0 1 3.96 2.15c-.1.06-2.41 1.4-2.38 4.17ZM14.34 4.43C15.09 3.51 15.6 2.22 15.46.94c-1.08.04-2.39.72-3.17 1.64-.7.81-1.32 2.11-1.15 3.36 1.2.1 2.43-.62 3.2-1.51Z"
                  />
                </svg>
              ) : (
                <img src="/brand/google-g.png" width="20" height="20" alt="" />
              )}
              <span>
                {linked
                  ? `${name} connected`
                  : link
                    ? `Connect ${name}`
                    : `Continue with ${name}`}
              </span>
            </button>
          </form>
        );
      })}
      {providers && !providers.google && (
        <p className="field-help text-center">
          Social sign-in is coming soon.{" "}
          {link
            ? "Your existing sign-in still works."
            : "You can continue with email today."}
        </p>
      )}
      {demo && link && (
        <p className="field-help">
          Create your own account to connect Google.
        </p>
      )}
      {!link && (
        <p className="social-note">
          An easier way in. Sharing is always your choice.
        </p>
      )}
    </div>
  );
}
