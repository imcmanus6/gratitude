import { randomUUID } from "node:crypto";
import webpush from "web-push";
import { db } from "./db";
import { emailConfiguration } from "./email-auth";
export function pushConfiguration() {
  const publicKey = process.env.VAPID_PUBLIC_KEY,
    privateKey = process.env.VAPID_PRIVATE_KEY,
    subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject
    ? { publicKey, privateKey, subject }
    : null;
}
export function validateSubscription(value: unknown): webpush.PushSubscription {
  const s = value as webpush.PushSubscription;
  if (!s || typeof s.endpoint !== "string" || s.endpoint.length > 4096)
    throw new Error("Invalid push subscription.");
  const u = new URL(s.endpoint);
  const host = u.hostname;
  if (
    u.protocol !== "https:" ||
    u.port ||
    u.username ||
    u.password ||
    u.hash ||
    !(
      host === "fcm.googleapis.com" ||
      host === "web.push.apple.com" ||
      host.endsWith(".push.apple.com") ||
      host === "updates.push.services.mozilla.com" ||
      host.endsWith(".notify.windows.com")
    )
  )
    throw new Error("Unsupported push service.");
  if (
    !s.keys ||
    !/^[A-Za-z0-9_-]+$/.test(s.keys.auth) ||
    !/^[A-Za-z0-9_-]+$/.test(s.keys.p256dh) ||
    Buffer.from(s.keys.auth, "base64url").length !== 16 ||
    Buffer.from(s.keys.p256dh, "base64url").length !== 65
  )
    throw new Error("Invalid push keys.");
  return {
    endpoint: s.endpoint,
    keys: { auth: s.keys.auth, p256dh: s.keys.p256dh },
  };
}
export function validateTime(value: unknown): string {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new Error("Choose a valid reminder time.");
  return value;
}
export function dueDay(timezone: string, date = new Date(), time = "21:00") {
  const [hour, minute] = validateTime(time).split(":").map(Number);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const p = (key: string) => parts.find((v) => v.type === key)!.value;
  // A short retry window avoids delivering yesterday's reminder after an outage.
  const current = Number(p("hour")) * 60 + Number(p("minute"));
  const target = hour * 60 + minute;
  const end = (target + 15) % 1440;
  const due =
    target + 15 < 1440
      ? current >= target && current < target + 15
      : current >= target || current < end;
  if (!due) return null;
  const day = `${p("year")}-${p("month")}-${p("day")}`;
  if (target + 15 < 1440 || current >= target) return day;
  const previous = new Date(date.getTime() - 86400000);
  const previousParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(previous);
  const previousPart = (key: string) =>
    previousParts.find((v) => v.type === key)!.value;
  return `${previousPart("year")}-${previousPart("month")}-${previousPart(
    "day",
  )}`;
}
export async function dispatchReminders(
  date = new Date(),
  send = webpush.sendNotification.bind(webpush),
) {
  const config = pushConfiguration();
  if (!config) return;
  const rows = (await db
    .prepare(
      "SELECT endpoint,subscription,timezone,time,last_day,lease FROM push_subscriptions",
    )
    .all()) as {
    endpoint: string;
    subscription: string;
    timezone: string;
    time: string;
    last_day: string | null;
    lease: number;
  }[];
  for (const row of rows) {
    const day = dueDay(row.timezone, date, row.time);
    if (!day || row.last_day === day) continue;
    const claim = await db
      .prepare(
        "UPDATE push_subscriptions SET lease=? WHERE endpoint=? AND (last_day IS NULL OR last_day<>?) AND lease<?",
      )
      .run(date.getTime() + 120000, row.endpoint, day, date.getTime());
    if (!claim.changes) continue;
    try {
      await send(
        validateSubscription(JSON.parse(row.subscription)),
        JSON.stringify({
          title: "A little gratitude before the day ends",
          body: "What are you grateful for today? Take a moment to notice the good.",
          url: "/",
          tag: `gratitude-${day}`,
        }),
        {
          vapidDetails: config,
          TTL: 900,
          timeout: 10000,
          urgency: "normal",
          topic: "daily-gratitude",
        },
      );
      await db
        .prepare(
          "UPDATE push_subscriptions SET last_day=?,lease=0 WHERE endpoint=?",
        )
        .run(day, row.endpoint);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        await db
          .prepare("DELETE FROM push_subscriptions WHERE endpoint=?")
          .run(row.endpoint);
      // Keep the lease as retry backoff; never log subscription URLs or keys.
      else
        console.error(
          "Reminder delivery failed; will retry within the reminder window.",
        );
    }
  }
}
export function emailReminderConfigured() {
  try {
    emailConfiguration();
    return true;
  } catch {
    return false;
  }
}
export async function sendReminderEmail(email: string, origin: string) {
  const config = emailConfiguration();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      from: config.from,
      to: [email],
      subject: "A little gratitude before the day ends",
      text: `What are you grateful for today? Take a moment to notice the good.\n\nOpen Gratitude Circles: ${origin}/\n\nYou can turn this daily email off in Settings.`,
    }),
  });
  if (!response.ok) throw new Error("delivery");
}
export async function dispatchEmailReminders(
  date = new Date(),
  send = sendReminderEmail,
) {
  const config = (() => {
    try {
      return emailConfiguration();
    } catch {
      return null;
    }
  })();
  if (!config) return;
  const rows = (await db
    .prepare(
      "SELECT r.user_id, r.timezone, r.time, r.last_day, r.lease, u.email FROM email_reminders r JOIN users u ON u.id=r.user_id WHERE u.demo=0 AND u.email_verified=1",
    )
    .all()) as {
    user_id: string;
    timezone: string;
    time: string;
    last_day: string | null;
    lease: number;
    email: string;
  }[];
  for (const row of rows) {
    const day = dueDay(row.timezone, date, row.time);
    if (!day || row.last_day === day) continue;
    const claim = await db
      .prepare(
        "UPDATE email_reminders SET lease=? WHERE user_id=? AND (last_day IS NULL OR last_day<>?) AND lease<?",
      )
      .run(date.getTime() + 120000, row.user_id, day, date.getTime());
    if (!claim.changes) continue;
    try {
      await send(row.email, config.origin);
      await db
        .prepare(
          "UPDATE email_reminders SET last_day=?,lease=0 WHERE user_id=?",
        )
        .run(day, row.user_id);
    } catch {
      console.error(
        "Email reminder delivery failed; will retry within the reminder window.",
      );
    }
  }
}
