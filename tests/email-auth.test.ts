import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
test("email confirmation and reset links expire, are single use, and revoke sessions", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-email-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  process.env.AUTH_ORIGIN = "http://localhost:3005";
  process.env.RESEND_API_KEY = "test-only";
  process.env.AUTH_EMAIL_FROM = "test@example.invalid";
  const { db, hashPassword, checkPassword } = await import("../lib/db");
  const { sendAccountEmail, consumeEmailToken, emailRateLimit } =
    await import("../lib/email-auth");
  const original = globalThis.fetch;
  let token = "";
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options!.body as string);
    const link = body.text
      .split("\n")
      .find((line: string) => line.startsWith("http"));
    token = new URLSearchParams(new URL(link).hash.slice(1)).get("token")!;
    return new Response(JSON.stringify({ id: "mock" }), { status: 200 });
  };
  try {
    await db
      .prepare(
        "INSERT INTO users(id,name,email,password) VALUES('u','Test','test@example.invalid',?)",
      )
      .run(hashPassword("old-password"));
    await sendAccountEmail("u", "test@example.invalid", "verify");
    assert.equal(
      (
        (await db
          .prepare("SELECT email_verified FROM users WHERE id='u'")
          .get()) as any
      ).email_verified,
      0,
    );
    await assert.rejects(
      async () => await consumeEmailToken(token, "reset", "new-password"),
      /invalid or expired/,
    );
    await consumeEmailToken(token, "verify");
    assert.equal(
      (
        (await db
          .prepare("SELECT email_verified FROM users WHERE id='u'")
          .get()) as any
      ).email_verified,
      1,
    );
    await assert.rejects(
      async () => await consumeEmailToken(token, "verify"),
      /invalid or expired/,
    );
    await sendAccountEmail("u", "test@example.invalid", "reset");
    await db
      .prepare(
        "INSERT INTO auth_sessions(token,user_id,expires) VALUES('session','u',?)",
      )
      .run(Date.now() + 100000);
    await assert.rejects(
      async () => await consumeEmailToken(token, "reset", "short"),
      /10 and 128/,
    );
    await consumeEmailToken(token, "reset", "new-password");
    assert.equal(
      ((await db.prepare("SELECT COUNT(*) n FROM auth_sessions").get()) as any)
        .n,
      0,
    );
    assert.ok(
      checkPassword(
        "new-password",
        (
          (await db
            .prepare("SELECT password FROM users WHERE id='u'")
            .get()) as any
        ).password,
      ),
    );
    await assert.rejects(
      async () => await consumeEmailToken(token, "reset", "new-password"),
      /invalid or expired/,
    );
    await sendAccountEmail("u", "test@example.invalid", "verify");
    await db.prepare("UPDATE email_tokens SET expires=0").run();
    await assert.rejects(
      async () => await consumeEmailToken(token, "verify"),
      /invalid or expired/,
    );
    for (let n = 0; n < 5; n++) await emailRateLimit("limited@example.invalid");
    await assert.rejects(
      async () => await emailRateLimit("limited@example.invalid"),
      /Too many/,
    );
    globalThis.fetch = async () => new Response("", { status: 500 });
    await assert.rejects(
      sendAccountEmail("u", "test@example.invalid", "reset"),
      /couldn't send/,
    );
    assert.equal(
      (
        (await db
          .prepare("SELECT count(*) n FROM email_tokens WHERE hash=?")
          .get(createHash("sha256").update(token).digest("hex"))) as any
      ).n,
      0,
    );
  } finally {
    globalThis.fetch = original;
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
