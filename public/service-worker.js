/* ---------------------------
   PUSH NOTIFICATIONS
--------------------------- */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json?.() ?? {};
  } catch (_e) {
    data = {};
  }

  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new update from MyThriveBuddy.",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: { url: (data.data && data.data.url) || data.url || "/dashboard/notifications" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).pathname === new URL(urlToOpen, self.location.origin).pathname && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/* Auto-resubscribe if Android drops the subscription */
self.addEventListener("pushsubscriptionchange", async (event) => {
  try {
    const appServerKey = self.__VAPID_PUBLIC_KEY__ ? urlBase64ToUint8Array(self.__VAPID_PUBLIC_KEY__) : null;
    const newSub = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey
    });
    // Optional: POST to your backend to update the subscription on change
    fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: newSub, reason: "pushsubscriptionchange" })
    });
  } catch (e) {
    // swallow
  }
});

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/* ---------------------------
   OFFLINE CACHING
--------------------------- */
const CACHE_NAME = "mtb-cache-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      OFFLINE_URL,
      "/icons/icon-192x192.png",
      "/icons/icon-512x512.png"
    ]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((name) => (name !== CACHE_NAME ? caches.delete(name) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Never cache API calls or the service worker itself
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.endsWith("/service-worker.js")) {
    return; // Let the network handle it
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((response) => {
        if (response) return response;
        if (event.request.mode === "navigate") return caches.match(OFFLINE_URL);
      })
    )
  );
});
