// Service Worker: legt alle Dateien der App im Cache ab, damit sie ohne Netz
// startet. Notwendig fuer die Installation als PWA und fuer die Android-App
// (Trusted Web Activity), die sonst ohne Verbindung eine Fehlerseite zeigt.
//
// WICHTIG beim Aendern von CSS oder JavaScript: VERSION hier genauso hochzaehlen
// wie die ?v=-Marken in den drei HTML-Dateien. Der Cache haengt am Namen, ein
// neuer Name ersetzt den alten komplett.
const VERSION = "v7";
const CACHE = "barcheck-" + VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png?v=7",
  "./icon-maskable-512.png?v=7",
  "./shared/base.css?v=7",
  "./shared/data.js?v=7",
  "./shared/lists.js?v=7",
  "./shared/pwa.js?v=7",
  "./rate/style.css?v=7",
  "./rate/catalog.js?v=7",
  "./rate/script.js?v=7",
  "./counter/",
  "./counter/index.html",
  "./counter/style.css?v=7",
  "./counter/script.js?v=7",
  "./stats/",
  "./stats/index.html",
  "./stats/style.css?v=7",
  "./stats/alcohol.js?v=7",
  "./stats/share.js?v=7",
  "./stats/script.js?v=7"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // Einzeln statt addAll: eine fehlende Datei wuerde sonst die komplette
      // Installation scheitern lassen und die App bliebe ohne Cache.
      .then(cache => Promise.all(ASSETS.map(url =>
        cache.add(url).catch(err => console.warn("nicht im Cache:", url, err))
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith("barcheck-") && k !== CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe zuerst aus dem Netz: so kommt eine neu veroeffentlichte
  // Fassung an, ohne dass jemand den Cache leeren muss. Ohne Netz aus dem Cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)
          .then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  // CSS, JS und Bilder tragen eine ?v=-Marke und aendern sich unter derselben
  // Adresse nie - daher zuerst aus dem Cache.
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
