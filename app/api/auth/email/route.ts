import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sameOrigin, fail, text } from "@/lib/http";
import {
  consumeEmailToken,
  emailConfiguration,
  emailRateLimit,
  sendAccountEmail,
} from "@/lib/email-auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const data = await request.json();
    if (data.action === "verify" || data.action === "reset") {
      await consumeEmailToken(
        text(data.token, 64),
        data.action,
        typeof data.password === "string" ? data.password : undefined,
      );
      return NextResponse.json({ ok: true });
    }
    if (data.action !== "forgot" && data.action !== "resend")
      throw new Error("Unknown action.");
    const email = text(data.email, 254).toLowerCase();
    emailConfiguration();
    await emailRateLimit(email);
    const user = (await db
      .prepare(
        "SELECT id,password,email_verified,demo FROM users WHERE email=?",
      )
      .get(email)) as
      | { id: string; password: string; email_verified: number; demo: number }
      | undefined;
    if (
      user &&
      !user.demo &&
      user.password !== "oauth-only" &&
      (data.action === "forgot" || !user.email_verified)
    ) {
      await sendAccountEmail(
        user.id,
        email,
        data.action === "forgot" ? "reset" : "verify",
      );
    }
    return NextResponse.json({
      ok: true,
      message:
        "If this address has an eligible account, an email is on its way. Check your inbox and spam folder.",
    });
  } catch (e) {
    return fail(e);
  }
}
