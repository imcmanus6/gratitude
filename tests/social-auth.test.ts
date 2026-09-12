import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("OAuth state is browser-bound, single-use, provider-specific and expiring; accounts never silently merge by email", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-social-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  process.env.AUTH_ORIGIN = "http://localhost:3005";
  process.env.GOOGLE_CLIENT_ID = "test-google-client";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
  process.env.FACEBOOK_APP_ID = "test-facebook-client";
  process.env.FACEBOOK_APP_SECRET = "test-facebook-secret";
  process.env.FACEBOOK_GRAPH_VERSION = "v99.0";
  const {
    beginAttempt,
    consumeAttempt,
    resolveIdentity,
    safeReturnPath,
    digest,
    providerEnabled,
    exchangeIdentity,
  } = await import("../lib/social-auth");
  const { db, id } = await import("../lib/db");
  try {
    assert.equal(providerEnabled("google"), true);
    assert.equal(safeReturnPath("https://evil.example/"), " /".trim());
    assert.equal(safeReturnPath("//evil.example/?invite=abc"), "/");
    assert.equal(safeReturnPath("/?invite=good-code"), "/?invite=good-code");
    const flow = await beginAttempt("google", "/?invite=good-code");
    const url = new URL(flow.url),
      state = url.searchParams.get("state")!;
    assert.equal(url.origin, "https://accounts.google.com");
    assert.equal(url.searchParams.get("scope"), "openid email profile");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    await assert.rejects(
      async () => await consumeAttempt("google", state, "wrong-browser"),
      /expired/,
    );
    await assert.rejects(
      async () => await consumeAttempt("facebook", state, flow.browser),
      /expired/,
    );
    const attempt = await consumeAttempt("google", state, flow.browser);
    assert.equal(attempt.return_path, "/?invite=good-code");
    await assert.rejects(
      async () => await consumeAttempt("google", state, flow.browser),
      /expired/,
    );
    const expired = await beginAttempt("google", "/");
    const expiredState = new URL(expired.url).searchParams.get("state")!;
    await db
      .prepare("UPDATE oauth_attempts SET expires=0 WHERE state_hash=?")
      .run(digest(expiredState));
    await assert.rejects(
      async () => await consumeAttempt("google", expiredState, expired.browser),
      /expired/,
    );
    const owner = id();
    await db
      .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
      .run(owner, "Existing", "owner@example.com", "not-a-hash");
    const identity = {
      subject: "google-123",
      name: "Owner",
      email: "owner@example.com",
    };
    await assert.rejects(
      async () => await resolveIdentity("google", identity),
      /email_exists/,
    );
    assert.equal(await resolveIdentity("google", identity, owner), owner);
    assert.equal(
      await resolveIdentity("google", {
        ...identity,
        email: "changed@example.com",
      }),
      owner,
    );
    const other = id();
    await db
      .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
      .run(other, "Other", "other@example.com", "not-a-hash");
    await assert.rejects(
      async () => await resolveIdentity("google", identity, other),
      /already_linked/,
    );
    const noEmail = await resolveIdentity("facebook", {
      subject: "facebook-123",
      name: "Facebook Friend",
    });
    assert.ok(noEmail);
    assert.equal(
      await resolveIdentity("facebook", {
        subject: "facebook-123",
        name: "Facebook Friend",
      }),
      noEmail,
    );
    const facebook = await beginAttempt("facebook", "/");
    assert.equal(
      new URL(facebook.url).searchParams.get("scope"),
      "public_profile,email",
    );
    // Exercise Facebook's token/profile exchange contract without contacting Meta.
    const originalFetch = globalThis.fetch;
    let call = 0;
    try {
      globalThis.fetch = async (input, init) => {
        call++;
        if (call === 1) {
          assert.equal(init?.method, "POST");
          assert.ok(
            String(init?.body).includes("client_secret=test-facebook-secret"),
          );
          return Response.json({ access_token: "provider-token" });
        }
        assert.ok(String(input).includes("/me?"));
        assert.equal(
          (init?.headers as Record<string, string>).Authorization,
          "Bearer provider-token",
        );
        return Response.json({ id: "fb-subject", name: "Member" });
      };
      assert.deepEqual(await exchangeIdentity("facebook", "code", attempt), {
        subject: "fb-subject",
        name: "Member",
        email: undefined,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
