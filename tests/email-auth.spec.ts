import { test, expect } from "@playwright/test";
import { db, id, hashPassword } from "../lib/db";
import { randomBytes, createHash } from "node:crypto";
test("email verification gates login and password reset works through the mobile UI", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3005/?signin=1");
  const uid = id(),
    email = `email-${uid}@example.invalid`,
    password = "Testing-password-123";
  await db
    .prepare(
      "INSERT INTO users(id,name,email,password,onboarding_complete) VALUES(?,?,?,?,1)",
    )
    .run(uid, "Email test", email, hashPassword(password));
  const makeToken = async (purpose: string) => {
    const token = randomBytes(32).toString("hex");
    await db
      .prepare(
        "INSERT INTO email_tokens(hash,user_id,purpose,expires) VALUES(?,?,?,?)",
      )
      .run(
        createHash("sha256").update(token).digest("hex"),
        uid,
        purpose,
        Date.now() + 60000,
      );
    return token;
  };
  try {
    await expect(
      page.getByRole("button", { name: "Continue with Facebook" }),
    ).toHaveCount(0);
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("p[role=alert]")).toContainText(
      "confirm your email",
    );
    expect(
      (await page.request.get("http://localhost:3005/api/state")).ok(),
    ).toBeFalsy();
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
    const token = await makeToken("verify");
    await page.goto(
      `http://localhost:3005/account/email#purpose=verify&token=${token}`,
    );
    await page
      .getByRole("button", { name: "Confirm email", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Email confirmed");
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByLabel("Account menu")).toBeVisible();
    await page.goto(
      `http://localhost:3005/account/email#purpose=reset&token=${await makeToken("reset")}`,
    );
    await page.locator("#password").fill("Replacement-password-123");
    await page.locator("#confirm").fill("Replacement-password-123");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByRole("status")).toContainText("Password updated");
    expect(
      (await page.request.get("http://localhost:3005/api/state")).ok(),
    ).toBeFalsy();
    expect(
      (
        await page.request.post("http://localhost:3005/api/auth", {
          data: { action: "login", email, password },
        })
      ).ok(),
    ).toBeFalsy();
    expect(
      (
        await page.request.post("http://localhost:3005/api/auth", {
          data: {
            action: "login",
            email,
            password: "Replacement-password-123",
          },
        })
      ).ok(),
    ).toBeTruthy();
  } finally {
    await db.prepare("DELETE FROM users WHERE id=?").run(uid);
  }
});
