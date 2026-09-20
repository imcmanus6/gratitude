import { validCardTheme } from "@/lib/card-themes";
import { validVibe } from "@/lib/vibes";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db, id, now, membership, visiblePost, state } from "@/lib/db";
import { currentUser, fail, sameOrigin, text } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await currentUser();
    const d = await request.json();
    let result: unknown;
    await db.transaction(async () => {
      const requireCircle = async (circle: string, owner = false) => {
        const m = await membership(user.id, circle);
        if (!m || (owner && m.role !== "owner"))
          throw new Error("You do not have access to this circle.");
      };
      const requirePost = async () => {
        const p = await visiblePost(user.id, d.postId);
        if (!p) throw new Error("This gratitude is unavailable.");
        return p;
      };
      switch (d.action) {
        case "completeOnboarding": {
          await db
            .prepare("UPDATE users SET onboarding_complete=1 WHERE id=?")
            .run(user.id);
          break;
        }
        case "createCircle": {
          const circle = id();
          const kind = text(d.kind, 30);
          if (
            ![
              "family",
              "friends",
              "partners",
              "work",
              "community",
              "custom",
            ].includes(kind)
          )
            throw new Error("Choose a circle type.");
          await db
            .prepare(
              "INSERT INTO circles(id,name,kind,description,owner,invite) VALUES(?,?,?,?,?,?)",
            )
            .run(
              circle,
              text(d.name, 80),
              kind,
              typeof d.description === "string"
                ? d.description.slice(0, 500)
                : "",
              user.id,
              randomBytes(18).toString("hex"),
            );
          await db
            .prepare(
              "INSERT INTO members(circle_id,user_id,role) VALUES(?,?,?)",
            )
            .run(circle, user.id, "owner");
          if (kind === "work")
            await db
              .prepare(
                "UPDATE circles SET prompt=?,cadence='weekly',day='Friday',time='12:00',count=2 WHERE id=?",
              )
              .run(
                "One professional gratitude. One personal gratitude.",
                circle,
              );
          result = { circleId: circle };
          break;
        }
        case "join": {
          const c = (await db
            .prepare("SELECT id FROM circles WHERE invite=?")
            .get(
              text(d.code, 100).split("/").pop()?.split("invite=").pop(),
            )) as { id: string } | undefined;
          if (!c)
            throw new Error(
              "That invitation was not found. Check the code and try again.",
            );
          await db
            .prepare(
              "INSERT OR IGNORE INTO members(circle_id,user_id) VALUES(?,?)",
            )
            .run(c.id, user.id);
          result = { circleId: c.id };
          break;
        }
        case "invitePerson": {
          await requireCircle(text(d.circleId, 100), true);
          const person = await visiblePost(user.id, text(d.sourcePostId, 100));
          if (!person || person.author === user.id)
            throw new Error("Choose another person to invite.");
          if (await membership(person.author, d.circleId))
            throw new Error("This person is already in that circle.");
          if (
            await db
              .prepare("SELECT 1 FROM blocks WHERE user_id=? AND blocked_id=?")
              .get(person.author, user.id)
          )
            throw new Error("This person cannot receive your invitation.");
          await db
            .prepare(
              "INSERT OR IGNORE INTO circle_invitations(id,circle_id,sender,recipient,created) VALUES(?,?,?,?,?)",
            )
            .run(id(), d.circleId, user.id, person.author, now());
          break;
        }
        case "respondInvitation": {
          const invite = (await db
            .prepare(
              "SELECT * FROM circle_invitations WHERE id=? AND recipient=?",
            )
            .get(text(d.invitationId, 100), user.id)) as
            { circle_id: string; sender: string } | undefined;
          if (!invite) throw new Error("This invitation is unavailable.");
          if (d.accept === true) {
            if (
              (await membership(invite.sender, invite.circle_id))?.role !==
              "owner"
            )
              throw new Error("This invitation is no longer valid.");
            await db
              .prepare(
                "INSERT OR IGNORE INTO members(circle_id,user_id) VALUES(?,?)",
              )
              .run(invite.circle_id, user.id);
          }
          await db
            .prepare("DELETE FROM circle_invitations WHERE id=?")
            .run(d.invitationId);
          break;
        }
        case "post": {
          if (d.audio)
            throw new Error(
              "Voice notes are no longer supported. Use dictation to write your gratitude.",
            );
          const background = d.background ?? (d.image ? "photo" : "linen");
          if (
            !validCardTheme(background) ||
            (background === "photo" && !d.image)
          )
            throw new Error("Choose a colour or attach a background photo.");
          const vibe = d.vibe ? d.vibe : null;
          if (vibe !== null && !validVibe(vibe))
            throw new Error("Unknown good-vibes icon.");
          const visibility = ["private", "circle", "public", "direct"].includes(
            d.visibility,
          )
            ? d.visibility
            : "circle";
          let recipient: string | null = null;
          if (visibility === "direct" || d.sourcePostId) {
            if (!["direct", "public"].includes(visibility))
              throw new Error("Choose private or public for this thank-you.");
            const source = await visiblePost(
              user.id,
              text(d.sourcePostId, 100),
            );
            if (!source || source.author === user.id)
              throw new Error("Choose another person to thank.");
            recipient = source.author;
            if (
              await db
                .prepare(
                  "SELECT 1 FROM blocks WHERE user_id=? AND blocked_id=?",
                )
                .get(recipient, user.id)
            )
              throw new Error("This person cannot receive your gratitude.");
          }
          const circleIds: string[] =
            visibility === "private" || visibility === "direct"
              ? []
              : Array.from(
                  new Set<string>(
                    Array.isArray(d.circleIds)
                      ? d.circleIds
                      : d.circleId
                        ? [d.circleId]
                        : [],
                  ),
                );
          if (circleIds.length > 30)
            throw new Error("Choose up to 30 circles.");
          for (const circleId of circleIds) await requireCircle(circleId);
          if (visibility === "circle" && !circleIds.length)
            throw new Error("Choose at least one circle.");
          d.circleId = circleIds[0] || null;
          if (d.sessionId) {
            const s = await db
              .prepare(
                "SELECT * FROM sessions WHERE id=? AND circle_id=? AND ended IS NULL",
              )
              .get(d.sessionId, d.circleId);
            if (!s)
              throw new Error(
                "This session has ended. You can still post to your circle.",
              );
          }
          if (
            d.image &&
            !(await db
              .prepare(
                "SELECT id FROM uploads WHERE id=? AND owner=? AND mime LIKE 'image/%'",
              )
              .get(d.image, user.id))
          )
            throw new Error("This image is unavailable.");
          if (
            d.audio &&
            !(await db
              .prepare(
                "SELECT id FROM uploads WHERE id=? AND owner=? AND mime LIKE ?",
              )
              .get(d.audio, user.id, "audio/%"))
          )
            throw new Error("This voice note is unavailable.");
          const postId = id();
          await db
            .prepare(
              "INSERT INTO posts(id,circle_id,author,body,image,audio,created,visibility,session_id,background,recipient,vibe) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            )
            .run(
              postId,
              d.circleId || null,
              user.id,
              text(d.body),
              d.image || null,
              d.audio || null,
              now(),
              visibility,
              d.sessionId || null,
              background,
              recipient,
              vibe,
            );
          for (const circleId of circleIds)
            await db
              .prepare(
                "INSERT INTO post_circles(post_id,circle_id) VALUES(?,?)",
              )
              .run(postId, circleId);
          break;
        }
        case "react": {
          await requirePost();
          if (!["heart", "thanks"].includes(d.kind))
            throw new Error("Unknown reaction.");
          const previous = await db
            .prepare(
              "SELECT 1 FROM reactions WHERE post_id=? AND user_id=? AND kind=?",
            )
            .get(d.postId, user.id, d.kind);
          if (previous)
            await db
              .prepare(
                "DELETE FROM reactions WHERE post_id=? AND user_id=? AND kind=?",
              )
              .run(d.postId, user.id, d.kind);
          else
            await db
              .prepare(
                "INSERT INTO reactions(post_id,user_id,kind) VALUES(?,?,?)",
              )
              .run(d.postId, user.id, d.kind);
          break;
        }
        case "comment": {
          await requirePost();
          await db
            .prepare(
              "INSERT INTO comments(id,post_id,author,body,created) VALUES(?,?,?,?,?)",
            )
            .run(id(), d.postId, user.id, text(d.body, 1000), now());
          break;
        }
        case "removeAudio": {
          const p = await requirePost();
          if (p.author !== user.id)
            throw new Error("Only the author can remove this voice note.");
          const audio = (
            (await db
              .prepare("SELECT audio FROM posts WHERE id=?")
              .get(d.postId)) as {
              audio: string | null;
            }
          )?.audio;
          await db
            .prepare("UPDATE posts SET audio=NULL WHERE id=?")
            .run(d.postId);
          if (audio)
            await db.prepare("DELETE FROM uploads WHERE id=?").run(audio);
          break;
        }
        case "editPost": {
          const p = await requirePost();
          if (p.author !== user.id)
            throw new Error("Only the author can edit this gratitude.");
          await db
            .prepare("UPDATE posts SET body=? WHERE id=?")
            .run(text(d.body), d.postId);
          break;
        }
        case "deletePost": {
          const p = await requirePost();
          if (p.author !== user.id) {
            await requireCircle(p.circle_id, true);
            if (p.visibility !== "circle")
              throw new Error("This entry is private.");
          }
          await db.prepare("DELETE FROM posts WHERE id=?").run(d.postId);
          break;
        }
        case "deleteComment": {
          const c = (await db
            .prepare("SELECT author,post_id FROM comments WHERE id=?")
            .get(d.commentId)) as
            { author: string; post_id: string } | undefined;
          if (!c || c.author !== user.id)
            throw new Error("You can only delete your own comments.");
          await db.prepare("DELETE FROM comments WHERE id=?").run(d.commentId);
          break;
        }
        case "ritual": {
          await requireCircle(d.circleId, true);
          if (
            !["daily", "weekly", "none"].includes(d.cadence) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time) ||
            ![
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].includes(d.day)
          )
            throw new Error("Choose a valid schedule.");
          try {
            new Intl.DateTimeFormat("en", { timeZone: d.timezone }).format();
          } catch {
            throw new Error("Enter a valid time zone, such as Europe/London.");
          }
          await db
            .prepare(
              "UPDATE circles SET prompt=?,cadence=?,day=?,time=?,timezone=?,count=? WHERE id=?",
            )
            .run(
              text(d.prompt, 500),
              d.cadence,
              d.day,
              d.time,
              text(d.timezone, 80),
              Math.max(1, Math.min(10, Number(d.count) || 3)),
              d.circleId,
            );
          break;
        }
        case "mute": {
          await requireCircle(d.circleId);
          await db
            .prepare(
              "UPDATE members SET muted=1-muted WHERE user_id=? AND circle_id=?",
            )
            .run(user.id, d.circleId);
          break;
        }
        case "leave": {
          await requireCircle(d.circleId);
          if ((await membership(user.id, d.circleId))?.role === "owner")
            throw new Error("The organiser cannot leave their circle.");
          await db
            .prepare("DELETE FROM members WHERE user_id=? AND circle_id=?")
            .run(user.id, d.circleId);
          break;
        }
        case "rotateInvite": {
          await requireCircle(d.circleId, true);
          await db
            .prepare("UPDATE circles SET invite=? WHERE id=?")
            .run(randomBytes(18).toString("hex"), d.circleId);
          break;
        }
        case "startSession": {
          await requireCircle(d.circleId, true);
          if (
            await db
              .prepare(
                "SELECT id FROM sessions WHERE circle_id=? AND ended IS NULL",
              )
              .get(d.circleId)
          )
            throw new Error("Your circle already has a live session.");
          await db
            .prepare(
              "INSERT INTO sessions(id,circle_id,host,prompt,created) VALUES(?,?,?,?,?)",
            )
            .run(id(), d.circleId, user.id, text(d.prompt, 500), now());
          break;
        }
        case "endSession": {
          const s = (await db
            .prepare("SELECT host FROM sessions WHERE id=? AND ended IS NULL")
            .get(d.sessionId)) as { host: string } | undefined;
          if (!s || s.host !== user.id)
            throw new Error("Only the host can close this session.");
          await db
            .prepare("UPDATE sessions SET ended=?,reflection=? WHERE id=?")
            .run(
              now(),
              typeof d.reflection === "string"
                ? d.reflection.slice(0, 2000)
                : "",
              d.sessionId,
            );
          break;
        }
        case "profile": {
          await db
            .prepare("UPDATE users SET name=? WHERE id=?")
            .run(text(d.name, 60), user.id);
          user.name = text(d.name, 60);
          break;
        }
        case "report": {
          await requirePost();
          await db
            .prepare(
              "INSERT INTO reports(id,post_id,reporter,reason,created) VALUES(?,?,?,?,?)",
            )
            .run(id(), d.postId, user.id, text(d.reason, 1000), now());
          break;
        }
        case "block": {
          const p = await requirePost();
          if (p.author === user.id)
            throw new Error("You cannot block yourself.");
          await db
            .prepare(
              "INSERT OR IGNORE INTO blocks(user_id,blocked_id) VALUES(?,?)",
            )
            .run(user.id, p.author);
          break;
        }
        default:
          throw new Error("Unknown action.");
      }
    })();
    return NextResponse.json({ ...(await state(user)), result });
  } catch (e) {
    return fail(e);
  }
}
