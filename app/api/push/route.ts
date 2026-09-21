import { NextResponse } from "next/server";
import { currentUser, sameOrigin, fail, text } from "@/lib/http";
import { db } from "@/lib/db";
import {
  emailReminderConfigured,
  pushConfiguration,
  validateSubscription,
} from "@/lib/push";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json(
      {
        publicKey: pushConfiguration()?.publicKey || null,
        emailConfigured: emailReminderConfigured(),
        emailVerified: !!(
          (await db
            .prepare("SELECT email_verified FROM users WHERE id=?")
            .get(user.id)) as { email_verified: number }
        )?.email_verified,
        subscriptions: await db
          .prepare(
            "SELECT endpoint,timezone FROM push_subscriptions WHERE user_id=?",
          )
          .all(user.id),
        email:
          (await db
            .prepare("SELECT timezone FROM email_reminders WHERE user_id=?")
            .get(user.id)) || null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await currentUser();
    const d = await request.json();
    if (d.action === "email-disable") {
      await db
        .prepare("DELETE FROM email_reminders WHERE user_id=?")
        .run(user.id);
      return NextResponse.json({ ok: true });
    }
    if (d.action === "email-enable") {
      if (user.demo)
        throw new Error("Create your own account to enable email reminders.");
      if (!emailReminderConfigured())
        throw new Error("Email reminders are not configured yet.");
      const verified = (
        (await db
          .prepare("SELECT email_verified FROM users WHERE id=?")
          .get(user.id)) as { email_verified: number }
      )?.email_verified;
      if (!verified) throw new Error("Confirm your email address first.");
      const timezone = text(d.timezone, 100);
      new Intl.DateTimeFormat("en-GB", { timeZone: timezone }).format();
      await db
        .prepare(
          "INSERT INTO email_reminders(user_id,timezone) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET timezone=excluded.timezone",
        )
        .run(user.id, timezone);
      return NextResponse.json({ ok: true });
    }
    if (d.action === "disable") {
      await db
        .prepare(
          "DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?",
        )
        .run(text(d.endpoint, 4096), user.id);
      return NextResponse.json({ ok: true });
    }
    if (user.demo)
      throw new Error("Create your own account to enable phone reminders.");
    if (!pushConfiguration())
      throw new Error("Phone reminders are not configured yet.");
    const s = validateSubscription(d.subscription),
      timezone = text(d.timezone, 100);
    new Intl.DateTimeFormat("en-GB", { timeZone: timezone }).format();
    await db.transaction(async () => {
      const owner = (await db
        .prepare("SELECT user_id FROM push_subscriptions WHERE endpoint=?")
        .get(s.endpoint)) as { user_id: string } | undefined;
      if (owner && owner.user_id !== user.id)
        throw new Error(
          "Disable notifications for the previous account on this device first.",
        );
      const count = (
        (await db
          .prepare("SELECT count(*) n FROM push_subscriptions WHERE user_id=?")
          .get(user.id)) as { n: number }
      ).n;
      if (!owner && count >= 10)
        throw new Error("You already have reminders enabled on ten devices.");
      await db
        .prepare(
          "INSERT INTO push_subscriptions(endpoint,user_id,subscription,timezone) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET subscription=excluded.subscription,timezone=excluded.timezone",
        )
        .run(s.endpoint, user.id, JSON.stringify(s), timezone);
    })();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
