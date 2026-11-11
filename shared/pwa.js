// Meldet den Service Worker an. Liegt in shared/, wird aber von Seiten in
// unterschiedlichen Ordnern geladen - deshalb wird der Pfad zu sw.js aus der
// Adresse dieser Datei abgeleitet statt aus der Adresse der Seite.
if ("serviceWorker" in navigator && document.currentScript) {
  const swUrl = new URL("../sw.js", document.currentScript.src).href;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl).catch(err => {
      // Ohne Service Worker laeuft die App normal weiter, nur eben nicht offline.
      console.warn("Service Worker nicht angemeldet:", err);
    });
  });
}

// Die beiden anderen Seiten im Hintergrund vorladen (Speculation Rules). Der
// Wechsel über die Reiter ist dann sofort da, statt dass Chrome neu lädt und
// oben den Ladebalken zeigt. Browser ohne diese Funktion laden wie bisher.
function prerenderOtherPages() {
  if (!HTMLScriptElement.supports || !HTMLScriptElement.supports("speculationrules")) return;
  if (navigator.connection && navigator.connection.saveData) return; // Datensparmodus
  const urls = [...document.querySelectorAll(".page-nav a:not(.active)")].map(a => a.href);
  if (urls.length === 0) return;
  const rules = document.createElement("script");
  rules.type = "speculationrules";
  rules.textContent = JSON.stringify({
    prerender: [{ source: "list", urls: urls, eagerness: "immediate" }]
  });
  document.head.appendChild(rules);
}

// Erst wenn die Seite selbst sichtbar und fertig geladen ist - eine vorgeladene
// Seite soll nicht ihrerseits weitere Seiten vorladen.
whenVisible(() => {
  if (document.readyState === "complete") prerenderOtherPages();
  else window.addEventListener("load", prerenderOtherPages, { once: true });
});
