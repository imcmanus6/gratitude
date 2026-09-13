import { NextResponse } from "next/server";
import { db, id, now } from "@/lib/db";
import { fail, text } from "@/lib/http";
import { requireApiKeyUser } from "@/lib/connect";
export const runtime = "nodejs";

/**
 * Partner API (x-api-key). Used by Briefly to read and write a user's
 * gratitude entries without leaving Briefly.
 *   GET  /api/v1/entries?limit=10         -> { entries }
 *   POST /api/v1/entries { body, visibility?: "private"|"circle" } -> { entry }
 * "circle" posts go to every circle the user belongs to; with no circles the
 * entry is saved privately.
 */
type Row = {
  id: string;
  body: string;
  created: string;
  visibility: string;
  circle_id: string | null;
};

const dto = (request: Request, r: Row) => ({
  id: r.id,
  body: r.body,
  visibility: r.visibility,
  created_at: r.created,
  url: `${new URL(request.url).origin}/#post-${r.id}`,
});

export async function GET(request: Request) {
  try {
    const user = await requireApiKeyUser(request);
    const limit = Math.min(
      50,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 10),
    );
    const rows = (await db
      .prepare(
        "SELECT id,body,created,visibility,circle_id FROM posts WHERE author=? AND recipient IS NULL ORDER BY created DESC LIMIT ?",
      )
      .all(user.id, limit)) as Row[];
    return NextResponse.json({ entries: rows.map((r) => dto(request, r)) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiKeyUser(request);
    const data = await request.json();
    const body = text(data.body);
    const circleIds =
      data.visibility === "circle"
        ? (
            (await db
              .prepare("SELECT circle_id FROM members WHERE user_id=?")
              .all(user.id)) as { circle_id: string }[]
          ).map((m) => m.circle_id)
        : [];
    const visibility = circleIds.length ? "circle" : "private";
    const postId = id();
    const created = now();
    await db.transaction(async () => {
      await db
        .prepare(
          "INSERT INTO posts(id,circle_id,author,body,created,visibility,background) VALUES(?,?,?,?,?,?,?)",
        )
        .run(
          postId,
          circleIds[0] || null,
          user.id,
          body,
          created,
          visibility,
          "linen",
        );
      for (const circleId of circleIds)
        await db
          .prepare("INSERT INTO post_circles(post_id,circle_id) VALUES(?,?)")
          .run(postId, circleId);
    })();
    return NextResponse.json({
      entry: dto(request, {
        id: postId,
        body,
        created,
        visibility,
        circle_id: circleIds[0] || null,
      }),
    });
  } catch (e) {
    return fail(e);
  }
}
