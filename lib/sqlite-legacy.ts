import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

let connection: Database.Database | undefined;
function connectionForRequest(): Database.Database {
  if (connection) return connection;
  const folder =
    process.env.GRATITUDE_DATA_DIR || path.join(process.cwd(), ".data");
  mkdirSync(folder, { recursive: true });
  const db = new Database(path.join(folder, "gratitude.sqlite"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, demo INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS oauth_identities (provider TEXT NOT NULL, subject TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(provider,subject), UNIQUE(user_id,provider));
CREATE TABLE IF NOT EXISTS oauth_attempts (state_hash TEXT PRIMARY KEY, browser_hash TEXT NOT NULL, provider TEXT NOT NULL, verifier TEXT NOT NULL, nonce TEXT NOT NULL, return_path TEXT NOT NULL, link_user TEXT REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions (token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_receipts (receipt_hash TEXT PRIMARY KEY, state_hash TEXT NOT NULL REFERENCES oauth_attempts(state_hash) ON DELETE CASCADE, browser_hash TEXT NOT NULL, payload TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, subscription TEXT NOT NULL, timezone TEXT NOT NULL, time TEXT NOT NULL DEFAULT '21:00', last_day TEXT, lease INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS circles (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', owner TEXT REFERENCES users(id), invite TEXT UNIQUE NOT NULL, prompt TEXT DEFAULT 'What are you grateful for today?', cadence TEXT DEFAULT 'daily', day TEXT DEFAULT 'Friday', time TEXT DEFAULT '21:00', timezone TEXT DEFAULT 'Europe/London', count INTEGER DEFAULT 3);
CREATE TABLE IF NOT EXISTS members (circle_id TEXT REFERENCES circles(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'member', muted INTEGER DEFAULT 0, PRIMARY KEY (circle_id,user_id));
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, circle_id TEXT REFERENCES circles(id) ON DELETE CASCADE, host TEXT REFERENCES users(id), prompt TEXT NOT NULL, created TEXT NOT NULL, ended TEXT, reflection TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, circle_id TEXT REFERENCES circles(id) ON DELETE CASCADE, author TEXT REFERENCES users(id), body TEXT NOT NULL, image TEXT, audio TEXT, created TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'circle', session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS reactions (post_id TEXT REFERENCES posts(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id), kind TEXT NOT NULL, PRIMARY KEY(post_id,user_id,kind));
CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT REFERENCES posts(id) ON DELETE CASCADE, author TEXT REFERENCES users(id), body TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, owner TEXT REFERENCES users(id), mime TEXT NOT NULL, data BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, post_id TEXT REFERENCES posts(id) ON DELETE CASCADE, reporter TEXT REFERENCES users(id), reason TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS blocks (user_id TEXT REFERENCES users(id), blocked_id TEXT REFERENCES users(id), PRIMARY KEY(user_id,blocked_id));
`);
  if (
    !(db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).some(
      (c) => c.name === "email_verified",
    )
  )
    db.exec(
      "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0",
    );
  db.exec(`CREATE TABLE IF NOT EXISTS email_tokens (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, purpose TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS email_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  if (
    !(db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).some(
      (c) => c.name === "onboarding_complete",
    )
  ) {
    db.exec(
      "ALTER TABLE users ADD COLUMN onboarding_complete INTEGER NOT NULL DEFAULT 0; UPDATE users SET onboarding_complete=1;",
    );
  }
  if (
    !(db.prepare("PRAGMA table_info(posts)").all() as { name: string }[]).some(
      (c) => c.name === "audio",
    )
  )
    db.exec("ALTER TABLE posts ADD COLUMN audio TEXT");
  db.exec(
    "CREATE TABLE IF NOT EXISTS api_keys (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, created INTEGER NOT NULL, last_used INTEGER)",
  );
  if (
    !(
      db.prepare("PRAGMA table_info(push_subscriptions)").all() as {
        name: string;
      }[]
    ).some((c) => c.name === "time")
  )
    db.exec(
      "ALTER TABLE push_subscriptions ADD COLUMN time TEXT NOT NULL DEFAULT '21:00'",
    );
  db.exec(
    "CREATE TABLE IF NOT EXISTS email_reminders (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, timezone TEXT NOT NULL, time TEXT NOT NULL DEFAULT '21:00', last_day TEXT, lease INTEGER NOT NULL DEFAULT 0)",
  );
  db.exec(`CREATE TABLE IF NOT EXISTS post_circles (post_id TEXT REFERENCES posts(id) ON DELETE CASCADE, circle_id TEXT REFERENCES circles(id) ON DELETE CASCADE, PRIMARY KEY(post_id,circle_id));
  INSERT OR IGNORE INTO post_circles SELECT id,circle_id FROM posts WHERE circle_id IS NOT NULL AND visibility='circle';`);
  if (
    !(db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).some(
      (c) => c.name === "last_login",
    )
  )
    db.exec(
      "ALTER TABLE users ADD COLUMN last_login TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
    );
  if (
    !(
      db.prepare("PRAGMA table_info(auth_sessions)").all() as { name: string }[]
    ).some((c) => c.name === "feed_since")
  )
    db.exec(
      "ALTER TABLE auth_sessions ADD COLUMN feed_since TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
    );
  db.exec(
    `CREATE TRIGGER IF NOT EXISTS track_gratitude_login AFTER INSERT ON auth_sessions BEGIN UPDATE auth_sessions SET feed_since=(SELECT last_login FROM users WHERE id=NEW.user_id) WHERE token=NEW.token; UPDATE users SET last_login=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.user_id; END;`,
  );
  if (
    !(db.prepare("PRAGMA table_info(posts)").all() as { name: string }[]).some(
      (c) => c.name === "recipient",
    )
  )
    db.exec("ALTER TABLE posts ADD COLUMN recipient TEXT REFERENCES users(id)");
  db.exec(
    `CREATE TABLE IF NOT EXISTS circle_invitations (id TEXT PRIMARY KEY, circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE, sender TEXT NOT NULL REFERENCES users(id), recipient TEXT NOT NULL REFERENCES users(id), created TEXT NOT NULL, UNIQUE(circle_id,recipient));`,
  );
  if (
    !(
      db.prepare("PRAGMA table_info(auth_sessions)").all() as { name: string }[]
    ).some((c) => c.name === "deletion_verified")
  )
    db.exec(
      "ALTER TABLE auth_sessions ADD COLUMN deletion_verified INTEGER NOT NULL DEFAULT 0",
    );
  if (
    !(
      db.prepare("PRAGMA table_info(oauth_attempts)").all() as {
        name: string;
      }[]
    ).some((c) => c.name === "intent")
  )
    db.exec(
      "ALTER TABLE oauth_attempts ADD COLUMN intent TEXT NOT NULL DEFAULT 'login'",
    );
  db.exec(
    "CREATE TABLE IF NOT EXISTS departure_feedback(id TEXT PRIMARY KEY,reason TEXT NOT NULL,comment TEXT NOT NULL,expires INTEGER NOT NULL)",
  );
  const postColumns = db.prepare("PRAGMA table_info(posts)").all() as {
    name: string;
  }[];
  if (!postColumns.some((c) => c.name === "background")) {
    db.exec(
      "ALTER TABLE posts ADD COLUMN background TEXT NOT NULL DEFAULT 'linen'",
    );
    db.exec("UPDATE posts SET background='photo' WHERE image IS NOT NULL");
  }
  if (!postColumns.some((c) => c.name === "vibe"))
    db.exec("ALTER TABLE posts ADD COLUMN vibe TEXT");
  const uploadColumns = db.prepare("PRAGMA table_info(uploads)").all() as {
    name: string;
  }[];
  if (!uploadColumns.some((c) => c.name === "generated"))
    db.exec(
      "ALTER TABLE uploads ADD COLUMN generated INTEGER NOT NULL DEFAULT 0",
    );
  db.exec(
    "CREATE TABLE IF NOT EXISTS image_generations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created INTEGER NOT NULL, status TEXT NOT NULL, upload_id TEXT REFERENCES uploads(id))",
  );
  connection = db;
  return db;
}
// Delay opening SQLite until a request needs it; Next's parallel build workers do not touch the database.
export const db = new Proxy({} as Database.Database, {
  get(_target, key) {
    const database = connectionForRequest();
    const value = Reflect.get(database, key);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
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
export function getUser(token?: string) {
  return token
    ? (db
        .prepare(
          "SELECT u.id,u.name,u.email,u.demo,s.feed_since FROM users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
        )
        .get(token, Date.now()) as
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
export function membership(user: string, circle: string) {
  return db
    .prepare("SELECT * FROM members WHERE user_id=? AND circle_id=?")
    .get(user, circle) as { role: string } | undefined;
}
export function visiblePost(user: string, post: string) {
  return db
    .prepare(
      `SELECT p.* FROM posts p WHERE p.id=? AND (p.author=? OR (p.visibility='direct' AND p.recipient=?) OR p.visibility='public' OR (p.visibility='circle' AND EXISTS (SELECT 1 FROM members m WHERE (m.circle_id=p.circle_id OR m.circle_id IN (SELECT pc.circle_id FROM post_circles pc WHERE pc.post_id=p.id)) AND m.user_id=?)))`,
    )
    .get(post, user, user, user) as
    | { id: string; author: string; circle_id: string; visibility: string }
    | undefined;
}
export function state(user: {
  id: string;
  name: string;
  email: string;
  demo: number;
  feed_since?: string;
}) {
  const circles = db
    .prepare(
      `SELECT c.*, m.role,m.muted,(SELECT COUNT(*) FROM members x WHERE x.circle_id=c.id) as members FROM circles c JOIN members m ON m.circle_id=c.id WHERE m.user_id=? ORDER BY c.rowid`,
    )
    .all(user.id);
  const posts = db
    .prepare(
      `SELECT p.*,u.name,(SELECT name FROM users WHERE id=p.recipient) as recipient_name,COALESCE((SELECT generated FROM uploads WHERE id=p.image),0) as image_generated,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='heart') as hearts,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='thanks') as thanks,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='heart' AND r.user_id=@user) as hearted,
 (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='thanks' AND r.user_id=@user) as thanked
 FROM posts p JOIN users u ON u.id=p.author WHERE (p.author=@user OR (p.visibility='direct' AND p.recipient=@user) OR (p.visibility='public' AND u.demo=0 AND @demo=0) OR (p.visibility='circle' AND EXISTS(SELECT 1 FROM members m WHERE (m.circle_id=p.circle_id OR m.circle_id IN (SELECT pc.circle_id FROM post_circles pc WHERE pc.post_id=p.id)) AND m.user_id=@user))) AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.user_id=@user AND b.blocked_id=p.author) ORDER BY p.created DESC`,
    )
    .all({ user: user.id, demo: user.demo }) as any[];
  for (const post of posts) {
    post.circle_ids = (
      db
        .prepare(
          "SELECT pc.circle_id FROM post_circles pc JOIN members m ON m.circle_id=pc.circle_id WHERE pc.post_id=? AND m.user_id=?",
        )
        .all(post.id, user.id) as { circle_id: string }[]
    ).map((c) => c.circle_id);
    post.comments = db
      .prepare(
        "SELECT c.*,u.name FROM comments c JOIN users u ON u.id=c.author WHERE c.post_id=? AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.user_id=? AND b.blocked_id=c.author) ORDER BY c.created",
      )
      .all(post.id, user.id);
  }
  const sessions = db
    .prepare(
      `SELECT s.*,(SELECT COUNT(*) FROM posts p WHERE p.session_id=s.id AND (p.visibility IN ('circle','public') OR p.author=?)) as entries FROM sessions s JOIN members m ON m.circle_id=s.circle_id WHERE m.user_id=? ORDER BY s.created DESC`,
    )
    .all(user.id, user.id);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    invitations: db
      .prepare(
        "SELECT i.id,i.circle_id,c.name as circle_name,u.name as sender_name FROM circle_invitations i JOIN circles c ON c.id=i.circle_id JOIN users u ON u.id=i.sender WHERE i.recipient=? ORDER BY i.created DESC",
      )
      .all(user.id),
    feed_since: user.feed_since || "1970-01-01T00:00:00.000Z",
    circles,
    posts,
    sessions,
    demo: !!user.demo,
    onboarding_complete: !!(
      db
        .prepare("SELECT onboarding_complete FROM users WHERE id=?")
        .get(user.id) as { onboarding_complete: number }
    ).onboarding_complete,
  };
}
export function createDemo() {
  const userId = id();
  const email = `demo-${userId}@example.invalid`;
  db.prepare(
    "INSERT INTO users (id,name,email,password,demo) VALUES (?,?,?,?,1)",
  ).run(userId, "Alex", email, "disabled");
  const people = ["Sophie", "James", "Maya"].map((name) => {
    const person = id();
    db.prepare(
      "INSERT INTO users(id,name,email,password,demo) VALUES(?,?,?,?,1)",
    ).run(person, name, `${person}@example.invalid`, "disabled");
    return person;
  });
  const circles = [
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
  ].map((c, i) => {
    const circle = id();
    db.prepare(
      "INSERT INTO circles(id,name,kind,description,owner,invite,prompt,cadence,time,count) VALUES(?,?,?,?,?,?,?,?,?,?)",
    ).run(
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
    [userId, ...people].forEach((person, j) =>
      db
        .prepare("INSERT INTO members(circle_id,user_id,role) VALUES(?,?,?)")
        .run(circle, person, j === 0 ? "owner" : "member"),
    );
    return circle;
  });
  const bodies = [
    "A long walk with no destination. The air felt like the beginning of autumn, and for once I wasn’t thinking about what came next. Just really grateful to be here.",
    "Mum called just to tell me the tomatoes finally turned red. Twenty minutes about the garden. The ordinary things really are the big things.",
    "Grateful for a team that makes asking for help feel easy. And for the first cup of coffee before the world wakes up.",
  ];
  bodies.forEach((body, i) =>
    db
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
  );
  db.exec(
    "INSERT OR IGNORE INTO post_circles SELECT id,circle_id FROM posts WHERE circle_id IS NOT NULL AND visibility='circle'",
  );
  return userId;
}
