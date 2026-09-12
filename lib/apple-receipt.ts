import { randomBytes } from "node:crypto";
import { db } from "./db";
import { digest, SocialAuthError } from "./social-auth";
export type AppleResponse = {
  state: string;
  code?: string;
  error?: string;
  user?: string;
};
export async function saveAppleReceipt(
  payload: AppleResponse,
  browser: string,
) {
  if (
    !browser ||
    browser.length > 200 ||
    !payload.state ||
    payload.state.length > 200 ||
    JSON.stringify(payload).length > 10000
  )
    throw new SocialAuthError("expired");
  const receipt = randomBytes(32).toString("base64url");
  await db.transaction(async () => {
    const attempt = await db
      .prepare(
        "SELECT state_hash FROM oauth_attempts WHERE state_hash=? AND browser_hash=? AND provider=? AND expires>?",
      )
      .get(digest(payload.state), digest(browser), "apple", Date.now());
    if (!attempt) throw new SocialAuthError("expired");
    await db
      .prepare("DELETE FROM oauth_receipts WHERE expires<? OR state_hash=?")
      .run(Date.now(), digest(payload.state));
    await db
      .prepare(
        "INSERT INTO oauth_receipts(receipt_hash,state_hash,browser_hash,payload,expires) VALUES(?,?,?,?,?)",
      )
      .run(
        digest(receipt),
        digest(payload.state),
        digest(browser),
        JSON.stringify(payload),
        Date.now() + 120000,
      );
  })();
  return receipt;
}
export async function takeAppleReceipt(
  receipt: string,
  browser: string,
): Promise<AppleResponse> {
  if (!receipt || receipt.length > 200 || !browser || browser.length > 200)
    throw new SocialAuthError("expired");
  return await db.transaction(async () => {
    const row = (await db
      .prepare(
        "SELECT payload FROM oauth_receipts WHERE receipt_hash=? AND browser_hash=? AND expires>?",
      )
      .get(digest(receipt), digest(browser), Date.now())) as
      { payload: string } | undefined;
    if (!row) throw new SocialAuthError("expired");
    await db
      .prepare("DELETE FROM oauth_receipts WHERE receipt_hash=?")
      .run(digest(receipt));
    return JSON.parse(row.payload) as AppleResponse;
  })();
}
