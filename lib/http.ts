import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUser } from "./db";
export async function currentUser() {
  const user = await getUser(cookies().get("gratitude_session")?.value);
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}
export function appOrigin(request: Request) {
  return new URL(process.env.AUTH_ORIGIN || request.url).origin;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== appOrigin(request))
    throw new Error("Request origin is not allowed.");
}
export function fail(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  return NextResponse.json(
    { error: message },
    { status: message.includes("sign in") ? 401 : 400 },
  );
}
export function text(value: unknown, max = 5000) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error(`Please enter between 1 and ${max} characters.`);
  return value.trim();
}
