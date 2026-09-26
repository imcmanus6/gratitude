/**
 * Ecosystem identity — Gratitude's inbound side of the shared-login system.
 *
 * When a user is handed from another app (e.g. Briefly) via a universal/deep
 * link, they arrive with a short-lived, HMAC-signed handoff token minted by
 * Briefly's Identity API (POST /api/id/handoff). This verifies that token so
 * Gratitude can recognise the SAME canonical person (Supabase `sub`) without a
 * fresh login. Must mirror Briefly's signHandoff exactly (HS256 over
 * `header.payload`, base64url, typ:"HANDOFF").
 *
 * Full federation (issuing Gratitude sessions from Supabase Auth, linking
 * users.canonical_id = sub, emitting gratitude.completed) is the larger cutover
 * documented in the Morning-space contract brief — this is the safe first block.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface HandoffClaims {
  sub: string;
  aud: string;
  act?: string;
  src?: string;
  profile?: { email?: string; name?: string; hub_id?: string };
  iat: number;
  exp: number;
}

const fromB64url = (s: string): Buffer =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const b64url = (buf: Buffer): string =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** The shared handoff secret. Must equal Briefly's ECOSYSTEM_HANDOFF_SECRET. */
export function ecosystemHandoffSecret(): string {
  const s = process.env.ECOSYSTEM_HANDOFF_SECRET?.trim();
  if (!s) throw new Error("ECOSYSTEM_HANDOFF_SECRET is not configured");
  return s;
}

/**
 * Verify a Briefly-minted handoff token addressed to Gratitude. Returns the
 * claims if the signature is valid, unexpired, and aud === expectedAud; else null.
 */
export function verifyBrieflyHandoff(
  token: string,
  secret: string = ecosystemHandoffSecret(),
  expectedAud = "gratitude",
): HandoffClaims | null {
  if (!secret || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = b64url(createHmac("sha256", secret).update(`${header}.${payload}`).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let claims: HandoffClaims;
  try {
    claims = JSON.parse(fromB64url(payload).toString("utf8")) as HandoffClaims;
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp < now) return null;
  if (!claims.sub || claims.aud !== expectedAud) return null;
  return claims;
}
