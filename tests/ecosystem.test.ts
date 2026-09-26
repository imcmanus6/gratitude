import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { verifyBrieflyHandoff } from "../lib/ecosystem.ts";

const SECRET = "shared-ecosystem-secret";
const SUB = "33333333-3333-3333-3333-333333333333";

const b64url = (o: unknown) => {
  const buf = Buffer.isBuffer(o) ? o : Buffer.from(typeof o === "string" ? o : JSON.stringify(o));
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Mirror Briefly's signHandoff so this proves cross-repo token compatibility.
function mintBrieflyHandoff(claims: Record<string, unknown>, secret = SECRET) {
  const header = b64url({ alg: "HS256", typ: "HANDOFF" });
  const payload = b64url(claims);
  const sig = b64url(createHmac("sha256", secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

const future = () => Math.floor(Date.now() / 1000) + 120;

test("verifies a valid Briefly handoff addressed to gratitude", () => {
  const tok = mintBrieflyHandoff({ sub: SUB, aud: "gratitude", src: "briefly", iat: 1, exp: future() });
  const c = verifyBrieflyHandoff(tok, SECRET, "gratitude");
  assert.equal(c?.sub, SUB);
  assert.equal(c?.src, "briefly");
});

test("rejects a token minted for a different app (audience)", () => {
  const tok = mintBrieflyHandoff({ sub: SUB, aud: "meditation", exp: future() });
  assert.equal(verifyBrieflyHandoff(tok, SECRET, "gratitude"), null);
});

test("rejects wrong secret, expiry and tampering", () => {
  assert.equal(verifyBrieflyHandoff(mintBrieflyHandoff({ sub: SUB, aud: "gratitude", exp: future() }, "other"), SECRET, "gratitude"), null);
  assert.equal(verifyBrieflyHandoff(mintBrieflyHandoff({ sub: SUB, aud: "gratitude", exp: 1 }), SECRET, "gratitude"), null);
  const good = mintBrieflyHandoff({ sub: SUB, aud: "gratitude", exp: future() });
  const [h, , s] = good.split(".");
  const forged = b64url({ sub: "attacker", aud: "gratitude", exp: future() });
  assert.equal(verifyBrieflyHandoff(`${h}.${forged}.${s}`, SECRET, "gratitude"), null);
});

test("malformed tokens return null", () => {
  assert.equal(verifyBrieflyHandoff("x.y", SECRET, "gratitude"), null);
  assert.equal(verifyBrieflyHandoff("", SECRET, "gratitude"), null);
});
