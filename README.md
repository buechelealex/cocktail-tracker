# 🍹 Cocktail-Bewertungen (BarCheck)

Eine kleine Web-App zum Bewerten und Zählen von Cocktails, ohne Build-Schritt,
ohne Server und ohne Benutzerkonto – alle Daten bleiben auf dem eigenen Gerät.

Sie besteht aus zwei Seiten:

| Seite | Zweck |
| --- | --- |
| [index.html](index.html) | Cocktails bewerten, Zutaten ansehen, eigene Cocktails anlegen |
| [counter.html](counter.html) | Zählen, wie viele Cocktails welcher Sorte und Art getrunken wurden |

Beide Seiten teilen sich die Cocktail-Liste und die Speicherlogik aus
[data.js](data.js); oben wechselt man mit den beiden Reitern zwischen ihnen.

Live: <https://projects.abuechele.de/cocktail-tracker/>

## Was die App kann

- **19 Cocktails sind fest hinterlegt** (Blue Lagoon, Negroni, Pina Colada, Gin Tonic …),
  jeweils mit Zutatenliste inklusive Mengenangaben.
- **Bewerten mit 1–5 Sternen.** Bewertete Cocktails wandern automatisch in den
  Bereich „⭐ Bewertet“ und werden dort nach Bewertung sortiert (beste zuerst,
  bei Gleichstand alphabetisch). Unbewertete stehen alphabetisch darunter.
  Die bewertete Karte gleitet dabei sichtbar an ihre neue Position – die Liste
  wird nicht neu aufgebaut, aufgeklappte Zutaten und Scrollposition bleiben
  erhalten.
- **Zutaten aufklappen** per Tipp auf den Cocktailnamen.
- **Cocktails löschen** – eigene endgültig, fest hinterlegte nur aus der eigenen
  Liste (jederzeit wiederherstellbar).
- **Eigene Cocktails hinzufügen** – über den schwebenden **+**-Button unten
  rechts, der einen Dialog öffnet – mit Live-Suche gegen
  [TheCocktailDB](https://www.thecocktaildb.com/): beim Tippen erscheinen
  Vorschläge, und bei Auswahl werden Name und Zutaten automatisch übernommen.
- **Zusammenfassung** am Seitenende: wie viele Cocktails bewertet sind und der
  Durchschnitt in Sternen.
- **Zählen, was getrunken wurde** (Seite „🥂 Zähler“): pro Cocktail mit
  **+**/**−**, dazu Auswertungen nach **Sorte** (welcher Cocktail wie oft) und
  nach **Art** (Vodka, Gin, Rum, Schaumwein …) sowie Gesamt, Heute und die
  letzten 7 Tage.
- **Installierbar** als App (PWA über [manifest.json](manifest.json)); zusätzlich
  existiert eine Android-Variante als APK.

## Anleitung

### Einen Cocktail bewerten

1. Cocktail in der Liste suchen.
2. Rechts auf den gewünschten Stern tippen – z. B. der vierte Stern für 4 ★.
3. Die Karte gleitet in den Bereich „⭐ Bewertet“ und wird gespeichert
   (kurze Statusmeldung „Gespeichert ✓“ oben). Die übrigen Cocktails rücken
   ruhig nach, ohne dass die Seite neu aufgebaut wird.

**Bewertung entfernen:** entweder noch einmal auf den *aktuell höchsten
gesetzten* Stern tippen, oder die Zutaten aufklappen und dort auf **„Bewertung
zurücksetzen“** tippen. In beiden Fällen wandert der Cocktail animiert zurück
unter „Unbewertet“. Der Button erscheint nur bei Cocktails, die auch bewertet
sind.

### Zutaten ansehen

Auf den Cocktailnamen (oder das ▶-Symbol) tippen. Das Panel klappt auf und zeigt
die Zutaten mit Mengen sowie die Buttons **„Bewertung zurücksetzen“** (nur bei
bewerteten Cocktails) und **„Cocktail löschen“**. Erneutes Tippen schließt es
wieder. Bei eigenen Cocktails ohne eingetragene Zutaten steht dort „Keine
Zutaten hinterlegt.“

### Eigenen Cocktail hinzufügen

1. Unten rechts auf den runden **+**-Button tippen – es öffnet sich ein Dialog.
2. In das Feld **Name** mindestens 2 Zeichen eingeben. Nach kurzer Pause
   erscheint ein Vorschlagsmenü aus der Online-Datenbank.
   - Vorschlag antippen (oder mit ↑/↓ auswählen und mit Enter bestätigen) →
     Name und Zutaten werden automatisch eingetragen und können noch angepasst
     werden.
   - Mit Esc oder einem Klick daneben schließt sich die Vorschlagsliste.
   - Ohne Internet bzw. ohne passenden Treffer einfach selbst weitertippen.
3. Feld **Zutaten**: mehrere Zutaten mit Komma trennen, z. B.
   `2 oz Rum, 1 oz Limettensaft, 1/2 oz Zuckersirup`. Das Feld darf auch leer
   bleiben.
4. **Speichern**. Der Dialog schließt sich, und der Cocktail erscheint mit dem
   Hinweis „eigener“ in der Liste, mit bereits aufgeklappten Zutaten.

Den Dialog schließt du ohne zu speichern über **Abbrechen**, das **×** oben
rechts, einen Klick auf den abgedunkelten Hintergrund oder mit **Esc**. Ist die
Vorschlagsliste offen, schließt Esc zuerst nur diese.

Doppelte Namen werden abgelehnt („Diesen Cocktail gibt es schon.“) – die Prüfung
ignoriert Groß-/Kleinschreibung.

### Cocktail löschen

Zutaten des Cocktails aufklappen und auf **„Cocktail löschen“** tippen, dann die
Rückfrage bestätigen. Die Bewertung des Cocktails wird mitgelöscht.

- Ein **eigener** Cocktail ist danach endgültig weg.
- Ein **fest hinterlegter** Cocktail verschwindet nur aus *deiner* Liste; das
  Rezept bleibt in der App und lässt sich wiederherstellen (siehe unten).

### Entfernte Standard-Cocktails wiederherstellen

Sobald mindestens ein fest hinterlegter Cocktail entfernt wurde, erscheint ganz
unten ein zusätzlicher Button, z. B. **„3 entfernte Standard-Cocktails
wiederherstellen“**. Ein Tipp darauf holt alle entfernten Standard-Cocktails
zurück (unbewertet). Selbst gelöschte eigene Cocktails lassen sich so nicht
zurückholen – die müssen bei Bedarf neu angelegt werden.

### Alle Bewertungen zurücksetzen

Ganz unten **„Alle Bewertungen zurücksetzen“** – nach Bestätigung sind alle
Sterne wieder leer. Selbst hinzugefügte Cocktails bleiben dabei erhalten, nur
ihre Bewertungen verschwinden.

### Getrunkene Cocktails zählen

Oben auf den Reiter **„🥂 Zähler“** wechseln. Dort steht dieselbe Cocktail-Liste
wie auf der Bewertungsseite, jeweils mit **− 0 +**:

1. Beim Trinken eines Cocktails auf **+** tippen. Der Cocktail wandert nach oben
   in den Bereich „Nach Sorte“ (häufigste zuerst) und wird sofort gespeichert.
2. Zu viel gezählt? **−** entfernt den zuletzt gezählten Drink dieser Sorte.
3. Oben zeigen vier Kacheln **Gesamt**, **Heute**, **7 Tage** und **Sorten**
   (Anzahl verschiedener Cocktails).
4. Der Block **Nach Art** fasst zusammen, wie viele Drinks auf welche Basis
   entfielen – Vodka, Gin, Rum, Tequila, Whisky, Brandy, Bitter & Aperitif,
   Schaumwein, Wein, Likör, Bier oder „Alkoholfrei / Sonstige“. Die Art wird
   automatisch aus den Zutaten abgeleitet (erste passende Regel gewinnt).
5. Das Suchfeld filtert die Liste nach Namen.

**„Alle Zählerstände zurücksetzen“** ganz unten löscht nach Rückfrage das
komplette Trink-Protokoll; Bewertungen und eigene Cocktails bleiben unberührt.
Wird ein bereits gezählter Cocktail aus der Liste gelöscht, bleibt sein
Zählerstand mit dem Hinweis „nicht mehr in der Liste“ erhalten.

## Wo die Daten liegen

Alles wird lokal im Browser gespeichert, unter diesen Schlüsseln:

| Schlüssel | Inhalt |
| --- | --- |
| `cocktail-ratings` | Bewertungen (Cocktail-Name in Kleinbuchstaben mit Bindestrichen → 0–5) |
| `cocktail-custom-list` | Selbst hinzugefügte Cocktails (Name → Zutatenliste) |
| `cocktail-deleted-base` | Aus der Liste entfernte Standard-Cocktails (Name → `true`) |
| `cocktail-counts` | Trink-Protokoll: ein Eintrag `{id, name, ts}` pro getrunkenem Cocktail |

Geschrieben wird immer in `localStorage` **und** – falls vorhanden – in
`window.storage`; beim Laden werden beide Quellen zusammengeführt. Dadurch
bleiben Bewertungen und Zählerstände erhalten, wenn die Dateien später
aktualisiert werden. Beim Zähler wird nicht nur eine Zahl gespeichert, sondern
ein Protokoll mit Zeitstempel und eigener ID je Eintrag – daraus ergeben sich
die Zeiträume (Heute, 7 Tage), und beim Zusammenführen beider Speicherquellen
wird nichts doppelt gezählt.

Konsequenz: Die Daten sind **an Gerät und Browser gebunden**. Es gibt keine
Synchronisation zwischen Geräten, und das Löschen der Browserdaten löscht auch
die Bewertungen.

## Lokal starten

Ein Doppelklick auf `index.html` genügt – es wird kein Server benötigt. Für die
Live-Suche nach Cocktails ist eine Internetverbindung nötig; alles andere
funktioniert offline.

## Als App installieren

- **Handy/Desktop (PWA):** Seite im Browser öffnen und „Zum Startbildschirm
  hinzufügen“ bzw. „Installieren“ wählen. Die App startet dann im
  Vollbild-Modus.
- **Android (APK):** Im Ordner `apk-build/` liegt ein mit
  [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) erzeugtes
  TWA-Projekt (App-Name „BarCheck“, Paket `com.buechelealex.barcheck`), das die
  GitHub-Pages-Seite als Android-App verpackt. Der Ordner ist bewusst nicht Teil
  des Repositorys (siehe [.gitignore](.gitignore)), da er Build-Artefakte und
  den Signing-Keystore enthält.

## Technisches in Kürze

- Kein Framework, kein Build – reines HTML, CSS und Vanilla JavaScript:
  [data.js](data.js) (gemeinsame Cocktail-Liste, Speicherung, Kategorien),
  [script.js](script.js) (Bewertungsseite), [counter.js](counter.js)
  (Zählerseite) und [style.css](style.css) für beide Seiten.
- Beim Bewerten wird die Liste nicht neu gerendert: die vorhandenen Karten werden
  nur umgehängt und per FLIP-Technik (Position vorher messen → umsortieren →
  von der alten an die neue Position animieren) bewegt. Bei aktiviertem
  „Bewegung reduzieren“ (`prefers-reduced-motion`) wird ohne Animation
  umsortiert.
- Einzige externe Abhängigkeit: die TheCocktailDB-API für Suchvorschläge
  (`search.php?s=`), aufgerufen mit 300 ms Verzögerung nach der Eingabe;
  veraltete Antworten werden verworfen.
- Deployment: GitHub Pages aus dem `main`-Branch.
