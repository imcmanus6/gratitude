import { verifiedAccount } from "./verified-account";
import { test, expect } from "@playwright/test";
test("optional feedback, download and password-confirmed deletion from settings", async ({
  page,
}) => {
  await page.goto("http://localhost:3005");
  const email = `delete-${Date.now()}@example.invalid`;
  await verifiedAccount(page.request, {
    data: {
      action: "signup",
      name: "Deletion test",
      email,
      password: "Deletion-password-123",
    },
  });
  await page.reload();
  await page.getByLabel("Account menu").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete my account", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "What’s making you think about leaving?",
  );
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page.getByLabel("Confirm your password")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data first" }).click();
  expect((await download).suggestedFilename()).toBe("my-gratitude-data.json");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByLabel("Confirm your password").fill("wrong");
  await page
    .getByRole("button", { name: "Permanently delete account" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Verify your identity" }),
  ).toBeVisible();
  await page.getByLabel("Confirm your password").fill("Deletion-password-123");
  await page
    .getByRole("button", { name: "Permanently delete account" })
    .click();
  await expect(
    page.getByRole("button", { name: "Explore the demo" }),
  ).toBeVisible();
  expect(
    (await page.request.get("http://localhost:3005/api/state")).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post("http://localhost:3005/api/auth", {
        data: { action: "login", email, password: "Deletion-password-123" },
      })
    ).status(),
  ).toBe(400);
});
