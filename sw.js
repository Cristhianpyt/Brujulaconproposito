// ════════════════════════════════════════════════════════════
// Service Worker — Brújula Joven
// Permite que las notificaciones se muestren incluso si la
// pestaña no está activa en primer plano (mientras el navegador
// siga corriendo en segundo plano o la PWA esté instalada).
// ════════════════════════════════════════════════════════════

const CACHE_NAME = "brujula-joven-v1";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Recibe el mensaje desde la app principal para mostrar la notificación.
// Esto permite disparar la notificación desde un setTimeout en la página,
// pero que la muestre el Service Worker (más confiable en segundo plano
// y necesario en algunos navegadores Android para que se vea con ícono y acciones).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = event.data.payload;
    self.registration.showNotification(title, {
      body: body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: tag || "brujula-recordatorio",
      renotify: true,
      vibrate: [120, 60, 120],
      data: { url: "./index.html" }
    });
  }
});

// Al tocar la notificación, abre o enfoca la app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes("index.html"));
      if (existing) return existing.focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
