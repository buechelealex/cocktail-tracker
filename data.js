// Gemeinsame Datenbasis für alle Seiten (Bewertungen und Zähler).
// Wird von script.js (index.html) und counter.js (counter.html) geladen.

// Fest hinterlegte Cocktails mit Zutaten inkl. Mengenangaben, im selben
// Format, wie es die TheCocktailDB-API zurückgibt (Menge + Zutat kombiniert,
// z. B. "1 1/2 oz Vodka" statt nur "Vodka").
const baseRecipes = {
  "Blue Lagoon": ["1 1/2 oz Vodka", "1 oz Blue Curacao", "3 oz Lemonade"],
  "Malibu Pineapple": ["2 oz Malibu Rum", "4 oz Pineapple Juice"],
  "Vodka Orange": ["1 1/2 oz Vodka", "4 oz Orange Juice"],
  "Black Russian": ["2 oz Vodka", "1 oz Kahlua"],
  "Tequila Sunrise": ["1 1/2 oz Tequila", "3 oz Orange Juice", "1/2 oz Grenadine"],
  "Tequila Sunset": ["1 1/2 oz Tequila", "3 oz Orange Juice", "1/2 oz Blackcurrant Cordial"],
  "Sirocco": ["1 oz Vodka", "1 oz Campari", "3 oz Orange Juice", "1/2 oz Grenadine"],
  "Dolce Vita": ["3 oz Prosecco", "1 oz Campari", "1 oz Orange Juice"],
  "Cuba Libre": ["2 oz Light Rum", "4 oz Cola", "1/2 oz Lime Juice"],
  "Campari Orange": ["1 1/2 oz Campari", "4 oz Orange Juice"],
  "Dry Martini": ["2 1/2 oz Gin", "1/2 oz Dry Vermouth"],
  "Gin Tonic": ["1 1/2 oz Gin", "4 oz Tonic Water"],
  "Negroni": ["1 oz Gin", "1 oz Campari", "1 oz Sweet Vermouth"],
  "Pina Colada": ["2 oz Light Rum", "1 oz Coconut Cream", "3 oz Pineapple Juice"],
  "Vodka Martini": ["2 1/2 oz Vodka", "1/2 oz Dry Vermouth"],
  "Kir Royal": ["4 oz Champagne", "1/2 oz Creme de Cassis"],
  "Bellini": ["3 oz Prosecco", "2 oz Peach Puree"],
  "Mimoza": ["3 oz Champagne", "3 oz Orange Juice"],
  "Punch": ["2 oz Dark Rum", "1 oz Orange Juice", "1 oz Pineapple Juice", "1/2 oz Grenadine"]
};

const RATINGS_KEY = "cocktail-ratings";
const CUSTOM_KEY = "cocktail-custom-list";
const DELETED_KEY = "cocktail-deleted-base";
const COUNTS_KEY = "cocktail-counts";

let customCocktails = {}; // name -> ingredients[]
let deletedBase = {}; // name -> true, entfernte Standard-Cocktails
let countLog = []; // [{ id, name, ts }] - ein Eintrag pro getrunkenem Cocktail

// Jede Seite meldet hier ihre eigene Statuszeile an.
let statusHandler = null;
function setStatusHandler(fn) { statusHandler = fn; }
function notifyStatus(text, fade) { if (statusHandler) statusHandler(text, fade); }

function slug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// Speicherung: schreibt IMMER in beide Speicher (window.storage UND
// localStorage), damit Bewertungen, Zählerstände und selbst hinzugefügte
// Cocktails auch dann erhalten bleiben, wenn die Dateien später aktualisiert
// werden (z. B. neue Features) oder die Seite eigenständig im Browser
// geöffnet wird. Beim Laden werden beide Quellen zusammengeführt.
async function storageGetBoth(key) {
  let fromWindowStorage = null;
  let fromLocalStorage = null;
  try {
    if (window.storage) {
      const result = await window.storage.get(key, false);
      fromWindowStorage = result ? result.value : null;
    }
  } catch (e) { /* nicht verfügbar oder Key existiert noch nicht */ }
  try {
    fromLocalStorage = localStorage.getItem(key);
  } catch (e) { /* nicht verfügbar (z.B. Privacy-Modus) */ }
  return { fromWindowStorage, fromLocalStorage };
}

async function storageSetBoth(key, value) {
  let ok = false;
  try {
    if (window.storage) {
      const result = await window.storage.set(key, value, false);
      if (result) ok = true;
    }
  } catch (e) { /* ignorieren, localStorage übernimmt */ }
  try {
    localStorage.setItem(key, value);
    ok = true;
  } catch (e) { /* ignorieren */ }
  return ok;
}

function parseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function saveKey(key, value) {
  notifyStatus("Speichere…", false);
  const ok = await storageSetBoth(key, JSON.stringify(value));
  notifyStatus(ok ? "Gespeichert ✓" : "Speichern fehlgeschlagen", ok);
  return ok;
}

async function loadCustomCocktails() {
  const { fromWindowStorage, fromLocalStorage } = await storageGetBoth(CUSTOM_KEY);
  const a = parseJson(fromWindowStorage, {});
  const b = parseJson(fromLocalStorage, {});
  // Zusammenführen: alle selbst hinzugefügten Cocktails aus beiden Quellen behalten.
  customCocktails = { ...b, ...a };
  await storageSetBoth(CUSTOM_KEY, JSON.stringify(customCocktails));
}

async function saveCustomCocktails() {
  return saveKey(CUSTOM_KEY, customCocktails);
}

// Entfernte Standard-Cocktails werden als Namensliste gespeichert, damit die
// Basisliste im Code unverändert bleibt und ein Wiederherstellen möglich ist.
async function loadDeletedBase() {
  const { fromWindowStorage, fromLocalStorage } = await storageGetBoth(DELETED_KEY);
  const a = parseJson(fromWindowStorage, {});
  const b = parseJson(fromLocalStorage, {});
  const merged = { ...b, ...a };
  // Nur Namen behalten, die es in der Standardliste wirklich (noch) gibt.
  for (const name of Object.keys(merged)) {
    if (!Object.prototype.hasOwnProperty.call(baseRecipes, name)) delete merged[name];
  }
  deletedBase = merged;
  await storageSetBoth(DELETED_KEY, JSON.stringify(deletedBase));
}

async function saveDeletedBase() {
  return saveKey(DELETED_KEY, deletedBase);
}

function getAllRecipes() {
  const base = {};
  for (const name of Object.keys(baseRecipes)) {
    if (!deletedBase[name]) base[name] = baseRecipes[name];
  }
  return { ...base, ...customCocktails };
}

// --- Zähler ---
// Gespeichert wird ein Protokoll mit einem Eintrag pro getrunkenem Cocktail.
// Daraus lassen sich Gesamtzahl, Anzahl pro Sorte und Zeiträume (heute, letzte
// 7 Tage) berechnen. Jeder Eintrag hat eine eigene ID, damit beim
// Zusammenführen der beiden Speicherquellen nichts doppelt gezählt wird.

function isValidEntry(e) {
  return e && typeof e === "object" && typeof e.id === "string" && typeof e.name === "string";
}

function mergeLogs(a, b) {
  const byId = new Map();
  [...a, ...b].forEach(e => {
    if (isValidEntry(e) && !byId.has(e.id)) byId.set(e.id, e);
  });
  return [...byId.values()].sort((x, y) => (x.ts || 0) - (y.ts || 0));
}

async function loadCountLog() {
  const { fromWindowStorage, fromLocalStorage } = await storageGetBoth(COUNTS_KEY);
  const a = parseJson(fromWindowStorage, []);
  const b = parseJson(fromLocalStorage, []);
  countLog = mergeLogs(Array.isArray(a) ? a : [], Array.isArray(b) ? b : []);
  await storageSetBoth(COUNTS_KEY, JSON.stringify(countLog));
}

async function saveCountLog() {
  return saveKey(COUNTS_KEY, countLog);
}

function newEntryId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function addDrink(name) {
  countLog.push({ id: newEntryId(), name: name, ts: Date.now() });
}

// Entfernt den zuletzt eingetragenen Cocktail dieser Sorte.
function removeDrink(name) {
  for (let i = countLog.length - 1; i >= 0; i--) {
    if (countLog[i].name === name) {
      countLog.splice(i, 1);
      return true;
    }
  }
  return false;
}

function countsByName() {
  const counts = {};
  countLog.forEach(e => { counts[e.name] = (counts[e.name] || 0) + 1; });
  return counts;
}

function countSince(timestamp) {
  return countLog.filter(e => (e.ts || 0) >= timestamp).length;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// --- Art / Kategorie ---
// Die "Art" wird aus den Zutaten abgeleitet (erste passende Regel gewinnt),
// damit sichtbar wird, wie viele Gin-, Rum-, Vodka-Drinks usw. es waren.
const CATEGORY_RULES = [
  { id: "vodka",     label: "Vodka",             emoji: "🥔", pattern: /vodka|wodka/i },
  { id: "gin",       label: "Gin",               emoji: "🌿", pattern: /\bgin\b/i },
  { id: "rum",       label: "Rum",               emoji: "🏝️", pattern: /\brum\b|malibu|cachaca|cachaça/i },
  { id: "tequila",   label: "Tequila",           emoji: "🌵", pattern: /tequila|mezcal/i },
  { id: "whisky",    label: "Whisky",            emoji: "🥃", pattern: /whisk(?:e)?y|bourbon|scotch/i },
  { id: "brandy",    label: "Brandy & Cognac",   emoji: "🍇", pattern: /brandy|cognac|weinbrand|armagnac/i },
  { id: "bitter",    label: "Bitter & Aperitif", emoji: "🍊", pattern: /campari|aperol|vermouth|wermut|cynar/i },
  { id: "sparkling", label: "Schaumwein",        emoji: "🥂", pattern: /champagne|champagner|prosecco|sekt|cremant|crémant|cava|spumante/i },
  { id: "wine",      label: "Wein",              emoji: "🍷", pattern: /\bwine\b|\bwein\b|sherry|\bport\b/i },
  { id: "liqueur",   label: "Likör",             emoji: "🍸", pattern: /liqueur|likör|curacao|curaçao|kahlua|baileys|amaretto|triple sec|cointreau|creme de|crème de|schnapps|advocaat|limoncello/i },
  { id: "beer",      label: "Bier",              emoji: "🍺", pattern: /\bbeer\b|\bbier\b|\bale\b|lager/i }
];
const CATEGORY_NONE = { id: "none", label: "Alkoholfrei / Sonstige", emoji: "🧃" };

function categoryOf(name) {
  const ingredients = getAllRecipes()[name];
  const haystack = (ingredients && ingredients.length ? ingredients.join(", ") : "") + " " + name;
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(haystack)) return rule;
  }
  return CATEGORY_NONE;
}
