// Teilen-Funktion der Zähler-Seite: zeichnet die Zählerstände als
// Story-Bild (1080 x 1920) auf ein Canvas und gibt es über die Web-Share-API
// weiter (z. B. an Instagram). Wo Teilen von Dateien nicht unterstützt wird,
// bleibt der Download als Rückfallebene.

const SHARE_W = 1080;
const SHARE_H = 1920;
const DAY = 24 * 60 * 60 * 1000;

// Farben aus shared/base.css, damit das Bild wie die Seite aussieht.
const C = {
  bgTop: "#fff8f0",
  bgBottom: "#f6ece1",
  card: "#ffffff",
  accent: "#c9762f",
  accentDark: "#a15d21",
  accentSoft: "#fbeedd",
  star: "#e0a530",
  text: "#2b2620",
  muted: "#8a8178",
  border: "#ede4d8",
  track: "#f1e8dd"
};
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const PERIODS = {
  today: { label: "Heute", badge: "HEUTE", from: () => startOfToday() },
  week: { label: "7 Tage", badge: "LETZTE 7 TAGE", from: () => Date.now() - 7 * DAY },
  all: { label: "Gesamt", badge: "INSGESAMT", from: () => 0 }
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Weich auslaufender Farbfleck im Hintergrund.
function softCircle(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

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

  // Hintergrund mit Farbverlauf wie auf der Seite
  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_H);
  bg.addColorStop(0, C.bgTop);
  bg.addColorStop(1, C.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  // Zwei weich auslaufende Farbkreise als Deko
  softCircle(ctx, 940, 60, 460, C.accent, 0.2);
  softCircle(ctx, 100, 1860, 420, C.star, 0.2);

  // Höhe der Karte richtet sich nach dem Inhalt, damit unten kein
  // Leerraum entsteht, wenn nur ein oder zwei Cocktails gezählt wurden.
  const rowsEnd = 830 + s.top.length * 150;
  const kindY = s.topKind ? rowsEnd + 40 : rowsEnd - 60;
  const cardH = kindY + 200;
  const cardX = 64, cardY = Math.round((SHARE_H - cardH) / 2), cardW = SHARE_W - 128, cardR = 64;
  ctx.save();
  ctx.shadowColor = "rgba(43, 38, 32, 0.14)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = C.card;
  roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();
  ctx.restore();

  const mid = SHARE_W / 2;
  const left = cardX + 88;
  const right = cardX + cardW - 88;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Kopfzeile - mit dem Namen der Liste, wenn eine ausgewählt ist
  setFont(ctx, "600", 44, 8);
  ctx.fillStyle = C.muted;
  const list = getActiveList();
  const heading = list
    ? "🍹 BARCHECK · " + (list.emoji ? list.emoji + " " : "") + list.name.toUpperCase()
    : "🍹 BARCHECK";
  ctx.fillText(fitText(ctx, heading, cardW - 140), mid + 4, cardY + 130);

  // Zeitraum-Pille
  setFont(ctx, "700", 30, 5);
  const badge = PERIODS[sharePeriod].badge;
  const badgeW = ctx.measureText(badge).width + 56;
  ctx.fillStyle = C.accentSoft;
  roundRect(ctx, mid - badgeW / 2, cardY + 176, badgeW, 62, 31);
  ctx.fill();
  ctx.fillStyle = C.accentDark;
  ctx.fillText(badge, mid + 2, cardY + 218);

  // Große Zahl
  const numSize = s.total >= 1000 ? 240 : s.total >= 100 ? 280 : 320;
  setFont(ctx, "700", numSize, -4);
  ctx.fillStyle = C.accent;
  ctx.fillText(String(s.total), mid, cardY + 520);

  setFont(ctx, "600", 62, 1);
  ctx.fillStyle = C.text;
  ctx.fillText(s.total === 1 ? "Cocktail" : "Cocktails", mid, cardY + 600);

  if (s.sorts > 0) {
    setFont(ctx, "400", 38, 0);
    ctx.fillStyle = C.muted;
    ctx.fillText(s.sorts === 1 ? "aus 1 Sorte" : "aus " + s.sorts + " Sorten", mid, cardY + 662);
  }

  // Trennlinie
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, cardY + 730);
  ctx.lineTo(right, cardY + 730);
  ctx.stroke();

  // Top-Sorten mit Balken
  let y = cardY + 830;
  if (s.top.length === 0) {
    setFont(ctx, "400", 42, 0);
    ctx.fillStyle = C.muted;
    ctx.fillText("Noch nichts gezählt.", mid, y);
  } else {
    setFont(ctx, "600", 30, 6);
    ctx.fillStyle = C.muted;
    ctx.textAlign = "left";
    ctx.fillText(s.top.length === 1 ? "MEIN DRINK" : "MEINE TOP " + s.top.length, left, y - 54);

    const medals = ["🥇", "🥈", "🥉"];
    const max = s.top[0].count;
    const barX = left + 78;
    const barW = right - barX;

    s.top.forEach((item, i) => {
      setFont(ctx, "400", 52, 0);
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.fillText(medals[i], left, y + 12);

      // Anzahl rechts, Name füllt den Rest
      setFont(ctx, "700", 48, 0);
      ctx.textAlign = "right";
      ctx.fillStyle = C.accentDark;
      const countText = item.count + "×";
      ctx.fillText(countText, right, y + 8);
      const countW = ctx.measureText(countText).width;

      setFont(ctx, "500", 48, 0);
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.fillText(fitText(ctx, item.name, barW - countW - 40), barX, y + 8);

      ctx.fillStyle = C.track;
      roundRect(ctx, barX, y + 36, barW, 16, 8);
      ctx.fill();
      const fillW = Math.max(24, Math.round((item.count / max) * barW));
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, C.accent);
      grad.addColorStop(1, C.star);
      ctx.fillStyle = grad;
      roundRect(ctx, barX, y + 36, fillW, 16, 8);
      ctx.fill();

      y += 150;
    });
  }

  // Lieblings-Art als eine ruhige Zeile
  if (s.topKind) {
    const pct = Math.round((s.topKind.count / s.total) * 100);
    // Bei nur einer Sorte wäre "Meistens … · 100%" albern.
    const line = s.sorts === 1
      ? s.topKind.cat.emoji + "  " + s.topKind.cat.label
      : s.topKind.cat.emoji + "  Meistens " + s.topKind.cat.label + " · " + pct + "%";
    setFont(ctx, "500", 40, 0);
    ctx.textAlign = "center";
    const lineW = ctx.measureText(line).width + 72;
    const lineY = cardY + kindY + 55;
    ctx.fillStyle = C.accentSoft;
    roundRect(ctx, mid - lineW / 2, lineY - 52, lineW, 84, 42);
    ctx.fill();
    ctx.fillStyle = C.accentDark;
    ctx.fillText(line, mid, lineY);
  }

  // Fußzeile
  setFont(ctx, "400", 32, 2);
  ctx.textAlign = "center";
  ctx.fillStyle = C.muted;
  const date = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  ctx.fillText(date + " · projects.abuechele.de", mid + 1, cardY + cardH - 60);

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
