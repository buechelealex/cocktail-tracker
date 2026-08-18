# 🍹 Cocktail-Bewertungen (BarCheck)

Eine kleine Web-App zum Bewerten von Cocktails. Sie besteht aus einer einzigen
HTML-Datei ([index.html](index.html)) ohne Build-Schritt, ohne Server und ohne
Benutzerkonto – alle Daten bleiben auf dem eigenen Gerät.

Live: <https://buechelealex.github.io/cocktail-tracker/>

## Was die App kann

- **19 Cocktails sind fest hinterlegt** (Blue Lagoon, Negroni, Pina Colada, Gin Tonic …),
  jeweils mit Zutatenliste inklusive Mengenangaben.
- **Bewerten mit 1–5 Sternen.** Bewertete Cocktails wandern automatisch in den
  Bereich „⭐ Bewertet“ und werden dort nach Bewertung sortiert (beste zuerst,
  bei Gleichstand alphabetisch). Unbewertete stehen alphabetisch darunter.
- **Zutaten aufklappen** per Tipp auf den Cocktailnamen.
- **Eigene Cocktails hinzufügen** – mit Live-Suche gegen
  [TheCocktailDB](https://www.thecocktaildb.com/): beim Tippen erscheinen
  Vorschläge, und bei Auswahl werden Name und Zutaten automatisch übernommen.
- **Zusammenfassung** am Seitenende: wie viele Cocktails bewertet sind und der
  Durchschnitt in Sternen.
- **Installierbar** als App (PWA über [manifest.json](manifest.json)); zusätzlich
  existiert eine Android-Variante als APK.

## Anleitung

### Einen Cocktail bewerten

1. Cocktail in der Liste suchen.
2. Rechts auf den gewünschten Stern tippen – z. B. der vierte Stern für 4 ★.
3. Die Karte springt in den Bereich „⭐ Bewertet“ und wird gespeichert
   (kurze Statusmeldung „Gespeichert ✓“ oben).

**Bewertung entfernen:** noch einmal auf den *aktuell höchsten gesetzten* Stern
tippen – die Bewertung wird auf 0 zurückgesetzt und der Cocktail landet wieder
unter „Unbewertet“.

### Zutaten ansehen

Auf den Cocktailnamen (oder das ▶-Symbol) tippen. Das Panel klappt auf und zeigt
die Zutaten mit Mengen. Erneutes Tippen schließt es wieder. Bei eigenen
Cocktails ohne eingetragene Zutaten steht dort „Keine Zutaten hinterlegt.“

### Eigenen Cocktail hinzufügen

1. Unten auf **„+ Neuen Cocktail hinzufügen“** tippen.
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
4. **Speichern**. Der Cocktail erscheint mit dem Hinweis „eigener“ in der Liste,
   mit bereits aufgeklappten Zutaten.

Doppelte Namen werden abgelehnt („Diesen Cocktail gibt es schon.“) – die Prüfung
ignoriert Groß-/Kleinschreibung.

### Eigenen Cocktail löschen

Zutaten des Cocktails aufklappen und unten auf **„Diesen selbst hinzugefügten
Cocktail löschen“** tippen, dann die Rückfrage bestätigen. Die Bewertung des
Cocktails wird mitgelöscht. Die 19 fest hinterlegten Cocktails lassen sich nicht
löschen.

### Alle Bewertungen zurücksetzen

Ganz unten **„Alle Bewertungen zurücksetzen“** – nach Bestätigung sind alle
Sterne wieder leer. Selbst hinzugefügte Cocktails bleiben dabei erhalten, nur
ihre Bewertungen verschwinden.

## Wo die Daten liegen

Alles wird lokal im Browser gespeichert, unter zwei Schlüsseln:

| Schlüssel | Inhalt |
| --- | --- |
| `cocktail-ratings` | Bewertungen (Cocktail-Name in Kleinbuchstaben mit Bindestrichen → 0–5) |
| `cocktail-custom-list` | Selbst hinzugefügte Cocktails (Name → Zutatenliste) |

Geschrieben wird immer in `localStorage` **und** – falls vorhanden – in
`window.storage`; beim Laden werden beide Quellen zusammengeführt. Dadurch
bleiben Bewertungen erhalten, wenn die HTML-Datei später aktualisiert wird.

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

- Kein Framework, kein Build – reines HTML, CSS und Vanilla JavaScript in einer
  Datei.
- Einzige externe Abhängigkeit: die TheCocktailDB-API für Suchvorschläge
  (`search.php?s=`), aufgerufen mit 300 ms Verzögerung nach der Eingabe;
  veraltete Antworten werden verworfen.
- Deployment: GitHub Pages aus dem `main`-Branch.
