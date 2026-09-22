import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
test("daily push follows a selected local time, deduplicates, expires subscriptions and respects deletion", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-push-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  process.env.VAPID_PUBLIC_KEY = "mock";
  process.env.VAPID_PRIVATE_KEY = "mock";
  process.env.VAPID_SUBJECT = "mailto:test@example.invalid";
  const { db } = await import("../lib/db");
  const { dueDay, validateTime, validateSubscription, dispatchReminders } =
    await import("../lib/push");
  try {
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T20:00:00Z")),
      "2026-07-01",
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-01-01T21:00:00Z")),
      "2026-01-01",
    );
    assert.equal(
      dueDay("Asia/Kolkata", new Date("2026-07-01T15:30:00Z")),
      "2026-07-01",
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T21:00:00Z")),
      null,
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T20:15:00Z")),
      null,
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T06:30:00Z"), "07:30"),
      "2026-07-01",
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T06:44:00Z"), "07:30"),
      "2026-07-01",
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T06:45:00Z"), "07:30"),
      null,
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T07:50:00Z"), "08:50"),
      "2026-07-01",
    );
    assert.equal(
      dueDay("Europe/London", new Date("2026-07-01T08:04:00Z"), "08:50"),
      "2026-07-01",
    );
    for (const value of ["25:00", "9pm", ""])
      assert.throws(() => validateTime(value), /Choose a valid reminder time/);
    assert.throws(
      () => validateSubscription({ endpoint: "http://127.0.0.1/" }),
      /Unsupported/,
    );
    assert.throws(
      () =>
        validateSubscription({
          endpoint: "https://fcm.googleapis.com.evil.example/",
        }),
      /Unsupported/,
    );
    const subscription = {
      endpoint: "https://fcm.googleapis.com/mock",
      keys: {
        auth: Buffer.alloc(16).toString("base64url"),
        p256dh: Buffer.alloc(65).toString("base64url"),
      },
    };
    validateSubscription(subscription);
    await db
      .prepare(
        "INSERT INTO users(id,name,email,password) VALUES('push-user','Test','push@example.invalid','mock')",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO push_subscriptions(endpoint,user_id,subscription,timezone,time) VALUES(?,'push-user',?,'Europe/London','07:30')",
      )
      .run(subscription.endpoint, JSON.stringify(subscription));
    let sent = 0;
    const send = async () => {
      sent++;
      return { statusCode: 201, headers: {}, body: "" };
    };
    await dispatchReminders(new Date("2026-07-01T20:00:00Z"), send);
    assert.equal(sent, 0);
    await dispatchReminders(new Date("2026-07-01T06:30:00Z"), send);
    await dispatchReminders(new Date("2026-07-01T06:31:00Z"), send);
    assert.equal(sent, 1);
    await dispatchReminders(new Date("2026-07-02T06:30:00Z"), send);
    assert.equal(sent, 2);
    await dispatchReminders(new Date("2026-07-03T06:30:00Z"), async () => {
      throw { statusCode: 410 };
    });
    assert.equal(
      (
        (await db
          .prepare("SELECT count(*) n FROM push_subscriptions")
          .get()) as any
      ).n,
      0,
    );
    await db
      .prepare(
        "INSERT INTO push_subscriptions(endpoint,user_id,subscription,timezone,time) VALUES(?,'push-user',?,'Europe/London','07:30')",
      )
      .run(subscription.endpoint, JSON.stringify(subscription));
    await db.prepare("DELETE FROM users WHERE id='push-user'").run();
    await dispatchReminders(new Date("2026-07-04T20:00:00Z"), send);
    assert.equal(sent, 2);
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
