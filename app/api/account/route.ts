import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser, sameOrigin, fail } from "@/lib/http";
import { db, checkPassword } from "@/lib/db";
import { deletionPlan, deleteAccount } from "@/lib/account-deletion";
import { providerEnabled, Provider } from "@/lib/social-auth";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; until: number }>();
export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (new URL(request.url).searchParams.get("export") === "1")
      return NextResponse.json(
        {
          exportedAt: new Date().toISOString(),
          profile: { name: user.name, email: user.email },
          entries: await db
            .prepare("SELECT * FROM posts WHERE author=?")
            .all(user.id),
          comments: await db
            .prepare("SELECT * FROM comments WHERE author=?")
            .all(user.id),
          media: (
            (await db
              .prepare("SELECT id,mime,data FROM uploads WHERE owner=?")
              .all(user.id)) as { id: string; mime: string; data: Buffer }[]
          ).map((m) => ({
            id: m.id,
            mime: m.mime,
            base64: m.data.toString("base64"),
          })),
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "Content-Disposition":
              'attachment; filename="my-gratitude-data.json"',
          },
        },
      );
    await db
      .prepare("DELETE FROM departure_feedback WHERE expires<?")
      .run(Date.now());
    const account = (await db
      .prepare("SELECT password FROM users WHERE id=?")
      .get(user.id)) as { password: string };
    const verified = (await db
      .prepare("SELECT deletion_verified FROM auth_sessions WHERE token=?")
      .get(cookies().get("gratitude_session")?.value)) as {
      deletion_verified: number;
    };
    return NextResponse.json(
      {
        circles: await deletionPlan(user.id),
        hasPassword: account.password !== "oauth-only",
        demo: !!user.demo,
        verified: verified.deletion_verified > Date.now(),
        providers: (
          (await db
            .prepare("SELECT provider FROM oauth_identities WHERE user_id=?")
            .all(user.id)) as { provider: Provider }[]
        ).map((p) => ({
          name: p.provider,
          enabled: providerEnabled(p.provider),
        })),
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
    if (d.confirm !== "DELETE") throw new Error("Type DELETE to confirm.");
    const account = (await db
      .prepare("SELECT password FROM users WHERE id=?")
      .get(user.id)) as { password: string };
    const session = (await db
      .prepare("SELECT deletion_verified FROM auth_sessions WHERE token=?")
      .get(cookies().get("gratitude_session")?.value)) as {
      deletion_verified: number;
    };
    if (!user.demo && session.deletion_verified < Date.now()) {
      const rate = attempts.get(user.id);
      if (rate && rate.until > Date.now() && rate.count >= 5)
        throw new Error("Too many attempts. Try again in 15 minutes.");
      if (
        typeof d.password !== "string" ||
        d.password.length > 128 ||
        !checkPassword(d.password, account.password)
      ) {
        attempts.set(user.id, {
          count: rate && rate.until > Date.now() ? rate.count + 1 : 1,
          until: Date.now() + 900000,
        });
        throw new Error(
          "Verify your identity with your password or connected sign-in.",
        );
      }
    }
    if (!d.choices || typeof d.choices !== "object" || Array.isArray(d.choices))
      throw new Error("Review your circles first.");
    const reasons = [
      "not_using",
      "privacy",
      "notifications",
      "broken",
      "other",
    ];
    if (d.reason && !reasons.includes(d.reason))
      throw new Error("Choose a feedback option or skip.");
    if (d.comment && (typeof d.comment !== "string" || d.comment.length > 1000))
      throw new Error("Keep your comment under 1,000 characters.");
    await deleteAccount(user.id, d.choices, {
      reason: d.reason,
      comment: d.comment,
    });
    attempts.delete(user.id);
    cookies().delete("gratitude_session");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
