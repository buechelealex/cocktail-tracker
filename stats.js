// Statistik-Seite: wertet das Zähler-Protokoll aus (Kennzahlen, Verteilung
// nach Art als Kreisdiagramm, Top-Drinks und die getrunkene Menge Alkohol).
// Gezählt wird auf der Zähler-Seite, hier wird nur gelesen. Ist oben eine
// eigene Liste gewählt, beziehen sich alle Zahlen ausschließlich auf deren
// Cocktails - dafür sorgt visibleLog() aus data.js.

const statusEl = document.getElementById("status");
const statTotalEl = document.getElementById("statTotal");
const statTodayEl = document.getElementById("statToday");
const statWeekEl = document.getElementById("statWeek");
const statKindsEl = document.getElementById("statKinds");
const statsScopeEl = document.getElementById("statsScope");
const donutEl = document.getElementById("donut");
const chartLegendEl = document.getElementById("chartLegend");
const chartCardEl = document.getElementById("chartCard");
const boardEl = document.getElementById("leaderboard");
const alcValueEl = document.getElementById("alcValue");
const alcSubEl = document.getElementById("alcSub");
const alcBtn = document.getElementById("alcBtn");
const alcNoteEl = document.getElementById("alcNote");
const alcOverlay = document.getElementById("alcOverlay");
const closeAlcBtn = document.getElementById("closeAlcBtn");
const alcDoneBtn = document.getElementById("alcDoneBtn");
const alcHeadlineEl = document.getElementById("alcHeadline");
const alcListEl = document.getElementById("alcList");

const DAY_MS = 24 * 60 * 60 * 1000;
const BOARD_MAX = 8; // so viele Getränke stehen im Leaderboard

// Feste Farbe je Art, damit ein Tortenstück beim Weiterzählen nicht die
// Farbe wechselt. Reihenfolge und Töne passen zur Palette aus style.css.
const KIND_COLORS = {
  vodka: "#c9762f",
  gin: "#7d9a6b",
  rum: "#b0764a",
  tequila: "#d0a44a",
  whisky: "#8a5a2b",
  brandy: "#9b6b7e",
  korn: "#c2a75e",
  bitter: "#d4703a",
  sparkling: "#e0c069",
  wine: "#9c4f5a",
  liqueur: "#a58fb0",
  beer: "#e0a530",
  none: "#a8a29a"
};
const KIND_COLOR_FALLBACK = "#8a8178";

function setStatus(text, fade) {
  statusEl.style.opacity = "1";
  statusEl.textContent = text;
  if (fade) {
    setTimeout(() => { statusEl.style.opacity = "0"; }, 1200);
  }
}
setStatusHandler(setStatus); // Speicher-Meldungen aus data.js hier anzeigen

function updateStats() {
  const counts = countsByName();
  statTotalEl.textContent = visibleLog().length;
  statTodayEl.textContent = countSince(startOfToday());
  statWeekEl.textContent = countSince(Date.now() - 7 * DAY_MS);
  statKindsEl.textContent = Object.keys(counts).length;
  updateShareBtn(); // Teilen-Button aus share.js ein-/ausblenden
}

// Macht sichtbar, dass sich die Zahlen nur auf die gewählte Liste beziehen.
function updateStatsScope() {
  const list = getActiveList();
  statsScopeEl.hidden = !list;
  if (list) {
    statsScopeEl.textContent = "Nur " + (list.emoji ? list.emoji + " " : "") + list.name;
  }
}

function emptyHint(text) {
  const hint = document.createElement("div");
  hint.className = "empty-hint";
  hint.textContent = text;
  return hint;
}

// --- Kreisdiagramm nach Art ---

function kindTotals() {
  const byKind = new Map();
  visibleLog().forEach(e => {
    const cat = categoryOf(e.name);
    const entry = byKind.get(cat.id) || { cat, count: 0 };
    entry.count++;
    byKind.set(cat.id, entry);
  });
  return [...byKind.values()]
    .sort((a, b) => b.count - a.count || a.cat.label.localeCompare(b.cat.label, "de"));
}

function kindColor(id) {
  return KIND_COLORS[id] || KIND_COLOR_FALLBACK;
}

// Der Ring wird aus einzelnen Kreisen gebaut: jeder bekommt über
// stroke-dasharray genau die Länge seines Anteils und wird über
// stroke-dashoffset an die richtige Stelle gedreht. Das kommt ohne
// Pfad-Mathematik aus und bleibt in jeder Größe scharf.
const DONUT_R = 60;
const DONUT_C = 2 * Math.PI * DONUT_R;

function renderDonut(kinds, total) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 160 160");
  svg.setAttribute("class", "donut-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label",
    "Verteilung nach Art: " + kinds.map(k => k.cat.label + " " + k.count).join(", "));

  const group = document.createElementNS(svgNS, "g");
  group.setAttribute("transform", "rotate(-90 80 80)"); // Start oben statt rechts

  // Grundring, damit auch bei einem einzigen Anteil ein Ring zu sehen ist
  const track = document.createElementNS(svgNS, "circle");
  track.setAttribute("cx", "80");
  track.setAttribute("cy", "80");
  track.setAttribute("r", String(DONUT_R));
  track.setAttribute("class", "donut-track");
  group.appendChild(track);

  let offset = 0;
  kinds.forEach(({ cat, count }) => {
    const len = (count / total) * DONUT_C;
    const seg = document.createElementNS(svgNS, "circle");
    seg.setAttribute("cx", "80");
    seg.setAttribute("cy", "80");
    seg.setAttribute("r", String(DONUT_R));
    seg.setAttribute("class", "donut-seg");
    seg.setAttribute("stroke", kindColor(cat.id));
    seg.setAttribute("stroke-dasharray", len + " " + (DONUT_C - len));
    seg.setAttribute("stroke-dashoffset", String(-offset));
    group.appendChild(seg);
    offset += len;
  });

  svg.appendChild(group);

  // Gesamtzahl in der Mitte
  const value = document.createElementNS(svgNS, "text");
  value.setAttribute("x", "80");
  value.setAttribute("y", "76");
  value.setAttribute("class", "donut-value");
  value.textContent = String(total);
  svg.appendChild(value);

  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", "80");
  label.setAttribute("y", "96");
  label.setAttribute("class", "donut-label");
  label.textContent = total === 1 ? "Drink" : "Drinks";
  svg.appendChild(label);

  donutEl.innerHTML = "";
  donutEl.appendChild(svg);
}

function renderLegend(kinds, total) {
  chartLegendEl.innerHTML = "";
  kinds.forEach(({ cat, count }) => {
    const row = document.createElement("div");
    row.className = "legend-row";

    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = kindColor(cat.id);

    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = cat.emoji + " " + cat.label;

    const value = document.createElement("span");
    value.className = "legend-value";
    value.textContent = count + "× · " + Math.round((count / total) * 100) + "%";

    row.appendChild(dot);
    row.appendChild(label);
    row.appendChild(value);
    chartLegendEl.appendChild(row);
  });
}

function renderChart() {
  const kinds = kindTotals();
  const total = visibleLog().length;
  donutEl.innerHTML = "";
  chartLegendEl.innerHTML = "";
  if (total === 0) {
    chartCardEl.classList.add("is-empty");
    chartLegendEl.appendChild(emptyHint("Noch nichts gezählt."));
    return;
  }
  chartCardEl.classList.remove("is-empty");
  renderDonut(kinds, total);
  renderLegend(kinds, total);
}

// --- Leaderboard ---

const MEDALS = ["🥇", "🥈", "🥉"];

function renderBoard() {
  const counts = countsByName();
  const top = Object.keys(counts)
    .map(name => ({ name, count: counts[name] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "de"))
    .slice(0, BOARD_MAX);

  boardEl.innerHTML = "";
  if (top.length === 0) {
    boardEl.appendChild(emptyHint("Noch nichts gezählt."));
    return;
  }

  const max = top[0].count;
  top.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "board-row" + (i < 3 ? " podium" : "");

    const rank = document.createElement("span");
    rank.className = "board-rank";
    rank.textContent = i < 3 ? MEDALS[i] : (i + 1) + ".";

    const info = document.createElement("span");
    info.className = "board-info";

    const name = document.createElement("span");
    name.className = "board-name";
    name.textContent = item.name;

    const cat = categoryOf(item.name);
    const catEl = document.createElement("span");
    catEl.className = "board-cat";
    catEl.textContent = cat.emoji + " " + cat.label;

    info.appendChild(name);
    info.appendChild(catEl);

    // Der Balken zeigt den Abstand zum Spitzenreiter.
    const bar = document.createElement("span");
    bar.className = "board-bar";
    const fill = document.createElement("span");
    fill.className = "board-bar-fill";
    fill.style.width = Math.max(6, Math.round((item.count / max) * 100)) + "%";
    fill.style.background = kindColor(cat.id);
    bar.appendChild(fill);
    info.appendChild(bar);

    const count = document.createElement("span");
    count.className = "board-count";
    count.textContent = item.count + "×";

    row.appendChild(rank);
    row.appendChild(info);
    row.appendChild(count);
    boardEl.appendChild(row);
  });
}

// --- Alkohol ---

function renderAlcohol() {
  const a = alcoholTotal();
  alcValueEl.textContent = Math.round(a.ml) + " ml";
  alcSubEl.textContent = a.ml > 0
    ? "das sind rund " + Math.round(a.gramm) + " g – etwa " + num(a.ml / 25) + " Halbe Bier"
    : "Noch nichts gezählt.";
  alcBtn.disabled = a.ml <= 0;

  // Ehrlich bleiben: Getränke ohne Mengenangabe können nicht gerechnet werden.
  if (a.unbekannt.length > 0) {
    alcNoteEl.hidden = false;
    alcNoteEl.textContent = "Ohne Mengenangabe und daher nicht mitgerechnet: "
      + a.unbekannt.join(", ");
  } else {
    alcNoteEl.hidden = true;
  }
}

function openAlcModal() {
  const a = alcoholTotal();
  if (a.ml <= 0) return;

  alcHeadlineEl.textContent = Math.round(a.ml) + " ml reiner Alkohol entsprechen:";
  alcListEl.innerHTML = "";
  EQUIVALENTS.forEach(eq => {
    const row = document.createElement("div");
    row.className = "alc-row";

    const emoji = document.createElement("span");
    emoji.className = "alc-emoji";
    emoji.textContent = eq.emoji;

    const text = document.createElement("span");
    text.className = "alc-text";

    const titel = document.createElement("span");
    titel.className = "alc-titel";
    titel.textContent = eq.titel;

    const info = document.createElement("span");
    info.className = "alc-info";
    info.textContent = eq.info;

    text.appendChild(titel);
    text.appendChild(info);

    const wert = document.createElement("span");
    wert.className = "alc-wert";
    wert.textContent = eq.wert(a.ml);

    row.appendChild(emoji);
    row.appendChild(text);
    row.appendChild(wert);
    alcListEl.appendChild(row);
  });

  alcOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  closeAlcBtn.focus();
}

function closeAlcModal() {
  alcOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  alcBtn.focus();
}

alcBtn.addEventListener("click", openAlcModal);
closeAlcBtn.addEventListener("click", closeAlcModal);
alcDoneBtn.addEventListener("click", closeAlcModal);
alcOverlay.addEventListener("click", (e) => {
  if (e.target === alcOverlay) closeAlcModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && alcOverlay.classList.contains("open")) closeAlcModal();
});

function renderAll() {
  updateStatsScope();
  updateStats();
  renderChart();
  renderBoard();
  renderAlcohol();
}

(async function init() {
  await loadCustomCocktails();
  await loadDeletedBase();
  await loadCountLog();
  await loadCocktailLists();
  initLists(renderAll); // Wechsel der Liste ändert alle Auswertungen
  // Wird nebenan im Zähler-Tab gezählt, aktualisiert sich diese Seite mit.
  watchStorage(() => { renderListBar(); renderAll(); });
  renderAll();
  setStatus("Bereit", true);
})();
