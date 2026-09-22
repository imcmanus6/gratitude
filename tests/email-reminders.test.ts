import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("daily email reminders follow a selected local time, deduplicate, retry leases, and cascade", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-email-reminders-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  process.env.RESEND_API_KEY = "test-only";
  process.env.AUTH_EMAIL_FROM = "test@example.invalid";
  process.env.AUTH_ORIGIN = "https://example.invalid";
  const { db } = await import("../lib/db");
  const { dispatchEmailReminders } = await import("../lib/push");
  const sent: string[] = [];
  try {
    await db
      .prepare(
        "INSERT INTO users(id,name,email,password,email_verified) VALUES('verified','Verified','verified@example.invalid','mock',1)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO users(id,name,email,password,email_verified) VALUES('unverified','Unverified','unverified@example.invalid','mock',0)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO users(id,name,email,password,demo,email_verified) VALUES('demo','Demo','demo@example.invalid','mock',1,1)",
      )
      .run();
    for (const user of ["verified", "unverified", "demo"])
      await db
        .prepare(
          "INSERT INTO email_reminders(user_id,timezone,time) VALUES(?,'Europe/London','07:30')",
        )
        .run(user);
    const send = async (email: string) => {
      sent.push(email);
    };
    const first = new Date("2026-07-01T06:30:00Z");
    await dispatchEmailReminders(new Date("2026-07-01T20:00:00Z"), send);
    assert.deepEqual(sent, []);
    await dispatchEmailReminders(first, send);
    await dispatchEmailReminders(new Date(first.getTime() + 60000), send);
    assert.deepEqual(sent, ["verified@example.invalid"]);
    assert.equal(
      (
        (await db
          .prepare(
            "SELECT last_day,lease FROM email_reminders WHERE user_id='verified'",
          )
          .get()) as { last_day: string; lease: number }
      ).last_day,
      "2026-07-01",
    );

    await db
      .prepare(
        "UPDATE email_reminders SET last_day=NULL WHERE user_id='verified'",
      )
      .run();
    await dispatchEmailReminders(first, async () => {
      throw new Error("delivery");
    });
    assert.equal(
      (
        (await db
          .prepare(
            "SELECT last_day,lease FROM email_reminders WHERE user_id='verified'",
          )
          .get()) as { last_day: string | null; lease: number }
      ).last_day,
      null,
    );
    await dispatchEmailReminders(new Date(first.getTime() + 60000), send);
    assert.equal(sent.length, 1);
    await dispatchEmailReminders(new Date(first.getTime() + 121000), send);
    assert.deepEqual(sent, [
      "verified@example.invalid",
      "verified@example.invalid",
    ]);

    await db.prepare("DELETE FROM users WHERE id='verified'").run();
    assert.equal(
      (
        (await db.prepare("SELECT COUNT(*) n FROM email_reminders").get()) as {
          n: number;
        }
      ).n,
      2,
    );
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
