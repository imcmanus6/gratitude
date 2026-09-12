import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Voice notes are no longer supported. Use dictation to write your gratitude.",
    },
    { status: 410 },
  );
}
