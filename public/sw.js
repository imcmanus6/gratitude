self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || "Your daily gratitude", {
    body: data.body || "Take a moment to notice the good.",
    icon: "/icons/gratitude-192.png", badge: "/icons/gratitude-192.png",
    tag: data.tag || "daily-gratitude", data: {url: "/"}
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate("/"); return existing.focus(); }
    return self.clients.openWindow("/");
  })());
});
