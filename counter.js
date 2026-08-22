// Zähler-Seite: zählt, wie viele Cocktails welcher Sorte (und damit welcher
// Art) getrunken wurden. Cocktail-Liste und Speicherung kommen aus data.js,
// die Zählerstände werden genauso persistent gespeichert wie die Bewertungen.

const statusEl = document.getElementById("status");
const statTotalEl = document.getElementById("statTotal");
const statTodayEl = document.getElementById("statToday");
const statWeekEl = document.getElementById("statWeek");
const statKindsEl = document.getElementById("statKinds");
const kindListEl = document.getElementById("kindList");
const drunkListEl = document.getElementById("drunkList");
const notDrunkListEl = document.getElementById("notDrunkList");
const notYetTitleEl = document.getElementById("notYetTitle");
const filterInput = document.getElementById("filterInput");
const resetBtn = document.getElementById("resetBtn");

const DAY_MS = 24 * 60 * 60 * 1000;
let filterText = "";

function setStatus(text, fade) {
  statusEl.style.opacity = "1";
  statusEl.textContent = text;
  if (fade) {
    setTimeout(() => { statusEl.style.opacity = "0"; }, 1200);
  }
}
setStatusHandler(setStatus); // Speicher-Meldungen aus data.js hier anzeigen

// Alle Namen, die angezeigt werden: die aktuelle Cocktail-Liste plus alle
// bereits gezählten Sorten, die inzwischen aus der Liste gelöscht wurden
// (damit keine Zählerstände unsichtbar verschwinden).
function allNames() {
  const recipes = getAllRecipes();
  const names = new Set(Object.keys(recipes));
  countLog.forEach(e => names.add(e.name));
  return { names: [...names], recipes };
}

function matchesFilter(name) {
  return !filterText || name.toLowerCase().includes(filterText);
}

function updateStats() {
  const counts = countsByName();
  statTotalEl.textContent = countLog.length;
  statTodayEl.textContent = countSince(startOfToday());
  statWeekEl.textContent = countSince(Date.now() - 7 * DAY_MS);
  statKindsEl.textContent = Object.keys(counts).length;
  updateShareBtn(); // Teilen-Button aus share.js ein-/ausblenden
}

// Balkenliste je Art (Gin, Rum, Vodka …), absteigend nach Anzahl.
function renderKinds() {
  const byKind = new Map();
  countLog.forEach(e => {
    const cat = categoryOf(e.name);
    const entry = byKind.get(cat.id) || { cat, count: 0 };
    entry.count++;
    byKind.set(cat.id, entry);
  });

  kindListEl.innerHTML = "";
  const kinds = [...byKind.values()].sort((a, b) => b.count - a.count || a.cat.label.localeCompare(b.cat.label, "de"));
  if (kinds.length === 0) {
    const hint = document.createElement("div");
    hint.className = "empty-hint";
    hint.textContent = "Noch nichts gezählt.";
    kindListEl.appendChild(hint);
    return;
  }

  const max = kinds[0].count;
  const total = countLog.length;
  kinds.forEach(({ cat, count }) => {
    const row = document.createElement("div");
    row.className = "kind-row";

    const head = document.createElement("div");
    head.className = "kind-head";

    const label = document.createElement("span");
    label.className = "kind-label";
    label.textContent = cat.emoji + " " + cat.label;

    const value = document.createElement("span");
    value.className = "kind-count";
    value.textContent = count + "× · " + Math.round((count / total) * 100) + "%";

    head.appendChild(label);
    head.appendChild(value);

    const bar = document.createElement("div");
    bar.className = "kind-bar";
    const fill = document.createElement("div");
    fill.className = "kind-bar-fill";
    fill.style.width = Math.max(4, Math.round((count / max) * 100)) + "%";
    bar.appendChild(fill);

    row.appendChild(head);
    row.appendChild(bar);
    kindListEl.appendChild(row);
  });
}

function bump(el) {
  el.classList.remove("bump");
  void el.offsetWidth; // Animation neu starten
  el.classList.add("bump");
}

function buildCard(name, count, idx, isGone) {
  const card = document.createElement("div");
  card.className = "cocktail-card count-card";
  card.dataset.name = name;
  card.style.animationDelay = (idx * 0.03) + "s";

  const info = document.createElement("div");
  info.className = "count-info";

  const nameEl = document.createElement("div");
  nameEl.className = "cocktail-name";
  nameEl.textContent = name;
  if (isGone) {
    const tag = document.createElement("span");
    tag.className = "custom-tag";
    tag.textContent = "nicht mehr in der Liste";
    nameEl.appendChild(tag);
  }

  const cat = categoryOf(name);
  const catEl = document.createElement("div");
  catEl.className = "count-cat";
  catEl.textContent = cat.emoji + " " + cat.label;

  info.appendChild(nameEl);
  info.appendChild(catEl);

  const controls = document.createElement("div");
  controls.className = "count-controls";

  const minus = document.createElement("button");
  minus.className = "count-btn";
  minus.type = "button";
  minus.textContent = "−";
  minus.title = "Einen abziehen";
  minus.setAttribute("aria-label", name + ": einen abziehen");
  minus.disabled = count === 0;

  const valueEl = document.createElement("span");
  valueEl.className = "count-value";
  valueEl.textContent = count;

  const plus = document.createElement("button");
  plus.className = "count-btn plus";
  plus.type = "button";
  plus.textContent = "+";
  plus.title = "Einen dazuzählen";
  plus.setAttribute("aria-label", name + ": einen dazuzählen");

  minus.addEventListener("click", () => changeCount(name, -1, card, valueEl, minus));
  plus.addEventListener("click", () => changeCount(name, 1, card, valueEl, minus));

  controls.appendChild(minus);
  controls.appendChild(valueEl);
  controls.appendChild(plus);

  card.appendChild(info);
  card.appendChild(controls);

  const settle = () => card.classList.add("settled");
  card.addEventListener("animationend", settle, { once: true });
  setTimeout(settle, 800); // Fallback, falls die Animation nicht läuft

  return card;
}

async function changeCount(name, delta, card, valueEl, minusBtn) {
  const before = countsByName()[name] || 0;
  if (delta > 0) {
    addDrink(name);
  } else if (!removeDrink(name)) {
    return;
  }
  const after = before + delta;

  // Wechselt der Cocktail zwischen "getrunken" und "noch nicht getrunken",
  // werden die Listen neu aufgebaut - sonst reicht ein Update der Zahl.
  if (before === 0 || after === 0) {
    renderLists();
  } else {
    valueEl.textContent = after;
    minusBtn.disabled = after === 0;
    bump(valueEl);
  }

  updateStats();
  renderKinds();
  await saveCountLog();
}

function buildEmptyHint(text) {
  const hint = document.createElement("div");
  hint.className = "empty-hint";
  hint.textContent = text;
  return hint;
}

function renderLists() {
  const counts = countsByName();
  const { names, recipes } = allNames();

  const drunk = [];
  const notDrunk = [];
  names.forEach(name => {
    if (!matchesFilter(name)) return;
    const count = counts[name] || 0;
    const isGone = !Object.prototype.hasOwnProperty.call(recipes, name);
    (count > 0 ? drunk : notDrunk).push({ name, count, isGone });
  });

  // Getrunkene: häufigste zuerst, bei Gleichstand alphabetisch.
  drunk.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "de"));
  notDrunk.sort((a, b) => a.name.localeCompare(b.name, "de"));

  drunkListEl.innerHTML = "";
  notDrunkListEl.innerHTML = "";

  if (drunk.length === 0) {
    drunkListEl.appendChild(buildEmptyHint(filterText ? "Kein Treffer." : "Noch nichts gezählt."));
  } else {
    drunk.forEach((item, idx) => drunkListEl.appendChild(buildCard(item.name, item.count, idx, item.isGone)));
  }

  notDrunk.forEach((item, idx) => notDrunkListEl.appendChild(buildCard(item.name, 0, idx, item.isGone)));
  notYetTitleEl.style.display = notDrunk.length === 0 ? "none" : "";
}

function renderAll() {
  updateStats();
  renderKinds();
  renderLists();
}

filterInput.addEventListener("input", () => {
  filterText = filterInput.value.trim().toLowerCase();
  renderLists();
});

resetBtn.addEventListener("click", async () => {
  if (!confirm("Wirklich alle Zählerstände löschen?")) return;
  countLog = [];
  renderAll();
  await saveCountLog();
});

(async function init() {
  await loadCustomCocktails();
  await loadDeletedBase();
  await loadCountLog();
  renderAll();
  setStatus("Bereit", true);
})();
