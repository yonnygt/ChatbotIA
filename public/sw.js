// Service Worker for SuperMarket AI PWA
// Enables push notifications on mobile devices

const CACHE_NAME = "supermarket-ai-v1";

// Install — activate immediately
self.addEventListener("install", (event) => {
    console.log("[SW] Installing service worker...");
    self.skipWaiting();
});

// Activate — claim all clients immediately
self.addEventListener("activate", (event) => {
    console.log("[SW] Service worker activated");
    event.waitUntil(clients.claim());
});

// Push event — for future server-sent push notifications
self.addEventListener("push", (event) => {
    let data = { title: "SuperMarket AI", body: "Tienes una nueva actualización", icon: "/favicon.ico" };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || "/favicon.ico",
            badge: "/favicon.ico",
            vibrate: [200, 100, 200],
            tag: data.tag || "general",
            requireInteraction: false,
        })
    );
});

// Notification click — open/focus the app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // If there's already an open window, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow("/");
        })
    );
});
