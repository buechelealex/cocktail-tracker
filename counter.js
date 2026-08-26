// Zähler-Seite: hier wird nur gezählt, wie oft welcher Cocktail getrunken
// wurde. Cocktail-Liste und Speicherung kommen aus data.js, die Auswertung
// (Gesamt, Heute, Nach Art, Teilen) steht auf der Statistik-Seite in stats.js.

const statusEl = document.getElementById("status");
const drunkListEl = document.getElementById("drunkList");
const notDrunkListEl = document.getElementById("notDrunkList");
const notYetTitleEl = document.getElementById("notYetTitle");
const filterInput = document.getElementById("filterInput");
const resetBtn = document.getElementById("resetBtn");

const cardEls = new Map(); // Name -> Karten-Element (für das Umsortieren ohne Neuaufbau)
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
// (damit keine Zählerstände unsichtbar verschwinden). Ist oben eine eigene
// Liste gewählt, bleibt nur deren Inhalt übrig.
function allNames() {
  const recipes = getVisibleRecipes();
  const names = new Set(Object.keys(recipes));
  visibleLog().forEach(e => names.add(e.name));
  return { names: [...names], recipes };
}

function matchesFilter(name) {
  return !filterText || name.toLowerCase().includes(filterText);
}

// Teilt die Cocktails in getrunken/noch nicht auf und sortiert beide Gruppen.
function computeGroups() {
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
  return { drunk, notDrunk };
}

// Zurückgesetzt wird immer nur das, was gerade auch gezählt wird.
function updateResetBtn() {
  const list = getActiveList();
  resetBtn.textContent = list
    ? "Zählerstände in \"" + list.name + "\" zurücksetzen"
    : "Alle Zählerstände zurücksetzen";
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
  minus.className = "count-btn minus";
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

  minus.addEventListener("click", () => changeCount(name, -1));
  plus.addEventListener("click", () => changeCount(name, 1));

  controls.appendChild(minus);
  controls.appendChild(valueEl);
  controls.appendChild(plus);

  card.appendChild(info);
  card.appendChild(controls);

  const settle = () => card.classList.add("settled");
  card.addEventListener("animationend", settle, { once: true });
  setTimeout(settle, 800); // Fallback, falls die Animation nicht läuft

  cardEls.set(name, card);
  return card;
}

function buildEmptyHint() {
  const hint = document.createElement("div");
  hint.className = "empty-hint";
  if (filterText) {
    hint.textContent = "Kein Treffer.";
  } else if (getActiveList() && getActiveList().items.length === 0) {
    hint.textContent = "In dieser Liste ist noch nichts. Tippe oben auf ✎, um Cocktails auszuwählen.";
  } else {
    hint.textContent = "Noch nichts gezählt.";
  }
  return hint;
}

// Vollständiger Neuaufbau: beim Laden und wenn sich der Suchfilter ändert.
function renderLists() {
  drunkListEl.innerHTML = "";
  notDrunkListEl.innerHTML = "";
  cardEls.clear();

  const { drunk, notDrunk } = computeGroups();

  if (drunk.length === 0) {
    drunkListEl.appendChild(buildEmptyHint());
  } else {
    drunk.forEach((item, idx) => drunkListEl.appendChild(buildCard(item.name, item.count, idx, item.isGone)));
  }

  notDrunk.forEach((item, idx) => notDrunkListEl.appendChild(buildCard(item.name, 0, idx, item.isGone)));
  notYetTitleEl.style.display = notDrunk.length === 0 ? "none" : "";
}

// Aktualisiert Zahl und Minus-Button einer bestehenden Karte, ohne sie neu
// zu bauen.
function refreshCard(card, count, animate) {
  const valueEl = card.querySelector(".count-value");
  const minusBtn = card.querySelector(".minus");
  if (valueEl) {
    valueEl.textContent = count;
    if (animate) bump(valueEl);
  }
  if (minusBtn) minusBtn.disabled = count === 0;
}

// Hängt die vorhandenen Karten in die richtige Reihenfolge/Liste um. Die
// Elemente selbst bleiben erhalten (kein innerHTML), damit nichts flackert.
function sortListsInPlace() {
  const { drunk, notDrunk } = computeGroups();
  const hint = drunkListEl.querySelector(".empty-hint");
  if (drunk.length > 0 && hint) hint.remove();

  drunk.forEach(item => {
    const el = cardEls.get(item.name);
    if (el) drunkListEl.appendChild(el);
  });
  notDrunk.forEach(item => {
    const el = cardEls.get(item.name);
    if (el) notDrunkListEl.appendChild(el);
  });

  if (drunk.length === 0 && !hint) drunkListEl.appendChild(buildEmptyHint());
  notYetTitleEl.style.display = notDrunk.length === 0 ? "none" : "";
}

// FLIP-Animation ("First, Last, Invert, Play") wie auf der Bewertungsseite:
// erst die aktuellen Positionen merken, dann umsortieren, dann jede
// verschobene Karte von ihrer alten an ihre neue Position animieren.
const FLIP_MS = 400;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function endFlip(el) {
  el.classList.remove("flipping", "flip-lead");
  el.style.transition = "";
  el.style.transform = "";
}

function updateAfterCount(name, count) {
  const card = cardEls.get(name);
  if (!card) { // Sollte nicht vorkommen; sicherheitshalber normaler Neuaufbau
    renderLists();
    return;
  }

  if (reduceMotion.matches) {
    refreshCard(card, count, false);
    sortListsInPlace();
    return;
  }

  // First: Positionen vor jeder Änderung merken
  const before = new Map();
  cardEls.forEach((el, key) => before.set(key, el.getBoundingClientRect()));

  // Last: Zahl aktualisieren und umsortieren
  refreshCard(card, count, true);
  sortListsInPlace();

  // Invert: jede verschobene Karte optisch an ihre alte Stelle zurücksetzen
  const moved = [];
  cardEls.forEach((el, key) => {
    const b = before.get(key);
    if (!b) return;
    const a = el.getBoundingClientRect();
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.classList.add("flipping");
    if (key === name) el.classList.add("flip-lead");
    el.style.transition = "none";
    el.style.transform = "translate(" + dx + "px, " + dy + "px)";
    moved.push(el);
  });

  // Play: im nächsten Frame zurück auf die echte Position animieren
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      moved.forEach(el => {
        el.style.transition = "transform " + FLIP_MS + "ms cubic-bezier(0.22, 0.61, 0.36, 1)";
        el.style.transform = "";
        const done = () => endFlip(el);
        el.addEventListener("transitionend", done, { once: true });
        setTimeout(done, FLIP_MS + 150);
      });
    });
  });
}

async function changeCount(name, delta) {
  const before = countsByName()[name] || 0;
  if (delta > 0) {
    addDrink(name);
  } else if (!removeDrink(name)) {
    return;
  }
  updateAfterCount(name, before + delta);
  await saveCountLog();
}

function renderAll() {
  renderLists();
  updateResetBtn();
}

filterInput.addEventListener("input", () => {
  filterText = filterInput.value.trim().toLowerCase();
  renderLists();
});

resetBtn.addEventListener("click", async () => {
  const list = getActiveList();
  const question = list
    ? "Wirklich alle Zählerstände in \"" + list.name + "\" löschen?"
    : "Wirklich alle Zählerstände löschen?";
  if (!confirm(question)) return;
  // Ohne Liste alles, mit Liste nur deren Cocktails.
  countLog = list ? countLog.filter(e => !list.items.includes(e.name)) : [];
  renderAll();
  await saveCountLog();
});

(async function init() {
  await loadCustomCocktails();
  await loadDeletedBase();
  await loadCountLog();
  await loadCocktailLists();
  initLists(renderAll); // Wechsel der Liste grenzt die angezeigten Karten ein
  // Aenderungen aus einem anderen offenen Tab live uebernehmen.
  watchStorage(() => { renderListBar(); renderAll(); });
  renderAll();
  setStatus("Bereit", true);
})();
