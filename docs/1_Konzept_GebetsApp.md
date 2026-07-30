# Konzept: Persönliche Gebets-App (russisch-orthodox, deutschsprachig)

*Arbeitsstand v0.3 — PWA, alle Entscheidungen eingearbeitet*

---

## 0. Festgelegte Rahmenbedingungen

| Entscheidung | Festlegung |
|---|---|
| Tradition | Russisch-orthodox |
| Kalender | Julianisch (Weihnachten am 7. Januar greg.) |
| Sprache | Ausschliesslich Deutsch — modern, verständlich, auch die Gebetstexte |
| Bibeltext | Nur gemeinfreie Quellen bzw. eigene Übertragung |
| Plattform | **PWA** — Web-App, auf dem Home-Bildschirm installiert |
| Nutzerkreis | Nur du. Keine Veröffentlichung, kein App Store |
| Anmeldung | Google-Konto, ausschliesslich für den Abgleich zwischen deinen Geräten |
| Jesusgebet | Fester Bestandteil jedes Gebets |
| Kosten | Vollständig kostenfrei im Betrieb |

---

## 1. Leitidee

Eine sehr persönliche, ruhige App, die dich dreimal täglich zum Gebet ruft — nicht mit Content-Feed oder Gamification, sondern mit genau dem, was du in diesem Moment beten kannst. Du wählst die Themen, die dich gerade beschäftigen; die App zeigt dir für Morgen, Mittag und Abend jeweils ein kurzes, in sich geschlossenes Gebet.

**Drei Prinzipien:**

1. **Weniger ist heiliger.** Ein Bildschirm, ein Gebet, kein Scrollen durch Angebote. Die App führt dich ins Gebet und verschwindet dann.
2. **Verwurzelt, aber verständlich.** Die Texte stehen in der Haltung der orthodoxen Tradition, sprechen aber modernes Deutsch. Ehrfurcht entsteht durch Ernst und Ruhe, nicht durch altertümliche Endungen.
3. **Deine Themen, nicht meine.** Die App gibt keine Lebensziele vor. Sie hört zu, was du eingibst.

**Kernszenario:** 7:00 Uhr, Benachrichtigung auf dem Sperrbildschirm. Ein Tippen. Kreuzzeichen, ein Psalmvers, ein Gebet für „Geduld mit meinem Vater" und „Klarheit über den Jobwechsel", dann zwölf Mal das Jesusgebet. Zwei Minuten. Fertig.

---

## 2. Russisch-orthodoxer Rahmen

### 2.1 Gebetszeiten

| Zeit | Anlehnung | Charakter | Länge |
|---|---|---|---|
| Morgen | Morgengebete (Утренние молитвы) | Dank für den neuen Tag, Übergabe, Bitte um Bewahrung | ~150 Wörter |
| Mittag | Sechste Stunde | Kurz, unterbrechend, Erinnerung mitten im Lärm | ~60 Wörter |
| Abend | Abendgebete (Вечерние молитвы) | Rückblick, Reue, Vergebung, Übergabe der Nacht | ~180 Wörter |

### 2.2 Julianischer Kalender

- Alle Fest- und Heiligentage werden julianisch berechnet und im gregorianischen Datum angezeigt (derzeit +13 Tage).
- **Osterdatum** nach dem julianischen Algorithmus, davon abgeleitet der gesamte bewegliche Festkreis: Triodion-Vorbereitungswochen, Grosse Fastenzeit, Karwoche, Ostern, Christi Himmelfahrt, Pfingsten, Allerheiligen, Apostelfasten.
- **Feste Fastenzeiten:** Weihnachtsfasten (28.11.–6.1. jul.), Marienfasten (1.–14.8. jul.), dazu Mittwoch und Freitag ganzjährig.
- **Liturgische Färbung** beeinflusst den Ton: mehr Reue in der Fastenzeit, Osterjubel in den 40 Tagen nach Ostern — dort beginnt das Gebet mit „Christus ist auferstanden!" statt mit der gewöhnlichen Eröffnung.
- **Heiliger des Tages** aus dem russischen Heiligenkalender (Nikolaus, Serafim von Sarow, Sergius von Radonesch, Matrona von Moskau, Johannes von Kronstadt u. a.), optional als Zeile und in der Fürbitte.
- **Psalmen-Zählung** folgt der Septuaginta: Ps 50 ist das Bussgebet, nicht Ps 51. Masoretische Zählung in Klammern.

### 2.3 Das Jesusgebet (fest)

> „Herr Jesus Christus, Sohn Gottes, erbarme dich meiner, des Sünders."

Fester Abschluss jedes der drei Gebete. Zähler mit wählbarer Anzahl (12 / 33 / 100), ein sanfter Vibrationsimpuls pro Wiederholung, wie die Knoten einer Tschotki. Der Bildschirm zeigt dabei nur den Text und einen wachsenden Kreis.

### 2.4 Sprachliche Leitplanken

- Anrede an Gott in der Du-Form, ernst und schlicht — modernes Deutsch, aber keine Alltagssprache, keine Anbiederung, keine Ausrufezeichen.
- Trinitarisch und christozentrisch; Schluss trinitarisch oder auf Christus hin.
- Fürbitte der Gottesgebärerin und der Heiligen erwünscht — immer als *Bitte um Fürsprache*, nie als Anbetung.
- Keine Wohlstands- oder Erfolgstheologie. Bitten werden gestellt, aber unter „wenn es Dein Wille ist".
- Keine Prophetie, keine Zusagen im Namen Gottes, kein Ersatz für Beichte und geistliche Begleitung.

---

## 3. Kernfunktionen

### 3.1 Themen (das Herzstück)

- **Startset an Kategorien** zum An- und Abwählen: Familie · Ehe/Partnerschaft · Arbeit & Berufung · Gesundheit · Angst & Sorge · Zorn & Vergebung · Dankbarkeit · Reue & Umkehr · Reinheit · Geduld · Finanzen · Entscheidungen · Verstorbene · Schwierige Menschen · Glaubenszweifel · Demut
- **Eigene Themen** als Freitext: „Gespräch mit dem Chef am Donnerstag", „Krankheit meiner Mutter". Diese sind die wertvollsten und müssen mit einem Tippen erreichbar sein.
- **Zustände:** aktiv · pausiert · erhört/abgeschlossen (mit Datum). Das Archiv der erhörten Anliegen wird über die Zeit das Bewegendste an der App.
- **Rotation:** Pro Gebet fliessen 1–3 aktive Themen ein, wechselnd, damit kein Anliegen verwaist.

### 3.2 Gebetsansicht (der eine Bildschirm)

Ein zusammenhängender Fluss von oben nach unten:

1. **Eröffnung** — „Im Namen des Vaters, des Sohnes und des Heiligen Geistes." *(in der Osterzeit der Ostergruss)*
2. **Schriftwort** — kurzer Psalmvers oder Christuswort zum Thema, mit Stellenangabe (LXX-Zählung)
3. **Das Gebet** — auf deine Themen zugeschnitten
4. **Fürbitte** — Namen aus deiner Gedenkliste
5. **Jesusgebet** — mit Zähler
6. **Abschluss** — Kreuzzeichen, kurze Doxologie

Am Ende: *„Gebetet"* (schliesst still) und diskret *„Anderes Gebet"*.

### 3.3 Benachrichtigungen

- Drei feste Zeiten, frei einstellbar, einzeln abschaltbar.
- **Der Ton ist entscheidend:** kein „Du hast 3 Gebete verpasst!". Stattdessen ruhig und einladend — ein Psalmwort oder der erste Halbsatz. Kein Schuldaufbau, keine Streak-Verluste.
- Technisch über Web Push (siehe technische Spezifikation). Die Benachrichtigung enthält bewusst **keine** persönlichen Themen, sondern nur einen allgemeinen Ruf — die Gebetstexte selbst bleiben auf dem Gerät.

### 3.4 Gedenkliste (Diptychen)

Zwei Listen — Lebende und Entschlafene. Fliessen in die Fürbitte ein und lassen sich vor der Liturgie exportieren oder abschreiben.

### 3.5 Gebetstagebuch

Nach jedem Gebet optional ein Satz. Beim Abschliessen eines Themas fragt die App: „Wie hat Gott geantwortet?" — daraus entsteht über Monate ein Dankbarkeits-Archiv.

### 3.6 Bewusst *nicht* enthalten

Social Feed, Gebetsgruppen, strafende Streaks, Werbung, KI-„Seelsorge-Chat".

---

## 4. Inhalts- und Textkonzept

### 4.1 Drei Ebenen

| Ebene | Quelle | Beispiel |
|---|---|---|
| **Fixer Rahmen** | Kuratiert, fest in der App | Kreuzzeichen, Jesusgebet, Doxologie, Ostergruss |
| **Schriftwort** | Kuratierte Datenbank, ~300 Verse thematisch verschlagwortet | Ps 50,12 zu „Reue"; Ps 90 zu „Angst" |
| **Themengebet** | Vorab erzeugtes Korpus (siehe 5) | Der individuelle Mittelteil |

### 4.2 Bibeltext: gemeinfrei *und* modernes Deutsch

Hier liegt eine echte Spannung: gemeinfreie deutsche Übersetzungen (Luther 1912, Elberfelder 1905) sind sprachlich altertümlich; alle modernen Übersetzungen sind urheberrechtlich geschützt.

**Lösung:** Eine eigene, behutsame Übertragung von rund 300 ausgewählten Versen. Der Urtext ist gemeinfrei, eine eigene Formulierung ist dein eigenes Werk — rechtlich sauber, solange keine geschützte moderne Übersetzung als Vorlage abgeschrieben wird. Luther 1912 dient als Ausgangsbasis und wird sprachlich geglättet.

Beispiel: statt „Schaffe in mir, Gott, ein reines Herz, und gib mir einen neuen, gewissen Geist" → „Erschaffe in mir ein reines Herz, Gott, und gib mir einen neuen, festen Geist."

### 4.3 Qualitätssicherung

- Jedes Gebet im Korpus wird gegen eine Prüfliste validiert, bevor es aufgenommen wird.
- „Melden"-Funktion für Texte, die daneben liegen.
- Da die App nur für dich ist, entfällt der Druck einer öffentlichen Freigabe. Trotzdem lohnt es sich, eine Auswahl der Gebete deinem Priester oder geistlichen Vater zu zeigen — nicht aus Vorsicht, sondern weil es die Texte besser macht.

---

## 5. Textbeschaffung ohne laufende Kosten

### 5.1 Warum kein Live-Aufruf bei jedem Gebet

Das Gebet, das morgens um sieben erscheint, darf nicht von einem Netzaufruf abhängen:

1. **Verfügbarkeit.** Ein Gebet, das im Zug oder im Funkloch nicht lädt, ist wertlos.
2. **Datenschutz.** Anbieter behalten sich bei kostenlosen Kontingenten vor, Eingaben zur Modellverbesserung zu verwenden. Was täglich unbemerkt abfliesst, ist etwas anderes als das, was du bewusst einmal sendest.
3. **Limits.** Kostenlose Kontingente werden ohne Vorankündigung gekürzt.

Deshalb: Das tägliche Gebet kommt immer aus dem Korpus auf dem Gerät. Neue Texte werden erzeugt, wenn **du** es auslöst (siehe 5.3) — nicht dreimal täglich im Hintergrund.

### 5.2 Stattdessen: mitgeliefertes Gebetskorpus

Die Gebete werden **einmalig vorab erzeugt** — von dir, mit Claude, ausserhalb der App — und als JSON-Datei mit ausgeliefert.

```
16 Kategorien × 3 Tageszeiten × 4 liturgische Färbungen × 6 Varianten
≈ 1 150 Gebete, etwa 1–2 MB
```

Liturgische Färbungen: gewöhnliche Zeit · Fastenzeit · Osterzeit · Trauer/Gedenken.

**Vorteile:** laufende Kosten null · funktioniert vollständig offline · kein persönliches Datum verlässt je das Gerät · jeder Text war einmal von dir angesehen · sofortige Anzeige ohne Ladezeit.

### 5.3 Eigene Freitext-Themen — zwei Wege

**Weg 1 · Platzhalter (immer verfügbar).** Jeder Gebetstext enthält an einer dafür vorgesehenen Stelle einen Satz mit Platzhalter. Ist ein eigenes Thema aktiv, wird es dort eingesetzt:

> „…besonders bringe ich Dir vor Augen: **das Gespräch mit dem Chef am Donnerstag**."

Ist kein eigenes Thema aktiv, entfällt der Satz. Funktioniert offline, ohne Netz, ohne Kosten.

**Weg 2 · Eigene Gebete erzeugen (auf Knopfdruck).** Legst du ein neues Thema oder eine neue Kategorie an, bietet die App an: *„Eigene Gebete für dieses Thema erstellen."* Ein Tippen erzeugt drei passgenaue Gebete — Morgen, Mittag, Abend — im selben Ton wie das übrige Korpus, und speichert sie dauerhaft auf dem Gerät.

Das ist der entscheidende Unterschied zu einem Live-Aufruf bei jedem Gebet: Es geschieht **einmal pro Thema**, ausdrücklich von dir ausgelöst, und das Ergebnis gehört danach dir. Ab dann läuft alles wieder offline.

**Was dabei gesendet wird:** ausschliesslich der Titel des Themas, die Kategorie und die Tageszeit. Niemals Tagebuch, niemals Gedenknamen, niemals dein Konto. Bei besonders persönlichen Themen kannst du die Erzeugung überspringen und bei Weg 1 bleiben — ein Schalter je Thema regelt das.

### 5.4 Nachschub

Neue Gebete fügst du dem JSON hinzu und veröffentlichst die App neu — ein Befehl. Ein Server dafür ist nicht nötig.

---

## 6. Gestaltungsrichtung

- **Ruhe vor Reichtum.** Viel Weissraum, ein Textblock, keine Kacheln im Gebetsfluss.
- **Farbwelt:** warmes Pergament-Off-White als Grund, tiefes byzantinisches Rot als Akzent, Gold sehr sparsam für Trennlinien. Dark Mode in tiefem, warmem Anthrazit — Pflicht für Abend- und Nachtgebete.
- **Typografie:** ruhige Serifenschrift für Gebets- und Schrifttexte, gross gesetzt (19–21 pt), grosszügige Zeilenhöhe. Serifenlos nur für Bedienelemente.
- **Ornament:** höchstens das orthodoxe Kreuz mit drei Balken, klein, an einer einzigen Stelle. Keine Stock-Icons, keine Ikonen als Hintergrundtapete.
- **Vibration statt Ton** beim Jesusgebet-Zähler.

---

## 7. Roadmap

**MVP (v0.1)** — Gerüst und Datenmodell · Themenverwaltung · drei Gebetszeiten · Gebetsansicht mit Schriftwort, Gebet und Jesusgebet · Korpus mit ~400 Gebeten für die gewöhnliche Zeit · lokale Speicherung · Dark Mode · als PWA installierbar

**v0.2** — Julianischer Kirchenkalender (Fastenzeiten, Feste, Heiliger des Tages) · Korpus auf alle vier Färbungen erweitert · Benachrichtigungen über Web Push

**v0.3** — Google-Anmeldung und Geräteabgleich · Gedenkliste · Gebetstagebuch · Archiv erhörter Anliegen

**Später** — Audio (gesprochenes Gebet) · Widget · optionaler eigener API-Schlüssel für frei formulierte Gebete

---

## 8. Verwandte Dokumente

- `2_Prompt_fuer_Claude_Design.md` — Gestaltungsauftrag für Claude Design
- `3_Technische_Spezifikation.md` — Bauplan für Claude Code
