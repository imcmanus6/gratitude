import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") || "";
  if (code.length > 200)
    return NextResponse.json({ error: "Invalid invitation." }, { status: 400 });
  const invite = code.split("/").pop()?.split("invite=").pop();
  const circle = await db
    .prepare(
      "SELECT c.name,c.description,c.kind,c.cadence,c.day,c.time,c.timezone,u.name as host,(SELECT COUNT(*) FROM members m WHERE m.circle_id=c.id) as members FROM circles c JOIN users u ON u.id=c.owner WHERE c.invite=?",
    )
    .get(invite || "");
  return circle
    ? NextResponse.json(circle)
    : NextResponse.json(
        { error: "This invitation is unavailable or has been replaced." },
        { status: 404 },
      );
}
