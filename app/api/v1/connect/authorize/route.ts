import { NextResponse } from "next/server";
import { db, id, hashPassword, checkPassword } from "@/lib/db";
import { currentUser, fail, sameOrigin, text } from "@/lib/http";
import {
  emailConfiguration,
  emailRateLimit,
  sendAccountEmail,
} from "@/lib/email-auth";
import {
  KNOWN_CLIENTS,
  encodeConnectCode,
  isAllowedRedirect,
  mintApiKey,
} from "@/lib/connect";
export const runtime = "nodejs";

const attempts = new Map<string, { count: number; until: number }>();
type Account = { id: string; name: string; email: string };

/**
 * POST { client, redirect_uri, state?, mode?: "signup"|"signin", name?, email?, password? }
 * Authenticates with credentials (works inside a third-party iframe where the
 * session cookie may be blocked) or falls back to the current session cookie.
 * Returns { redirect } carrying a short-lived code, or { verificationRequired }.
 */
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const data = await request.json();
    const client = text(data.client, 40);
    const meta = KNOWN_CLIENTS[client];
    if (!meta) throw new Error("Unknown client.");
    const redirectUri = text(data.redirect_uri, 2000);
    if (!isAllowedRedirect(redirectUri))
      throw new Error("Redirect URL is not allowed.");

    let account: Account | undefined;
    if (typeof data.email === "string" && typeof data.password === "string") {
      const email = text(data.email, 254).toLowerCase();
      const password: string = data.password;
      if (!password.length || password.length > 128)
        throw new Error("Please enter a password of up to 128 characters.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Please enter a valid email address.");
      const rate = attempts.get(email);
      if (rate && rate.until > Date.now() && rate.count >= 10)
        throw new Error("Too many attempts. Please try again in 15 minutes.");
      if (data.mode === "signup") {
        emailConfiguration();
        await emailRateLimit(email);
        if (password.length < 10)
          throw new Error("Use a password with at least 10 characters.");
        if (await db.prepare("SELECT id FROM users WHERE email=?").get(email))
          throw new Error(
            "An account already uses this email. Please sign in.",
          );
        const userId = id();
        await db
          .prepare("INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)")
          .run(userId, text(data.name, 60), email, hashPassword(password));
        await sendAccountEmail(userId, email, "verify");
        return NextResponse.json({ ok: true, verificationRequired: true });
      }
      const user = (await db
        .prepare(
          "SELECT id,name,email,password,email_verified FROM users WHERE email=?",
        )
        .get(email)) as
        | (Account & { password: string; email_verified: number })
        | undefined;
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
      account = { id: user.id, name: user.name, email: user.email };
    } else {
      account = await currentUser();
    }
    if (!account) throw new Error("Please sign in to continue.");

    const apiKey = await mintApiKey(account.id, `${meta.name} connection`);
    const code = encodeConnectCode({
      apiKey,
      client,
      userId: account.id,
      email: account.email,
      name: account.name,
      exp: Date.now() + 5 * 60 * 1000,
    });
    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    url.searchParams.set("provider", "gratitude");
    if (typeof data.state === "string" && data.state)
      url.searchParams.set("state", data.state.slice(0, 4000));
    return NextResponse.json({ ok: true, redirect: url.toString() });
  } catch (e) {
    return fail(e);
  }
}
