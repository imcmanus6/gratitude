import { db } from "@/lib/db";
import { currentUser, fail } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    const image = (await db
      .prepare(
        `SELECT u.* FROM uploads u WHERE u.id=@id AND (u.owner=@user OR EXISTS(SELECT 1 FROM posts p WHERE (p.image=u.id OR p.audio=u.id) AND (p.visibility='public' OR (p.visibility='direct' AND p.recipient=@user) OR (p.visibility='circle' AND EXISTS(SELECT 1 FROM post_circles pc JOIN members m ON m.circle_id=pc.circle_id WHERE pc.post_id=p.id AND m.user_id=@user)))))`,
      )
      .get({ id: params.id, user: user.id })) as
      { data: Buffer; mime: string } | undefined;
    if (!image || image.mime.startsWith("audio/"))
      return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
