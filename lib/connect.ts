import { createHash, randomBytes } from "node:crypto";
import { db, id, now } from "./db";

/**
 * Partner "Connect" flow (Briefly first): the signed-in user consents on
 * /connect, we hand the partner a one-time code, and its server swaps the code
 * for an API key (x-api-key) scoped to that user.
 */
export const CONNECT_CLIENTS: Record<string, { name: string }> = {
  briefly: { name: "Briefly" },
};

const DEFAULT_REDIRECT_HOSTS = [
  "briefly.so",
  "app.briefly.so",
  "api.briefly.so",
];

export function isAllowedRedirect(redirectUri: string) {
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1")
    return (
      process.env.NODE_ENV !== "production" ||
      process.env.CONNECT_ALLOW_LOCALHOST === "1"
    );
  if (url.protocol !== "https:") return false;
  const extra = (process.env.CONNECT_REDIRECT_HOSTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_REDIRECT_HOSTS, ...extra].some(
    (h) => host === h || host.endsWith(`.${h}`),
  );
}

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function createConnectCode(
  userId: string,
  client: string,
  redirectUri: string,
) {
  const code = `gc_${randomBytes(24).toString("base64url")}`;
  await db
    .prepare(
      "INSERT INTO connect_codes(code_hash,user_id,client,redirect_uri,expires) VALUES(?,?,?,?,?)",
    )
    .run(sha256(code), userId, client, redirectUri, Date.now() + 5 * 60000);
  return code;
}

/** Consumes the code (single use) and returns the owning user id, or null. */
export async function consumeConnectCode(code: string, client: string) {
  const hash = sha256(code);
  const row = (await db
    .prepare(
      "SELECT user_id,expires FROM connect_codes WHERE code_hash=? AND client=?",
    )
    .get(hash, client)) as { user_id: string; expires: number } | undefined;
  await db.prepare("DELETE FROM connect_codes WHERE code_hash=?").run(hash);
  await db.prepare("DELETE FROM connect_codes WHERE expires<?").run(Date.now());
  if (!row || Number(row.expires) < Date.now()) return null;
  return row.user_id;
}

export async function mintApiKey(userId: string, name: string) {
  const key = `gk_${randomBytes(32).toString("base64url")}`;
  await db
    .prepare(
      "INSERT INTO api_keys(id,user_id,name,key_prefix,key_hash,created) VALUES(?,?,?,?,?,?)",
    )
    .run(id(), userId, name, key.slice(0, 7), sha256(key), now());
  return key;
}

/** Resolves the user behind an `x-api-key` header; throws a sign-in error otherwise. */
export async function apiKeyUser(request: Request) {
  const key = request.headers.get("x-api-key")?.trim();
  if (!key) throw new Error("Please sign in to continue.");
  const hash = sha256(key);
  const user = (await db
    .prepare(
      "SELECT u.id,u.name,u.email,u.demo FROM api_keys k JOIN users u ON u.id=k.user_id WHERE k.key_hash=? AND k.revoked IS NULL",
    )
    .get(hash)) as
    { id: string; name: string; email: string; demo: number } | undefined;
  if (!user) throw new Error("Please sign in to continue.");
  void db
    .prepare("UPDATE api_keys SET last_used=? WHERE key_hash=?")
    .run(now(), hash)
    .catch(() => {});
  return user;
}
