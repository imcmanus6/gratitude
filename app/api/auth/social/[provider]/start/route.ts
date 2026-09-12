import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  beginAttempt,
  providerName,
  SocialAuthError,
  safeReturnPath,
  authConfig,
} from "@/lib/social-auth";
import { appOrigin, sameOrigin } from "@/lib/http";
import { getUser } from "@/lib/db";
export async function POST(
  request: Request,
  { params }: { params: { provider: string } },
) {
  let returnPath = "/";
  try {
    sameOrigin(request);
    const form = await request.formData();
    returnPath = safeReturnPath(form.get("returnPath"));
    const provider = providerName(params.provider),
      config = authConfig(provider);
    if (appOrigin(request) !== config.origin)
      throw new SocialAuthError("unavailable");
    let userId: string | undefined;
    if (["link", "delete"].includes(String(form.get("intent")))) {
      const user = await getUser(cookies().get("gratitude_session")?.value);
      if (!user || user.demo) throw new SocialAuthError("link_session");
      userId = user.id;
    }
    const attempt = await beginAttempt(
      provider,
      returnPath,
      userId,
      form.get("intent") === "delete" ? "delete" : "login",
    );
    const response = NextResponse.redirect(attempt.url, 303);
    response.cookies.set(`gratitude_oauth_${provider}`, attempt.browser, {
      httpOnly: true,
      secure: config.origin.startsWith("https:"),
      sameSite: provider === "apple" ? "none" : "lax",
      path: "/",
      maxAge: 600,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const url = new URL(returnPath, appOrigin(request));
    url.searchParams.set(
      "auth_error",
      error instanceof SocialAuthError ? error.code : "failed",
    );
    return NextResponse.redirect(url, 303);
  }
}
