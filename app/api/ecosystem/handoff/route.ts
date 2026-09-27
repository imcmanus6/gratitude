/**
 * Ecosystem unified-login landing.
 *
 * Another app (e.g. Briefly) sends the browser here with a short-lived,
 * HMAC-signed handoff token that names the canonical Via65 identity:
 *   GET /api/ecosystem/handoff?token=<jwt-like>&next=/optional-relative-path
 *
 * We verify the token (audience-bound to "gratitude"), map the canonical
 * person to a local Gratitude user (reuse / link / create), mint the usual
 * `gratitude_session`, set the cookie, and redirect into the app — so the user
 * arrives already signed in, no password prompt. An invalid/expired token just
 * bounces to the login page.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { appOrigin } from "@/lib/http";
import { verifyBrieflyHandoff } from "@/lib/ecosystem";
import { resolveGratitudeUser } from "@/lib/ecosystem-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_MS = 30 * 86400000;

export async function GET(request: Request) {
  const origin = appOrigin(request);
  try {
    const url = new URL(request.url);
    const claims = verifyBrieflyHandoff(url.searchParams.get("token") || "");
    if (!claims) return NextResponse.redirect(new URL("/?ecosystem=invalid", origin));

    const { userId } = await resolveGratitudeUser(claims);

    const token = randomBytes(32).toString("hex");
    await db
      .prepare("INSERT INTO auth_sessions(token,user_id,expires) VALUES(?,?,?)")
      .run(token, userId, Date.now() + SESSION_MS);

    // Only follow a same-site relative path; never an attacker-supplied absolute URL.
    const nextParam = url.searchParams.get("next");
    const dest = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

    const res = NextResponse.redirect(new URL(dest, origin));
    res.cookies.set("gratitude_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https:"),
      path: "/",
      maxAge: 30 * 86400,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/?ecosystem=error", origin));
  }
}
