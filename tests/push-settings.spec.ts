import { test, expect } from "@playwright/test";
import { verifiedAccount } from "./verified-account";
test("daily phone reminder settings and push resources are available", async ({
  page,
}) => {
  await verifiedAccount(page.request, {
    data: {
      name: "Push settings",
      email: `push-ui-${Date.now()}@example.invalid`,
      password: "Testing-password-123",
    },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3005");
  await page.getByLabel("Account menu").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your daily gratitude reminder" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remind me at 9 p.m." }),
  ).toBeEnabled();
  const config = await (
    await page.request.get("http://localhost:3005/api/push")
  ).json();
  expect(config.publicKey).toBeTruthy();
  expect(config.privateKey).toBeUndefined();
  expect(
    (await page.request.get("http://localhost:3005/sw.js")).ok(),
  ).toBeTruthy();
  const manifest = await (
    await page.request.get("http://localhost:3005/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  const invalid = await page.request.post("http://localhost:3005/api/push", {
    data: {
      subscription: { endpoint: "http://127.0.0.1/" },
      timezone: "Europe/London",
    },
  });
  expect(invalid.ok()).toBeFalsy();
});
