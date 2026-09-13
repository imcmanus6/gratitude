import { NextResponse } from "next/server";
import { KNOWN_CLIENTS, decodeConnectCode } from "@/lib/connect";
export const runtime = "nodejs";

/** Server-to-server: POST { code, client } -> { api_key, account }. */
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));
  const client = typeof data.client === "string" ? data.client : "";
  if (!KNOWN_CLIENTS[client])
    return NextResponse.json({ error: "Unknown client." }, { status: 400 });
  const payload =
    typeof data.code === "string" ? decodeConnectCode(data.code) : null;
  if (!payload || payload.client !== client)
    return NextResponse.json(
      { error: "Code is invalid or expired." },
      { status: 400 },
    );
  return NextResponse.json({
    api_key: payload.apiKey,
    account: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      label: payload.email,
    },
  });
}
