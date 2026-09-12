import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
test("account deletion transfers ownership, preserves other authors and removes account data atomically", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-delete-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  const { db, id, now } = await import("../lib/db");
  const { deleteAccount } = await import("../lib/account-deletion");
  try {
    const owner = id(),
      member = id(),
      circle = id(),
      second = id();
    for (const u of [owner, member])
      await db
        .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
        .run(u, "Name", u + "@example.invalid", "test");
    for (const c of [circle, second]) {
      await db
        .prepare(
          "INSERT INTO circles(id,name,kind,owner,invite) VALUES(?,?,?,?,?)",
        )
        .run(c, "Circle", "friends", owner, id());
      for (const u of [owner, member])
        await db
          .prepare("INSERT INTO members(circle_id,user_id,role) VALUES(?,?,?)")
          .run(c, u, u === owner ? "owner" : "member");
    }
    const own = id(),
      others = id(),
      cross = id();
    for (const [p, u, c] of [
      [own, owner, circle],
      [others, member, circle],
      [cross, member, second],
    ])
      await db
        .prepare(
          "INSERT INTO posts(id,circle_id,author,body,created) VALUES(?,?,?,?,?)",
        )
        .run(p, c, u, "Words", now());
    for (const c of [circle, second])
      await db
        .prepare("INSERT INTO post_circles(post_id,circle_id) VALUES(?,?)")
        .run(cross, c);
    const upload = id();
    await db
      .prepare("INSERT INTO uploads(id,owner,mime,data) VALUES(?,?,?,?)")
      .run(upload, owner, "image/png", Buffer.from("image"));
    await db
      .prepare(
        "INSERT INTO image_generations(id,user_id,created,status,upload_id) VALUES(?,?,?,?,?)",
      )
      .run(id(), owner, Date.now(), "complete", upload);
    await db
      .prepare(
        "INSERT INTO comments(id,post_id,author,body,created) VALUES(?,?,?,?,?)",
      )
      .run(id(), others, owner, "Thanks", now());
    await db
      .prepare("INSERT INTO reactions(post_id,user_id,kind) VALUES(?,?,?)")
      .run(others, owner, "heart");
    await db
      .prepare("INSERT INTO auth_sessions(token,user_id,expires) VALUES(?,?,?)")
      .run("session", owner, Date.now() + 10000);
    await db
      .prepare(
        "INSERT INTO oauth_identities(provider,subject,user_id) VALUES(?,?,?)",
      )
      .run("google", "subject", owner);
    await assert.rejects(
      async () => await deleteAccount(owner, { [circle]: member }),
      /Choose what happens/,
    );
    assert.ok(await db.prepare("SELECT 1 FROM posts WHERE id=?").get(own));
    await deleteAccount(
      owner,
      { [circle]: member, [second]: "delete" },
      { reason: "privacy" },
    );
    assert.equal(
      await db.prepare("SELECT 1 FROM users WHERE id=?").get(owner),
      undefined,
    );
    assert.equal(
      (
        (await db
          .prepare("SELECT owner FROM circles WHERE id=?")
          .get(circle)) as {
          owner: string;
        }
      )?.owner,
      member,
    );
    assert.ok(await db.prepare("SELECT 1 FROM posts WHERE id=?").get(others));
    assert.equal(
      (
        (await db
          .prepare("SELECT circle_id FROM posts WHERE id=?")
          .get(cross)) as {
          circle_id: string;
        }
      )?.circle_id,
      circle,
    );
    for (const table of [
      "uploads",
      "image_generations",
      "auth_sessions",
      "oauth_identities",
      "comments",
      "reactions",
    ])
      assert.equal(
        (
          (await db.prepare(`SELECT COUNT(*) n FROM ${table}`).get()) as {
            n: number;
          }
        ).n,
        0,
      );
    assert.deepEqual(db.pragma("foreign_key_check"), []);
    assert.equal(
      (
        (await db.prepare("SELECT reason FROM departure_feedback").get()) as {
          reason: string;
        }
      ).reason,
      "privacy",
    );
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
