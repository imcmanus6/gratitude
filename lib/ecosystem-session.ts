/**
 * Ecosystem identity — resolve a Gratitude user from a verified handoff.
 *
 * Gratitude keeps its OWN user records (hand-rolled auth), but each user can be
 * linked to the ecosystem's canonical identity (the Via65 Supabase `sub`) via
 * users.canonical_id. When a signed handoff arrives from Briefly (already
 * verified by verifyBrieflyHandoff), this maps the canonical person to a local
 * Gratitude user — reusing an existing account by canonical id or verified
 * email, or creating a federated one — so the caller can mint a session.
 *
 * This is the link-layer half of unified login: no local password is set for a
 * federated account, and the email is trusted because the handoff token is
 * HMAC-signed by Briefly and audience-bound to Gratitude.
 */
import { randomBytes } from "node:crypto";
import { db, id } from "./db";
import type { HandoffClaims } from "./ecosystem";

export interface ResolvedUser {
  userId: string;
  /** true when a brand-new Gratitude account was created for this identity. */
  created: boolean;
  /** true when an existing account was newly linked to the canonical id. */
  linked: boolean;
}

/**
 * Find (or create) the Gratitude user for a canonical identity:
 *   1. already linked (users.canonical_id === sub)      → reuse
 *   2. same verified email, not yet linked              → link + reuse
 *   3. no match                                         → create federated user
 */
export async function resolveGratitudeUser(claims: HandoffClaims): Promise<ResolvedUser> {
  const sub = claims.sub;
  const email = claims.profile?.email?.trim().toLowerCase() || null;
  const name = claims.profile?.name?.trim() || "Friend";

  // 1. Already linked to this canonical identity.
  const byCanonical = (await db
    .prepare("SELECT id FROM users WHERE canonical_id=?")
    .get(sub)) as { id: string } | undefined;
  if (byCanonical) return { userId: byCanonical.id, created: false, linked: false };

  // 2. Same verified email — link the existing account to this canonical id.
  if (email) {
    const byEmail = (await db
      .prepare("SELECT id, canonical_id FROM users WHERE email=?")
      .get(email)) as { id: string; canonical_id: string | null } | undefined;
    if (byEmail) {
      const wasUnlinked = !byEmail.canonical_id;
      if (wasUnlinked) await db.prepare("UPDATE users SET canonical_id=? WHERE id=?").run(sub, byEmail.id);
      return { userId: byEmail.id, created: false, linked: wasUnlinked };
    }
  }

  // 3. New federated account. No usable password: `via65:<rand>` never has the
  // `salt:hash` shape checkPassword expects, so password login can't match it.
  const userId = id();
  const unusable = `via65:${randomBytes(16).toString("hex")}`;
  const emailForRow = email ?? `${userId}@via65.local`;
  await db
    .prepare("INSERT INTO users(id,name,email,password,canonical_id) VALUES(?,?,?,?,?)")
    .run(userId, name, emailForRow, unusable, sub);
  // Via65 already verified the email; mark it so on schemas that track it
  // (Postgres). The legacy SQLite users table has no such column — ignore there.
  try {
    await db.prepare("UPDATE users SET email_verified=1 WHERE id=?").run(userId);
  } catch {
    /* column absent (test/legacy schema) — federated accounts are verified anyway */
  }
  return { userId, created: true, linked: true };
}
