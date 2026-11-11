// Teilen-Funktion der Zähler-Seite: zeichnet die Zählerstände als
// Story-Bild (1080 x 1920) auf ein Canvas und gibt es über die Web-Share-API
// weiter (z. B. an Instagram). Wo Teilen von Dateien nicht unterstützt wird,
// bleibt der Download als Rückfallebene.

const SHARE_W = 1080;
const SHARE_H = 1920;
const DAY = 24 * 60 * 60 * 1000;

// Farben des App-Symbols: dunkelblauer Grund, helle Schrift, Mint als Akzent.
const C = {
  bg: "#14213a",
  text: "#f4f7f5",
  muted: "#9aa6ba",
  mint: "#8fd0c6",
  line: "#2c3a56"
};
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const PERIODS = {
  today: { label: "Heute", badge: "Heute", from: () => startOfToday() },
  week: { label: "7 Tage", badge: "In den letzten 7 Tagen", from: () => Date.now() - 7 * DAY },
  all: { label: "Gesamt", badge: "Insgesamt", from: () => 0 }
};
let sharePeriod = "all";

const shareBtn = document.getElementById("shareBtn");
const shareOverlay = document.getElementById("shareOverlay");
const shareCanvas = document.getElementById("shareCanvas");
const closeShareBtn = document.getElementById("closeShareBtn");
const doShareBtn = document.getElementById("doShareBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareHint = document.getElementById("shareHint");
const periodBtns = [...document.querySelectorAll(".seg-btn")];

shareCanvas.width = SHARE_W;
shareCanvas.height = SHARE_H;

// --- Zeichen-Helfer ---

function setFont(ctx, weight, size, spacing) {
  ctx.font = weight + " " + size + "px " + FONT;
  ctx.letterSpacing = (spacing || 0) + "px"; // wird von älteren Browsern ignoriert
}

// Kürzt zu lange Cocktailnamen mit Auslassungszeichen.
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(cut + "…").width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return cut.trim() + "…";
}

// --- Daten für den gewählten Zeitraum ---

function shareStats() {
  const from = PERIODS[sharePeriod].from();
  // visibleLog() statt countLog: das Bild zeigt genau die Liste, die auf der
  // Seite ausgewählt ist.
  const entries = visibleLog().filter(e => (e.ts || 0) >= from);

  const byName = {};
  const byKind = new Map();
  entries.forEach(e => {
    byName[e.name] = (byName[e.name] || 0) + 1;
    const cat = categoryOf(e.name);
    const k = byKind.get(cat.id) || { cat, count: 0 };
    k.count++;
    byKind.set(cat.id, k);
  });

  const top = Object.keys(byName)
    .map(name => ({ name, count: byName[name] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "de"))
    .slice(0, 3);

  const kinds = [...byKind.values()].sort((a, b) => b.count - a.count);

  return {
    total: entries.length,
    sorts: Object.keys(byName).length,
    top,
    topKind: kinds[0] || null
  };
}

// --- Das Story-Bild ---

function drawShareImage() {
  const ctx = shareCanvas.getContext("2d");
  const s = shareStats();
  const left = 96;
  const right = SHARE_W - 96;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);
  ctx.textBaseline = "alphabetic";

  // Kopfzeile: links der Name der App, rechts die Liste, wenn eine gewählt ist
  setFont(ctx, "700", 48, 0);
  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  ctx.fillText("BarCheck", left, 250);
  const list = getActiveList();
  if (list) {
    const brandW = ctx.measureText("BarCheck").width;
    setFont(ctx, "400", 44, 0);
    ctx.textAlign = "right";
    ctx.fillStyle = C.muted;
    const listName = (list.emoji ? list.emoji + " " : "") + list.name;
    ctx.fillText(fitText(ctx, listName, right - left - brandW - 60), right, 250);
  }

  // Der Block darunter steht mittig in der Höhe, damit bei nur ein oder zwei
  // Cocktails unten kein Leerraum entsteht.
  const rowsH = s.top.length ? 100 + s.top.length * 150 : 110;
  const blockH = 650 + rowsH + (s.topKind ? 90 : 0);
  let y = Math.max(380, Math.round((SHARE_H - blockH) / 2));

  ctx.textAlign = "left";
  setFont(ctx, "500", 44, 0);
  ctx.fillStyle = C.mint;
  ctx.fillText(PERIODS[sharePeriod].badge, left, y + 44);

  // Große Zahl
  setFont(ctx, "700", s.total >= 1000 ? 260 : 340, -6);
  ctx.fillStyle = C.text;
  ctx.fillText(String(s.total), left - 12, y + 390);

  setFont(ctx, "600", 68, 0);
  ctx.fillText(s.total === 1 ? "Cocktail" : "Cocktails", left, y + 490);

  if (s.sorts > 0) {
    setFont(ctx, "400", 40, 0);
    ctx.fillStyle = C.muted;
    ctx.fillText(s.sorts === 1 ? "aus 1 Sorte" : "aus " + s.sorts + " Sorten", left, y + 552);
  }

  // Trennlinie
  y += 620;
  ctx.fillStyle = C.line;
  ctx.fillRect(left, y, right - left, 3);
  y += 30;

  // Meistgetrunkene Sorten mit Balken
  if (s.top.length === 0) {
    setFont(ctx, "400", 42, 0);
    ctx.fillStyle = C.muted;
    ctx.fillText("Noch nichts gezählt.", left, y + 80);
  } else {
    setFont(ctx, "400", 36, 0);
    ctx.fillStyle = C.muted;
    ctx.fillText(s.top.length === 1 ? "Mein Drink" : "Meine Top " + s.top.length, left, y + 50);
    y += 100;

    const max = s.top[0].count;
    const nameX = left + 64;
    const barW = right - nameX;

    s.top.forEach((item, i) => {
      setFont(ctx, "400", 48, 0);
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.fillText(String(i + 1), left, y + 50);

      // Anzahl rechts, Name füllt den Rest
      setFont(ctx, "700", 48, 0);
      ctx.textAlign = "right";
      ctx.fillStyle = C.text;
      const countText = item.count + "×";
      ctx.fillText(countText, right, y + 50);
      const countW = ctx.measureText(countText).width;

      setFont(ctx, "500", 48, 0);
      ctx.textAlign = "left";
      ctx.fillText(fitText(ctx, item.name, barW - countW - 40), nameX, y + 50);

      ctx.fillStyle = C.line;
      ctx.fillRect(nameX, y + 80, barW, 8);
      ctx.fillStyle = C.mint;
      ctx.fillRect(nameX, y + 80, Math.max(16, Math.round((item.count / max) * barW)), 8);

      y += 150;
    });
  }

  // Häufigste Art als eine ruhige Zeile
  if (s.topKind) {
    const pct = Math.round((s.topKind.count / s.total) * 100);
    // Bei nur einer Sorte wäre "Meistens … (100 %)" albern.
    const line = s.sorts === 1
      ? s.topKind.cat.label
      : "Meistens " + s.topKind.cat.label + " (" + pct + " %)";
    setFont(ctx, "400", 40, 0);
    ctx.textAlign = "left";
    ctx.fillStyle = C.muted;
    ctx.fillText(line, left, y + 50);
  }

  // Fußzeile
  setFont(ctx, "400", 32, 0);
  ctx.textAlign = "left";
  ctx.fillStyle = C.muted;
  const date = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  ctx.fillText(date + " · projects.abuechele.de", left, 1760);

  ctx.letterSpacing = "0px";
}

// --- Teilen / Speichern ---

function shareFileName() {
  const d = new Date();
  const stamp = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  return "barcheck-" + stamp + ".png";
}

function canvasBlob() {
  return new Promise(resolve => shareCanvas.toBlob(resolve, "image/png"));
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = shareFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Die fertige Datei wird schon beim Zeichnen vorbereitet: Safari (iOS) lässt
// navigator.share nur direkt aus dem Antippen heraus zu, ein await davor
// würde das Teilen blockieren.
let preparedFile = null;

async function prepareFile() {
  preparedFile = null;
  const blob = await canvasBlob();
  if (blob) preparedFile = new File([blob], shareFileName(), { type: "image/png" });
}

async function shareImage() {
  const file = preparedFile || await (async () => {
    const blob = await canvasBlob();
    return blob ? new File([blob], shareFileName(), { type: "image/png" }) : null;
  })();
  if (!file) return;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Meine Cocktails" });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return; // vom Nutzer abgebrochen
    }
  }
  // Teilen nicht möglich (z. B. Desktop-Browser): Bild herunterladen.
  downloadBlob(file);
  shareHint.textContent = "Direktes Teilen geht hier nicht – das Bild wurde gespeichert.";
}

function setPeriod(id) {
  sharePeriod = id;
  periodBtns.forEach(b => b.classList.toggle("active", b.dataset.period === id));
  drawShareImage();
  prepareFile();
}

function openShareModal() {
  // Der Dialog startet mit dem Zeitraum, der auf der Statistik-Seite gerade
  // gewählt ist - sonst zeigte das Bild etwas anderes als die Seite dahinter.
  // Fällt auf "heute" zurück, falls die Seite keinen Zeitraum kennt.
  const today = countSince(startOfToday());
  const seite = typeof statsPeriod === "string" ? statsPeriod : null;
  shareHint.textContent = "Teilen → Instagram → Story";
  shareOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  setPeriod(seite || (today > 0 ? "today" : "all"));
  closeShareBtn.focus();
}

function closeShareModal() {
  shareOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  shareBtn.focus();
}

// Der Teilen-Button erscheint erst, wenn es überhaupt etwas zu zeigen gibt.
function updateShareBtn() {
  shareBtn.hidden = visibleLog().length === 0;
}

shareBtn.addEventListener("click", openShareModal);
closeShareBtn.addEventListener("click", closeShareModal);
doShareBtn.addEventListener("click", shareImage);
downloadBtn.addEventListener("click", async () => {
  const blob = preparedFile || await canvasBlob();
  if (blob) downloadBlob(blob);
});
periodBtns.forEach(b => b.addEventListener("click", () => setPeriod(b.dataset.period)));

shareOverlay.addEventListener("click", (e) => {
  if (e.target === shareOverlay) closeShareModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && shareOverlay.classList.contains("open")) closeShareModal();
});
