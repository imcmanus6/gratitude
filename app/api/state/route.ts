import { NextResponse } from "next/server";
import { state } from "@/lib/db";
import { currentUser, fail } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await state(await currentUser()));
  } catch (e) {
    return fail(e);
  }
}
