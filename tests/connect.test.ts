import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("connect codes are single use and API keys resolve to their user", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-test-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  const { db, id, hashPassword } = await import("../lib/db");
  const {
    createConnectCode,
    consumeConnectCode,
    mintApiKey,
    apiKeyUser,
    isAllowedRedirect,
  } = await import("../lib/connect");
  try {
    const user = id();
    await db
      .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
      .run(user, "Test", `${user}@test.invalid`, hashPassword("testing-pw"));
    const code = await createConnectCode(
      user,
      "briefly",
      "https://app.briefly.so/api/app-connections/callback",
    );
    assert.equal(await consumeConnectCode(code, "other"), null);
    assert.equal(
      await consumeConnectCode(code, "briefly"),
      null,
      "wrong-client attempt burns the code",
    );
    const code2 = await createConnectCode(
      user,
      "briefly",
      "https://app.briefly.so/cb",
    );
    assert.equal(await consumeConnectCode(code2, "briefly"), user);
    assert.equal(
      await consumeConnectCode(code2, "briefly"),
      null,
      "replay rejected",
    );
    const expired = await createConnectCode(
      user,
      "briefly",
      "https://app.briefly.so/cb",
    );
    await db.prepare("UPDATE connect_codes SET expires=?").run(Date.now() - 1);
    assert.equal(await consumeConnectCode(expired, "briefly"), null);

    const key = await mintApiKey(user, "Briefly");
    assert.equal(
      await db.prepare("SELECT 1 FROM api_keys WHERE key_hash=?").get(key),
      undefined,
      "raw key is never stored",
    );
    const headers = (k: string) =>
      new Request("http://x/", { headers: { "x-api-key": k } });
    assert.equal((await apiKeyUser(headers(key))).id, user);
    await assert.rejects(apiKeyUser(headers("gk_bogus")), /sign in/);
    await assert.rejects(apiKeyUser(new Request("http://x/")), /sign in/);
    await db.prepare("UPDATE api_keys SET revoked=?").run("now");
    await assert.rejects(apiKeyUser(headers(key)), /sign in/);

    assert.ok(
      isAllowedRedirect("https://app.briefly.so/api/app-connections/callback"),
    );
    assert.ok(!isAllowedRedirect("http://app.briefly.so/cb"));
    assert.ok(!isAllowedRedirect("https://evil.example/cb"));
    assert.ok(!isAllowedRedirect("not a url"));
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
