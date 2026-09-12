import { verifiedAccount } from "./verified-account";
import { test, expect } from "@playwright/test";
test("demo: create circle, post, react, comment, journal, ritual and session", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(
    page.getByRole("heading", {
      name: "A little good, every day.",
      includeHidden: true,
    }),
  ).toHaveCount(1);
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await openGratitude(page);
  await page
    .getByLabel("I’m grateful for…")
    .fill("A small moment of kindness, tested end to end.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Share gratitude", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("A small moment of kindness, tested end to end.", {
      exact: true,
    }),
  ).toBeVisible();
  const post = page
    .locator("article")
    .filter({ hasText: "A small moment of kindness, tested end to end." });
  await post.getByRole("button", { name: "Send a heart" }).click();
  await expect(
    post.getByRole("button", { name: "Remove heart" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "My journal", exact: true }).click();
  await openGratitude(page);
  await page
    .getByLabel("I’m grateful for…")
    .fill("This reflection is only for me.");
  await page
    .getByRole("button", { name: "Save privately", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("This reflection is only for me.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(
    page.getByText("This reflection is only for me.", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("button", { name: "Manage circles", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a circle", exact: true })
    .click();
  await page.getByLabel("Circle name").fill("Test kindness circle");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create circle", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test kindness circle", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit ritual" }).click();
  await page.getByLabel("How often?").selectOption("weekly");
  await page.getByLabel("Day", { exact: true }).selectOption("Friday");
  await page.getByLabel("Time", { exact: true }).fill("12:00");
  await page.getByRole("button", { name: "Save ritual" }).click();
  await page.getByRole("button", { name: "Start a session" }).click();
  await page.getByRole("button", { name: "Begin session" }).click();
  await expect(
    page.getByRole("button", { name: "Add what I shared" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add what I shared" }).click();
  await page
    .getByLabel("I’m grateful for…")
    .fill("Grateful for this time together.");
  await page
    .getByLabel("Public · everyone on Gratitude Circles", { exact: true })
    .check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Share gratitude", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View gratitudes", exact: true })
    .click();
  await expect(
    page.getByText("Grateful for this time together.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hide gratitudes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close session", exact: true })
    .click();
  await page
    .getByLabel("A closing reflection (optional)")
    .fill("Let’s take this feeling into the week.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View gratitudes", exact: true })
    .click();
  await expect(
    page.getByText("Grateful for this time together.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "A little good, every day.",
      includeHidden: true,
    }),
  ).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("two real accounts: invite, private post and photo permissions", async ({
  playwright,
}) => {
  const a = await playwright.request.newContext({
      baseURL: "http://localhost:3005",
    }),
    b = await playwright.request.newContext({
      baseURL: "http://localhost:3005",
    }),
    c = await playwright.request.newContext({
      baseURL: "http://localhost:3005",
    });
  const suffix = Date.now();
  for (const [ctx, name] of [
    [a, "Owner"],
    [b, "Member"],
    [c, "Outsider"],
  ] as const) {
    const signup = await verifiedAccount(ctx, {
      data: {
        action: "signup",
        name,
        email: `${name}-${suffix}@example.invalid`,
        password: "A-strong-test-password",
      },
    });
    expect(signup.ok()).toBe(true);
  }
  const created = await (
    await a.post("/api/action", {
      data: {
        action: "createCircle",
        name: "Private test circle",
        kind: "family",
      },
    })
  ).json();
  const circle = created.circles[0];
  expect(
    (
      await b.post("/api/action", {
        data: { action: "join", code: circle.invite },
      })
    ).ok(),
  ).toBe(true);
  const upload = await (
    await a.post("/api/upload", {
      multipart: {
        file: {
          name: "photo.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6gYQAAAAASUVORK5CYII=",
            "base64",
          ),
        },
      },
    })
  ).json();
  const posted = await (
    await a.post("/api/action", {
      data: {
        action: "post",
        circleId: circle.id,
        body: "Shared with members",
        image: upload.id,
        visibility: "circle",
      },
    })
  ).json();
  const postId = posted.posts[0].id;
  await a.post("/api/action", {
    data: {
      action: "post",
      circleId: circle.id,
      body: "Secret journal",
      visibility: "private",
    },
  });
  const memberState = await (await b.get("/api/state")).json(),
    outsiderState = await (await c.get("/api/state")).json();
  expect(
    memberState.posts
      .filter((p: any) => p.visibility !== "public")
      .map((p: any) => p.body),
  ).toEqual(["Shared with members"]);
  expect(
    outsiderState.posts.filter((p: any) => p.visibility !== "public"),
  ).toEqual([]);
  expect((await b.get(`/api/media/${upload.id}`)).status()).toBe(200);
  expect((await c.get(`/api/media/${upload.id}`)).status()).toBe(404);
  expect(
    (
      await c.post("/api/action", {
        data: { action: "react", postId, kind: "heart" },
      })
    ).status(),
  ).toBe(400);
  await b.post("/api/action", {
    data: { action: "leave", circleId: circle.id },
  });
  expect((await b.get(`/api/media/${upload.id}`)).status()).toBe(404);
  await a.dispose();
  await b.dispose();
  await c.dispose();
});

test("dictation stays available and voice-note uploads are disabled", async ({
  page,
}) => {
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await openGratitude(page);
  await expect(
    page.getByRole("button", { name: "Dictate", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record a voice note" }),
  ).toHaveCount(0);
  expect(
    (await page.request.post("http://localhost:3005/api/audio")).status(),
  ).toBe(410);
  expect(
    (
      await page.request.post("http://localhost:3005/api/action", {
        data: {
          action: "post",
          body: "Audio must be rejected",
          visibility: "private",
          audio: "old-audio",
        },
      })
    ).status(),
  ).toBe(400);
});

test("social sign-in unavailable state is honest and email remains usable", async ({
  page,
}) => {
  await page.goto("http://localhost:3005");
  await expect(
    page.getByRole("button", { name: "Continue with Apple" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Continue with Facebook" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Social sign-in is coming soon.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/signup-social.png",
    fullPage: true,
  });
  await expect(page.locator(".social-button").first()).toHaveText(
    "Continue with Apple",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/signup-social-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await page.goto(
    "http://localhost:3005/?auth_error=cancelled&invite=example-code",
  );
  await expect(
    page.getByText("Sign-in was cancelled. You can try again or use email."),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("invite")).toBe("example-code");
});

test("shared posts have share cards; private export is deliberate and produces an image", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(
    page
      .locator("article")
      .getByRole("button", { name: "Share image", exact: true }),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "My journal", exact: true }).click();
  await openGratitude(page);
  await page
    .getByLabel("I’m grateful for…")
    .fill("A small thing that meant the world.");
  await page
    .getByRole("button", { name: "Save privately", exact: true })
    .click();
  await page.getByRole("button", { name: "Share image", exact: true }).click();
  await expect(
    page.getByText("This journal entry is private.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Preview of your gratitude sharing image" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").locator("textarea")).toHaveCount(0);
  const preview = page.getByRole("img", {
    name: "Preview of your gratitude sharing image",
  });
  expect((await preview.boundingBox())!.width).toBeGreaterThan(300);
  await page.screenshot({ path: "artifacts/share-preview-mobile.png" });
  await expect(
    page.getByRole("button", { name: "Save image", exact: true }),
  ).toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save image", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("my-gratitude.png");
  await download.saveAs("artifacts/share-card.png");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByText("A small thing that meant the world.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(
    page.getByText("A small thing that meant the world.", { exact: true }),
  ).toHaveCount(0);
});

test("mobile gratitude backgrounds preview, persist and export", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await openGratitude(page);
  const dialog = page.getByRole("dialog");
  await page
    .getByLabel("I’m grateful for…")
    .fill("The sunlight through the trees on our walk home.");
  await page
    .getByRole("button", { name: "Sage background", exact: true })
    .click();
  await expect(dialog.locator(".gratitude-visual")).toHaveAttribute(
    "data-theme",
    "sage",
  );
  await page.getByRole("button", { name: "Make an image for me" }).click();
  await expect(
    dialog.getByText(
      /AI image creation is not connected|Create your own account to generate/,
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Woodland background", exact: true })
    .click();
  await dialog.screenshot({ path: "artifacts/background-composer-mobile.png" });
  await dialog
    .getByRole("button", { name: "Share gratitude", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  const card = page
    .locator(".gratitude-visual")
    .filter({ hasText: "The sunlight through the trees on our walk home." });
  await expect(card).toHaveAttribute("data-theme", "woodland");
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "artifacts/background-feed-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await card
    .locator("xpath=..")
    .getByRole("button", { name: "Share image", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save image", exact: true }),
  ).toBeEnabled();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save image", exact: true }).click();
  await (await downloaded).saveAs("artifacts/woodland-share-card.png");
});

async function openGratitude(page: import("@playwright/test").Page) {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const journal = await page
    .getByRole("heading", {
      name: "My journal",
      exact: true,
      includeHidden: true,
    })
    .count();
  await page
    .getByRole("button", { name: "Add gratitude", exact: true })
    .click();
  if (!journal) {
    await page.getByLabel("Selected circles", { exact: true }).check();
    await page.locator(".circle-choices input[type=checkbox]").first().check();
  }
}
