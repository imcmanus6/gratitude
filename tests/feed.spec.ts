import { verifiedAccount } from "./verified-account";
import { test, expect } from "@playwright/test";
test("feed-first mobile navigation and multi-circle audience", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(page.locator(".gratitude-visual")).toHaveCount(3);
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(
    page.getByText("Gratitude Circles is grateful for Meditate’s support."),
  ).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/feed-first-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Add gratitude", exact: true })
    .click();
  await page
    .getByLabel("I’m grateful for…")
    .fill("Grateful for both of my circles.");
  await page.getByLabel("Selected circles", { exact: true }).check();
  const checks = page.locator(".circle-choices input[type=checkbox]");
  await checks.nth(0).check();
  await checks.nth(1).check();
  await page
    .getByRole("button", { name: "Share gratitude", exact: true })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const res = await page.request.get("http://localhost:3005/api/state");
  const state = await res.json();
  const post = state.posts.find(
    (p: any) => p.body === "Grateful for both of my circles.",
  );
  expect(post.circle_ids.length).toBe(2);
  expect(post.visibility).toBe("circle");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "My journal", exact: true }).click();
  await expect(
    page.getByText("Grateful for both of my circles.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("public posts reach outsiders while multi-circle and private posts stay restricted", async ({
  playwright,
  page,
}) => {
  const contexts = await Promise.all(
    [1, 2, 3].map(() =>
      playwright.request.newContext({ baseURL: "http://localhost:3005" }),
    ),
  );
  const [a, b, c] = contexts;
  try {
    for (let i = 0; i < 3; i++) {
      expect(
        (
          await verifiedAccount(contexts[i], {
            data: {
              action: "signup",
              name: "Feed test",
              email: `feed-${Date.now()}-${i}@example.invalid`,
              password: "Testing-password-123",
            },
          })
        ).ok(),
      ).toBeTruthy();
    }
    const create = async (name: string) =>
      (
        await (
          await a.post("/api/action", {
            data: { action: "createCircle", name, kind: "friends" },
          })
        ).json()
      ).circles.find((x: any) => x.name === name);
    const one = await create("One"),
      two = await create("Two");
    await b.post("/api/action", { data: { action: "join", code: two.invite } });
    const send = async (
      visibility: string,
      body: string,
      circleIds: string[],
    ) =>
      await a.post("/api/action", {
        data: {
          action: "post",
          body,
          visibility,
          circleIds,
          background: "sage",
        },
      });
    expect(
      (await send("circle", "Multi-circle access", [one.id, two.id])).ok(),
    ).toBeTruthy();
    expect(
      (await send("private", "Private entry", [one.id])).ok(),
    ).toBeTruthy();
    expect((await send("public", "Public entry", [one.id])).ok()).toBeTruthy();
    const bs = await (await b.get("/api/state")).json(),
      cs = await (await c.get("/api/state")).json();
    expect(
      bs.posts.some((p: any) => p.body === "Multi-circle access"),
    ).toBeTruthy();
    expect(
      cs.posts.some((p: any) => p.body === "Multi-circle access"),
    ).toBeFalsy();
    expect(cs.posts.some((p: any) => p.body === "Public entry")).toBeTruthy();
    expect(bs.posts.some((p: any) => p.body === "Private entry")).toBeFalsy();
    const ownerState = await (await a.get("/api/state")).json();
    const source = ownerState.posts.find(
      (p: any) => p.body === "Public entry" && p.author === ownerState.user.id,
    );
    const thanks = await b.post("/api/action", {
      data: {
        action: "post",
        visibility: "direct",
        sourcePostId: source.id,
        body: "Thank you personally for being there.",
        background: "rose",
      },
    });
    expect(thanks.ok()).toBeTruthy();
    const received = await (await a.get("/api/state")).json();
    const personal = received.posts.find(
      (p: any) => p.body === "Thank you personally for being there.",
    );
    expect(personal.recipient).toBe(received.user.id);
    expect(personal.circle_ids).toEqual([]);
    const outsider = await (await c.get("/api/state")).json();
    expect(outsider.posts.some((p: any) => p.id === personal.id)).toBeFalsy();
    expect(
      (
        await c.post("/api/action", {
          data: { action: "react", postId: personal.id, kind: "heart" },
        })
      ).ok(),
    ).toBeFalsy();
    await page.context().addCookies((await a.storageState()).cookies);
    await page.goto("http://localhost:3005");
    await expect(page.locator("article").first()).toContainText(
      "Thank you personally for being there.",
    );
    await expect(page.locator("article").first()).toContainText("Just for you");
    await b.post("/api/action", {
      data: { action: "deletePost", postId: personal.id },
    });
    const senderState = await (await b.get("/api/state")).json();
    const senderPost = senderState.posts.find(
      (p: any) => p.body === "Multi-circle access",
    );
    // A recipient can reply publicly while preserving the addressed identity.
    const publicReply = await b.post("/api/action", {
      data: {
        action: "post",
        visibility: "public",
        sourcePostId: source.id,
        body: "@Feed test Thank you publicly.",
      },
    });
    expect(publicReply.ok()).toBeTruthy();
    const publicState = await publicReply.json();
    const publicThanks = publicState.posts.find(
      (p: any) => p.body === "@Feed test Thank you publicly.",
    );
    expect(publicThanks.recipient).toBe(ownerState.user.id);
    expect(
      (await (await c.get("/api/state")).json()).posts.some(
        (p: any) => p.id === publicThanks.id,
      ),
    ).toBeTruthy();
    expect(
      (
        await a.post("/api/action", {
          data: {
            action: "invitePerson",
            sourcePostId: publicThanks.id,
            circleId: one.id,
          },
        })
      ).ok(),
    ).toBeTruthy();
    const invited = await (await b.get("/api/state")).json();
    const invitation = invited.invitations.find(
      (i: any) => i.circle_id === one.id,
    );
    expect(invitation).toBeTruthy();
    expect(invited.circles.some((c: any) => c.id === one.id)).toBeFalsy();
    expect(
      (
        await c.post("/api/action", {
          data: {
            action: "respondInvitation",
            invitationId: invitation.id,
            accept: true,
          },
        })
      ).ok(),
    ).toBeFalsy();
    expect(
      (
        await b.post("/api/action", {
          data: {
            action: "respondInvitation",
            invitationId: invitation.id,
            accept: true,
          },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (await (await b.get("/api/state")).json()).circles.some(
        (c: any) => c.id === one.id,
      ),
    ).toBeTruthy();
    await b.post("/api/action", {
      data: { action: "deletePost", postId: publicThanks.id },
    });

    expect(
      (
        await c.post("/api/action", {
          data: {
            action: "post",
            body: "Unauthorized",
            visibility: "circle",
            circleIds: [one.id],
          },
        })
      ).ok(),
    ).toBeFalsy();
  } finally {
    const own = await (await a.get("/api/state")).json();
    for (const post of own.posts || [])
      if (post.author === own.user.id)
        await a.post("/api/action", {
          data: { action: "deletePost", postId: post.id },
        });
    await Promise.all(contexts.map((x) => x.dispose()));
  }
});

test("send a personal thank-you from a card and open the logo account menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page
    .locator(".gratitude-background")
    .first()
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: "artifacts/edge-feed-mobile.png" });
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: "Send gratitude", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("@Sophie");
  await page
    .getByLabel("I’m grateful for…")
    .fill("Thank you for reminding me to slow down.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send gratitude", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Account menu").click();
  await expect(
    page.getByRole("button", { name: "Log out", exact: true }),
  ).toBeVisible();
});

test("profile shows public posts only and reply prefills recipient with audience choice", async ({
  page,
}) => {
  await page.goto("http://localhost:3005");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page.getByRole("button", { name: "View Sophie’s profile" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "No public gratitudes yet.",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send gratitude", exact: true })
    .click();
  await expect(page.getByLabel("I’m grateful for…")).toHaveValue("@Sophie ");
  await page.getByLabel("Who can see this thank-you?").selectOption("public");
  await expect(page.getByRole("dialog")).toContainText(
    "visible on your public profile",
  );
});
