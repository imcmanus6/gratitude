import { createHash, createHmac, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { db, id } from "./db";
import {
  appleCredentials,
  appleClientSecret,
  verifyAppleToken,
  appleDisplayName,
} from "./apple-auth";
import { isIP } from "node:net";

export type Provider = "google" | "facebook" | "apple";
export type Identity = { subject: string; name: string; email?: string };
export class SocialAuthError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export function providerName(value: string): Provider {
  if (value !== "google" && value !== "apple")
    throw new SocialAuthError("unavailable");
  return value;
}
export function authConfig(provider: Provider) {
  const clientId =
    process.env[
      provider === "google"
        ? "GOOGLE_CLIENT_ID"
        : provider === "apple"
          ? "APPLE_SERVICES_ID"
          : "FACEBOOK_APP_ID"
    ];
  const secret =
    process.env[
      provider === "google" ? "GOOGLE_CLIENT_SECRET" : "FACEBOOK_APP_SECRET"
    ];
  const raw = process.env.AUTH_ORIGIN;
  if (!clientId || (provider !== "apple" && !secret) || !raw)
    throw new SocialAuthError("unavailable");
  let origin: URL;
  try {
    origin = new URL(raw);
  } catch {
    throw new SocialAuthError("unavailable");
  }
  if (
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== "/" ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(origin.hostname)
      ))
  )
    throw new SocialAuthError("unavailable");
  if (provider === "apple") {
    if (
      origin.protocol !== "https:" ||
      origin.hostname === "localhost" ||
      origin.hostname.endsWith(".localhost") ||
      isIP(origin.hostname.replace(/^\[|\]$/g, ""))
    )
      throw new SocialAuthError("unavailable");
    try {
      appleCredentials();
    } catch {
      throw new SocialAuthError("unavailable");
    }
  }
  // Explicitly configured so it can match the Meta app's supported Graph API version.
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION;
  if (
    provider === "facebook" &&
    (!graphVersion || !/^v\d+\.\d+$/.test(graphVersion))
  )
    throw new SocialAuthError("unavailable");
  return {
    clientId,
    secret: secret || "",
    origin: origin.origin,
    redirectUri: `${origin.origin}/api/auth/social/${provider}/callback`,
    graphVersion,
  };
}
export function providerEnabled(provider: Provider) {
  try {
    authConfig(provider);
    return true;
  } catch {
    return false;
  }
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string") return "/";
  // Only preserve the existing invitation deep-link; arbitrary redirects are never accepted.
  try {
    const url = new URL(value, "https://gratitude.invalid");
    if (url.origin !== "https://gratitude.invalid" || url.pathname !== "/")
      return "/";
    const invite = url.searchParams.get("invite");
    return invite && /^[a-zA-Z0-9-]{1,100}$/.test(invite)
      ? `/?invite=${encodeURIComponent(invite)}`
      : "/";
  } catch {
    return "/";
  }
}
export async function beginAttempt(
  provider: Provider,
  returnPath: string,
  linkUser?: string,
  intent = "login",
) {
  const config = authConfig(provider);
  const state = randomBytes(32).toString("base64url"),
    browser = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url"),
    nonce = randomBytes(32).toString("base64url");
  await db
    .prepare("DELETE FROM oauth_attempts WHERE expires<?")
    .run(Date.now());
  await db
    .prepare(
      "INSERT INTO oauth_attempts(state_hash,browser_hash,provider,verifier,nonce,return_path,link_user,expires,intent) VALUES(?,?,?,?,?,?,?,?,?)",
    )
    .run(
      digest(state),
      digest(browser),
      provider,
      verifier,
      nonce,
      safeReturnPath(returnPath),
      linkUser || null,
      Date.now() + 600000,
      intent,
    );
  const url = new URL(
    provider === "google"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : provider === "apple"
        ? "https://appleid.apple.com/auth/authorize"
        : `https://www.facebook.com/${config.graphVersion}/dialog/oauth`,
  );
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set(
    "scope",
    provider === "google"
      ? "openid email profile"
      : provider === "apple"
        ? "name email"
        : "public_profile,email",
  );
  if (provider === "apple") {
    url.searchParams.set("nonce", nonce);
    url.searchParams.set("response_mode", "form_post");
  }
  if (provider === "google") {
    url.searchParams.set("nonce", nonce);
    url.searchParams.set(
      "code_challenge",
      createHash("sha256").update(verifier).digest("base64url"),
    );
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
  }
  if (intent === "delete") {
    if (provider === "facebook")
      url.searchParams.set("auth_type", "reauthenticate");
    else if (provider === "google") url.searchParams.set("max_age", "0");
  }
  return {
    url: url.toString(),
    browser,
    returnPath: safeReturnPath(returnPath),
  };
}
export type Attempt = {
  verifier: string;
  nonce: string;
  return_path: string;
  link_user: string | null;
  intent?: string;
};
export async function consumeAttempt(
  provider: Provider,
  state: string,
  browser: string,
): Promise<Attempt> {
  if (!state || !browser || state.length > 200 || browser.length > 200)
    throw new SocialAuthError("expired");
  const attempt = await db.transaction(async () => {
    const row = (await db
      .prepare(
        "SELECT verifier,nonce,return_path,link_user,intent FROM oauth_attempts WHERE state_hash=? AND browser_hash=? AND provider=? AND expires>?",
      )
      .get(digest(state), digest(browser), provider, Date.now())) as
      Attempt | undefined;
    if (row)
      await db
        .prepare("DELETE FROM oauth_attempts WHERE state_hash=?")
        .run(digest(state));
    return row;
  })();
  if (!attempt) throw new SocialAuthError("expired");
  return attempt;
}
export async function exchangeIdentity(
  provider: Provider,
  code: string,
  attempt: Attempt,
  appleUser?: string,
): Promise<Identity> {
  const config = authConfig(provider);
  const form = new URLSearchParams({
    client_id: config.clientId,
    client_secret:
      provider === "apple" ? await appleClientSecret() : config.secret,
    redirect_uri: config.redirectUri,
    code,
  });
  if (provider === "apple") form.set("grant_type", "authorization_code");
  if (provider === "google") {
    form.set("grant_type", "authorization_code");
    form.set("code_verifier", attempt.verifier);
  }
  const tokenResponse = await fetch(
    provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : provider === "apple"
        ? "https://appleid.apple.com/auth/token"
        : `https://graph.facebook.com/${config.graphVersion}/oauth/access_token`,
    {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!tokenResponse.ok) throw new SocialAuthError("failed");
  const token = await tokenResponse.json();
  if (provider === "apple") {
    if (typeof token.id_token !== "string") throw new SocialAuthError("failed");
    const identity = await verifyAppleToken(
      token.id_token,
      config.clientId,
      attempt.nonce,
    );
    return { ...identity, name: appleDisplayName(appleUser) };
  }

  if (provider === "google") {
    if (typeof token.id_token !== "string") throw new SocialAuthError("failed");
    const ticket = await new OAuth2Client(config.clientId).verifyIdToken({
      idToken: token.id_token,
      audience: config.clientId,
    });
    const claims = ticket.getPayload();
    if (
      !claims?.sub ||
      (claims as typeof claims & { nonce?: string }).nonce !== attempt.nonce ||
      !claims.email_verified ||
      !claims.email
    )
      throw new SocialAuthError("failed");
    return {
      subject: claims.sub,
      name: claims.name || "New friend",
      email: claims.email,
    };
  }
  if (typeof token.access_token !== "string")
    throw new SocialAuthError("failed");
  const me = new URL(`https://graph.facebook.com/${config.graphVersion}/me`);
  me.searchParams.set("fields", "id,name,email");
  me.searchParams.set(
    "appsecret_proof",
    createHmac("sha256", config.secret)
      .update(token.access_token)
      .digest("hex"),
  );
  const response = await fetch(me, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new SocialAuthError("failed");
  const profile = await response.json();
  if (typeof profile.id !== "string" || typeof profile.name !== "string")
    throw new SocialAuthError("failed");
  return {
    subject: profile.id,
    name: profile.name,
    email: typeof profile.email === "string" ? profile.email : undefined,
  };
}
export async function resolveIdentity(
  provider: Provider,
  identity: Identity,
  linkUser?: string | null,
): Promise<string> {
  if (!identity.subject || identity.subject.length > 255)
    throw new SocialAuthError("failed");
  return await db.transaction(async () => {
    const existing = (await db
      .prepare(
        "SELECT user_id FROM oauth_identities WHERE provider=? AND subject=?",
      )
      .get(provider, identity.subject)) as { user_id: string } | undefined;
    if (existing) {
      if (linkUser && existing.user_id !== linkUser)
        throw new SocialAuthError("already_linked");
      return existing.user_id;
    }
    const email = identity.email?.trim().toLowerCase();
    let userId = linkUser;
    if (userId) {
      if (
        await db
          .prepare(
            "SELECT 1 FROM oauth_identities WHERE user_id=? AND provider=?",
          )
          .get(userId, provider)
      )
        throw new SocialAuthError("already_linked");
    } else {
      // Do not merge by email: an unverified password signup must never acquire a social identity.
      if (
        email &&
        (await db.prepare("SELECT 1 FROM users WHERE email=?").get(email))
      )
        throw new SocialAuthError("email_exists");
      userId = id();
      await db
        .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
        .run(
          userId,
          identity.name.trim().slice(0, 60) || "New friend",
          email || `${provider}-${userId}@identity.invalid`,
          "oauth-only",
        );
    }
    await db
      .prepare(
        "INSERT INTO oauth_identities(provider,subject,user_id) VALUES(?,?,?)",
      )
      .run(provider, identity.subject, userId);
    return userId;
  })();
}
