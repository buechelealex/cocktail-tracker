// Cocktail-Liste, Speicherlogik und Kategorien stehen in shared/data.js und werden
// von dieser Seite und der Zähler-Seite gemeinsam genutzt.

let ratings = {};
const expandedState = {}; // slug -> bool
const cardEls = new Map(); // slug -> Karten-Element (für das Umsortieren ohne Neuaufbau)

const ratedListEl = document.getElementById("ratedList");
const unratedListEl = document.getElementById("unratedList");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const clearBtn = document.getElementById("clearBtn");
const restoreBtn = document.getElementById("restoreBtn");
const addBtn = document.getElementById("addBtn");
const addOverlay = document.getElementById("addOverlay");
const closeAddBtn = document.getElementById("closeAddBtn");
const newNameInput = document.getElementById("newName");
const newIngredientsInput = document.getElementById("newIngredients");
const formError = document.getElementById("formError");
const cancelAddBtn = document.getElementById("cancelAddBtn");
const saveAddBtn = document.getElementById("saveAddBtn");
const autofillHint = document.getElementById("autofillHint");
const suggestionsList = document.getElementById("suggestionsList");
const addForm = document.getElementById("addForm");

function setStatus(text, fade) {
  statusEl.style.opacity = "1";
  statusEl.textContent = text;
  if (fade) {
    setTimeout(() => { statusEl.style.opacity = "0"; }, 1200);
  }
}
setStatusHandler(setStatus); // Speicher-Meldungen aus shared/data.js hier anzeigen

async function loadRatings() {
  const { fromWindowStorage, fromLocalStorage } = await storageGetBoth(RATINGS_KEY);
  const a = parseJson(fromWindowStorage, {});
  const b = parseJson(fromLocalStorage, {});
  const merged = { ...a };
  for (const key of Object.keys(b)) {
    if (!(key in merged) || (b[key] > (merged[key] || 0))) {
      merged[key] = b[key];
    }
  }
  ratings = merged;
  await storageSetBoth(RATINGS_KEY, JSON.stringify(ratings));
}

async function saveRatings() {
  return saveKey(RATINGS_KEY, ratings);
}

function updateRestoreBtn() {
  const count = Object.keys(deletedBase).length;
  if (count === 0) {
    restoreBtn.style.display = "none";
    return;
  }
  restoreBtn.style.display = "block";
  restoreBtn.textContent = count === 1
    ? "1 entfernten Standard-Cocktail wiederherstellen"
    : count + " entfernte Standard-Cocktails wiederherstellen";
}

function updateSummary() {
  // Bezieht sich immer auf die gerade gewaehlte Liste ("Alle" = komplette Sammlung).
  const names = Object.keys(getVisibleRecipes());
  const total = names.length;
  const rated = names.map(n => ratings[slug(n)] || 0).filter(v => v > 0);
  if (total === 0) {
    summaryEl.textContent = "Diese Liste ist noch leer.";
    return;
  }
  if (rated.length === 0) {
    summaryEl.textContent = "Noch keine Bewertungen abgegeben.";
    return;
  }
  const avg = (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
  summaryEl.textContent = `${rated.length} von ${total} bewertet · Ø ${avg} ★`;
}

function renderStars(container, name) {
  container.innerHTML = "";
  const current = ratings[slug(name)] || 0;
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star" + (i <= current ? " filled" : "");
    star.textContent = "★";
    star.addEventListener("click", async (e) => {
      e.stopPropagation();
      const key = slug(name);
      // Klick auf bereits gesetzten höchsten Stern setzt Bewertung zurück
      ratings[key] = (ratings[key] === i) ? 0 : i;
      updateAfterRating(name);
      await saveRatings();
    });
    container.appendChild(star);
  }
}

function buildCard(name, idx, isCustom) {
  const key = slug(name);
  const card = document.createElement("div");
  card.className = "cocktail-card";
  card.dataset.key = key;
  card.style.animationDelay = (idx * 0.03) + "s";

  const row = document.createElement("div");
  row.className = "cocktail-row";

  const nameWrap = document.createElement("div");
  nameWrap.className = "cocktail-name-wrap";

  const expandIcon = document.createElement("span");
  expandIcon.className = "expand-icon" + (expandedState[key] ? " open" : "");
  expandIcon.textContent = "▶";

  const nameEl = document.createElement("span");
  nameEl.className = "cocktail-name";
  nameEl.textContent = name;
  if (isCustom) {
    const tag = document.createElement("span");
    tag.className = "custom-tag";
    tag.textContent = "eigener";
    nameEl.appendChild(tag);
  }

  nameWrap.appendChild(expandIcon);
  nameWrap.appendChild(nameEl);

  const starsEl = document.createElement("div");
  starsEl.className = "stars";
  renderStars(starsEl, name);

  row.appendChild(nameWrap);
  row.appendChild(starsEl);
  card.appendChild(row);

  const panel = document.createElement("div");
  panel.className = "ingredients-panel" + (expandedState[key] ? " open" : "");

  const inner = document.createElement("div");
  inner.className = "ingredients-inner";

  const ingredients = getAllRecipes()[name] || [];
  if (ingredients.length === 0) {
    const p = document.createElement("div");
    p.className = "no-ingredients";
    p.textContent = "Keine Zutaten hinterlegt.";
    inner.appendChild(p);
  } else {
    const ul = document.createElement("ul");
    ul.className = "ingredients-list";
    ingredients.forEach(ing => {
      const li = document.createElement("li");
      li.textContent = ing;
      ul.appendChild(li);
    });
    inner.appendChild(ul);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  // Nur sichtbar, solange der Cocktail überhaupt eine Bewertung hat.
  const resetBtn = document.createElement("button");
  resetBtn.className = "card-action-btn reset-rating-btn";
  resetBtn.type = "button";
  resetBtn.textContent = "Bewertung zurücksetzen";
  resetBtn.hidden = !(ratings[key] > 0);
  resetBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!(ratings[key] > 0)) return;
    ratings[key] = 0;
    updateAfterRating(name); // wandert animiert zurück zu "Unbewertet"
    await saveRatings();
  });

  const delBtn = document.createElement("button");
  delBtn.className = "card-action-btn delete-btn";
  delBtn.type = "button";
  delBtn.textContent = "Cocktail löschen";
  delBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    if (isCustom) {
      delete customCocktails[name];
    } else {
      deletedBase[name] = true;
    }
    delete ratings[key];
    delete expandedState[key];
    const wasInList = removeNameFromLists(name);
    renderList();
    renderListBar();
    if (wasInList) await saveCocktailLists();
    if (isCustom) {
      await saveCustomCocktails();
    } else {
      await saveDeletedBase();
    }
    await saveRatings();
  });

  actions.appendChild(resetBtn);
  actions.appendChild(delBtn);
  inner.appendChild(actions);

  panel.appendChild(inner);
  card.appendChild(panel);

  nameWrap.addEventListener("click", () => {
    expandedState[key] = !expandedState[key];
    panel.classList.toggle("open", expandedState[key]);
    expandIcon.classList.toggle("open", expandedState[key]);
  });

  const settle = () => card.classList.add("settled");
  card.addEventListener("animationend", settle, { once: true });
  setTimeout(settle, 800); // Fallback, falls die Animation nicht läuft

  cardEls.set(key, card);
  return card;
}

// Teilt alle Cocktails in bewertet/unbewertet auf und sortiert beide Gruppen.
function computeGroups() {
  const allRecipes = getVisibleRecipes();
  const rated = [];
  const unrated = [];
  Object.keys(allRecipes).forEach(name => {
    const r = ratings[slug(name)] || 0;
    const isCustom = Object.prototype.hasOwnProperty.call(customCocktails, name);
    if (r > 0) rated.push({ name, r, isCustom });
    else unrated.push({ name, r: 0, isCustom });
  });
  // Bewertete: beste zuerst, bei Gleichstand alphabetisch
  rated.sort((a, b) => b.r - a.r || a.name.localeCompare(b.name, "de"));
  // Unbewertete: alphabetisch
  unrated.sort((a, b) => a.name.localeCompare(b.name, "de"));
  return { rated, unrated };
}

function buildEmptyHint() {
  const hint = document.createElement("div");
  hint.className = "empty-hint";
  hint.textContent = "Noch nichts bewertet.";
  return hint;
}

// Vollständiger Neuaufbau: beim Laden sowie beim Hinzufügen/Löschen.
function renderList() {
  ratedListEl.innerHTML = "";
  unratedListEl.innerHTML = "";
  cardEls.clear();

  const { rated, unrated } = computeGroups();

  if (rated.length === 0) {
    ratedListEl.appendChild(buildEmptyHint());
  } else {
    rated.forEach((item, idx) => ratedListEl.appendChild(buildCard(item.name, idx, item.isCustom)));
  }

  unrated.forEach((item, idx) => unratedListEl.appendChild(buildCard(item.name, idx, item.isCustom)));

  // Leere Liste: erklaeren, wie Cocktails hineinkommen.
  if (rated.length === 0 && unrated.length === 0 && getActiveList()) {
    const hint = document.createElement("div");
    hint.className = "empty-hint";
    hint.textContent = "In dieser Liste ist noch nichts. Tippe oben auf ✎, um Cocktails auszuwählen.";
    unratedListEl.appendChild(hint);
  }

  updateSummary();
  updateRestoreBtn();
}

// Aktualisiert Sterne und Button-Sichtbarkeit einer bestehenden Karte,
// ohne sie neu zu bauen.
function refreshCard(card, name) {
  const current = ratings[slug(name)] || 0;
  card.querySelectorAll(".star").forEach((star, i) => {
    star.classList.toggle("filled", i < current);
  });
  const resetBtn = card.querySelector(".reset-rating-btn");
  if (resetBtn) resetBtn.hidden = current === 0;
}

// Hängt die vorhandenen Karten in die richtige Reihenfolge/Liste um.
// Die Elemente selbst bleiben erhalten (kein innerHTML), damit aufgeklappte
// Zutaten, Scrollposition und Event-Listener unverändert bleiben.
function sortListsInPlace() {
  const { rated, unrated } = computeGroups();
  const hint = ratedListEl.querySelector(".empty-hint");
  if (rated.length > 0 && hint) hint.remove();

  rated.forEach(item => {
    const el = cardEls.get(slug(item.name));
    if (el) ratedListEl.appendChild(el);
  });
  unrated.forEach(item => {
    const el = cardEls.get(slug(item.name));
    if (el) unratedListEl.appendChild(el);
  });

  if (rated.length === 0 && !hint) ratedListEl.appendChild(buildEmptyHint());
}

// FLIP-Animation ("First, Last, Invert, Play"): erst die aktuellen Positionen
// merken, dann umsortieren, dann jede verschobene Karte von ihrer alten an ihre
// neue Position animieren. Es wird dabei nichts neu aufgebaut.
const FLIP_MS = 400;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function endFlip(el) {
  el.classList.remove("flipping", "flip-lead");
  el.style.transition = "";
  el.style.transform = "";
}

function updateAfterRating(name) {
  const key = slug(name);
  const card = cardEls.get(key);
  if (!card) { // Sollte nicht vorkommen; sicherheitshalber normaler Neuaufbau
    renderList();
    return;
  }

  if (reduceMotion.matches) {
    refreshCard(card, name);
    sortListsInPlace();
    updateSummary();
    return;
  }

  // First: Positionen vor jeder Änderung merken
  const before = new Map();
  cardEls.forEach((el, k) => before.set(k, el.getBoundingClientRect()));

  // Last: Karte aktualisieren und umsortieren
  refreshCard(card, name);
  sortListsInPlace();

  // Invert: jede verschobene Karte optisch an ihre alte Stelle zurücksetzen
  const moved = [];
  cardEls.forEach((el, k) => {
    const b = before.get(k);
    if (!b) return;
    const a = el.getBoundingClientRect();
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.classList.add("flipping");
    if (k === key) el.classList.add("flip-lead");
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

  updateSummary();
}

clearBtn.addEventListener("click", async () => {
  if (!confirm("Wirklich alle Bewertungen löschen?")) return;
  ratings = {};
  renderList();
  await saveRatings();
});

restoreBtn.addEventListener("click", async () => {
  deletedBase = {};
  renderList();
  await saveDeletedBase();
});

function showAutofillHint(text) {
  autofillHint.textContent = text;
  autofillHint.classList.toggle("show", !!text);
}

// Trägt Name + Zutaten aus einem Katalog-Eintrag ins Formular ein.
// Wird bei Auswahl aus dem Vorschlags-Dropdown genutzt.
function fillFormFromEntry(entry) {
  newNameInput.value = entry.name;
  newIngredientsInput.value = entry.ingredients.join(", ");
  showAutofillHint(`"${entry.name}" übernommen · Zutaten bei Bedarf anpassen.`);
}

// --- Vorschläge aus dem Offline-Katalog (rate/catalog.js) ---
// Früher lief hier eine Anfrage an TheCocktailDB. Der Katalog liegt jetzt
// im Browser: kein Netz, keine Wartezeit, keine API-Kosten.
const MAX_SUGGESTIONS = 8;
const POPULAR_SUGGESTIONS = 6;

// Umlaute und Akzente vereinheitlichen und deutsche Suchwörter auf die
// englischen Katalogbegriffe abbilden ("Wodka Sauer" -> "vodka sour").
function normalizeSearch(text) {
  const plain = (text || "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!plain) return "";
  return plain.split(" ").map(w => SEARCH_SYNONYMS[w] || w).join(" ");
}

// Einmal vorberechnet, damit jeder Tastendruck nur noch vergleicht.
const catalogIndex = cocktailCatalog.map((entry, order) => ({
  entry,
  order,
  name: normalizeSearch(entry.name),
  ingredients: normalizeSearch(entry.ingredients.join(" "))
}));

function wordStartsWith(haystack, query) {
  return haystack.split(" ").some(word => word.startsWith(query));
}

// Cocktails, die es schon gibt, gehören nicht in die Vorschläge - sie würden
// beim Speichern nur an "Diesen Cocktail gibt es schon" scheitern.
function knownNames() {
  return new Set(Object.keys(getAllRecipes()).map(n => n.toLowerCase()));
}

// Treffer nach Fundstelle bewerten: Name schlägt Zutat, Wortanfang schlägt
// Fundstelle mitten im Wort. Bei gleicher Bewertung entscheidet die
// Reihenfolge im Katalog, die grob der Bekanntheit folgt.
function searchCatalog(query) {
  const q = normalizeSearch(query);
  if (!q) return [];
  const taken = knownNames();
  const hits = [];
  for (const item of catalogIndex) {
    if (taken.has(item.entry.name.toLowerCase())) continue;
    let score = -1;
    if (item.name === q) score = 0;
    else if (item.name.startsWith(q)) score = 1;
    else if (wordStartsWith(item.name, q)) score = 2;
    else if (item.name.includes(q)) score = 3;
    else if (wordStartsWith(item.ingredients, q)) score = 4;
    else if (item.ingredients.includes(q)) score = 5;
    if (score >= 0) hits.push({ item, score });
  }
  hits.sort((a, b) => a.score - b.score || a.item.order - b.item.order);
  return hits.slice(0, MAX_SUGGESTIONS).map(h => h.item.entry);
}

// Solange nichts getippt ist: die bekanntesten noch fehlenden Cocktails.
function popularEntries() {
  const taken = knownNames();
  const out = [];
  for (const item of catalogIndex) {
    if (taken.has(item.entry.name.toLowerCase())) continue;
    out.push(item.entry);
    if (out.length === POPULAR_SUGGESTIONS) break;
  }
  return out;
}

// Genauer Namenstreffer, um beim Speichern leere Zutaten zu ergänzen.
function findCatalogEntry(name) {
  const q = normalizeSearch(name);
  const hit = catalogIndex.find(item => item.name === q);
  return hit ? hit.entry : null;
}

// "1 1/2 oz Vodka" -> "Vodka", "0,25 l Cola" -> "Cola"
function ingredientLabel(text) {
  const stripped = text
    .replace(/^\s*[\d.,/\s]+/, "")
    .replace(/^(oz|cl|ml|l|tsp|tbsp|dashes|dash|scoops|scoop|pinch|splash|spritzer|cup|shots|shot)\b\.?\s*/i, "")
    .trim();
  return stripped || text;
}

// --- Vorschlagsliste (Dropdown) ---
let suggestionEntries = [];
let suggestionActiveIndex = -1;

function closeSuggestions() {
  suggestionsList.classList.remove("open");
  suggestionsList.innerHTML = "";
  suggestionEntries = [];
  suggestionActiveIndex = -1;
  resetSuggestionFit();
}

function renderSuggestionsEmpty() {
  suggestionsList.innerHTML = "";
  const li = document.createElement("li");
  li.className = "suggestion-empty";
  li.textContent = "Kein Treffer - Name und Zutaten einfach selbst eintippen.";
  suggestionsList.appendChild(li);
  suggestionsList.classList.add("open");
  fitSuggestions();
}

function renderSuggestions(entries, headline) {
  suggestionEntries = entries;
  suggestionActiveIndex = -1;
  suggestionsList.innerHTML = "";

  if (headline) {
    const head = document.createElement("li");
    head.className = "suggestion-headline";
    head.textContent = headline;
    suggestionsList.appendChild(head);
  }

  entries.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.dataset.index = String(i);

    // Statt eines Fotos aus dem Netz das Emoji der erkannten Art - es steht
    // ohne Ladezeit bereit und passt zur Anzeige auf den anderen Seiten.
    const icon = document.createElement("span");
    icon.className = "suggestion-thumb";
    icon.textContent = categoryFor(entry.name, entry.ingredients).emoji;
    icon.setAttribute("aria-hidden", "true");
    li.appendChild(icon);

    const text = document.createElement("span");
    text.className = "suggestion-text";
    const name = document.createElement("span");
    name.className = "suggestion-name";
    name.textContent = entry.name;
    const sub = document.createElement("span");
    sub.className = "suggestion-sub";
    sub.textContent = entry.ingredients.map(ingredientLabel).join(" · ");
    text.appendChild(name);
    text.appendChild(sub);
    li.appendChild(text);

    li.addEventListener("mousedown", (e) => {
      // mousedown statt click, damit es vor dem blur-Event des Inputs feuert
      e.preventDefault();
      fillFormFromEntry(entry);
      closeSuggestions();
    });
    suggestionsList.appendChild(li);
  });
  suggestionsList.classList.add("open");
  fitSuggestions();
}

// Die Liste haengt frei ueber dem Dialog und wuerde unten aus der Karte
// herausragen. Statt sie klein zu quetschen, zieht diese Funktion den Dialog
// so weit auf, dass die Liste hineinpasst - begrenzt durch die Fensterhoehe.
function fitSuggestions() {
  const listeTop = suggestionsList.getBoundingClientRect().top;
  const formTop = addForm.getBoundingClientRect().top;
  const hoehe = Math.max(120, Math.min(
    300,                                  // mehr als das wird unuebersichtlich
    suggestionsList.scrollHeight,         // kurze Liste braucht keinen Platz
    window.innerHeight - listeTop - 24    // auf kleinen Bildschirmen ausbremsen
  ));
  suggestionsList.style.maxHeight = hoehe + "px";
  addForm.style.minHeight = (listeTop - formTop + hoehe + 18) + "px";
}

function resetSuggestionFit() {
  suggestionsList.style.maxHeight = "";
  addForm.style.minHeight = "";
}

function updateActiveSuggestion() {
  const items = suggestionsList.querySelectorAll(".suggestion-item");
  items.forEach((el, i) => el.classList.toggle("active", i === suggestionActiveIndex));
  const activeEl = items[suggestionActiveIndex];
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
}

function showSuggestionsFor(query) {
  if (!query) {
    const popular = popularEntries();
    if (popular.length === 0) {
      closeSuggestions();
    } else {
      renderSuggestions(popular, "Beliebte Cocktails");
    }
    return;
  }
  const hits = searchCatalog(query);
  if (hits.length === 0) {
    suggestionEntries = [];
    suggestionActiveIndex = -1;
    renderSuggestionsEmpty();
  } else {
    renderSuggestions(hits, null);
  }
}

newNameInput.addEventListener("input", () => {
  showSuggestionsFor(newNameInput.value.trim());
});

newNameInput.addEventListener("focus", () => {
  showSuggestionsFor(newNameInput.value.trim());
});

newNameInput.addEventListener("keydown", (e) => {
  if (!suggestionsList.classList.contains("open") || suggestionEntries.length === 0) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    suggestionActiveIndex = Math.min(suggestionActiveIndex + 1, suggestionEntries.length - 1);
    updateActiveSuggestion();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    suggestionActiveIndex = Math.max(suggestionActiveIndex - 1, 0);
    updateActiveSuggestion();
  } else if (e.key === "Enter") {
    if (suggestionActiveIndex >= 0 && suggestionEntries[suggestionActiveIndex]) {
      e.preventDefault();
      fillFormFromEntry(suggestionEntries[suggestionActiveIndex]);
      closeSuggestions();
    }
  }
});

newNameInput.addEventListener("blur", () => {
  // Kurze Verzögerung, damit ein Klick (mousedown) auf einen Vorschlag
  // noch verarbeitet werden kann, bevor die Liste verschwindet.
  setTimeout(closeSuggestions, 150);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".name-input-wrap")) {
    closeSuggestions();
  }
});

function isAddFormOpen() {
  return addOverlay.classList.contains("open");
}

function openAddForm() {
  addOverlay.classList.add("open");
  document.body.classList.add("modal-open"); // Hintergrund nicht mitscrollen
  formError.classList.remove("show");
  showAutofillHint("");
  closeSuggestions();
  newNameInput.value = "";
  newIngredientsInput.value = "";
  // Erst im naechsten Durchlauf: der Klick auf "+" laeuft sonst noch bis zum
  // document-Listener weiter und schliesst die Vorschlagsliste gleich wieder.
  setTimeout(() => {
    newNameInput.focus();
    // Nicht nur auf das Fokus-Ereignis verlassen - es bleibt aus, wenn das
    // Fenster selbst gerade keinen Fokus hat.
    showSuggestionsFor("");
  }, 0);
}

function closeAddForm() {
  addOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  showAutofillHint("");
  closeSuggestions();
  addBtn.focus();
}

addBtn.addEventListener("click", openAddForm);
cancelAddBtn.addEventListener("click", closeAddForm);
closeAddBtn.addEventListener("click", closeAddForm);

// Klick auf den abgedunkelten Bereich schliesst den Dialog
addOverlay.addEventListener("click", (e) => {
  if (e.target === addOverlay) closeAddForm();
});

// Escape: zuerst die Vorschlagsliste, danach den Dialog schliessen
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !isAddFormOpen()) return;
  if (suggestionsList.classList.contains("open")) {
    closeSuggestions();
  } else {
    closeAddForm();
  }
});

saveAddBtn.addEventListener("click", async () => {
  const name = newNameInput.value.trim();
  if (!name) {
    formError.textContent = "Bitte einen Namen eingeben.";
    formError.classList.add("show");
    newNameInput.focus();
    return;
  }
  const allRecipes = getAllRecipes();
  const exists = Object.keys(allRecipes).some(n => n.toLowerCase() === name.toLowerCase());
  if (exists) {
    formError.textContent = "Diesen Cocktail gibt es schon.";
    formError.classList.add("show");
    return;
  }
  let ingredients = newIngredientsInput.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // Wer den Namen tippt und das Zutatenfeld leer laesst, bekommt die Zutaten
  // aus dem Katalog - ohne dass er den Vorschlag anklicken musste.
  if (ingredients.length === 0) {
    const entry = findCatalogEntry(name);
    if (entry) ingredients = entry.ingredients.slice();
  }

  customCocktails[name] = ingredients;
  // Sonst waere der neue Cocktail bei aktiver Liste sofort wieder ausgeblendet.
  const addedToList = addNameToActiveList(name);
  closeAddForm();
  expandedState[slug(name)] = true;
  renderList();
  renderListBar();
  await saveCustomCocktails();
  if (addedToList) await saveCocktailLists();
});

(async function init() {
  await loadRatings();
  await loadCustomCocktails();
  await loadDeletedBase();
  await loadCocktailLists();
  initLists(renderList); // Wechsel der Liste baut die Karten neu auf
  // Aenderungen aus einem anderen offenen Tab live uebernehmen.
  watchStorage(() => { renderListBar(); renderList(); });
  renderList();
  setStatus("Bereit", true);
})();
