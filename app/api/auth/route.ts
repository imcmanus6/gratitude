import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db, id, hashPassword, checkPassword, createDemo } from "@/lib/db";
import { appOrigin, fail, sameOrigin, text } from "@/lib/http";
import {
  emailConfiguration,
  emailRateLimit,
  sendAccountEmail,
} from "@/lib/email-auth";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const data = await request.json();
    if (data.action === "logout") {
      await db
        .prepare("DELETE FROM auth_sessions WHERE token=?")
        .run(cookies().get("gratitude_session")?.value || "");
      cookies().delete("gratitude_session");
      return NextResponse.json({ ok: true });
    }
    let userId: string;
    if (data.action === "demo") {
      userId = await db.transaction(createDemo)();
    } else {
      const email = text(data.email, 254).toLowerCase();
      if (
        typeof data.password !== "string" ||
        !data.password.length ||
        data.password.length > 128
      )
        throw new Error("Please enter a password of up to 128 characters.");
      const password = data.password;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Please enter a valid email address.");
      const rate = attempts.get(email);
      if (rate && rate.until > Date.now() && rate.count >= 10)
        throw new Error("Too many attempts. Please try again in 15 minutes.");
      if (data.action === "signup") {
        emailConfiguration();
        await emailRateLimit(email);
        if (password.length < 10)
          throw new Error("Use a password with at least 10 characters.");
        if (await db.prepare("SELECT id FROM users WHERE email=?").get(email))
          throw new Error(
            "An account already uses this email. Please sign in.",
          );
        userId = id();
        await db
          .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
          .run(userId, text(data.name, 60), email, hashPassword(password));
        await sendAccountEmail(userId, email, "verify");
        return NextResponse.json({ ok: true, verificationRequired: true });
      } else if (data.action === "login") {
        const user = (await db
          .prepare("SELECT id,password,email_verified FROM users WHERE email=?")
          .get(email)) as
          { id: string; password: string; email_verified: number } | undefined;
        if (!user || !checkPassword(password, user.password)) {
          attempts.set(email, {
            count: rate && rate.until > Date.now() ? rate.count + 1 : 1,
            until: Date.now() + 900000,
          });
          throw new Error("Email or password is incorrect.");
        }
        if (!user.email_verified)
          return NextResponse.json({ ok: true, verificationRequired: true });
        attempts.delete(email);
        userId = user.id;
      } else throw new Error("Unknown action.");
    }
    const token = randomBytes(32).toString("hex");
    await db
      .prepare("INSERT INTO auth_sessions(token,user_id,expires) VALUES(?,?,?)")
      .run(token, userId, Date.now() + 30 * 86400000);
    cookies().set("gratitude_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: appOrigin(request).startsWith("https:"),
      path: "/",
      maxAge: 30 * 86400,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
