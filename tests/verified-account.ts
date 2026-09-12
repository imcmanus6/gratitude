import type { APIRequestContext } from "@playwright/test";
import { db, id, hashPassword } from "../lib/db";
// Non-auth browser tests provision a verified fixture directly; no real emails.
export async function verifiedAccount(
  context: APIRequestContext,
  options: {
    data: { name: string; email: string; password: string; action?: string };
  },
) {
  const { name, email, password } = options.data;
  await db
    .prepare(
      "INSERT INTO users(id,name,email,password,email_verified,onboarding_complete) VALUES(?,?,?,?,1,1)",
    )
    .run(id(), name, email.toLowerCase(), hashPassword(password));
  return context.post("http://localhost:3005/api/auth", {
    data: { action: "login", email, password },
  });
}
