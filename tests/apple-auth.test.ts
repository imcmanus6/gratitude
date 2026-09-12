import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateKeyPair, exportPKCS8, SignJWT, jwtVerify } from "jose";

test("Apple verifies signed identities and client secrets, preserves relay identities and binds form-post receipts", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-apple-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  const signing = await generateKeyPair("ES256");
  process.env.APPLE_SERVICES_ID = "net.example.gratitude.web";
  process.env.APPLE_TEAM_ID = "TESTTEAM01";
  process.env.APPLE_KEY_ID = "TESTKEY001";
  process.env.APPLE_PRIVATE_KEY = await exportPKCS8(signing.privateKey);
  const { appleClientSecret, verifyAppleToken, appleDisplayName } =
    await import("../lib/apple-auth");
  const { providerEnabled, beginAttempt, consumeAttempt, resolveIdentity } =
    await import("../lib/social-auth");
  const { saveAppleReceipt, takeAppleReceipt } =
    await import("../lib/apple-receipt");
  const { db } = await import("../lib/db");
  try {
    process.env.AUTH_ORIGIN = "http://localhost:3005";
    assert.equal(providerEnabled("apple"), false);
    process.env.AUTH_ORIGIN = "https://127.0.0.1";
    assert.equal(providerEnabled("apple"), false);
    process.env.AUTH_ORIGIN = "https://gratitude.example";
    assert.equal(providerEnabled("apple"), true);
    const secret = await appleClientSecret();
    const verified = await jwtVerify(secret, signing.publicKey, {
      algorithms: ["ES256"],
      issuer: "TESTTEAM01",
      audience: "https://appleid.apple.com",
    });
    assert.equal(verified.protectedHeader.kid, "TESTKEY001");
    assert.equal(verified.payload.sub, "net.example.gratitude.web");
    assert.ok(verified.payload.exp! - verified.payload.iat! <= 300);
    const flow = await beginAttempt("apple", "/?invite=family-link");
    const url = new URL(flow.url);
    assert.equal(url.origin, "https://appleid.apple.com");
    assert.equal(url.searchParams.get("response_mode"), "form_post");
    assert.equal(url.searchParams.get("scope"), "name email");
    const state = url.searchParams.get("state")!,
      nonce = url.searchParams.get("nonce")!;
    await assert.rejects(
      async () =>
        await saveAppleReceipt(
          { state, code: "one-use-code" },
          "wrong-browser",
        ),
      /expired/,
    );
    const receipt = await saveAppleReceipt(
      {
        state,
        code: "one-use-code",
        user: JSON.stringify({
          name: { firstName: "Alex", lastName: "Friend" },
        }),
      },
      flow.browser,
    );
    assert.ok(!receipt.includes("one-use-code"));
    await assert.rejects(
      async () => await takeAppleReceipt(receipt, "wrong-browser"),
      /expired/,
    );
    const response = await takeAppleReceipt(receipt, flow.browser);
    assert.equal(response.code, "one-use-code");
    await assert.rejects(
      async () => await takeAppleReceipt(receipt, flow.browser),
      /expired/,
    );
    const attempt = await consumeAttempt("apple", response.state, flow.browser);
    assert.equal(attempt.return_path, "/?invite=family-link");
    const appleKeys = await generateKeyPair("RS256");
    const keys = async () => appleKeys.publicKey;
    const token = await new SignJWT({
      nonce,
      email: "hidden@privaterelay.appleid.com",
      email_verified: "true",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("stable-apple-user")
      .setIssuer("https://appleid.apple.com")
      .setAudience("net.example.gratitude.web")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(appleKeys.privateKey);
    const identity = await verifyAppleToken(
      token,
      "net.example.gratitude.web",
      nonce,
      keys,
    );
    assert.equal(identity.email, "hidden@privaterelay.appleid.com");
    await assert.rejects(verifyAppleToken(token, "other-app", nonce, keys));
    await assert.rejects(
      verifyAppleToken(token, "net.example.gratitude.web", "wrong-nonce", keys),
    );
    const impostor = await generateKeyPair("RS256");
    await assert.rejects(
      verifyAppleToken(
        token,
        "net.example.gratitude.web",
        nonce,
        async () => impostor.publicKey,
      ),
    );
    const expired = await new SignJWT({ nonce })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("user")
      .setIssuer("https://appleid.apple.com")
      .setAudience("net.example.gratitude.web")
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(appleKeys.privateKey);
    await assert.rejects(
      verifyAppleToken(expired, "net.example.gratitude.web", nonce, keys),
    );
    const name = appleDisplayName(response.user);
    assert.equal(name, "Alex Friend");
    const user = await resolveIdentity("apple", { ...identity, name });
    assert.equal(
      await resolveIdentity("apple", {
        subject: identity.subject,
        name: appleDisplayName(undefined),
      }),
      user,
    );
    assert.equal(
      (
        (await db.prepare("SELECT name FROM users WHERE id=?").get(user)) as {
          name: string;
        }
      ).name,
      "Alex Friend",
    );
    assert.equal(appleDisplayName("{invalid"), "New friend");
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
