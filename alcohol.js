// Rechnet aus, wie viel reiner Alkohol (Ethanol) in den gezählten Getränken
// steckt, und übersetzt diese Menge in anschauliche Vergleiche.
// Grundlage sind die Zutatentexte aus data.js, die Menge und Zutat enthalten
// ("1 1/2 oz Vodka", "0,5 l Helles Bier", "4 cl Korn"): aus der Menge und dem
// Alkoholgehalt der Zutat ergibt sich der reine Alkohol.
// Wird nur von der Statistik-Seite gebraucht.

const ML_PER_OZ = 29.5735;
const ETHANOL_G_PER_ML = 0.789;  // Dichte von Ethanol
const ETHANOL_KJ_PER_ML = 21.1;  // Heizwert, gerundet

// Alkoholgehalt in Vol.-%. Die erste passende Regel gewinnt, deshalb stehen
// die alkoholfreien Zutaten ganz oben und Sonderfälle (Malibu, Aperol) vor
// ihrer jeweiligen Gattung.
const ABV_RULES = [
  { pattern: /juice|saft|limonade|lemonade|cola|tonic|water|wasser|puree|püree|cordial|grenadine|sirup|syrup|cream|milch|energydrink|\bice\b/i, abv: 0 },
  { pattern: /malibu/i,                          abv: 21 },
  { pattern: /curacao|curaçao/i,                 abv: 20 },
  { pattern: /kahlua/i,                          abv: 16 },
  { pattern: /baileys/i,                         abv: 17 },
  { pattern: /amaretto|limoncello/i,             abv: 28 },
  { pattern: /triple sec|cointreau/i,            abv: 40 },
  { pattern: /creme de|crème de/i,               abv: 16 },
  { pattern: /aperol/i,                          abv: 11 },
  { pattern: /campari|cynar/i,                   abv: 25 },
  { pattern: /vermouth|wermut/i,                 abv: 15 },
  { pattern: /sherry|\bport\b/i,                 abv: 18 },
  { pattern: /brandy|cognac|weinbrand|armagnac/i, abv: 38 },
  { pattern: /champagne|champagner/i,            abv: 12 },
  { pattern: /prosecco|sekt|cava|spumante|cremant|crémant/i, abv: 11.5 },
  { pattern: /\bwine\b|\bwein\b/i,               abv: 11.5 },
  { pattern: /\bbier\b|weizen|\bbeer\b|\bale\b|lager/i, abv: 5 },
  { pattern: /\bkorn\b|doppelkorn|klarer|obstler/i, abv: 32 },
  { pattern: /vodka|wodka/i,                     abv: 40 },
  { pattern: /\bgin\b/i,                         abv: 40 },
  { pattern: /\brum\b|bacardi|cachaca|cachaça/i, abv: 37.5 },
  { pattern: /tequila|mezcal/i,                  abv: 38 },
  { pattern: /whisk(?:e)?y|bourbon|scotch/i,     abv: 40 },
  { pattern: /liqueur|likör|schnaps|schnapps|advocaat/i, abv: 20 }
];

// Erkennt die Menge am Anfang eines Zutatentextes. Erlaubt sind ganze Zahlen,
// Dezimalzahlen mit Komma oder Punkt, Brüche und beides kombiniert:
// "2", "0,25", "1/2", "1 1/2".
const AMOUNT_RE = /^\s*(\d+(?:[.,]\d+)?)?\s*(?:(\d+)\s*\/\s*(\d+))?\s*(oz|ml|cl|dl|l)\b/i;
const UNIT_ML = { oz: ML_PER_OZ, ml: 1, cl: 10, dl: 100, l: 1000 };

function parseAmountMl(text) {
  const m = AMOUNT_RE.exec(text);
  if (!m) return null;
  let amount = m[1] ? parseFloat(m[1].replace(",", ".")) : 0;
  if (m[2] && m[3]) amount += parseInt(m[2], 10) / parseInt(m[3], 10);
  if (!amount) return null;
  return amount * UNIT_ML[m[4].toLowerCase()];
}

function abvOf(ingredient) {
  for (const rule of ABV_RULES) {
    if (rule.pattern.test(ingredient)) return rule.abv;
  }
  return 0; // Unbekannte Zutaten zählen nicht als Alkohol
}

// Reiner Alkohol in ml für ein Glas dieses Getränks. "bekannt" ist false,
// wenn keine einzige Zutat eine Mengenangabe hat - das passiert bei selbst
// angelegten Cocktails, bei denen nur die Zutaten notiert wurden.
function alcoholOf(name) {
  const ingredients = getAllRecipes()[name] || [];
  let ml = 0;
  let withAmount = 0;
  ingredients.forEach(text => {
    const amount = parseAmountMl(text);
    if (amount === null) return;
    withAmount++;
    ml += amount * abvOf(text) / 100;
  });
  return { ml, bekannt: withAmount > 0 };
}

// Summe über alle gezählten Getränke der aktuell gewählten Liste.
function alcoholTotal() {
  let ml = 0;
  const unbekannt = new Set();
  visibleLog().forEach(e => {
    const a = alcoholOf(e.name);
    if (a.bekannt) ml += a.ml;
    else unbekannt.add(e.name);
  });
  return { ml, gramm: ml * ETHANOL_G_PER_ML, unbekannt: [...unbekannt] };
}

// --- Vergleiche ---

// Deutsche Schreibweise mit Komma; Nachkommastellen nur, wo sie etwas
// aussagen ("5×" statt "5,0×", aber "2,4 km").
function num(n) {
  if (n >= 10) return String(Math.round(n));
  const text = n >= 1 ? n.toFixed(1) : n.toFixed(2);
  return text.replace(/[.,]?0+$/, "").replace(".", ",");
}

function strecke(meter) {
  return meter >= 1000 ? num(meter / 1000) + " km" : num(meter) + " m";
}

function zeit(minuten) {
  if (minuten >= 1440) {
    const tage = num(minuten / 1440);
    return tage + (tage === "1" ? " Tag" : " Tage");
  }
  if (minuten >= 120) return num(minuten / 60) + " Stunden";
  const min = num(minuten);
  return min + (min === "1" ? " Minute" : " Minuten");
}

function mal(anzahl) {
  return num(anzahl) + "×";
}

// Die Vergleiche kommen bewusst aus ganz verschiedenen Bereichen. Wo Energie
// im Spiel ist, wird über den Heizwert gerechnet (kJ), sonst direkt über die
// Menge Alkohol (ml).
const EQUIVALENTS = [
  {
    emoji: "🚗", titel: "Auto fahren", info: "Kleinwagen mit 7 l/100 km",
    wert: ml => strecke(ml * ETHANOL_KJ_PER_ML / 2.24)
  },
  {
    emoji: "✈️", titel: "Flugzeug fliegen", info: "Mittelstreckenjet, ganze Maschine",
    wert: ml => strecke(ml * ETHANOL_KJ_PER_ML / 129)
  },
  {
    emoji: "🔥", titel: "Grill reinigen", info: "50 ml Spiritus je Reinigung",
    wert: ml => mal(ml / 50)
  },
  {
    emoji: "🧴", titel: "Hände desinfizieren", info: "3 ml je Anwendung",
    wert: ml => mal(ml / 3)
  },
  {
    emoji: "🫕", titel: "Fondue warm halten", info: "Brenner mit 60 ml je Stunde",
    wert: ml => zeit(ml)
  },
  {
    emoji: "☕", titel: "Wasser kochen", info: "von 20 auf 100 °C",
    wert: ml => num(ml * ETHANOL_KJ_PER_ML / 335) + " Liter"
  },
  {
    emoji: "🔋", titel: "Handy laden", info: "Akku mit 15 Wh",
    wert: ml => mal(ml * ETHANOL_KJ_PER_ML / 54)
  },
  {
    emoji: "💡", titel: "LED-Lampe brennen lassen", info: "10 Watt",
    wert: ml => zeit(ml * ETHANOL_KJ_PER_ML / 0.6)
  }
];
