import { NextResponse } from "next/server";
import { db, id, now } from "@/lib/db";
import { appOrigin, fail, text } from "@/lib/http";
import { apiKeyUser } from "@/lib/connect";

type Entry = {
  id: string;
  body: string;
  visibility: string;
  created_at: string;
  circle_ids: string[];
  url: string;
};

async function entry(
  request: Request,
  row: { id: string; body: string; visibility: string; created: string },
): Promise<Entry> {
  const circles = (await db
    .prepare("SELECT circle_id FROM post_circles WHERE post_id=?")
    .all(row.id)) as { circle_id: string }[];
  return {
    id: row.id,
    body: row.body,
    visibility: row.visibility,
    created_at: row.created,
    circle_ids: circles.map((c) => c.circle_id),
    url: `${appOrigin(request)}/?post=${row.id}`,
  };
}

/** GET /api/v1/entries?limit=10 — the caller's own gratitude posts, newest first. */
export async function GET(request: Request) {
  try {
    const user = await apiKeyUser(request);
    const limit = Math.min(
      50,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 10),
    );
    const rows = (await db
      .prepare(
        "SELECT id,body,visibility,created FROM posts WHERE author=? ORDER BY created DESC LIMIT ?",
      )
      .all(user.id, limit)) as {
      id: string;
      body: string;
      visibility: string;
      created: string;
    }[];
    const circles = (await db
      .prepare(
        "SELECT c.id,c.name FROM circles c JOIN members m ON m.circle_id=c.id WHERE m.user_id=? ORDER BY c.name",
      )
      .all(user.id)) as { id: string; name: string }[];
    return NextResponse.json({
      account: { id: user.id, name: user.name, email: user.email },
      circles,
      entries: await Promise.all(rows.map((r) => entry(request, r))),
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * POST /api/v1/entries { body, visibility: 'private'|'circle', circle_ids?: string[] }
 * "circle" with no circle_ids posts to every circle the user belongs to.
 */
export async function POST(request: Request) {
  try {
    const user = await apiKeyUser(request);
    const d = await request.json();
    const body = text(d.body);
    const visibility = d.visibility === "circle" ? "circle" : "private";
    let circleIds: string[] = [];
    if (visibility === "circle") {
      const mine = (
        (await db
          .prepare("SELECT circle_id FROM members WHERE user_id=?")
          .all(user.id)) as { circle_id: string }[]
      ).map((m) => m.circle_id);
      const requested: string[] = Array.isArray(d.circle_ids)
        ? Array.from(new Set(d.circle_ids.map((c: unknown) => text(c, 100))))
        : mine;
      if (requested.some((c) => !mine.includes(c)))
        throw new Error("You are not a member of that circle.");
      circleIds = requested.slice(0, 30);
      if (!circleIds.length)
        throw new Error(
          "Join or create a circle in Gratitude before sharing, or keep this entry private.",
        );
    }
    const postId = id();
    await db
      .prepare(
        "INSERT INTO posts(id,circle_id,author,body,created,visibility,background) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        postId,
        circleIds[0] || null,
        user.id,
        body,
        now(),
        visibility,
        "linen",
      );
    for (const circleId of circleIds)
      await db
        .prepare("INSERT INTO post_circles(post_id,circle_id) VALUES(?,?)")
        .run(postId, circleId);
    const row = (await db
      .prepare("SELECT id,body,visibility,created FROM posts WHERE id=?")
      .get(postId)) as {
      id: string;
      body: string;
      visibility: string;
      created: string;
    };
    return NextResponse.json(
      { entry: await entry(request, row) },
      { status: 201 },
    );
  } catch (e) {
    return fail(e);
  }
}
