import { db, id, now } from "./db";
export async function deletionPlan(user: string) {
  return await Promise.all(
    (
      (await db
        .prepare("SELECT id,name FROM circles WHERE owner=?")
        .all(user)) as {
        id: string;
        name: string;
      }[]
    ).map(async (c) => ({
      ...c,
      otherPosts: (
        (await db
          .prepare(
            "SELECT COUNT(*) n FROM posts WHERE circle_id=? AND author<>?",
          )
          .get(c.id, user)) as { n: number }
      ).n,
      members: await db
        .prepare(
          "SELECT u.id,u.name FROM members m JOIN users u ON u.id=m.user_id WHERE m.circle_id=? AND u.id<>?",
        )
        .all(c.id, user),
    })),
  );
}
export async function deleteAccount(
  user: string,
  choices: Record<string, string>,
  feedback?: { reason?: string; comment?: string },
) {
  await db.transaction(async () => {
    const plan = await deletionPlan(user);
    for (const c of plan) {
      const choice = choices[c.id];
      if (!choice) throw new Error(`Choose what happens to ${c.name}.`);
      if (
        choice !== "delete" &&
        !(c.members as { id: string }[]).some((m) => m.id === choice)
      )
        throw new Error("Choose a current member as the new owner.");
    }
    await db.prepare("DELETE FROM posts WHERE author=?").run(user);
    for (const c of plan) {
      const choice = choices[c.id];
      if (choice === "delete") {
        // Keep cross-posted content in its other circles instead of cascading it away.
        await db
          .prepare(
            "UPDATE posts SET circle_id=(SELECT pc.circle_id FROM post_circles pc WHERE pc.post_id=posts.id AND pc.circle_id<>? LIMIT 1) WHERE circle_id=? AND EXISTS(SELECT 1 FROM post_circles pc WHERE pc.post_id=posts.id AND pc.circle_id<>?)",
          )
          .run(c.id, c.id, c.id);
        // Public and other members’ private entries survive the circle.
        await db
          .prepare(
            "UPDATE posts SET circle_id=NULL WHERE circle_id=? AND visibility IN ('public','private','direct')",
          )
          .run(c.id);
        await db.prepare("DELETE FROM circles WHERE id=?").run(c.id);
      } else {
        await db
          .prepare("UPDATE circles SET owner=? WHERE id=?")
          .run(choice, c.id);
        await db
          .prepare(
            "UPDATE members SET role='owner' WHERE circle_id=? AND user_id=?",
          )
          .run(c.id, choice);
      }
    }
    await db
      .prepare("UPDATE posts SET recipient=NULL WHERE recipient=?")
      .run(user);
    await db
      .prepare("UPDATE sessions SET host=NULL,reflection='' WHERE host=?")
      .run(user);
    for (const table of ["reactions", "comments"])
      await db
        .prepare(
          `DELETE FROM ${table} WHERE ${table === "reactions" ? "user_id" : "author"}=?`,
        )
        .run(user);
    await db.prepare("DELETE FROM reports WHERE reporter=?").run(user);
    await db
      .prepare("DELETE FROM blocks WHERE user_id=? OR blocked_id=?")
      .run(user, user);
    await db
      .prepare("DELETE FROM circle_invitations WHERE sender=? OR recipient=?")
      .run(user, user);
    await db.prepare("DELETE FROM image_generations WHERE user_id=?").run(user);
    await db.prepare("DELETE FROM uploads WHERE owner=?").run(user);
    await db.prepare("DELETE FROM users WHERE id=?").run(user);
    await db
      .prepare("DELETE FROM departure_feedback WHERE expires<?")
      .run(Date.now());
    if (feedback?.reason || feedback?.comment)
      await db
        .prepare(
          "INSERT INTO departure_feedback(id,reason,comment,expires) VALUES(?,?,?,?)",
        )
        .run(
          id(),
          feedback.reason || "",
          feedback.comment || "",
          Date.now() + 30 * 86400000,
        );
  })();
}
