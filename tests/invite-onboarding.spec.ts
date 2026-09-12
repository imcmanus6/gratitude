import { test, expect } from "@playwright/test";
import { verifiedAccount } from "./verified-account";
import { db } from "../lib/db";
test("new member can create a circle, get an invitation, and return from the right menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = `onboarding-${Date.now()}@example.invalid`;
  await verifiedAccount(page.request, {
    data: { email, name: "Invitation test", password: "Testing-password-123" },
  });
  await db
    .prepare("UPDATE users SET onboarding_complete=0 WHERE email=?")
    .run(email);
  await page.goto("http://localhost:3005");
  await expect(page.getByText("Good things are better shared.")).toBeVisible();
  await expect(page.getByLabel("Invitation link")).toHaveValue(
    "http://localhost:3005/",
  );
  await page.getByRole("button", { name: "Create a new circle" }).click();
  await page.getByLabel("Give your circle a name").fill("Our little joys");
  await page
    .getByRole("button", { name: "Create circle", exact: true })
    .click();
  await expect(page.getByLabel("Invitation link")).toHaveValue(/\?invite=.+/);
  await page.getByRole("button", { name: "Continue to my feed" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Good things are better shared.")).toHaveCount(0);
  await page.getByLabel("Account menu").click();
  await page
    .getByRole("button", { name: "Invite people", exact: true })
    .click();
  await page
    .getByLabel("Choose a circle")
    .selectOption({ label: "Our little joys" });
  await expect(page.getByLabel("Invitation link")).toHaveValue(/\?invite=.+/);
});
test("skipping onboarding is remembered", async ({ page }) => {
  const email = `skip-${Date.now()}@example.invalid`;
  await verifiedAccount(page.request, {
    data: { email, name: "Skip test", password: "Testing-password-123" },
  });
  await db
    .prepare("UPDATE users SET onboarding_complete=0 WHERE email=?")
    .run(email);
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Good things are better shared.")).toHaveCount(0);
  await expect(page.getByLabel("Account menu")).toBeVisible();
});
