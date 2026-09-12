import webpush from "web-push";
import { db } from "./db";
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
export function dueDay(timezone: string, date = new Date()) {
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
  return p("hour") === "21" && Number(p("minute")) < 15
    ? `${p("year")}-${p("month")}-${p("day")}`
    : null;
}
export async function dispatchReminders(
  date = new Date(),
  send = webpush.sendNotification.bind(webpush),
) {
  const config = pushConfiguration();
  if (!config) return;
  const rows = (await db.prepare("SELECT * FROM push_subscriptions").all()) as {
    endpoint: string;
    subscription: string;
    timezone: string;
    last_day: string | null;
    lease: number;
  }[];
  for (const row of rows) {
    const day = dueDay(row.timezone, date);
    if (!day || row.last_day === day) continue;
    const claim = (await db
          .prepare(
            "UPDATE push_subscriptions SET lease=? WHERE endpoint=? AND (last_day IS NULL OR last_day<>?) AND lease<?",
          )
          .run(date.getTime() + 120000, row.endpoint, day, date.getTime()));
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
      (await db.prepare(
                "UPDATE push_subscriptions SET last_day=?,lease=0 WHERE endpoint=?",
              ).run(day, row.endpoint));
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        (await db.prepare("DELETE FROM push_subscriptions WHERE endpoint=?").run(
                    row.endpoint,
                  ));
      // Keep the lease as retry backoff; never log subscription URLs or keys.
      else
        console.error(
          "Reminder delivery failed; will retry within the reminder window.",
        );
    }
  }
}
