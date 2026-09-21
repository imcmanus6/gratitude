import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
export { db } from "./database";
import { db } from "./database";
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function getUser(token?: string) {
  return token
    ? ((await db
        .prepare(
          "SELECT u.id,u.name,u.email,u.demo,s.feed_since FROM users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
        )
        .get(token, Date.now())) as
        | {
            id: string;
            name: string;
            email: string;
            demo: number;
            feed_since?: string;
          }
        | undefined)
    : undefined;
}
export async function membership(user: string, circle: string) {
  return (await db
    .prepare("SELECT * FROM members WHERE user_id=? AND circle_id=?")
    .get(user, circle)) as { role: string } | undefined;
}
export async function visiblePost(user: string, post: string) {
  return (await db
    .prepare(
      `SELECT p.* FROM posts p WHERE p.id=? AND (p.author=? OR (p.visibility='direct' AND p.recipient=?) OR p.visibility='public' OR (p.visibility='circle' AND EXISTS (SELECT 1 FROM members m WHERE (m.circle_id=p.circle_id OR m.circle_id IN (SELECT pc.circle_id FROM post_circles pc WHERE pc.post_id=p.id)) AND m.user_id=?)))`,
    )
    .get(post, user, user, user)) as
    | { id: string; author: string; circle_id: string; visibility: string }
    | undefined;
}
export async function state(user: {
  id: string;
  name: string;
  email: string;
  demo: number;
  feed_since?: string;
}) {
  const circles = await db
    .prepare(
      `SELECT c.*, m.role,m.muted,(SELECT COUNT(*) FROM members x WHERE x.circle_id=c.id) as members FROM circles c JOIN members m ON m.circle_id=c.id WHERE m.user_id=? ORDER BY c.rowid`,
    )
    .all(user.id);
  const posts = (await db
    .prepare(
      `SELECT p.*,u.name,(SELECT name FROM users WHERE id=p.recipient) as recipient_name,COALESCE((SELECT generated FROM uploads WHERE id=p.image),0) as image_generated,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='heart') as hearts,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='thanks') as thanks,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='heart' AND r.user_id=@user) as hearted,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='thanks' AND r.user_id=@user) as thanked
 FROM posts p JOIN users u ON u.id=p.author WHERE (p.author=@user OR (p.visibility='direct' AND p.recipient=@user) OR (p.visibility='public' AND u.demo=0 AND @demo=0) OR (p.visibility='circle' AND EXISTS(SELECT 1 FROM members m WHERE (m.circle_id=p.circle_id OR m.circle_id IN (SELECT pc.circle_id FROM post_circles pc WHERE pc.post_id=p.id)) AND m.user_id=@user))) AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.user_id=@user AND b.blocked_id=p.author) ORDER BY p.created DESC`,
    )
    .all({ user: user.id, demo: user.demo })) as any[];
  for (const post of posts) {
    post.circle_ids = (
      (await db
        .prepare(
          "SELECT pc.circle_id FROM post_circles pc JOIN members m ON m.circle_id=pc.circle_id WHERE pc.post_id=? AND m.user_id=?",
        )
        .all(post.id, user.id)) as { circle_id: string }[]
    ).map((c) => c.circle_id);
    post.comments = await db
      .prepare(
        "SELECT c.*,u.name FROM comments c JOIN users u ON u.id=c.author WHERE c.post_id=? AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.user_id=? AND b.blocked_id=c.author) ORDER BY c.created",
      )
      .all(post.id, user.id);
  }
  const sessions = await db
    .prepare(
      `SELECT s.*,(SELECT COUNT(*) FROM posts p WHERE p.session_id=s.id AND (p.visibility IN ('circle','public') OR p.author=?)) as entries FROM sessions s JOIN members m ON m.circle_id=s.circle_id WHERE m.user_id=? ORDER BY s.created DESC`,
    )
    .all(user.id, user.id);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    invitations: await db
      .prepare(
        "SELECT i.id,i.circle_id,c.name as circle_name,u.name as sender_name FROM circle_invitations i JOIN circles c ON c.id=i.circle_id JOIN users u ON u.id=i.sender WHERE i.recipient=? ORDER BY i.created DESC",
      )
      .all(user.id),
    feed_since: user.feed_since || "1970-01-01T00:00:00.000Z",
    circles,
    posts,
    sessions,
    demo: !!user.demo,
    complimentary_paid_access: process.env.GRATITUDE_COMPLIMENTARY_PAID_ACCESS !== "false",
    onboarding_complete: !!(
      (await db
        .prepare("SELECT onboarding_complete FROM users WHERE id=?")
        .get(user.id)) as { onboarding_complete: number }
    ).onboarding_complete,
  };
}
export async function createDemo() {
  const userId = id();
  const email = `demo-${userId}@example.invalid`;
  await db
    .prepare(
      "INSERT INTO users (id,name,email,password,demo) VALUES (?,?,?,?,1)",
    )
    .run(userId, "Alex", email, "disabled");
  const people = await Promise.all(
    ["Sophie", "James", "Maya"].map(async (name) => {
      const person = id();
      await db
        .prepare(
          "INSERT INTO users(id,name,email,password,demo) VALUES(?,?,?,?,1)",
        )
        .run(person, name, `${person}@example.invalid`, "disabled");
      return person;
    }),
  );
  const circles = await Promise.all(
    [
      [
        "The little things",
        "friends",
        "A little space for the people who make life brighter.",
        "What small moment made you smile today?",
        "daily",
        "21:00",
      ],
      [
        "Our family",
        "family",
        "Everyday moments. A lifetime of memories.",
        "Share three things you’re grateful for today.",
        "daily",
        "21:00",
      ],
      [
        "Friday reflections",
        "work",
        "A moment to appreciate our week, together.",
        "One professional gratitude. One personal gratitude.",
        "weekly",
        "12:00",
      ],
    ].map(async (c, i) => {
      const circle = id();
      await db
        .prepare(
          "INSERT INTO circles(id,name,kind,description,owner,invite,prompt,cadence,time,count) VALUES(?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          circle,
          c[0],
          c[1],
          c[2],
          userId,
          randomBytes(18).toString("hex"),
          c[3],
          c[4],
          c[5],
          i === 2 ? 2 : 3,
        );
      await Promise.all(
        [userId, ...people].map(
          async (person, j) =>
            await db
              .prepare(
                "INSERT INTO members(circle_id,user_id,role) VALUES(?,?,?)",
              )
              .run(circle, person, j === 0 ? "owner" : "member"),
        ),
      );
      return circle;
    }),
  );
  const bodies = [
    "A long walk with no destination. The air felt like the beginning of autumn, and for once I wasn’t thinking about what came next. Just really grateful to be here.",
    "Mum called just to tell me the tomatoes finally turned red. Twenty minutes about the garden. The ordinary things really are the big things.",
    "Grateful for a team that makes asking for help feel easy. And for the first cup of coffee before the world wakes up.",
  ];
  await Promise.all(
    bodies.map(
      async (body, i) =>
        await db
          .prepare(
            "INSERT INTO posts(id,circle_id,author,body,created,background) VALUES(?,?,?,?,?,?)",
          )
          .run(
            id(),
            circles[i],
            people[i],
            body,
            new Date(Date.now() - (i + 1) * 3600000).toISOString(),
            ["woodland", "rose", "sage"][i],
          ),
    ),
  );
  await db.exec(
    "INSERT OR IGNORE INTO post_circles SELECT id,circle_id FROM posts WHERE circle_id IS NOT NULL AND visibility='circle'",
  );
  return userId;
}
