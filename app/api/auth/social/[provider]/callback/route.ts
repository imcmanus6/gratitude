import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db, getUser } from "@/lib/db";
import {
  providerName,
  consumeAttempt,
  exchangeIdentity,
  resolveIdentity,
  SocialAuthError,
  authConfig,
} from "@/lib/social-auth";
import {
  saveAppleReceipt,
  takeAppleReceipt,
  type AppleResponse,
} from "@/lib/apple-receipt";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  let returnPath = "/";
  let origin = new URL(request.url).origin;
  try {
    const provider = providerName(params.provider);
    const config = authConfig(provider);
    origin = config.origin;
    const url = new URL(request.url);
    const apple =
      provider === "apple"
        ? await takeAppleReceipt(
            url.searchParams.get("receipt") || "",
            cookies().get("gratitude_oauth_apple")?.value || "",
          )
        : null;
    const values = apple
      ? new URLSearchParams(
          Object.entries(apple).filter(
            (pair): pair is [string, string] => typeof pair[1] === "string",
          ),
        )
      : url.searchParams;
    const attempt = await consumeAttempt(
      provider,
      values.get("state") || "",
      cookies().get(`gratitude_oauth_${provider}`)?.value || "",
    );
    returnPath = attempt.return_path;
    if (values.has("error")) throw new SocialAuthError("cancelled");
    const code = values.get("code");
    if (!code || code.length > 4096) throw new SocialAuthError("failed");
    if (attempt.link_user) {
      const current = await getUser(cookies().get("gratitude_session")?.value);
      if (current?.id !== attempt.link_user || current.demo)
        throw new SocialAuthError("link_session");
    }
    const identity = await exchangeIdentity(
      provider,
      code,
      attempt,
      apple?.user,
    );
    if (attempt.intent === "delete") {
      const identityOwner = (await db
        .prepare(
          "SELECT user_id FROM oauth_identities WHERE provider=? AND subject=?",
        )
        .get(provider, identity.subject)) as { user_id: string } | undefined;
      if (!attempt.link_user || identityOwner?.user_id !== attempt.link_user)
        throw new SocialAuthError("link_session");
      await db
        .prepare(
          "UPDATE auth_sessions SET deletion_verified=? WHERE token=? AND user_id=?",
        )
        .run(
          Date.now() + 300000,
          cookies().get("gratitude_session")?.value,
          attempt.link_user,
        );
      const destination = new URL("/", origin);
      destination.searchParams.set("delete_account", "verified");
      const response = NextResponse.redirect(destination, 303);
      response.cookies.delete(`gratitude_oauth_${provider}`);
      return response;
    }
    const userId = await resolveIdentity(provider, identity, attempt.link_user);
    const token = randomBytes(32).toString("hex");
    await db
      .prepare("INSERT INTO auth_sessions(token,user_id,expires) VALUES(?,?,?)")
      .run(token, userId, Date.now() + 30 * 86400000);
    const destination = new URL(returnPath, origin);
    if (attempt.link_user) destination.searchParams.set("connected", provider);
    const response = NextResponse.redirect(destination, 303);
    response.cookies.set("gratitude_session", token, {
      httpOnly: true,
      secure: origin.startsWith("https:"),
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
    response.cookies.delete(`gratitude_oauth_${provider}`);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const destination = new URL(returnPath, origin);
    destination.searchParams.set(
      "auth_error",
      error instanceof SocialAuthError ? error.code : "failed",
    );
    const response = NextResponse.redirect(destination, 303);
    if (["google", "facebook", "apple"].includes(params.provider))
      response.cookies.delete(`gratitude_oauth_${params.provider}`);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

// Apple returns a cross-site form POST. The short-lived SameSite=None cookie binds
// that response to the initiating browser. A one-use receipt restores a top-level
// GET before linking, so the app's existing SameSite=Lax session stays protected.
export async function POST(
  request: Request,
  { params }: { params: { provider: string } },
) {
  let origin = new URL(request.url).origin;
  try {
    if (params.provider !== "apple")
      return new Response("Method not allowed", { status: 405 });
    origin = authConfig("apple").origin;
    if (Number(request.headers.get("content-length")) > 12000)
      throw new SocialAuthError("failed");
    const form = await request.formData();
    const payload: AppleResponse = { state: String(form.get("state") || "") };
    for (const key of ["code", "error", "user"] as const) {
      const value = form.get(key);
      if (typeof value === "string") payload[key] = value;
    }
    const receipt = await saveAppleReceipt(
      payload,
      cookies().get("gratitude_oauth_apple")?.value || "",
    );
    const destination = new URL("/api/auth/social/apple/callback", origin);
    destination.searchParams.set("receipt", receipt);
    const response = NextResponse.redirect(destination, 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    const destination = new URL("/", origin);
    destination.searchParams.set(
      "auth_error",
      error instanceof SocialAuthError ? error.code : "failed",
    );
    const response = NextResponse.redirect(destination, 303);
    response.cookies.delete("gratitude_oauth_apple");
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
