import { NextResponse } from "next/server";
import { currentUser, fail, sameOrigin, text } from "@/lib/http";
import {
  CONNECT_CLIENTS,
  createConnectCode,
  isAllowedRedirect,
} from "@/lib/connect";

/** /connect → "Allow": mint a one-time code for the signed-in user (5 min). */
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await currentUser();
    const d = await request.json();
    const client = text(d.client, 40);
    if (!CONNECT_CLIENTS[client]) throw new Error("Unknown app.");
    const redirectUri = text(d.redirect_uri, 2000);
    if (!isAllowedRedirect(redirectUri))
      throw new Error("This app's return address is not allowed.");
    const code = await createConnectCode(user.id, client, redirectUri);
    const redirect = new URL(redirectUri);
    redirect.searchParams.set("code", code);
    if (typeof d.state === "string" && d.state)
      redirect.searchParams.set("state", d.state.slice(0, 4000));
    return NextResponse.json({ redirect: redirect.toString() });
  } catch (e) {
    return fail(e);
  }
}
