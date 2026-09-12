import { createHash, randomBytes } from "node:crypto";
import { db, hashPassword } from "./db";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function emailConfiguration() {
  const {
    RESEND_API_KEY: key,
    AUTH_EMAIL_FROM: from,
    AUTH_ORIGIN: origin,
  } = process.env;
  if (!key || !from || !origin)
    throw new Error(
      "Email delivery is not configured yet. Please try again later.",
    );
  const url = new URL(origin);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Email delivery requires a secure app address.");
  return { key, from, origin: url.origin };
}
export async function emailRateLimit(email: string) {
  const key = digest(email),
    now = Date.now();
  await db.transaction(async () => {
    await db.prepare("DELETE FROM email_limits WHERE expires<=?").run(now);
    const row = (await db
      .prepare("SELECT count FROM email_limits WHERE key=?")
      .get(key)) as { count: number } | undefined;
    if (row && row.count >= 5)
      throw new Error("Too many requests. Please try again in 15 minutes.");
    await db
      .prepare(
        "INSERT INTO email_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
      )
      .run(key, now + 900000);
  })();
}
export async function sendAccountEmail(
  userId: string,
  email: string,
  purpose: "verify" | "reset",
) {
  const config = emailConfiguration();
  const token = randomBytes(32).toString("hex"),
    hash = digest(token);
  const duration = purpose === "verify" ? 86400000 : 1800000;
  await db.prepare("DELETE FROM email_tokens WHERE expires<=?").run(Date.now());
  await db
    .prepare(
      "INSERT INTO email_tokens(hash,user_id,purpose,expires) VALUES(?,?,?,?)",
    )
    .run(hash, userId, purpose, Date.now() + duration);
  const link = `${config.origin}/account/email#${new URLSearchParams({ purpose, token })}`;
  const subject =
    purpose === "verify"
      ? "Confirm your Gratitude Circles email"
      : "Reset your Gratitude Circles password";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": hash,
      },
      body: JSON.stringify({
        from: config.from,
        to: [email],
        subject,
        text: `${subject}\n\n${link}\n\nThis link expires in ${purpose === "verify" ? "24 hours" : "30 minutes"}. If you did not request this, you can ignore this email.`,
      }),
    });
    if (!response.ok) throw new Error("delivery");
  } catch {
    await db.prepare("DELETE FROM email_tokens WHERE hash=?").run(hash);
    throw new Error("We couldn't send the email. Please try again shortly.");
  }
}
export async function consumeEmailToken(
  token: string,
  purpose: "verify" | "reset",
  password?: string,
) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new Error(
      "This link is invalid or expired. Please request a new one.",
    );
  if (
    purpose === "reset" &&
    (!password || password.length < 10 || password.length > 128)
  )
    throw new Error("Use a password between 10 and 128 characters.");
  const passwordHash =
    purpose === "reset" ? hashPassword(password!) : undefined;
  await db.transaction(async () => {
    const row = (await db
      .prepare(
        "SELECT user_id FROM email_tokens WHERE hash=? AND purpose=? AND expires>?",
      )
      .get(digest(token), purpose, Date.now())) as
      { user_id: string } | undefined;
    if (!row)
      throw new Error(
        "This link is invalid or expired. Please request a new one.",
      );
    if (purpose === "reset") {
      await db
        .prepare("UPDATE users SET password=?,email_verified=1 WHERE id=?")
        .run(passwordHash, row.user_id);
      await db
        .prepare("DELETE FROM auth_sessions WHERE user_id=?")
        .run(row.user_id);
      await db
        .prepare("DELETE FROM oauth_attempts WHERE link_user=?")
        .run(row.user_id);
      await db
        .prepare("DELETE FROM email_tokens WHERE user_id=?")
        .run(row.user_id);
    } else {
      await db
        .prepare("UPDATE users SET email_verified=1 WHERE id=?")
        .run(row.user_id);
      await db
        .prepare(
          "DELETE FROM email_tokens WHERE user_id=? AND purpose='verify'",
        )
        .run(row.user_id);
    }
  })();
}
