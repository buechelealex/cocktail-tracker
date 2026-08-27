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
