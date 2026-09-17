import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { db, now } from "./db";

/**
 * Partner "connect" hand-off (used by Briefly's embedded sign-up): the user
 * signs in on /connect, we mint an API key, wrap it in a short-lived encrypted
 * code and send the browser back to the partner's redirect_uri. The partner
 * then exchanges the code server-to-server for the key and calls /api/v1/*
 * with an `x-api-key` header.
 */

export const KNOWN_CLIENTS: Record<string, { name: string }> = {
  briefly: { name: "Briefly" },
};

const DEFAULT_REDIRECT_ORIGINS = [
  "https://api.brief-ly.com",
  "https://app.briefly.so",
];

export function isAllowedRedirect(redirectUri: string) {
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    return false;
  }
  if (
    process.env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  )
    return true;
  const env = (process.env.CONNECT_REDIRECT_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (env.length ? env : DEFAULT_REDIRECT_ORIGINS).includes(url.origin);
}

function codeKey() {
  const secret =
    process.env.CONNECT_CODE_SECRET || process.env.SUPABASE_DATABASE_URL;
  if (!secret) throw new Error("Partner connections are not configured.");
  return createHash("sha256").update(secret).digest();
}

export interface ConnectCodePayload {
  apiKey: string;
  client: string;
  userId: string;
  email: string;
  name: string;
  exp: number;
}

export function encodeConnectCode(payload: ConnectCodePayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", codeKey(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function decodeConnectCode(code: string): ConnectCodePayload | null {
  try {
    const buf = Buffer.from(code, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", codeKey(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([
      decipher.update(buf.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(json) as ConnectCodePayload;
    if (typeof payload.apiKey !== "string" || payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

const hashKey = (key: string) =>
  createHash("sha256").update(key).digest("hex");

export async function mintApiKey(userId: string, name: string) {
  const key = `grt_${randomBytes(32).toString("base64url")}`;
  await db
    .prepare("INSERT INTO api_keys(hash,user_id,name,created) VALUES(?,?,?,?)")
    .run(hashKey(key), userId, name, Date.now());
  return key;
}

/** Resolve the user behind an `x-api-key` header, or undefined. */
export async function apiKeyUser(request: Request) {
  const key = request.headers.get("x-api-key")?.trim();
  if (!key) return undefined;
  const hash = hashKey(key);
  const user = (await db
    .prepare(
      "SELECT u.id,u.name,u.email,u.demo FROM users u JOIN api_keys k ON k.user_id=u.id WHERE k.hash=?",
    )
    .get(hash)) as
    | { id: string; name: string; email: string; demo: number }
    | undefined;
  if (user)
    void db
      .prepare("UPDATE api_keys SET last_used=? WHERE hash=?")
      .run(Date.now(), hash)
      .catch(() => {});
  return user;
}

export async function requireApiKeyUser(request: Request) {
  const user = await apiKeyUser(request);
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}

export { now };
