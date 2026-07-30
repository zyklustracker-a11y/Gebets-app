# Technische Spezifikation — Gebets-PWA

*Bauplan für Claude Code. Ergänzend zu `1_Konzept_GebetsApp.md` (Inhalt und Haltung) und den Entwürfen aus Claude Design (Aussehen).*

---

## 1. Rahmen

Eine installierbare Web-App (PWA) für ein einziges Benutzerkonto, in erster Linie fürs iPhone. Kein App Store, keine Mehrbenutzerfähigkeit, keine Bezahlfunktion, keine Werbung, kein Tracking. Der Betrieb muss dauerhaft kostenfrei bleiben — jede vorgeschlagene Abhängigkeit muss in ein kostenloses Kontingent passen.

Die App funktioniert vollständig offline. Netzverbindung wird nur für zwei Dinge gebraucht: den Abgleich zwischen Geräten und den Versand der Benachrichtigungen.

---

## 2. Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Build | Vite + React + TypeScript | schnell, unkompliziert, gut für PWA |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest, Service Worker, Offline-Cache |
| Styling | Tailwind CSS | passt zum Export aus Claude Design |
| Routing | `react-router-dom` | echte URLs, wichtig für die Installation |
| Zustand | Zustand (`zustand`) | leichtgewichtig, kein Overhead |
| Lokale Daten | IndexedDB über `dexie` | strukturiert, offline, deutlich robuster als localStorage |
| Anmeldung | Firebase Authentication, Google-Provider | kostenlos, wenige Zeilen |
| Abgleich | Cloud Firestore | kostenloses Kontingent reicht für einen Nutzer um ein Vielfaches |
| Hosting | Firebase Hosting | gleiche Konsole wie Auth, kostenloses Kontingent, HTTPS inklusive |
| Benachrichtigungen | Web Push (VAPID) über einen Cloudflare Worker mit Cron-Trigger | kostenloses Kontingent, läuft auch bei geschlossener App |

**Bewusst nicht:** Firebase Cloud Functions mit Scheduler (setzt den kostenpflichtigen Blaze-Tarif voraus), Analytics-SDKs, UI-Bibliotheken ausser Tailwind.

---

## 3. Projektstruktur

```
src/
  main.tsx
  App.tsx                    Routing, Theme-Umschaltung
  routes/
    Heute.tsx
    Gebet.tsx                der Kernbildschirm
    Jesusgebet.tsx
    Themen.tsx
    ThemaNeu.tsx
    Gedenkliste.tsx
    Einstellungen.tsx
  components/                aus den Claude-Design-Entwürfen
  lib/
    db.ts                    Dexie-Schema
    kalender.ts              julianischer Kirchenkalender
    gebetsauswahl.ts         welches Gebet heute, zu welcher Zeit
    push.ts                  Berechtigung, Subscription, Registrierung
    sync.ts                  Firestore-Abgleich
    firebase.ts              Initialisierung
  store/
    useStore.ts
data/
  gebete.json                das Gebetskorpus
  verse.json                 Schriftworte
  heilige.json               Heiligenkalender, julianische Daten
public/
  manifest.webmanifest
  icons/
worker/
  index.ts                   Cloudflare Worker, Cron + Push-Versand
  wrangler.toml
```

---

## 4. Datenmodell

```ts
type Tageszeit = 'morgen' | 'mittag' | 'abend';
type Faerbung  = 'gewoehnlich' | 'fastenzeit' | 'osterzeit' | 'trauer';
type Status    = 'aktiv' | 'pausiert' | 'erhoert';

interface Thema {
  id: string;
  titel: string;              // bei Kategorien der Kategoriename, bei eigenen der Freitext
  kategorie: string;          // Schlüssel ins Korpus
  istEigen: boolean;
  status: Status;
  erstelltAm: string;         // ISO
  abgeschlossenAm?: string;
  notiz?: string;             // Antwort auf "Wie hat Gott geantwortet?"
}

interface Gebetszeit {
  typ: Tageszeit;
  uhrzeit: string;            // "07:00"
  aktiv: boolean;
  benachrichtigung: boolean;
}

interface Gebetseintrag {        // Protokoll, was wann gebetet wurde
  id: string;
  datum: string;               // "2026-07-30"
  tageszeit: Tageszeit;
  korpusId: string;
  versId: string;
  themenIds: string[];
  gebetetAm?: string;          // ISO, gesetzt beim Tippen auf "Gebetet"
}

interface Gedenkname {
  id: string;
  name: string;
  art: 'lebend' | 'entschlafen';
  aktiv: boolean;
}

interface Journaleintrag {
  id: string;
  gebetId: string;
  datum: string;
  text: string;
}

interface Einstellungen {
  jesusgebetAnzahl: 12 | 33 | 100;
  heiligentagAnzeigen: boolean;
  erscheinungsbild: 'system' | 'hell' | 'dunkel';
  kontoId?: string;
}
```

### Korpusformat (`data/gebete.json`)

```json
[
  {
    "id": "arbeit-morgen-gewoehnlich-03",
    "kategorie": "arbeit",
    "tageszeit": "morgen",
    "faerbung": "gewoehnlich",
    "text": "Herr, ich beginne diesen Tag … {{anliegen}} … Amen."
  }
]
```

Der Platzhalter `{{anliegen}}` steht für den eingesetzten Freitext eines eigenen Themas. Ist kein eigenes Thema aktiv, wird der **gesamte Satz**, in dem der Platzhalter steht, entfernt — nicht nur der Platzhalter. Der Satz ist im Korpus deshalb immer ein eigenständiger Satz.

### Schriftworte (`data/verse.json`)

```json
[
  {
    "id": "ps50-12",
    "text": "Erschaffe in mir ein reines Herz, Gott, und gib mir einen neuen, festen Geist.",
    "stelle": "Psalm 50,12",
    "stelleMasoretisch": "Psalm 51,12",
    "kategorien": ["reue", "reinheit", "umkehr"]
  }
]
```

---

## 5. Kirchenkalender (`lib/kalender.ts`)

Reines TypeScript, keine Abhängigkeiten, vollständig testbar. Das ist der fehleranfälligste Teil des Projekts — bau ihn zuerst und mit Tests.

### Osterdatum (julianisch, nach Meeus)

```ts
function orthodoxeOstern(jahr: number): Date {
  const a = jahr % 4;
  const b = jahr % 7;
  const c = jahr % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const monat = Math.floor((d + e + 114) / 31);   // 3 = März, 4 = April
  const tag   = ((d + e + 114) % 31) + 1;
  // Ergebnis ist ein julianisches Datum -> +13 Tage für gregorianisch (gültig 1900–2099)
  const julianisch = new Date(Date.UTC(jahr, monat - 1, tag));
  julianisch.setUTCDate(julianisch.getUTCDate() + 13);
  return julianisch;
}
```

**Testfälle:** 2026 → 12. April · 2027 → 2. Mai · 2028 → 16. April.

### Abgeleitete Zeiten

- Grosse Fastenzeit: 48 Tage vor Ostern bis Karsamstag
- Osterzeit: Ostern bis Christi Himmelfahrt (+39 Tage), im weiteren Sinn bis Pfingsten (+49)
- Apostelfasten: Montag nach Allerheiligen (Ostern +57) bis 28. Juni jul. (= 11. Juli greg.)
- Marienfasten: 1.–14. August jul. (= 14.–27. August greg.)
- Weihnachtsfasten: 15. November – 24. Dezember jul. (= 28. November – 6. Januar greg.)
- Mittwoch und Freitag ganzjährig, ausser in den fastenfreien Wochen

### Öffentliche Schnittstelle

```ts
function faerbungFuer(datum: Date): Faerbung;
function istFastentag(datum: Date): boolean;
function heiligerDesTages(datum: Date): string | null;
function festDesTages(datum: Date): string | null;
```

Feste Feiertage und Heilige liegen als julianische Monat/Tag-Paare in `heilige.json` und werden beim Vergleich um 13 Tage verschoben.

---

## 6. Gebetsauswahl (`lib/gebetsauswahl.ts`)

Ablauf beim Öffnen eines Gebets:

1. Färbung des Tages bestimmen
2. Aktive Themen laden, 1–3 auswählen — mit Rotation, damit nicht immer dasselbe drankommt: bevorzugt die Themen, die am längsten nicht vorkamen
3. Für die Kategorie des Hauptthemas ein Gebet aus dem Korpus wählen, das zu Tageszeit und Färbung passt und in den letzten 14 Tagen nicht verwendet wurde
4. Ist ein eigenes Thema unter den ausgewählten: dessen Titel in `{{anliegen}}` einsetzen, sonst den Trägersatz entfernen
5. Passendes Schriftwort zur Kategorie wählen, ebenfalls mit Wiederholungssperre
6. Fürbitte aus den aktiven Gedenknamen zusammensetzen
7. Ergebnis als `Gebetseintrag` speichern, damit derselbe Tag beim erneuten Öffnen dasselbe Gebet zeigt

Die Auswahl ist deterministisch pro (Datum, Tageszeit) — mehrmaliges Öffnen darf den Text nicht wechseln. „Anderes Gebet" setzt die Auswahl bewusst neu.

---

## 7. Benachrichtigungen

### In der App (`lib/push.ts`)

1. Berechtigung **nur** nach einem echten Tippen in den Einstellungen anfragen — auf iOS scheitert es sonst.
2. Voraussetzung auf iOS: iOS 16.4 oder neuer und die App muss über „Zum Home-Bildschirm" installiert sein. Prüfe `window.navigator.standalone` und zeige sonst einen ruhigen Hinweis mit Anleitung statt einer Fehlermeldung.
3. `PushSubscription` mit dem öffentlichen VAPID-Schlüssel anlegen, zusammen mit den drei Uhrzeiten an den Worker schicken.
4. Im Service Worker das `push`-Ereignis behandeln und die Benachrichtigung anzeigen; ein Tippen öffnet direkt die Gebetsansicht der jeweiligen Tageszeit.

### Worker (`worker/index.ts`)

- Cron-Trigger alle 15 Minuten (`*/15 * * * *`).
- **Achtung Zeitzone:** Cron läuft in UTC, die Uhrzeiten des Nutzers sind Ortszeit in Zürich mit Sommerzeitwechsel. Rechne im Worker über `Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' })` und vergleiche mit den gespeicherten Zeiten. Niemals fest kodierte UTC-Offsets verwenden.
- Subscriptions und Uhrzeiten in Cloudflare KV ablegen.
- Doppelversand verhindern: pro (Datum, Tageszeit) das Versanddatum in KV vermerken.
- Der Benachrichtigungstext kommt aus einer kleinen Liste im Worker (Psalmzeilen und schlichte Rufe) und enthält **niemals** Themen, Namen oder Journalinhalte.

---

## 8. Anmeldung und Abgleich

- Firebase Auth, ausschliesslich Google-Provider. Die Anmeldung ist optional: ohne Konto läuft alles lokal.
- Firestore-Struktur: `nutzer/{uid}/themen`, `.../gedenknamen`, `.../journal`, `.../einstellungen`, `.../protokoll`
- Abgleich in beide Richtungen beim Start und bei jeder Änderung, letzter Schreibvorgang gewinnt. Bei einem einzelnen Nutzer auf wenigen Geräten reicht das; baue keine Konfliktauflösung.
- Das Korpus wird **nicht** abgeglichen — es liegt in der App.
- Sicherheitsregeln:

```
match /nutzer/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

---

## 9. PWA-Details

- `display: "standalone"`, `orientation: "portrait"`, Hintergrund- und Themenfarbe passend zum hellen Modus
- Icons in 192, 512 und 512 maskable; zusätzlich `apple-touch-icon`
- `viewport-fit=cover` und `env(safe-area-inset-*)` für Notch und Home-Indikator
- Korpus, Verse und Heiligenkalender werden vorab in den Cache gelegt — die App muss beim ersten Start nach der Installation offline vollständig funktionieren
- Kein Update-Banner, der ins Gebet platzt: Aktualisierungen werden still beim nächsten Start übernommen

---

## 10. Bauabschnitte

Bitte in dieser Reihenfolge, jeder Abschnitt lauffähig abgeschlossen:

1. **Gerüst** — Vite, React, TypeScript, Tailwind, Routing, PWA-Grundgerüst, Dexie-Schema, Theme-Umschaltung hell/dunkel
2. **Kalender** — `lib/kalender.ts` samt Tests. Zuerst, weil alles Weitere darauf aufbaut
3. **Bildschirme** — die Entwürfe aus Claude Design als Komponenten, zunächst mit fest verdrahteten Beispieldaten
4. **Daten und Logik** — Themenverwaltung, Gebetsauswahl, Protokoll, Jesusgebet-Zähler mit Vibration
5. **Korpus anbinden** — echte JSON-Dateien, Platzhalter-Ersetzung, Wiederholungssperre
6. **Installierbarkeit** — Manifest, Icons, Offline-Test auf einem echten iPhone
7. **Benachrichtigungen** — Worker, VAPID, Subscription, Zeitzonenlogik
8. **Anmeldung und Abgleich** — Firebase Auth, Firestore, Sicherheitsregeln
9. **Eigene Themen erzeugen** — zweite Worker-Route, Systemprompt, Prüfungen, Bearbeitbarkeit (Abschnitt 12)
10. **Feinschliff** — Gedenkliste, Tagebuch, Archiv erhörter Anliegen

---

## 11. Grundsätze für die Umsetzung

- **Offline zuerst.** Keine Ansicht darf auf eine Netzantwort warten. Firestore ist Beiwerk, IndexedDB ist die Wahrheit.
- **Keine Fremdaufrufe zur Laufzeit.** Keine Schriftarten von fremden Servern, keine Analytics, keine KI-Aufrufe. Schriften werden lokal eingebunden.
- **Der Gebetsbildschirm ist heilig.** Dort keine Banner, keine Hinweise, keine Aufforderungen zur Bewertung, keine Ladezustände.
- **Deutsche Bezeichner** in Datenmodell und Dateinamen beibehalten, wie oben angelegt — das hält Konzept und Code beieinander.
- **Vibration** über `navigator.vibrate` mit stiller Rückfallebene; auf iOS ist sie eingeschränkt, das darf nichts kaputtmachen.

---

## 12. Gebete für eigene Themen erzeugen

Ergänzung zum mitgelieferten Korpus. Wird **ausschliesslich** durch eine bewusste Nutzeraktion ausgelöst, nie automatisch, nie im Hintergrund.

### Ablauf

1. Nutzer legt ein eigenes Thema oder eine neue Kategorie an.
2. Die App bietet an: „Eigene Gebete für dieses Thema erstellen."
3. **Ein** Aufruf erzeugt alle drei Tageszeiten auf einmal und gibt JSON zurück.
4. Die Texte werden in IndexedDB gespeichert und wie Korpuseinträge behandelt (`istEigen: true`).
5. Ab diesem Zeitpunkt läuft das Thema vollständig offline.
6. Schlägt der Aufruf fehl oder ist kein Netz da: stiller Rückfall auf den Platzhalter-Weg, ohne Fehlermeldung.

### Aufruf

Läuft über denselben Cloudflare Worker wie die Benachrichtigungen, unter einer zweiten Route `/erzeugen`. Der API-Schlüssel liegt als Worker-Secret, niemals im Frontend und niemals im Repository.

Modell: Gemini 2.5 Flash über die Gemini-API im kostenlosen Kontingent. Die Limits liegen um Grössenordnungen über dem, was ein einzelner Nutzer braucht — pro neuem Thema fällt genau ein Aufruf an.

### Übertragene Daten

Nur: Thementitel, Kategorie, liturgische Färbung. **Niemals** Tagebucheinträge, Gedenknamen, Konto-Kennung oder Gerätedaten. Pro Thema gibt es einen Schalter „Nicht an die KI senden"; ist er gesetzt, erscheint die Schaltfläche gar nicht.

### Systemprompt

Setzt sich zusammen aus:
- den zehn Tonregeln aus `4_Gebetskorpus_Referenz.md`
- drei vollständigen Referenztexten als Muster (je einer für Morgen, Mittag, Abend)
- den Sprachlichen Leitplanken aus Konzept 2.4
- der Anweisung, ausschliesslich JSON zurückzugeben, ohne Vor- oder Nachtext

### Rückgabeformat

```json
{
  "morgen": { "vers": "…", "stelle": "Psalm 89,17", "text": "…" },
  "mittag": { "vers": "…", "stelle": "…", "text": "…" },
  "abend":  { "vers": "…", "stelle": "…", "text": "…" }
}
```

### Prüfung vor dem Speichern

Client- und serverseitig, bevor ein Text ins lokale Korpus wandert:
- Länge im erwarteten Rahmen (Morgen 120–200, Mittag 40–90, Abend 140–230 Wörter)
- endet mit „Amen." (ausser Mittag)
- enthält keine Ausrufezeichen
- enthält den Platzhaltersatz oder das Thema wörtlich
- kein Bibelzitat über fünfzehn Wörter

Fällt eine Prüfung durch: einmal neu anfordern, dann auf den Platzhalter-Weg zurückfallen.

### Nachbearbeitung

Jeder erzeugte Text ist in der App **bearbeitbar**. Das ist wichtiger, als es klingt: Ein Gebet, an dem du eine Zeile geändert hast, ist deins.

---

## 13. Darstellung des Jesusgebets

Der Wortlaut muss **immer sichtbar** sein, nicht nur als Hinweis „12 × Jesusgebet". Der Nutzer soll ihn ablesen können, ohne ihn auswendig zu kennen.

- Auf dem Gebetsbildschirm steht der volle Text ausgeschrieben, bevor der Zähler beginnt: „Herr Jesus Christus, Sohn Gottes, erbarme dich meiner, des Sünders."
- Auf dem Zählerbildschirm bleibt derselbe Text während der gesamten Wiederholung stehen und verschwindet nie.
- Daneben ein kleines, unaufdringliches Zeichen (ⓘ), das einen kurzen Erklärtext öffnet: Herkunft (Wüstenväter, Philokalie, russische Tradition), Sinn der Wiederholung, Bedeutung der Zahlen 12 / 33 / 100 und der Tschotki. Zwei kurze Absätze, kein Lexikonartikel.
- Der Erklärtext ist auch aus den Einstellungen erreichbar.

---

## 14. Liturgische Zusammensetzung

Das Kirchenjahr **ersetzt** das Themengebet nicht, es **ergänzt** es. Der Nutzer betet immer seine gewählten Themen; an Festen und in den Fastenzeiten kommt Passendes hinzu.

### Bausteine eines Gebets

| Baustein | Quelle | Wechselt mit |
|---|---|---|
| `eroeffnung` | Modulliste | liturgischer Zeit |
| `vers` | Schriftwort-Datenbank | Thema, an Festen überschreibbar |
| `hauptteil` | Grundkorpus | Kategorie, Tageszeit |
| `{{anliegen}}` | eigenes Thema | — |
| `festeinschub` | Modulliste | Fest oder Fastenzeit, sonst leer |
| `fuerbitte` | fest + Gedenkliste | an Festen um den gefeierten Heiligen ergänzt |
| `schluss` | Modulliste | liturgischer Zeit |

An einem gewöhnlichen Tag ist `festeinschub` leer, und das Gebet liest sich genau wie die Referenztexte. Am Fest der Entschlafung der Gottesgebärerin erscheint zusätzlich ein kurzer Abschnitt zum Fest, und die Fürbitte nennt sie ausdrücklich.

### Folgen für die Korpusgröße

Statt vier vollständiger Fassungen je Feld:

```
144  Grundgebete (16 Kategorien × 3 Tageszeiten × 3 Varianten)
 ~40 liturgische Module
```

Module: Grosse Fastenzeit · Karwoche · Ostern und Osterzeit · Weihnachtsfasten · Apostelfasten · Marienfasten · die zwölf grossen Feste · ein Muster für Heiligengedenken mit eingesetztem Namen. Je Modul eine Eröffnung, drei Einschübe (Morgen/Mittag/Abend) und gegebenenfalls ein Schluss.

### Auswahlregel

```
1. faerbungFuer(heute) bestimmen
2. festDesTages(heute) bestimmen
3. Grundgebet nach Kategorie, Tageszeit und Wiederholungssperre wählen
4. Passt ein Fest- oder Fastenmodul? -> eroeffnung, festeinschub, schluss überschreiben
5. Fürbitte um den gefeierten Heiligen ergänzen
6. Bausteine zu einem Fliesstext zusammensetzen
```

Die Übergänge müssen unsichtbar sein: Es darf nicht nach zusammengesetzten Blöcken klingen. Jeder Einschub ist deshalb als eigenständiger Absatz formuliert, der ohne Anschlusswort funktioniert.

### Prüfung

Für den Kalender gilt dasselbe wie in Abschnitt 5: Tests mit festen Datumsangaben. Mindestens Ostern, Karfreitag, Weihnachten (7. Januar), Theophanie, Verklärung, Entschlafung und ein gewöhnlicher Dienstag — jeweils mit erwartetem Modul.
