import { NextResponse } from "next/server";
import { db, id } from "@/lib/db";
import { currentUser, fail, sameOrigin } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await currentUser();
    if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024)
      throw new Error("Choose a photo smaller than 5 MB.");
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      throw new Error("Choose a photo smaller than 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    let mime = "";
    if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
      mime = "image/jpeg";
    if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      mime = "image/png";
    if (
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP"
    )
      mime = "image/webp";
    if (!mime) throw new Error("Choose a JPEG, PNG or WebP photo.");
    const upload = id();
    await db
      .prepare("INSERT INTO uploads(id,owner,mime,data) VALUES(?,?,?,?)")
      .run(upload, user.id, mime, bytes);
    return NextResponse.json({ id: upload });
  } catch (e) {
    return fail(e);
  }
}
