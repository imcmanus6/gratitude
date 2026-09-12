import { NextResponse } from "next/server";
import { currentUser, sameOrigin, fail, text } from "@/lib/http";
import { db, id } from "@/lib/db";
import { generateGratitudeBackground } from "@/lib/image-generation";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({
      enabled: !!process.env.OPENAI_API_KEY && !user.demo,
      reason: !process.env.OPENAI_API_KEY
        ? "unconfigured"
        : user.demo
          ? "demo"
          : null,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  let jobId: string | undefined;
  try {
    sameOrigin(request);
    const user = await currentUser();
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json(
        {
          error:
            "Image generation is not connected yet. Choose a colour or your own photo for now.",
        },
        { status: 503 },
      );
    if (user.demo)
      return NextResponse.json(
        {
          error:
            "Create your own account to make a new AI background. You can try the sample woodland image here.",
        },
        { status: 403 },
      );
    const d = await request.json();
    const context = text(d.context, 1500);
    if (d.consent !== true)
      throw new Error(
        "Please confirm you want to use these words to make an image.",
      );
    if (!["photo", "watercolour", "abstract"].includes(d.style))
      throw new Error("Choose an image style.");
    const requestedId = text(d.requestId, 80);
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestedId))
      throw new Error("Please try making the image again.");
    const existing = (await db
      .prepare(
        "SELECT status,upload_id FROM image_generations WHERE id=? AND user_id=?",
      )
      .get(requestedId, user.id)) as
      { status: string; upload_id: string | null } | undefined;
    if (existing?.status === "complete")
      return NextResponse.json({ id: existing.upload_id });
    if (existing)
      throw new Error(
        "That image request was already started. Try again to make a new image.",
      );
    await db.transaction(async () => {
      const since = Date.now() - 86400000;
      const perUser = (
        (await db
          .prepare(
            "SELECT COUNT(*) n FROM image_generations WHERE user_id=? AND created>?",
          )
          .get(user.id, since)) as { n: number }
      ).n;
      const total = (
        (await db
          .prepare("SELECT COUNT(*) n FROM image_generations WHERE created>?")
          .get(since)) as { n: number }
      ).n;
      if (perUser >= 5 || total >= 50)
        throw new Error(
          "The image creation limit has been reached for today. Your colours and photos are still available.",
        );
      if (
        await db
          .prepare(
            "SELECT 1 FROM image_generations WHERE user_id=? AND status='pending' AND created>?",
          )
          .get(user.id, Date.now() - 240000)
      )
        throw new Error(
          "Your image is still being created. Please wait a moment.",
        );
      await db
        .prepare(
          "INSERT INTO image_generations(id,user_id,created,status) VALUES(?,?,?,?)",
        )
        .run(requestedId, user.id, Date.now(), "pending");
    })();
    jobId = requestedId;
    const bytes = await generateGratitudeBackground(
      context,
      d.style,
      request.signal,
    );
    const upload = id();
    await db.transaction(async () => {
      await db
        .prepare(
          "INSERT INTO uploads(id,owner,mime,data,generated) VALUES(?,?,?,?,1)",
        )
        .run(upload, user.id, "image/jpeg", bytes);
      await db
        .prepare(
          "UPDATE image_generations SET status='complete',upload_id=? WHERE id=?",
        )
        .run(upload, jobId);
    })();
    return NextResponse.json({ id: upload });
  } catch (e) {
    if (jobId)
      await db
        .prepare("UPDATE image_generations SET status='failed' WHERE id=?")
        .run(jobId);
    return fail(e);
  }
}
