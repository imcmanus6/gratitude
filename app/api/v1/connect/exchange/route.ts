import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, text } from "@/lib/http";
import { CONNECT_CLIENTS, consumeConnectCode, mintApiKey } from "@/lib/connect";

/** Server-to-server: swap a one-time connect code for an API key. */
export async function POST(request: Request) {
  try {
    const d = await request.json();
    const client = text(d.client, 40);
    if (!CONNECT_CLIENTS[client]) throw new Error("Unknown app.");
    const userId = await consumeConnectCode(text(d.code, 200), client);
    if (!userId)
      throw new Error("This connection code is invalid or has expired.");
    const apiKey = await mintApiKey(userId, CONNECT_CLIENTS[client].name);
    const user = (await db
      .prepare("SELECT id,name,email FROM users WHERE id=?")
      .get(userId)) as { id: string; name: string; email: string };
    return NextResponse.json({
      api_key: apiKey,
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        label: user.name || user.email,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
