import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { calendarEvent, ritualDue } from "../lib/ritual";
import type { Circle } from "../lib/types";

test("journal, circles and sessions enforce audience isolation", async () => {
  const folder = mkdtempSync(path.join(tmpdir(), "gratitude-test-"));
  process.env.GRATITUDE_DATA_DIR = folder;
  const { db, id, now, state, visiblePost, hashPassword, checkPassword } =
    await import("../lib/db");
  try {
    const [owner, member, stranger] = [id(), id(), id()];
    for (const user of [owner, member, stranger])
      await db
        .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
        .run(
          user,
          "Test",
          `${user}@test.invalid`,
          hashPassword("testing-password"),
        );
    const circle = id();
    await db
      .prepare(
        "INSERT INTO circles(id,name,kind,owner,invite) VALUES(?,?,?,?,?)",
      )
      .run(circle, "Family", "family", owner, id());
    for (const user of [owner, member])
      await db
        .prepare("INSERT INTO members(circle_id,user_id) VALUES(?,?)")
        .run(circle, user);
    const shared = id(),
      privatePost = id();
    for (const [post, visibility] of [
      [shared, "circle"],
      [privatePost, "private"],
    ])
      await db
        .prepare(
          "INSERT INTO posts(id,circle_id,author,body,created,visibility) VALUES(?,?,?,?,?,?)",
        )
        .run(post, circle, owner, "A good thing", now(), visibility);
    assert.ok(await visiblePost(member, shared));
    assert.equal(await visiblePost(member, privatePost), undefined);
    assert.equal(await visiblePost(stranger, shared), undefined);
    assert.ok(await visiblePost(owner, privatePost));
    const profile = (user: string) => ({
      id: user,
      name: "Test",
      email: "test@example.invalid",
      demo: 0,
    });
    assert.equal((await state(profile(member))).posts.length, 1);
    assert.equal((await state(profile(stranger))).posts.length, 0);
    assert.equal((await state(profile(owner))).posts.length, 2);
    await db.prepare("DELETE FROM members WHERE user_id=?").run(member);
    assert.equal(await visiblePost(member, shared), undefined);
    const hash = hashPassword("a-long-password");
    assert.equal(checkPassword("a-long-password", hash), true);
    assert.equal(checkPassword("wrong-password", hash), false);
  } finally {
    await db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
const circle = {
  id: "circle",
  name: "Friday circle",
  prompt: "One professional, one personal.",
  cadence: "weekly",
  day: "Friday",
  time: "12:00",
  timezone: "Europe/London",
  muted: 0,
} as Circle;
test("weekly calendar starts on the next actual Friday in the circle time zone", () => {
  const event = calendarEvent(circle, new Date("2026-09-12T10:00:00Z"));
  assert.match(event, /DTSTART;TZID=Europe\/London:20260918T120000/);
  assert.match(event, /RRULE:FREQ=WEEKLY;BYDAY=FR/);
});
test("ritual reminders respect daylight saving, weekday and mute", () => {
  assert.ok(ritualDue(circle, new Date("2026-09-18T11:00:00Z")));
  assert.equal(ritualDue(circle, new Date("2026-09-18T12:00:00Z")), null);
  assert.equal(
    ritualDue({ ...circle, muted: 1 }, new Date("2026-09-18T11:00:00Z")),
    null,
  );
  assert.ok(ritualDue(circle, new Date("2026-12-18T12:00:00Z")));
});
