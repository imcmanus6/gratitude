"use client";
import { useEffect, useState } from "react";
function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}
export function PushReminders({ demo }: { demo: boolean }) {
  const [ready, setReady] = useState(false),
    [supported, setSupported] = useState(false),
    [enabled, setEnabled] = useState(false),
    [emailEnabled, setEmailEnabled] = useState(false),
    [emailConfigured, setEmailConfigured] = useState(false),
    [emailVerified, setEmailVerified] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [key, setKey] = useState<string | null>(null),
    [zone, setZone] = useState(""),
    [time, setTime] = useState("21:00");
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    let active = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setZone(timezone);
    const can =
      window.isSecureContext &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(can);
    (async () => {
      try {
        const res = await fetch("/api/push");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!active) return;
        setEmailConfigured(data.emailConfigured);
        setEmailVerified(data.emailVerified);
        setEmailEnabled(!!data.email);
        if (data.email?.timezone) setZone(data.email.timezone);
        if (data.email?.time) setTime(data.email.time);
        setKey(data.publicKey);
        if (can) {
          const reg = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (!active) return;
          setRegistration(reg);
          const saved = data.subscriptions.find(
            (s: { endpoint: string; timezone: string; time: string }) =>
              s.endpoint === sub?.endpoint,
          );
          setEnabled(!!saved && Notification.permission === "granted");
          if (saved) {
            setZone(saved.timezone);
            setTime(saved.time || "21:00");
          }
        }
      } catch {
        if (active)
          setMessage(
            "Could not load reminder settings. Reopen Settings to try again.",
          );
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function save(payload: unknown) {
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
  }
  async function changeTime(next: string) {
    if (!next) return;
    setTime(next);
    if (!enabled && !emailEnabled) return;
    setBusy(true);
    setMessage("");
    try {
      await save({ action: "time", time: next });
      setMessage(`Reminder time updated to ${formatTime(next)}.`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="settings-card">
      <h2 className="serif">Your daily gratitude reminder</h2>
      <p>
        A gentle reminder every evening at <strong>{formatTime(time)}</strong>,
        whether or not you’ve posted that day. No circle needed.
      </p>
      <label htmlFor="reminder-time">Remind me at</label>
      <input
        id="reminder-time"
        type="time"
        value={time}
        disabled={busy}
        onChange={(event) => void changeTime(event.currentTarget.value)}
      />
      {zone && (
        <p className="field-help">
          Time zone: {zone.replaceAll("_", " ")}. Daylight saving is handled
          automatically.
        </p>
      )}
      {!supported && ready && (
        <p className="field-help">
          On iPhone, open the live app in Safari, choose Share → Add to Home
          Screen, then open it from that icon to enable notifications. A
          supported browser and secure HTTPS address are required.
        </p>
      )}
      {demo && (
        <p className="field-help">
          Create your own account to enable phone reminders.
        </p>
      )}
      {ready && supported && !key && (
        <p className="field-help">
          Phone reminders are awaiting server configuration.
        </p>
      )}
      <button
        className="button primary"
        disabled={!ready || !supported || !key || !registration || busy || demo}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            if (enabled) {
              const sub = await registration!.pushManager.getSubscription();
              if (sub) {
                await save({ action: "disable", endpoint: sub.endpoint });
                await sub.unsubscribe();
              }
              setEnabled(false);
              setMessage("Daily reminders turned off on this device.");
            } else {
              const permission = await Notification.requestPermission();
              if (permission !== "granted")
                throw new Error(
                  "Notifications are not allowed. You can enable them in your browser or phone settings.",
                );
              const padded = key!.replace(/-/g, "+").replace(/_/g, "/");
              const applicationServerKey = Uint8Array.from(atob(padded), (c) =>
                c.charCodeAt(0),
              );
              const sub =
                (await registration!.pushManager.getSubscription()) ||
                (await registration!.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey,
                }));
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              try {
                await save({ subscription: sub.toJSON(), timezone, time });
              } catch (e) {
                await sub.unsubscribe();
                throw e;
              }
              setZone(timezone);
              setEnabled(true);
              setMessage(
                `Daily reminders enabled for ${formatTime(time)} on this device.`,
              );
            }
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "One moment…"
          : enabled
            ? "Turn off daily reminders"
            : `Remind me at ${formatTime(time)}`}
      </button>
      {enabled && (
        <button
          className="button"
          onClick={async () => {
            try {
              await registration!.showNotification("Your daily gratitude", {
                body: `This is how your ${formatTime(time)} reminder will look. Take a moment to notice the good.`,
                icon: "/icons/gratitude-192.png",
              });
              setMessage(
                "Preview sent to this device. This checks notification display, not scheduled delivery.",
              );
            } catch {
              setMessage(
                "Could not display a notification. Check your notification settings.",
              );
            }
          }}
        >
          Preview notification
        </button>
      )}
      <p>
        Prefer email? We can also send the {formatTime(time)} reminder to your
        account email.
      </p>
      {!emailConfigured && ready && (
        <p className="field-help">
          Email reminders are awaiting server configuration.
        </p>
      )}
      {!emailVerified && ready && emailConfigured && (
        <p className="field-help">
          Confirm your email address in Settings to receive email reminders.
        </p>
      )}
      <button
        className="button"
        disabled={!ready || demo || !emailConfigured || !emailVerified || busy}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            await save({
              action: emailEnabled ? "email-disable" : "email-enable",
              timezone:
                zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              time,
            });
            setEmailEnabled(!emailEnabled);
            setMessage(
              emailEnabled
                ? "Daily email reminders turned off."
                : `Daily email reminders enabled for ${formatTime(time)}.`,
            );
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "One moment…"
          : emailEnabled
            ? "Turn off email reminders"
            : `Email me at ${formatTime(time)}`}
      </button>
      {message && (
        <p role="status" className="field-help">
          {message}
        </p>
      )}
      <p className="field-help">
        Delivery may be delayed by your phone’s connection or notification
        settings. If you travel, turn reminders off and on to use your new time
        zone.
      </p>
    </div>
  );
}
