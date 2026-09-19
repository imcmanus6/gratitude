"use client";
import { SeedHeart } from "@/components/seed-heart";
import { PushReminders } from "@/components/push-reminders";
import { InvitePeople } from "@/components/invite-people";
import { EmailRecovery } from "@/components/email-recovery";
import { useEffect, useState, useRef, Fragment, FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Heart,
  MessageCircle,
  Users,
  Home,
  BookOpen,
  Sun,
  Settings,
  Lock,
  Flower2,
  Leaf,
  Briefcase,
  Bell,
  BellOff,
  Search,
  Download,
  LogOut,
  ImagePlus,
  Trash2,
  Flag,
  UserX,
  Copy,
  Calendar,
  Mic,
  Menu,
  UserPlus,
} from "lucide-react";
import { GratitudeVisual } from "@/components/gratitude-visual";
import { BackgroundPicker } from "@/components/background-picker";
import { validCardTheme } from "@/lib/card-themes";
import { GratitudeReplyIcon } from "@/components/gratitude-reply-icon";
import { ReactionBar } from "@/components/reaction-bar";
import { ShareGratitude } from "@/components/share-gratitude";
import { SocialLogin } from "@/components/social-login";
import { authMessages } from "@/lib/auth-messages";
import { DeleteAccount } from "@/components/delete-account";
import { Logo } from "@/components/logo";
import { NaiLockup } from "@/components/nai-lockup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AppState, Circle, Post, Session } from "@/lib/types";
import { calendarEvent, ritualDue } from "@/lib/ritual";

type View =
  "home" | "circles" | "journal" | "sessions" | "memories" | "settings";
type Modal =
  "post" | "circle" | "join" | "invite" | "ritual" | "start" | "end" | null;
const circleIcons: Record<string, typeof Users> = {
  family: Home,
  friends: Flower2,
  work: Briefcase,
  partners: Heart,
  community: Users,
  custom: Leaf,
};
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const prompts = [
  "What small moment made you smile today?",
  "Who made your day a little better?",
  "What ordinary thing feels extraordinary when you stop to notice it?",
  "What is something your body helped you do today?",
  "What are you looking forward to?",
];
function timeAgo(date: string) {
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return mins < 1
    ? "Just now"
    : mins < 60
      ? `${mins}m ago`
      : mins < 1440
        ? `${Math.floor(mins / 60)}h ago`
        : new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });
}
function schedule(c: Circle) {
  return c.cadence === "none"
    ? "Whenever feels right"
    : `${c.cadence === "daily" ? "Every day" : `Every ${c.day}`} · ${c.time}`;
}
function download(filename: string, body: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function request(url: string, data?: unknown) {
  const res = await fetch(
    url,
    data
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      : undefined,
  );
  const body = await res.json();
  if (!res.ok)
    throw new Error(body.error || "Could not save. Please try again.");
  return body;
}

export default function App() {
  const [expandedSessions, setExpandedSessions] = useState<
    Record<string, boolean>
  >({});
  const [invitePeopleOpen, setInvitePeopleOpen] = useState(false);
  const [data, setData] = useState<AppState | null>(null),
    [loading, setLoading] = useState(true),
    [view, setView] = useState<View>("home"),
    [selected, setSelected] = useState("all"),
    [modal, setModal] = useState<Modal>(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState("");
  useEffect(() => {
    if (data) window.scrollTo(0, 0);
  }, [data?.user.id]);
  const [profile, setProfile] = useState<Post | null>(null),
    [inviteCircle, setInviteCircle] = useState("");
  const [directTo, setDirectTo] = useState<Post | null>(null);
  const [menuOpen, setMenuOpen] = useState(false),
    [postCircles, setPostCircles] = useState<string[]>([]);
  const [target, setTarget] = useState<Circle | null>(null),
    [live, setLive] = useState<Session | null>(null),
    [postCircle, setPostCircle] = useState(""),
    [audience, setAudience] = useState("circle"),
    [body, setBody] = useState(""),
    [photo, setPhoto] = useState<string | null>(null),
    [background, setBackground] = useState("linen"),
    [imageGenerated, setImageGenerated] = useState(false),
    [creatingImage, setCreatingImage] = useState(false),
    [uploading, setUploading] = useState(false),
    [recording, setRecording] = useState(false),
    [speech, setSpeech] = useState<any>(null),
    [pendingInvite, setPendingInvite] = useState("");
  const [invitePreview, setInvitePreview] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get("invite");
    if (invite) setPendingInvite(invite);
    const params = new URLSearchParams(window.location.search);
    if (params.has("delete_account")) setView("settings");
    if (params.get("connected")) {
      setView("settings");
      setToast(
        "Your social account is connected. You can use it next time you sign in.",
      );
    }

    request("/api/state")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!data) return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("auth_error");
    if (code) {
      setView("settings");
      setToast(authMessages[code] || authMessages.failed);
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [data?.user.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        request("/api/state")
          .then(setData)
          .catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, [!!data]);
  useEffect(() => {
    if (data && pendingInvite) {
      setModal("join");
      setForm({ code: pendingInvite });
      setPendingInvite("");
    }
  }, [data, pendingInvite]);
  useEffect(() => {
    if (modal !== "post") return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        `gratitude-draft-${data?.user.id}`,
        JSON.stringify({
          body,
          postCircle,
          postCircles,
          audience,
          background,
          photo,
          imageGenerated,
        }),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [
    body,
    postCircle,
    postCircles,
    audience,
    background,
    photo,
    imageGenerated,
    modal,
    data?.user.id,
  ]);
  useEffect(() => {
    if (!data) return;
    const check = () => {
      for (const c of data.circles) {
        const key = ritualDue(c);
        if (key && !localStorage.getItem(`reminder-${data.user.id}-${key}`)) {
          setToast(`${c.name}: ${c.prompt}`);
          localStorage.setItem(`reminder-${data.user.id}-${key}`, "seen");
        }
      }
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [data]);
  useEffect(() => {
    if (modal !== "join") {
      setInvitePreview(null);
      return;
    }
    let cancelled = false;
    setInvitePreview(null);
    const timer = setTimeout(() => {
      if (form.code)
        request(`/api/invite?code=${encodeURIComponent(form.code)}`)
          .then((value) => {
            if (!cancelled) setInvitePreview(value);
          })
          .catch((e) => {
            if (!cancelled) setInvitePreview({ error: e.message });
          });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.code, modal]);
  const notify = (message: string) => setToast(message);
  async function action(payload: Record<string, unknown>, message?: string) {
    setBusy(true);
    setError("");
    try {
      const next = await request("/api/action", payload);
      setData(next);
      if (message) notify(message);
      return next;
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      notify(message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  function open(which: Modal, c?: Circle) {
    setError("");
    setForm({});
    setTarget(c || null);
    setModal(which);
    if (which === "ritual" && c)
      setForm({
        prompt: c.prompt,
        cadence: c.cadence,
        day: c.day,
        time: c.time,
        timezone: c.timezone,
        count: String(c.count),
      });
    if (which === "start" && c) setForm({ prompt: c.prompt });
    if (which === "circle") setForm({ kind: "friends" });
  }
  function composer(circle?: Circle, session?: Session, privateEntry = false) {
    setError("");
    setDirectTo(null);
    setLive(session || null);
    setTarget(circle || null);
    setModal("post");
    setPhoto(null);
    let draft: any = {};
    try {
      draft = JSON.parse(
        localStorage.getItem(`gratitude-draft-${data?.user.id}`) || "{}",
      );
    } catch {}
    setBody(draft.body || "");
    setPostCircles(circle ? [circle.id] : draft.postCircles || []);
    setBackground(
      validCardTheme(draft.background) ? draft.background : "linen",
    );
    setPhoto(draft.photo || null);
    setImageGenerated(!!draft.imageGenerated);
    setPostCircle(circle?.id || draft.postCircle || data?.circles[0]?.id || "");
    setAudience(
      privateEntry
        ? "private"
        : circle
          ? "circle"
          : draft.audience || "private",
    );
  }
  function navigate(next: View) {
    window.scrollTo(0, 0);
    setMenuOpen(false);
    setView(next);
    setSelected("all");
    setQuery("");
  }
  function pickCircle(c: Circle) {
    setMenuOpen(false);
    setSelected(c.id);
    setView("home");
    setQuery("");
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const payload = new FormData();
      payload.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: payload });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setPhoto(result.id);
      setBackground("photo");
      setImageGenerated(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  function dictate() {
    if (recording) {
      speech?.stop();
      return;
    }
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setError(
        "Dictation is not available in this browser. You can use your keyboard’s microphone or type your gratitude.",
      );
      return;
    }
    const recognition = new Recognition();
    recognition.lang = navigator.language;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        text += event.results[i][0].transcript + " ";
      setBody((previous) =>
        `${previous}${previous ? " " : ""}${text}`.slice(0, 5000),
      );
    };
    recognition.onerror = () => {
      setRecording(false);
      setError(
        "Could not access dictation. Check your microphone permission or type your gratitude.",
      );
    };
    recognition.onend = () => setRecording(false);
    setSpeech(recognition);
    recognition.start();
    setRecording(true);
  }
  function close() {
    speech?.stop();
    setRecording(false);
    setModal(null);
    setError("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    let result: any = null;
    if (modal === "post") {
      speech?.stop();
      setRecording(false);
      result = await action(
        {
          action: "post",
          body,
          circleId: postCircle || null,
          circleIds: postCircles,
          visibility: directTo
            ? audience === "public"
              ? "public"
              : "direct"
            : audience,
          sourcePostId: directTo?.id,
          image: background === "photo" ? photo : null,
          background,
          sessionId: live?.id,
        },
        directTo
          ? `Your gratitude has been sent to ${directTo.name}.`
          : audience === "private"
            ? "Saved to your private journal."
            : "Your gratitude has been shared.",
      );
      if (result) {
        setBody("");
        localStorage.removeItem(`gratitude-draft-${data?.user.id}`);
      }
    }
    if (modal === "circle") {
      result = await action(
        { action: "createCircle", ...form },
        "Your circle is ready.",
      );
      if (result) {
        setSelected(result.result.circleId);
        setView("home");
      }
    }
    if (modal === "join") {
      result = await action(
        { action: "join", code: form.code },
        "Welcome to your circle.",
      );
      if (result) {
        setSelected(result.result.circleId);
        setView("home");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
    if (modal === "ritual")
      result = await action(
        { action: "ritual", circleId: target?.id, ...form },
        "Your ritual has been saved.",
      );
    if (modal === "start") {
      result = await action(
        { action: "startSession", circleId: target?.id, prompt: form.prompt },
        "Your circle session has started.",
      );
      if (result) setView("sessions");
    }
    if (modal === "end")
      result = await action(
        {
          action: "endSession",
          sessionId: live?.id,
          reflection: form.reflection,
        },
        "Your session has been gently closed.",
      );
    if (result) close();
  }
  function calendar(c: Circle) {
    download(`${c.name}-ritual.ics`, calendarEvent(c), "text/calendar");
    notify(
      "Calendar reminder downloaded. Open it in your calendar to add the ritual.",
    );
  }
  const field = (name: string, value: string) =>
    setForm((previous) => ({ ...previous, [name]: value }));
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NaiLockup variant="dark" />
        <span className="sr-only">Loading your circles</span>
      </div>
    );
  if (!data)
    return (
      <>
        {toast === "Your account and gratitudes have been deleted." && (
          <p className="notice" role="status">
            {toast}
          </p>
        )}
        <Welcome onLogin={setData} />
      </>
    );
  const circle = data.circles.find((c) => c.id === selected);
  const filtered = data.posts.filter(
    (p) =>
      (view !== "journal" || p.author === data.user.id) &&
      (view !== "home" || p.visibility !== "private") &&
      (selected === "all" || p.circle_ids?.includes(selected)) &&
      (!query ||
        `${p.body} ${p.name}`.toLowerCase().includes(query.toLowerCase())),
  );
  filtered.sort((a, b) => b.created.localeCompare(a.created));
  const activeSession = circle
    ? data.sessions.find((s) => s.circle_id === circle.id && !s.ended)
    : null;
  const title =
    view === "home"
      ? circle
        ? circle.name
        : "A little good, every day."
      : {
          circles: "Your people. Your circles.",
          journal: "My journal",
          sessions: "Be here, together.",
          memories: "The good stays with you.",
          settings: "Make yourself at home.",
        }[view];
  const sub =
    view === "home"
      ? circle
        ? circle.description
        : "Good things happen every day. This is where we notice them."
      : {
          circles: "Small circles. Meaningful connections.",
          journal:
            "Your gratitudes and memories, together. Each entry keeps its chosen audience.",
          sessions: "Gather in person or from wherever you are.",
          memories: "Revisit the people and moments that matter.",
          settings: "Your profile, your privacy, your own rhythm.",
        }[view];
  return (
    <div className="shell">
      {data.demo && (
        <div className="notice">
          You’re exploring a private demo with sample people and posts.{" "}
          <button
            className="underline"
            onClick={async () => {
              await request("/api/auth", { action: "logout" });
              setData(null);
            }}
          >
            Create your own account
          </button>
        </div>
      )}
      <InvitePeople
        key={data.user.id}
        data={data}
        open={
          invitePeopleOpen ||
          (!data.demo && !data.onboarding_complete && !pendingInvite && !modal)
        }
        onboarding={!data.demo && !data.onboarding_complete}
        onClose={() => setInvitePeopleOpen(false)}
        onUpdate={setData}
      />
      <header className="topbar minimal-topbar">
        <button
          className="text-button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={24} />
          {data.invitations?.length > 0 && (
            <span className="invitation-count">{data.invitations.length}</span>
          )}
        </button>
        <button
          className="button primary topbar-add"
          onClick={() => composer(circle, undefined, view === "journal")}
        >
          <Plus /> Add gratitude
        </button>
        <details className="account-dropdown">
          <summary aria-label="Account menu">
            <Logo variant="dark" className="w-10 h-10" priority />
          </summary>
          <div>
            <button
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                setInvitePeopleOpen(true);
              }}
            >
              Invite people
            </button>
            <button
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                navigate("settings");
              }}
            >
              Settings
            </button>
            <button
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                navigate("journal");
              }}
            >
              My journal
            </button>
            <button
              onClick={async () => {
                await request("/api/auth", { action: "logout" });
                setData(null);
              }}
            >
              Log out
            </button>
          </div>
        </details>
      </header>
      <Dialog
        open={!!profile}
        onOpenChange={(open) => {
          if (!open) setProfile(null);
        }}
      >
        <DialogContent className="profile-dialog">
          <DialogHeader>
            <DialogTitle>{profile?.name}</DialogTitle>
            <DialogDescription>Public gratitudes</DialogDescription>
          </DialogHeader>
          {profile && (
            <>
              <div className="profile-actions">
                {profile.author !== data.user.id && (
                  <>
                    <button
                      className="button"
                      onClick={() => {
                        const person = profile;
                        setProfile(null);
                        composer();
                        setDirectTo(person);
                        setBody(`@${person.name} `);
                        setAudience("private");
                      }}
                    >
                      <GratitudeReplyIcon size={22} />
                      Send gratitude
                    </button>
                    <label>
                      <span className="sr-only">Circle to invite to</span>
                      <select
                        aria-label="Circle to invite to"
                        value={inviteCircle}
                        onChange={(e) => setInviteCircle(e.target.value)}
                      >
                        <option value="">Choose your circle…</option>
                        {data.circles
                          .filter((c) => c.role === "owner")
                          .map((c) => (
                            <option value={c.id} key={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <button
                      className="button"
                      disabled={!inviteCircle || busy}
                      onClick={async () => {
                        if (
                          await action(
                            {
                              action: "invitePerson",
                              sourcePostId: profile.id,
                              circleId: inviteCircle,
                            },
                            "Circle invitation sent.",
                          )
                        )
                          setInviteCircle("");
                      }}
                    >
                      <UserPlus size={20} />
                      Invite to circle
                    </button>
                  </>
                )}
              </div>
              {data.posts
                .filter(
                  (p) =>
                    p.author === profile.author && p.visibility === "public",
                )
                .map((p) => (
                  <GratitudeVisual
                    key={p.id}
                    body={p.body}
                    theme={p.background}
                    image={p.image ? `/api/media/${p.image}` : null}
                    generated={!!p.image_generated}
                  />
                ))}
              {!data.posts.some(
                (p) => p.author === profile.author && p.visibility === "public",
              ) && <p className="field-help">No public gratitudes yet.</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
      <div className="layout">
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your space</DialogTitle>
              <DialogDescription>
                Your journal, circles and settings.
              </DialogDescription>
            </DialogHeader>
            <nav className="drawer-menu" aria-label="Main navigation">
              {data.invitations?.map((invite) => (
                <div className="direct-recipient" key={invite.id}>
                  <p>
                    {invite.sender_name} invited you to {invite.circle_name}.
                  </p>
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      action(
                        {
                          action: "respondInvitation",
                          invitationId: invite.id,
                          accept: true,
                        },
                        "You joined the circle.",
                      )
                    }
                  >
                    Accept invitation
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      action(
                        {
                          action: "respondInvitation",
                          invitationId: invite.id,
                          accept: false,
                        },
                        "Invitation declined.",
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              ))}
              {(
                [
                  ["home", "Feed"],
                  ["journal", "My journal"],
                  ["circles", "Manage circles"],
                  ["sessions", "Sessions"],
                  ["settings", "Settings"],
                ] as const
              ).map(([id, label]) => (
                <button
                  className="button"
                  key={id}
                  onClick={() => navigate(id)}
                >
                  {label}
                </button>
              ))}
              <p className="eyebrow">YOUR CIRCLES</p>
              {data.circles.map((c) => (
                <button
                  className="button"
                  key={c.id}
                  onClick={() => pickCircle(c)}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          </DialogContent>
        </Dialog>
        <main
          className={`main ${view === "home" && !circle ? "main-feed" : ""}`}
        >
          <div className="heading">
            <div>
              <div className="eyebrow">
                {view === "home"
                  ? "YOUR EVERYDAY PRACTICE"
                  : view === "journal"
                    ? "YOUR MEMORIES"
                    : `YOUR ${view.toUpperCase()}`}
              </div>
              <h1 className="serif">{title}</h1>
              <p>{sub}</p>
            </div>
            {view === "circles" && (
              <button className="button primary" onClick={() => open("circle")}>
                <Plus /> Create a circle
              </button>
            )}
          </div>
          {view === "home" && circle && (
            <div className="flex flex-wrap gap-3 mb-6">
              <button className="button" onClick={() => open("invite", circle)}>
                <Users />
                Invite people
              </button>
              {circle.role === "owner" && (
                <>
                  <button
                    className="button"
                    onClick={() => open("ritual", circle)}
                  >
                    <Calendar />
                    Edit ritual
                  </button>
                  <button
                    className="button"
                    onClick={() =>
                      activeSession
                        ? navigate("sessions")
                        : open("start", circle)
                    }
                  >
                    <Sun />
                    {activeSession ? "Join live session" : "Start a session"}
                  </button>
                </>
              )}
              <button
                className="button"
                onClick={() =>
                  action(
                    { action: "mute", circleId: circle.id },
                    circle.muted ? "Reminders unmuted." : "Reminders muted.",
                  )
                }
                aria-label={circle.muted ? "Unmute circle" : "Mute circle"}
              >
                {circle.muted ? <BellOff /> : <Bell />}
                {circle.muted ? "Muted" : "Reminders on"}
              </button>
            </div>
          )}
          {["home", "journal", "memories"].includes(view) && (
            <div className="content-grid">
              <section>
                {view !== "home" && (
                  <div className="feed-toolbar">
                    <input
                      className="search"
                      aria-label="Search gratitudes"
                      placeholder="Find a moment…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                )}
                {filtered.length ? (
                  filtered.map((post, index) => (
                    <Fragment key={post.id}>
                      <PostCard
                        onProfile={(post) => {
                          setProfile(post);
                          setInviteCircle("");
                        }}
                        onSend={(post) => {
                          composer();
                          setDirectTo(post);
                          setBody(`@${post.name} `);
                          setAudience("private");
                        }}
                        key={post.id}
                        post={post}
                        userId={data.user.id}
                        circle={data.circles.find(
                          (c) => c.id === post.circle_id,
                        )}
                        action={action}
                        busy={busy}
                      />
                      {view === "home" &&
                        !data.complimentary_paid_access &&
                        !circle &&
                        !query &&
                        index % 6 === 2 && (
                          <SponsorCard
                            name={
                              Math.floor(index / 6) % 2
                                ? "Brief-ly"
                                : "Meditate"
                            }
                          />
                        )}
                    </Fragment>
                  ))
                ) : (
                  <div className="empty">
                    <Flower2 size={28} className="mx-auto text-neutral-400" />
                    <h2 className="serif">
                      {query
                        ? "A moment yet to be found."
                        : "Every good thing starts somewhere."}
                    </h2>
                    <p>
                      {query
                        ? "Try another word or clear your search."
                        : "A kind word. A quiet morning. Someone who showed up. Start with one small thing."}
                    </p>
                    {!query && (
                      <button
                        className="button"
                        onClick={() =>
                          composer(circle, undefined, view === "journal")
                        }
                      >
                        <Plus />
                        Write a gratitude
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
          {view === "circles" && (
            <>
              <div className="flex gap-3 mb-7">
                <button className="button" onClick={() => open("join")}>
                  <Users />
                  Join with an invite
                </button>
              </div>
              <div className="circle-grid">
                {data.circles.map((c) => (
                  <CircleCard
                    key={c.id}
                    circle={c}
                    onClick={() => pickCircle(c)}
                  />
                ))}
              </div>
              {!data.circles.length && (
                <div className="empty">
                  <Users className="mx-auto" />
                  <h2 className="serif">Make room for your people.</h2>
                  <p>
                    Family, friends, partners or your team. Start a circle and
                    invite them in.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => open("circle")}
                  >
                    Create a circle
                  </button>
                </div>
              )}
            </>
          )}
          {view === "sessions" && (
            <>
              <div className="settings-card">
                <div className="eyebrow">GATHER. SHARE. REMEMBER.</div>
                <h2 className="serif mt-4">A companion to your real circle.</h2>
                <p>
                  Start a session, share the prompt, then add what you said.
                  Everyone chooses whether their reflection stays private or is
                  shared with the circle.
                </p>
                <div className="flex gap-3 flex-wrap">
                  {data.circles
                    .filter((c) => c.role === "owner")
                    .map((c) => (
                      <button
                        className="button"
                        key={c.id}
                        onClick={() => open("start", c)}
                      >
                        <Sun />
                        {c.name}
                      </button>
                    ))}
                </div>
                {!data.circles.length && (
                  <button className="button" onClick={() => open("circle")}>
                    Create your first circle
                  </button>
                )}
              </div>
              {data.sessions.map((session) => {
                const c = data.circles.find((c) => c.id === session.circle_id);
                return (
                  <div className="session-card" key={session.id}>
                    <div className="eyebrow">
                      {!session.ended && <span className="live-dot" />}
                      {c?.name} · {session.ended ? "COMPLETE" : "LIVE NOW"}
                    </div>
                    <h2 className="serif">{session.prompt}</h2>
                    <p>
                      {new Date(session.created).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      · {session.entries}{" "}
                      {session.entries === 1 ? "reflection" : "reflections"}{" "}
                      {session.ended ? "saved" : "shared so far"}
                    </p>
                    {session.reflection && <p>{session.reflection}</p>}
                    {!session.ended ? (
                      <div className="flex gap-3 flex-wrap">
                        <button
                          className="button primary"
                          onClick={() => composer(c, session)}
                        >
                          Add what I shared
                        </button>
                        {session.host === data.user.id && (
                          <button
                            className="button"
                            onClick={() => {
                              open("end", c);
                              setLive(session);
                            }}
                          >
                            Close session
                          </button>
                        )}
                      </div>
                    ) : null}
                    <button
                      className="button mt-4"
                      aria-expanded={!!expandedSessions[session.id]}
                      aria-controls={`session-gratitudes-${session.id}`}
                      onClick={() =>
                        setExpandedSessions((current) => ({
                          ...current,
                          [session.id]: !current[session.id],
                        }))
                      }
                    >
                      {expandedSessions[session.id]
                        ? "Hide gratitudes"
                        : "View gratitudes"}
                    </button>
                    {expandedSessions[session.id] && (
                      <div
                        id={`session-gratitudes-${session.id}`}
                        className="mt-4"
                      >
                        {!data.posts.some(
                          (p) => p.session_id === session.id,
                        ) && (
                          <p className="field-help">
                            No gratitudes are available to you in this session
                            yet.
                          </p>
                        )}
                        {data.posts
                          .filter((p) => p.session_id === session.id)
                          .map((p) => (
                            <PostCard
                              onProfile={(post) => {
                                setProfile(post);
                                setInviteCircle("");
                              }}
                              onSend={(post) => {
                                composer();
                                setDirectTo(post);
                                setBody(`@${post.name} `);
                                setAudience("private");
                              }}
                              key={p.id}
                              post={p}
                              userId={data.user.id}
                              circle={c}
                              action={action}
                              busy={busy}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {view === "settings" && (
            <>
              <form
                className="settings-card"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = new FormData(e.currentTarget).get("name");
                  await action(
                    { action: "profile", name },
                    "Your profile has been updated.",
                  );
                }}
              >
                <h2 className="serif">Your profile</h2>
                <label htmlFor="profile-name">Your name</label>
                <input
                  id="profile-name"
                  name="name"
                  defaultValue={data.user.name}
                  required
                  maxLength={60}
                />
                <p className="mt-3">
                  {data.demo
                    ? "Demo account"
                    : data.user.email.endsWith("@identity.invalid")
                      ? "Social account"
                      : data.user.email}
                </p>
                <button className="button" disabled={busy}>
                  Save profile
                </button>
              </form>

              <div className="settings-card">
                <h2 className="serif">An easier way in.</h2>
                <p>
                  Connect Google to sign in without another
                  password. This does not give permission to publish your
                  gratitudes.
                </p>
                <SocialLogin link demo={data.demo} />
              </div>
              {data.complimentary_paid_access && (
                <div className="settings-card">
                  <h2 className="serif">Paid features, on us</h2>
                  <p>
                    Enjoy Gratitude Circles without ads, with AI backgrounds
                    included. No payment needed.
                  </p>
                  <p className="mt-3">
                    {data.demo
                      ? "Create a free account to generate your own AI images."
                      : "Make up to 5 AI images a day when capacity is available."}
                  </p>
                </div>
              )}
              <PushReminders demo={data.demo} />
              <div className="settings-card">
                <h2 className="serif">Your rhythm</h2>
                <p>
                  Circle schedules are shown in their chosen time zone. Calendar
                  reminders work even when this app is closed. You can mute the
                  in-app ritual reminders for any circle.
                </p>
                {data.circles.map((c) => (
                  <div
                    className="flex flex-wrap gap-3 items-center py-3 border-b"
                    key={c.id}
                  >
                    <span className="text-xs flex-1">
                      {c.name}
                      <span className="block muted mt-1">
                        {schedule(c)} · {c.timezone}
                      </span>
                    </span>
                    <button
                      className="button"
                      onClick={() => action({ action: "mute", circleId: c.id })}
                    >
                      {c.muted ? <BellOff /> : <Bell />}
                      {c.muted ? "Muted" : "On"}
                    </button>
                    {c.cadence !== "none" && (
                      <button className="button" onClick={() => calendar(c)}>
                        <Download />
                        Calendar
                      </button>
                    )}
                    {c.role !== "owner" && (
                      <button
                        className="text-button"
                        onClick={() => {
                          if (
                            confirm(
                              `Leave ${c.name}? Your shared posts will remain visible to its members.`,
                            )
                          )
                            action(
                              { action: "leave", circleId: c.id },
                              "You have left the circle.",
                            );
                        }}
                      >
                        Leave
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="settings-card">
                <h2 className="serif">Your words belong to you.</h2>
                <p>
                  Private journal entries are visible only to you. Circle posts
                  and their photos are visible to members of that circle. Your
                  export contains only your own entries and includes the text
                  and media references.
                </p>
                <button
                  className="button"
                  onClick={() =>
                    download(
                      "my-gratitudes.json",
                      JSON.stringify(
                        {
                          exportedAt: new Date().toISOString(),
                          entries: data.posts.filter(
                            (p) => p.author === data.user.id,
                          ),
                        },
                        null,
                        2,
                      ),
                    )
                  }
                >
                  <Download />
                  Export my gratitudes
                </button>
              </div>

              <button
                className="button"
                onClick={async () => {
                  await request("/api/auth", { action: "logout" });
                  setData(null);
                  navigate("home");
                }}
              >
                <LogOut />
                Sign out
              </button>
              <div className="mt-8">
                <DeleteAccount
                  onDeleted={() => {
                    const userId = data.user.id;
                    for (const storage of [localStorage, sessionStorage]) {
                      for (const key of Object.keys(storage))
                        if (key.includes(userId)) storage.removeItem(key);
                    }
                    setData(null);
                    navigate("home");
                    notify("Your account and gratitudes have been deleted.");
                  }}
                />
              </div>
            </>
          )}
        </main>
      </div>
      <Dialog
        open={!!modal}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="serif text-3xl">
              {
                (
                  {
                    post: live
                      ? "Add what you shared."
                      : "Notice something good.",
                    circle: "A circle starts with you.",
                    join: "Come into the circle.",
                    invite: "Good things, shared.",
                    ritual: "Find your shared rhythm.",
                    start: "Bring your circle together.",
                    end: "Close with a little gratitude.",
                  } as any
                )[modal || "post"]
              }
            </DialogTitle>
            <DialogDescription>
              {modal === "post"
                ? "A few words are enough. Choose who gets to see them."
                : modal === "invite"
                  ? "Anyone with this link can join. Share it with people you trust."
                  : modal === "ritual"
                    ? "A gentle invitation, never an obligation."
                    : "A small space to notice the good, together."}
            </DialogDescription>
          </DialogHeader>
          {modal === "invite" && target ? (
            <div>
              <label>Circle invitation link</label>
              <input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/?invite=${data.circles.find((c) => c.id === target.id)?.invite}`}
                onFocus={(e) => e.target.select()}
              />
              <div className="modal-actions">
                <button
                  className="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/?invite=${data.circles.find((c) => c.id === target.id)?.invite}`,
                      );
                      notify("Invite link copied.");
                    } catch {
                      notify("Select and copy the invitation link above.");
                    }
                  }}
                >
                  <Copy />
                  Copy invite
                </button>
                {target.role === "owner" && (
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        confirm(
                          "Replace the invitation link? The old link will stop working.",
                        )
                      )
                        action(
                          { action: "rotateInvite", circleId: target.id },
                          "The previous invitation link has been revoked.",
                        );
                    }}
                  >
                    Replace link
                  </button>
                )}
              </div>
              <p className="field-help">
                For people on another device, the app needs a shared hosted
                address. A localhost link only works on this computer.
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {modal === "post" && (
                <>
                  {directTo ? (
                    <div className="direct-recipient">
                      <strong>@{directTo.name}</strong>
                      <label htmlFor="thank-you-audience">
                        Who can see this thank-you?
                      </label>
                      <select
                        id="thank-you-audience"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      >
                        <option value="private">
                          Only you and {directTo.name}
                        </option>
                        <option value="public">
                          Public · everyone on Gratitude Circles
                        </option>
                      </select>
                      <p>
                        {audience === "public"
                          ? "This thank-you will be visible on your public profile and in the public feed."
                          : `Only you and ${directTo.name} can read this thank-you.`}
                      </p>
                    </div>
                  ) : (
                    <fieldset className="audience-picker">
                      <legend>Who can see this gratitude?</legend>
                      <label>
                        <input
                          type="radio"
                          name="audience-choice"
                          checked={audience === "private"}
                          onChange={() => setAudience("private")}
                        />
                        Only me · private journal
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="audience-choice"
                          checked={audience === "circle"}
                          onChange={() => setAudience("circle")}
                        />
                        Selected circles
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="audience-choice"
                          checked={audience === "public"}
                          onChange={() => setAudience("public")}
                        />
                        Public · everyone on Gratitude Circles
                      </label>
                      {audience !== "private" && (
                        <div className="circle-choices">
                          {data.circles.map((c) => (
                            <label key={c.id}>
                              <input
                                type="checkbox"
                                checked={postCircles.includes(c.id)}
                                disabled={!!live}
                                onChange={(e) =>
                                  setPostCircles(
                                    e.target.checked
                                      ? [...postCircles, c.id]
                                      : postCircles.filter((id) => id !== c.id),
                                  )
                                }
                              />
                              {c.name}
                            </label>
                          ))}
                          <p className="field-help">
                            {audience === "public"
                              ? "This entry is public, even when also shared with selected circles."
                              : "Only members of the circles you choose can read this entry."}
                          </p>
                        </div>
                      )}
                    </fieldset>
                  )}
                  {live && (
                    <p className="field-help">Session prompt: {live.prompt}</p>
                  )}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label htmlFor="gratitude-body" className="!mb-0">
                      I’m grateful for…
                    </label>
                    <button
                      type="button"
                      className="button"
                      aria-pressed={recording}
                      aria-controls="gratitude-body"
                      onClick={dictate}
                    >
                      <Mic />
                      {recording ? "Stop dictation" : "Dictate"}
                    </button>
                  </div>
                  <textarea
                    id="gratitude-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    maxLength={5000}
                    placeholder="The person, the moment, the little thing…"
                    rows={6}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="field-help">
                      Draft saved on this device.
                    </span>
                    <span className="field-help">{body.length}/5,000</span>
                  </div>
                  <BackgroundPicker
                    body={body}
                    theme={background}
                    photo={photo}
                    onSelect={setBackground}
                    onBusy={setCreatingImage}
                    onGenerated={(id) => {
                      setPhoto(id);
                      setBackground("photo");
                      setImageGenerated(true);
                    }}
                  />
                  <GratitudeVisual
                    body={body}
                    theme={background}
                    image={photo ? `/api/media/${photo}` : null}
                    generated={imageGenerated}
                    preview
                  />
                  <label className="button cursor-pointer">
                    <ImagePlus size={15} />
                    {uploading ? "Uploading photo…" : "Add a photo"}
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>

                  <p className="field-help">
                    <Lock size={11} className="inline mr-1" />
                    {directTo
                      ? audience === "public"
                        ? "This thank-you is public."
                        : `Only you and ${directTo.name} can read this gratitude.`
                      : audience === "private"
                        ? "Only you can read this entry."
                        : audience === "public"
                          ? "Everyone on Gratitude Circles can read this entry."
                          : "Members of your selected circles can read this entry."}{" "}
                    Dictation uses your browser’s speech service; no audio is
                    saved.
                  </p>
                </>
              )}
              {modal === "circle" && (
                <>
                  <label htmlFor="circle-name">Circle name</label>
                  <input
                    id="circle-name"
                    required
                    maxLength={80}
                    placeholder="The little things"
                    value={form.name || ""}
                    onChange={(e) => field("name", e.target.value)}
                  />
                  <label htmlFor="circle-type">Who is this circle for?</label>
                  <select
                    id="circle-type"
                    value={form.kind || "friends"}
                    onChange={(e) => field("kind", e.target.value)}
                  >
                    {[
                      "friends",
                      "family",
                      "partners",
                      "work",
                      "community",
                      "custom",
                    ].map((kind) => (
                      <option key={kind} value={kind}>
                        {kind[0].toUpperCase() + kind.slice(1)}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="purpose">A little about your circle</label>
                  <textarea
                    id="purpose"
                    maxLength={500}
                    placeholder="A space to appreciate the everyday, together."
                    value={form.description || ""}
                    onChange={(e) => field("description", e.target.value)}
                  />
                  <p className="field-help">
                    <Lock size={11} className="inline" /> Private,
                    invitation-only. You can set your shared ritual once your
                    circle is ready.
                  </p>
                </>
              )}
              {modal === "join" && (
                <>
                  <label htmlFor="invite-code">Invite link or code</label>
                  <input
                    id="invite-code"
                    required
                    value={form.code || ""}
                    onChange={(e) => field("code", e.target.value)}
                    placeholder="Paste your invitation here"
                  />
                  {invitePreview && (
                    <div className="ritual-card mt-5 mb-0">
                      {invitePreview.error ? (
                        <p className="error">{invitePreview.error}</p>
                      ) : (
                        <>
                          <div className="eyebrow">
                            {invitePreview.kind} · INVITED BY{" "}
                            {invitePreview.host}
                          </div>
                          <h2 className="serif">{invitePreview.name}</h2>
                          <p>{invitePreview.description}</p>
                          <p>
                            {invitePreview.members} members ·{" "}
                            {schedule(invitePreview)} · {invitePreview.timezone}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  <p className="field-help">
                    Joining gives you access to the circle’s shared posts. Your
                    personal journal stays private.
                  </p>
                </>
              )}
              {modal === "ritual" && (
                <>
                  <label htmlFor="prompt">Your circle’s prompt</label>
                  <textarea
                    id="prompt"
                    required
                    maxLength={500}
                    value={form.prompt || ""}
                    onChange={(e) => field("prompt", e.target.value)}
                  />
                  <label htmlFor="prompt-library">
                    Or start with a gentle prompt
                  </label>
                  <select
                    id="prompt-library"
                    value=""
                    onChange={(e) => field("prompt", e.target.value)}
                  >
                    <option value="">Choose a prompt…</option>
                    {[
                      ...prompts,
                      "One professional gratitude. One personal gratitude.",
                      "Share three things you’re grateful for today.",
                    ].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  <div className="two-col">
                    <div>
                      <label htmlFor="cadence">How often?</label>
                      <select
                        id="cadence"
                        value={form.cadence}
                        onChange={(e) => field("cadence", e.target.value)}
                      >
                        <option value="daily">Every day</option>
                        <option value="weekly">Every week</option>
                        <option value="none">No schedule</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quantity">Gratitudes per prompt</label>
                      <input
                        id="quantity"
                        type="number"
                        min={1}
                        max={10}
                        value={form.count}
                        onChange={(e) => field("count", e.target.value)}
                      />
                    </div>
                  </div>
                  {form.cadence === "weekly" && (
                    <>
                      <label htmlFor="day">Day</label>
                      <select
                        id="day"
                        value={form.day}
                        onChange={(e) => field("day", e.target.value)}
                      >
                        {days.map((day) => (
                          <option key={day}>{day}</option>
                        ))}
                      </select>
                    </>
                  )}
                  <div className="two-col">
                    <div>
                      <label htmlFor="time">Time</label>
                      <input
                        id="time"
                        type="time"
                        required
                        value={form.time}
                        onChange={(e) => field("time", e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="timezone">Time zone</label>
                      <input
                        id="timezone"
                        required
                        value={form.timezone}
                        onChange={(e) => field("timezone", e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="field-help">
                    Members can add the ritual to their calendar for reminders
                    when the app is closed.
                  </p>
                </>
              )}
              {modal === "start" && (
                <>
                  <label htmlFor="session-prompt">
                    What will your circle reflect on?
                  </label>
                  <textarea
                    id="session-prompt"
                    required
                    maxLength={500}
                    value={form.prompt || ""}
                    onChange={(e) => field("prompt", e.target.value)}
                  />
                  <p className="field-help">
                    Members can open Sessions to join the same prompt. The room
                    is never recorded. Each person chooses what to save after
                    speaking.
                  </p>
                </>
              )}
              {modal === "end" && (
                <>
                  <label htmlFor="reflection">
                    A closing reflection (optional)
                  </label>
                  <textarea
                    id="reflection"
                    maxLength={2000}
                    value={form.reflection || ""}
                    onChange={(e) => field("reflection", e.target.value)}
                    placeholder="What are you taking away from this time together?"
                  />
                  <p className="field-help">
                    Your session’s shared entries will stay together in its
                    record. Private entries remain private.
                  </p>
                </>
              )}
              {error && (
                <p className="error mt-4" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button type="button" className="button" onClick={close}>
                  {modal === "post" ? "Keep draft" : "Cancel"}
                </button>
                <button
                  className="button primary"
                  disabled={busy || uploading || creatingImage || recording}
                >
                  {busy
                    ? "Saving…"
                    : modal === "post"
                      ? audience === "private"
                        ? directTo
                          ? "Send gratitude"
                          : "Save privately"
                        : "Share gratitude"
                      : modal === "circle"
                        ? "Create circle"
                        : modal === "join"
                          ? "Join circle"
                          : modal === "start"
                            ? "Begin session"
                            : modal === "end"
                              ? "Close session"
                              : "Save ritual"}
                  <ArrowRight />
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
function CircleCard({
  circle,
  onClick,
  selected = false,
}: {
  circle: Circle;
  onClick: () => void;
  selected?: boolean;
}) {
  const Icon = circleIcons[circle.kind] || Users;
  return (
    <button
      className={`circle-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="circle-icon">
        <Icon />
      </div>
      <ArrowUpRight className="arrow" />
      <h3>{circle.name}</h3>
      <p>
        {circle.members} {circle.members === 1 ? "member" : "members"} ·{" "}
        {circle.kind}
      </p>
    </button>
  );
}
function PostCard({
  post,
  userId,
  circle,
  action,
  busy,
  onSend,
  onProfile,
}: {
  onProfile: (post: Post) => void;
  onSend: (post: Post) => void;
  post: Post;
  userId: string;
  circle?: Circle;
  action: (data: Record<string, unknown>, message?: string) => Promise<any>;
  busy: boolean;
}) {
  const [showComments, setShowComments] = useState(false),
    [comment, setComment] = useState(""),
    [menu, setMenu] = useState(false);
  return (
    <article className="post">
      {menu && (
        <div className="flex gap-4 flex-wrap mb-3">
          {post.author === userId && (
            <button
              className="text-button"
              onClick={() => {
                const body = prompt("Edit your gratitude", post.body);
                if (body)
                  action(
                    { action: "editPost", postId: post.id, body },
                    "Your gratitude has been updated.",
                  );
              }}
            >
              Edit words
            </button>
          )}
          {(post.author === userId || circle?.role === "owner") && (
            <button
              className="text-button"
              onClick={() => {
                if (
                  confirm(
                    "Delete this gratitude and its comments? This cannot be undone.",
                  )
                )
                  action(
                    { action: "deletePost", postId: post.id },
                    "Gratitude deleted.",
                  );
              }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
          {post.author !== userId && (
            <>
              <button
                className="text-button"
                onClick={() => {
                  const reason = prompt(
                    "Tell us what concerns you about this post.",
                  );
                  if (reason)
                    action(
                      { action: "report", postId: post.id, reason },
                      "Report saved for the app administrator.",
                    );
                }}
              >
                <Flag size={12} />
                Report
              </button>
              <button
                className="text-button"
                onClick={() => {
                  if (confirm(`Hide all posts and comments from ${post.name}?`))
                    action(
                      { action: "block", postId: post.id },
                      "This person’s posts are now hidden.",
                    );
                }}
              >
                <UserX size={12} />
                Hide this person
              </button>
            </>
          )}
        </div>
      )}
      <GratitudeVisual
        header={
          <>
            {" "}
            <div className="post-head">
              <button
                className="avatar"
                aria-label={`View ${post.name}’s profile`}
                onClick={() => onProfile(post)}
              >
                {post.name[0]}
              </button>
              <div className="flex-1">
                <button className="name" onClick={() => onProfile(post)}>
                  {post.name}
                  {post.author === userId ? " · you" : ""}
                </button>
                <div className="meta">
                  {post.visibility === "private" ? (
                    <>
                      <Lock size={9} className="inline" /> Only you
                    </>
                  ) : post.visibility === "direct" ? (
                    post.recipient === userId ? (
                      "Just for you"
                    ) : (
                      `For ${post.recipient_name}`
                    )
                  ) : post.visibility === "public" ? (
                    post.recipient_name ? (
                      `Public · for @${post.recipient_name}`
                    ) : (
                      "Public"
                    )
                  ) : (
                    `${circle?.name || "Your circles"}${post.circle_ids?.length > 1 ? ` + ${post.circle_ids.length - 1}` : ""}`
                  )}{" "}
                  <span className="mx-1">·</span> {timeAgo(post.created)}
                  {post.session_id ? " · Circle session" : ""}
                </div>
              </div>
              <button
                className="text-button px-2"
                aria-label={`Options for ${post.name}'s gratitude`}
                onClick={() => setMenu(!menu)}
              >
                •••
              </button>
            </div>
          </>
        }
        footer={
          <>
            {" "}
            <div className="post-actions">
              {(post.author === userId ||
                post.visibility === "public" ||
                post.visibility === "circle") && (
                <ShareGratitude
                  body={post.body}
                  attribution={post.author !== userId ? post.name : undefined}
                  background={post.background}
                  photo={post.image ? `/api/media/${post.image}` : null}
                  generated={!!post.image_generated}
                  isPrivate={post.visibility === "private"}
                  personal={post.visibility === "direct"}
                />
              )}
              <ReactionBar
                reactions={post.reactions ?? []}
                busy={busy}
                onReact={(kind) =>
                  action({ action: "react", postId: post.id, kind })
                }
              />

              {post.author !== userId && (
                <button onClick={() => onSend(post)}>
                  <GratitudeReplyIcon size={22} />
                  <span className="sr-only">Send gratitude</span>
                </button>
              )}
              {post.comments.length > 0 && (
                <button
                  aria-label="View comments"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle />
                  {post.comments.length}
                </button>
              )}
            </div>
          </>
        }
        body={post.body}
        theme={post.background}
        image={post.image ? `/api/media/${post.image}` : null}
        generated={!!post.image_generated}
      />
      {showComments && (
        <div className="comments">
          {post.comments.map((c) => (
            <div className="comment" key={c.id}>
              <strong>{c.name}</strong>
              <span>{c.body}</span>
              {c.author === userId && (
                <button
                  aria-label="Delete comment"
                  className="text-button ml-3"
                  onClick={() =>
                    action({ action: "deleteComment", commentId: c.id })
                  }
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
          <form
            className="comment-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await action({
                  action: "comment",
                  postId: post.id,
                  body: comment,
                })
              )
                setComment("");
            }}
          >
            <input
              aria-label="Your kind word"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              maxLength={1000}
              placeholder="A kind word…"
            />
            <button
              className="button"
              aria-label="Post comment"
              disabled={busy}
            >
              <ArrowRight />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
function Welcome({ onLogin }: { onLogin: (data: AppState) => void }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [socialError, setSocialError] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("signin")) {
      setMode("login");
      setEmailOpen(true);
    }
    const code = url.searchParams.get("auth_error");
    if (code) {
      setSocialError(authMessages[code] || authMessages.failed);
      if (code === "email_exists") setEmailOpen(true);
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);
  const [mode, setMode] = useState("signup"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function auth(action: string, form?: FormData) {
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/auth", {
        action,
        name: form?.get("name"),
        email: form?.get("email"),
        password: form?.get("password"),
      });
      if (result.verificationRequired) {
        setError(
          "Please confirm your email before signing in. Check your inbox, or use Resend confirmation below.",
        );
        setMode("login");
        return;
      }
      onLogin(await request("/api/state"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="welcome">
      <section className="welcome-brand">
        <NaiLockup variant="dark" animated size="lg" />
        <h1 className="serif">
          Notice the good.
          <br />
          Together.
        </h1>
        <p>
          A quiet place for the little things. Share gratitude with your people,
          find a shared rhythm, and keep the moments that matter.
        </p>
        <div className="eyebrow mt-8">SMALL CIRCLES. FULLER LIVES.</div>
      </section>
      <section className="auth">
        <div className="eyebrow">WELCOME TO YOUR EVERYDAY PRACTICE</div>
        <h2 className="serif">
          {mode === "signup" ? "Start with something good." : "Welcome back."}
        </h2>
        <p className="text-sm muted leading-7">
          {mode === "signup"
            ? "Your journal is just for you. Your circles bring you together."
            : "Your people and your good moments are waiting."}
        </p>
        <SocialLogin />
        {socialError && (
          <p className="error mt-4" role="alert">
            {socialError}
          </p>
        )}
        <div className="auth-divider">or</div>
        {!emailOpen && (
          <button className="button" onClick={() => setEmailOpen(true)}>
            Continue with email <ArrowRight />
          </button>
        )}
        {emailOpen && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                auth(mode, new FormData(e.currentTarget));
              }}
            >
              {mode === "signup" && (
                <>
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="given-name"
                    required
                    maxLength={60}
                    placeholder="What should we call you?"
                  />
                </>
              )}
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "signup" ? 10 : 1}
                maxLength={128}
                placeholder={
                  mode === "signup" ? "At least 10 characters" : "Your password"
                }
              />
              {error && (
                <p role="alert" className="error mt-4">
                  {error}
                </p>
              )}
              <button className="button primary" disabled={busy}>
                {busy
                  ? "One moment…"
                  : mode === "signup"
                    ? "Create your account"
                    : "Sign in"}
                <ArrowRight />
              </button>
            </form>
            <EmailRecovery />
            <button
              className="text-button mx-auto mt-5"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError("");
              }}
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </>
        )}
        <div className="border-t mt-7 pt-2">
          <button
            className="button"
            disabled={busy}
            onClick={() => auth("demo")}
          >
            Explore the demo <ArrowUpRight />
          </button>
          <p className="field-help text-center">
            A private demo with sample circles. No email needed.
          </p>
        </div>
      </section>
    </div>
  );
}

function SponsorCard({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  return (
    <aside
      className={`sponsor-card ${name === "Meditate" ? "meditate-sponsor" : ""}`}
    >
      {name === "Meditate" && (
        <div className="meditate-sponsor-art">
          <SeedHeart className="meditate-sponsor-symbol" />
          <span className="meditate-sponsor-name">MEDITATE</span>
          <p className="serif">A little space to breathe.</p>
        </div>
      )}
      <h2>Gratitude Circles is grateful for {name}’s support.</h2>
      {name === "Brief-ly" ? (
        <>
          <p>
            Brief-ly offers a knowledge base, habit tracker and AI agents, and
            is giving away AI credits to new joiners.
          </p>
          <p>
            <a
              className="text-button underline"
              href="https://brief-ly.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here to learn more <ArrowUpRight size={14} />
            </a>
          </p>
        </>
      ) : (
        <>
          <p>
            Slow down with guided meditations and gentle breathing. A few quiet
            minutes for you, alongside your daily gratitude.
          </p>
          <p>
            <a
              className="text-button underline"
              href="https://meditate.iskind.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Meditate <ArrowUpRight size={14} />
            </a>
          </p>
        </>
      )}
      <div className="sponsor-footer">
        <button
          className="text-button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          Own a business? Sponsor a spot.
        </button>
        <button
          className="text-button sponsor-upgrade"
          onClick={() => setUpgradeOpen(!upgradeOpen)}
          aria-expanded={upgradeOpen}
        >
          Remove ads and upgrade!
        </button>
      </div>
      {upgradeOpen && (
        <p className="field-help" role="status">
          An ad-free upgrade is coming soon. Gratitude will remain free to use.
        </p>
      )}
      {expanded && (
        <p className="field-help">
          Sponsor spots will help keep Gratitude Circles free. Booking is coming
          soon.
        </p>
      )}
    </aside>
  );
}
