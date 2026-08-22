// Cocktail-Liste, Speicherlogik und Kategorien stehen in data.js und werden
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

function setStatus(text, fade) {
  statusEl.style.opacity = "1";
  statusEl.textContent = text;
  if (fade) {
    setTimeout(() => { statusEl.style.opacity = "0"; }, 1200);
  }
}
setStatusHandler(setStatus); // Speicher-Meldungen aus data.js hier anzeigen

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
  const allRecipes = getAllRecipes();
  const total = Object.keys(allRecipes).length;
  const rated = Object.values(ratings).filter(v => v > 0);
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
    renderList();
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
  const allRecipes = getAllRecipes();
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

// Trägt Name + Zutaten (inkl. Mengen) aus einem TheCocktailDB-Datensatz
// ins Formular ein. Wird sowohl vom "Automatisch befüllen"-Button als
// auch bei Auswahl aus dem Vorschlags-Dropdown genutzt.
function fillFormFromDrink(drink) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink["strIngredient" + i];
    const measure = drink["strMeasure" + i];
    if (ing && ing.trim()) {
      const measureText = measure && measure.trim() ? measure.trim() + " " : "";
      ingredients.push((measureText + ing.trim()).trim());
    }
  }
  if (drink.strDrink) newNameInput.value = drink.strDrink;
  newIngredientsInput.value = ingredients.join(", ");
  showAutofillHint(`Gefunden: "${drink.strDrink}" · Zutaten übernommen, bei Bedarf anpassen.`);
}

// --- Live-Vorschläge (Dropdown) beim Tippen ---
let suggestionTimer = null;
let suggestionDrinks = [];
let suggestionActiveIndex = -1;
let suggestionRequestId = 0;

function closeSuggestions() {
  suggestionsList.classList.remove("open");
  suggestionsList.innerHTML = "";
  suggestionDrinks = [];
  suggestionActiveIndex = -1;
}

function renderSuggestionsLoading() {
  suggestionsList.innerHTML = '<li class="suggestion-loading">Suche…</li>';
  suggestionsList.classList.add("open");
}

function renderSuggestionsEmpty() {
  suggestionsList.innerHTML = '<li class="suggestion-empty">Keine Treffer.</li>';
  suggestionsList.classList.add("open");
}

function renderSuggestions(drinks) {
  suggestionDrinks = drinks;
  suggestionActiveIndex = -1;
  suggestionsList.innerHTML = "";
  drinks.forEach((drink, i) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.dataset.index = String(i);

    if (drink.strDrinkThumb) {
      const img = document.createElement("img");
      img.className = "suggestion-thumb";
      img.src = drink.strDrinkThumb + "/preview";
      img.alt = "";
      li.appendChild(img);
    }
    const span = document.createElement("span");
    span.textContent = drink.strDrink;
    li.appendChild(span);

    li.addEventListener("mousedown", (e) => {
      // mousedown statt click, damit es vor dem blur-Event des Inputs feuert
      e.preventDefault();
      fillFormFromDrink(drink);
      closeSuggestions();
    });
    suggestionsList.appendChild(li);
  });
  suggestionsList.classList.add("open");
}

function updateActiveSuggestion() {
  const items = suggestionsList.querySelectorAll(".suggestion-item");
  items.forEach((el, i) => el.classList.toggle("active", i === suggestionActiveIndex));
  const activeEl = items[suggestionActiveIndex];
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
}

async function fetchSuggestions(query) {
  const requestId = ++suggestionRequestId;
  renderSuggestionsLoading();
  try {
    const url = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(query);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Netzwerkfehler");
    const data = await res.json();
    if (requestId !== suggestionRequestId) return; // veraltete Antwort ignorieren
    const drinks = data && data.drinks ? data.drinks.slice(0, 8) : [];
    if (drinks.length === 0) {
      renderSuggestionsEmpty();
    } else {
      renderSuggestions(drinks);
    }
  } catch (e) {
    if (requestId !== suggestionRequestId) return;
    closeSuggestions();
  }
}

newNameInput.addEventListener("input", () => {
  const query = newNameInput.value.trim();
  clearTimeout(suggestionTimer);
  if (query.length < 2) {
    closeSuggestions();
    return;
  }
  suggestionTimer = setTimeout(() => fetchSuggestions(query), 300);
});

newNameInput.addEventListener("keydown", (e) => {
  if (!suggestionsList.classList.contains("open") || suggestionDrinks.length === 0) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    suggestionActiveIndex = Math.min(suggestionActiveIndex + 1, suggestionDrinks.length - 1);
    updateActiveSuggestion();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    suggestionActiveIndex = Math.max(suggestionActiveIndex - 1, 0);
    updateActiveSuggestion();
  } else if (e.key === "Enter") {
    if (suggestionActiveIndex >= 0 && suggestionDrinks[suggestionActiveIndex]) {
      e.preventDefault();
      fillFormFromDrink(suggestionDrinks[suggestionActiveIndex]);
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
  newNameInput.focus();
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
  const ingredients = newIngredientsInput.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  customCocktails[name] = ingredients;
  closeAddForm();
  expandedState[slug(name)] = true;
  renderList();
  await saveCustomCocktails();
});

(async function init() {
  await loadRatings();
  await loadCustomCocktails();
  await loadDeletedBase();
  renderList();
  setStatus("Bereit", true);
})();
