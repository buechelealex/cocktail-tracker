# 🍹 Cocktail-Bewertungen (BarCheck)

Eine kleine Web-App zum Bewerten und Zählen von Cocktails, ohne Build-Schritt,
ohne Server und ohne Benutzerkonto – alle Daten bleiben auf dem eigenen Gerät.

Sie besteht aus drei Seiten:

| Seite | Zweck |
| --- | --- |
| [index.html](index.html) | Cocktails bewerten, Zutaten ansehen, eigene Cocktails anlegen |
| [counter.html](counter.html) | Zählen, wie oft welcher Cocktail getrunken wurde |
| [stats.html](stats.html) | Auswertung ansehen: Kennzahlen, Kreisdiagramm, Top-Drinks, Alkoholmenge – und als Story teilen |

Alle Seiten teilen sich die Cocktail-Liste und die Speicherlogik aus
[data.js](data.js); oben wechselt man mit den drei Reitern zwischen ihnen.
Mit eigenen **Listen** („Bierzelt“, „Exotische Drinks“ …) lässt sich die
Anzeige auf eine Auswahl eingrenzen – die Auswahl gilt auf allen drei Seiten
und begrenzt auch die Statistik.

Live: <https://projects.abuechele.de/cocktail-tracker/>
Quellcode: <https://github.com/buechelealex/cocktail-tracker>

Beides ist auch im Fußbereich jeder Seite verlinkt, zusammen mit dem Hinweis,
dass sämtliche Daten nur lokal im Browser liegen.

## Was die App kann

- **28 Getränke sind fest hinterlegt** (Blue Lagoon, Negroni, Pina Colada, Gin Tonic,
  dazu Bierzelt-Klassiker wie Radler, Russe oder Fanta-Korn),
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
- **Eigene Listen anlegen** – z. B. „Bierzelt“ (Bier, Radler, Russe, Vodka-Bull …)
  und „Exotische Drinks“ (Punch, Campari Orange, Bellini …). Über die Chip-Leiste
  oben schaltet man um; die Auswahl gilt auf allen drei Seiten und grenzt auch
  die Statistik ein.
- **Zählen, was getrunken wurde** (Seite „🥂 Zähler“): pro Cocktail mit
  **+**/**−**, häufigste zuerst, mit Suchfeld.
- **Statistik ansehen** (Seite „📊 Statistik“): Gesamt, Heute und die letzten
  7 Tage, ein **Kreisdiagramm** der Verteilung nach Art, ein **Leaderboard**
  der Top-Drinks und die getrunkene Menge **reinen Alkohols**.
- **Story-Bild teilen** – die Zählerstände als fertiges Hochformat-Bild
  (1080×1920) für Instagram & Co. (auf der Statistik-Seite), bewusst knapp
  gehalten: Gesamtzahl, Top 3 und die häufigste Art.
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
wie auf der Bewertungsseite, jeweils mit **− 0 +**. Diese Seite dient nur dem
Zählen – die Auswertung steht auf der Statistik-Seite.

1. Beim Trinken eines Cocktails auf **+** tippen. Der Cocktail wandert nach oben
   (häufigste zuerst) und wird sofort gespeichert.
2. Zu viel gezählt? **−** entfernt den zuletzt gezählten Drink dieser Sorte.
3. Das Suchfeld filtert die Liste nach Namen.

Der Button ganz unten löscht nach Rückfrage die Zählerstände. Ist oben eine
eigene Liste gewählt, betrifft er auch nur deren Cocktails und heißt dann z. B.
**„Zählerstände in ‚Bierzelt‘ zurücksetzen“**; unter „Alle“ löscht er das
komplette Trink-Protokoll. Bewertungen und eigene Cocktails bleiben unberührt.
Wird ein bereits gezählter Cocktail aus der Liste gelöscht, bleibt sein
Zählerstand mit dem Hinweis „nicht mehr in der Liste“ erhalten.

### Eigene Listen anlegen und bearbeiten

Unter der Navigation steht auf jeder Seite eine Leiste mit **„Alle“**, den
eigenen Listen und **„+ Liste“**.

1. **„+ Liste“** antippen. Im Dialog ein Symbol (Emoji, optional) und einen
   Namen eingeben, z. B. 🍺 und „Bierzelt“.
2. Darunter die Cocktails ankreuzen, die dazugehören. Das Suchfeld hilft bei
   langen Listen, **„Angezeigte auswählen“** hakt alle gerade sichtbaren Treffer
   an, **„Auswahl leeren“** setzt zurück.
3. **Speichern** – die neue Liste ist sofort aktiv.

Ein Tipp auf einen Chip schaltet auf diese Liste um; angezeigt werden dann nur
noch deren Getränke. Beim aktiven Chip erscheint ein **✎** zum Bearbeiten (dort
liegt auch **„Liste löschen“** – dabei bleiben die Cocktails selbst erhalten).
**„Alle“** hebt die Eingrenzung wieder auf.

Die gewählte Liste gilt für alle drei Seiten und bleibt nach dem Neuladen
erhalten. Ein Cocktail darf in mehreren Listen stehen. Legst du bei aktiver
Liste einen neuen Cocktail an, landet er automatisch darin – sonst wäre er
sofort wieder ausgeblendet.

### Statistik ansehen

Oben auf den Reiter **„📊 Statistik“** wechseln.

1. Vier Kacheln zeigen **Gesamt**, **Heute**, **7 Tage** und **Sorten**
   (Anzahl verschiedener Cocktails). Die ersten drei sind zugleich
   **Umschalter für den Zeitraum**: ein Tipp darauf grenzt alles Weitere auf
   diese Zeitspanne ein – Kreisdiagramm, Top-Drinks und Alkoholmenge. Die
   aktive Kachel ist farbig umrandet, jede behält dabei ihre eigene Zahl.
   „Sorten“ ist keine Zeitspanne und daher nicht anklickbar; sie zeigt, wie
   viele verschiedene Getränke im gewählten Zeitraum vorkamen.
2. **Nach Art** stellt als Kreisdiagramm dar, wie sich die Drinks auf die Basis
   verteilen – Vodka, Gin, Rum, Tequila, Whisky, Brandy, Korn & Klare,
   Bitter & Aperitif, Schaumwein, Wein, Likör, Bier oder „Alkoholfrei /
   Sonstige“. Die Art wird automatisch aus den Zutaten abgeleitet (erste
   passende Regel gewinnt). Jede Art hat eine feste Farbe, daneben stehen
   Anzahl und Prozent.
3. **🏆 Top-Drinks** listet die häufigsten Getränke mit 🥇🥈🥉 und Balken.
4. **🍸 Alkohol** zeigt, wie viel reiner Alkohol darin steckt – in Millilitern,
   Gramm und „Halbe Bier“.

Liste und Zeitraum lassen sich kombinieren. Worauf sich die Zahlen gerade
beziehen, steht unter den Kacheln – z. B. „Nur 🍺 Bierzelt · Heute“. Bei
„Alle“ und „Gesamt“ gibt es nichts einzuschränken, dann bleibt die Zeile leer.
Der gewählte Zeitraum gilt für den Seitenbesuch und beginnt jedes Mal wieder
bei „Gesamt“; die gewählte Liste bleibt dagegen dauerhaft gespeichert.

#### Was hätte man damit machen können?

Der Button unter der Alkoholmenge öffnet ein Popup, das dieselbe Menge in
Vergleiche aus ganz verschiedenen Bereichen umrechnet – Auto fahren, Flugzeug
fliegen, Grill reinigen, Hände desinfizieren, Fondue warm halten, Wasser kochen,
Handy laden und eine LED brennen lassen.

Grundlage ist die Menge reinen Alkohols aus den Zutaten; wo Energie im Spiel
ist, wird über den Heizwert von Ethanol (rund 21 kJ je ml) gerechnet. Das ist
als Spielerei gedacht, nicht als Messwert.

Selbst angelegte Cocktails **ohne Mengenangaben** lassen sich nicht berechnen.
Sie werden nicht stillschweigend als 0 gezählt, sondern unter der Karte
namentlich genannt („Ohne Mengenangabe und daher nicht mitgerechnet: …“).

### Als Instagram-Story teilen

Sobald mindestens ein Cocktail gezählt ist, erscheint auf der Statistik-Seite
unten rechts der Button **„📸 Teilen“**.

1. Button antippen – es öffnet sich eine Vorschau des Story-Bilds.
2. Oben den Zeitraum wählen: **Heute**, **7 Tage** oder **Gesamt**.
   Voreingestellt ist der Zeitraum, der auf der Statistik-Seite gerade aktiv
   ist – das Bild zeigt also dasselbe wie die Seite dahinter.
3. **Teilen** öffnet das Teilen-Menü des Handys – dort Instagram wählen und das
   Bild in die Story legen. **Speichern** legt das PNG stattdessen in den
   Downloads ab.

Das Bild ist 1080×1920 Pixel groß (Story-Format) und zeigt bewusst nur wenig:
die Gesamtzahl, aus wie vielen Sorten sie besteht, die Top 3 mit Balken und die
häufigste Art. Gestaltung und Farben entsprechen der Website. Ist oben eine
Liste gewählt, zeigt das Bild nur deren Drinks und nennt die Liste im Kopf.

Browser ohne Datei-Teilen (typischerweise am Desktop) laden das Bild
automatisch herunter statt das Teilen-Menü zu öffnen.

## Wo die Daten liegen

Alles wird lokal im Browser gespeichert, unter diesen Schlüsseln:

| Schlüssel | Inhalt |
| --- | --- |
| `cocktail-ratings` | Bewertungen (Cocktail-Name in Kleinbuchstaben mit Bindestrichen → 0–5) |
| `cocktail-custom-list` | Selbst hinzugefügte Cocktails (Name → Zutatenliste) |
| `cocktail-deleted-base` | Aus der Liste entfernte Standard-Cocktails (Name → `true`) |
| `cocktail-counts` | Trink-Protokoll: ein Eintrag `{id, name, ts}` pro getrunkenem Cocktail |
| `cocktail-lists` | Eigene Listen: je Liste `{id, name, emoji, items, ts}` |
| `cocktail-active-list` | ID der gerade gewählten Liste (`null` = „Alle“) |

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

Am besten über einen kleinen Webserver im Projektordner:

```
python -m http.server 8765
```

Danach <http://localhost:8765> aufrufen.

Ein Doppelklick auf `index.html` (`file://`) funktioniert in Chrome, **nicht
aber in Firefox**: Firefox behandelt seit Version 68 jede lokale Datei als
eigene Origin, dadurch haben die drei Seiten getrennte localStorage-Speicher
und teilen weder Listen noch eigene Cocktails.

Für die Live-Suche nach Cocktails ist eine Internetverbindung nötig; alles
andere funktioniert offline.

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

- **Wichtig beim Ändern von CSS oder JavaScript:** In den drei HTML-Dateien
  hängt an jeder eingebundenen Datei eine Versionsmarke (`style.css?v=2`).
  Diese Zahl bei jeder Änderung hochzählen – sonst liefern Browser (vor allem
  auf dem Handy) weiter ihre alte Kopie aus dem Cache aus, während neu
  hinzugekommene Dateien frisch geladen werden. Das Ergebnis ist eine halb
  aktuelle Seite: neue Bausteine ohne die zugehörigen Regeln, z. B. ein
  schwarzes Kreisdiagramm.
- Kein Framework, kein Build – reines HTML, CSS und Vanilla JavaScript:
  [data.js](data.js) (gemeinsame Cocktail-Liste, Speicherung, Listen,
  Kategorien), [lists.js](lists.js) (Listen-Leiste und -Dialog, von allen
  Seiten genutzt), [script.js](script.js) (Bewertungsseite),
  [counter.js](counter.js) (Zählerseite), [stats.js](stats.js)
  (Statistikseite), [alcohol.js](alcohol.js) (Alkoholmenge und Vergleiche),
  [share.js](share.js) (Story-Bild) und
  [style.css](style.css) für alle Seiten.
- Änderungen werden über das `storage`-Ereignis zwischen gleichzeitig
  geöffneten Tabs abgeglichen – wer im Zähler-Tab zählt, sieht es im
  Statistik-Tab sofort.
- Das Story-Bild wird zur Laufzeit auf ein `<canvas>` gezeichnet und per
  Web-Share-API (`navigator.share` mit Datei) weitergegeben; die PNG-Datei wird
  schon beim Öffnen der Vorschau erzeugt, weil Safari `navigator.share` nur
  direkt aus der Nutzeraktion heraus erlaubt.
- Beim Bewerten wird die Liste nicht neu gerendert: die vorhandenen Karten werden
  nur umgehängt und per FLIP-Technik (Position vorher messen → umsortieren →
  von der alten an die neue Position animieren) bewegt. Bei aktiviertem
  „Bewegung reduzieren“ (`prefers-reduced-motion`) wird ohne Animation
  umsortiert.
- Einzige externe Abhängigkeit: die TheCocktailDB-API für Suchvorschläge
  (`search.php?s=`), aufgerufen mit 300 ms Verzögerung nach der Eingabe;
  veraltete Antworten werden verworfen.
- Deployment: GitHub Pages aus dem `main`-Branch.
