import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { HandoffClaims } from "../lib/ecosystem";

const claims = (over: Partial<HandoffClaims> & { sub: string }): HandoffClaims => ({
  aud: "gratitude",
  iat: 1,
  exp: Math.floor(Date.now() / 1000) + 120,
  ...over,
});

test("resolveGratitudeUser: create, link-by-email, then reuse-by-canonical", async () => {
  process.env.GRATITUDE_DATA_DIR = mkdtempSync(path.join(tmpdir(), "gratitude-eco-"));
  const { db, id } = await import("../lib/db");
  const { resolveGratitudeUser } = await import("../lib/ecosystem-session");

  const SUB = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  // 1. Unknown identity → a federated account is created and linked.
  const first = await resolveGratitudeUser(claims({ sub: SUB, profile: { email: "eco@example.invalid", name: "Eco" } }));
  assert.equal(first.created, true);
  assert.equal(first.linked, true);
  const row = (await db.prepare("SELECT canonical_id, name FROM users WHERE id=?").get(first.userId)) as
    | { canonical_id: string; name: string }
    | undefined;
  assert.equal(row?.canonical_id, SUB);
  assert.equal(row?.name, "Eco");

  // 2. Same canonical id again → reuse, no new account, no re-link.
  const again = await resolveGratitudeUser(claims({ sub: SUB, profile: { email: "eco@example.invalid" } }));
  assert.equal(again.userId, first.userId);
  assert.equal(again.created, false);
  assert.equal(again.linked, false);

  // 3. A pre-existing local account with a matching email but no canonical id
  //    gets linked (not duplicated) when its person arrives via handoff.
  const localId = id();
  await db
    .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
    .run(localId, "Local", "local@example.invalid", "salt:hash");
  const OTHER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const linked = await resolveGratitudeUser(claims({ sub: OTHER, profile: { email: "local@example.invalid" } }));
  assert.equal(linked.userId, localId);
  assert.equal(linked.created, false);
  assert.equal(linked.linked, true);
  const relinked = (await db.prepare("SELECT canonical_id FROM users WHERE id=?").get(localId)) as
    | { canonical_id: string }
    | undefined;
  assert.equal(relinked?.canonical_id, OTHER);
});
