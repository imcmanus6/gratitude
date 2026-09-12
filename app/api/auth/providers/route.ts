import { NextResponse } from "next/server";
import { providerEnabled } from "@/lib/social-auth";
import { db, getUser } from "@/lib/db";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getUser(cookies().get("gratitude_session")?.value);
  const linked = user
    ? (
        (await db
          .prepare("SELECT provider FROM oauth_identities WHERE user_id=?")
          .all(user.id)) as { provider: string }[]
      ).map((row) => row.provider)
    : [];
  return NextResponse.json(
    {
      apple: providerEnabled("apple"),
      google: providerEnabled("google"),
      linked,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
