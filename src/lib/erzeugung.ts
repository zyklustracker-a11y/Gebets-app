/**
 * Gemeinsame Grundlage für die KI-Erzeugung eigener Gebete
 * (Spezifikation, Abschnitt 12). Bewusst rein: kein `fetch`, kein `import.meta`,
 * keine Datenbank — damit sowohl der Cloudflare Worker (serverseitig) als auch
 * das Frontend (clientseitig) genau dieselbe Prüfliste und denselben
 * Systemprompt verwenden.
 *
 * Übertragen werden ausschliesslich Thementitel, Kategorie und Färbung —
 * niemals Tagebuch, Gedenknamen, Konto oder Gerätedaten.
 */

import type { Faerbung, Tageszeit } from './types'
import { TAGESZEITEN } from './types'

// ---------------------------------------------------------------------------
// Datenformen
// ---------------------------------------------------------------------------

/** Ein erzeugtes Gebet für eine Tageszeit (Rückgabeformat, Abschnitt 12). */
export interface ErzeugtesTeil {
  vers: string
  stelle: string
  text: string
}

export interface ErzeugungAntwort {
  morgen: ErzeugtesTeil
  mittag: ErzeugtesTeil
  abend: ErzeugtesTeil
}

export interface ErzeugungAnfrage {
  /** Thementitel (Freitext des Nutzers). */
  titel: string
  /** Lesbarer Kategoriename, etwa „Geduld". */
  kategorie: string
  faerbung: Faerbung
}

/** Der Trägersatz mit dem Platzhalter, den jeder Text enthalten muss. */
export const PLATZHALTER = '{{anliegen}}'

/** Erwartete Wortzahl je Tageszeit (Abschnitt 12). */
export const WORTZAHL: Record<Tageszeit, readonly [number, number]> = {
  morgen: [120, 200],
  mittag: [40, 90],
  abend: [140, 230],
}

// ---------------------------------------------------------------------------
// Systemprompt: zehn Tonregeln + Leitplanken + drei Muster + JSON-Anweisung
// ---------------------------------------------------------------------------

// Die zehn Tonregeln aus docs/4_Gebetskorpus_Referenz.md, wörtlich.
const TONREGELN = `1. Dank steht vorn — jedes Gebet beginnt mit dem, was da ist.
2. Die Tugend benennen, nicht das Laster.
3. Umkehr nur abends, höchstens zwei Sätze, immer im selben Atemzug aufgelöst.
4. Kein Selbstmitleid, keine Klage über Umstände.
5. Gott ist nah, nicht fern. Grundton ist Vertrauen.
6. Konkret statt allgemein.
7. Keine Ausrufezeichen, keine Superlative.
8. Immer Fürbitte (morgens/abends) und christozentrischer Schluss.
9. \`${PLATZHALTER}\` steht immer als eigenständiger Satz.
10. Länge: Morgen ~150, Mittag ~60, Abend ~180 Wörter.`

// Die Sprachlichen Leitplanken aus Konzept 2.4, wörtlich.
const LEITPLANKEN = `- Anrede an Gott in der Du-Form, ernst und schlicht — modernes Deutsch, aber keine Alltagssprache, keine Anbiederung, keine Ausrufezeichen.
- Trinitarisch und christozentrisch; Schluss trinitarisch oder auf Christus hin.
- Fürbitte der Gottesgebärerin und der Heiligen erwünscht — immer als Bitte um Fürsprache, nie als Anbetung.
- Keine Wohlstands- oder Erfolgstheologie. Bitten werden gestellt, aber unter „wenn es Dein Wille ist".
- Keine Prophetie, keine Zusagen im Namen Gottes, kein Ersatz für Beichte und geistliche Begleitung.`

// Drei vollständige Referenztexte (Dankbarkeit) als Muster — je einer für
// Morgen, Mittag, Abend, wörtlich aus docs/4_Gebetskorpus_Referenz.md.
const MUSTER = `MORGEN (Muster):
Schriftwort: „Es ist gut, dem Herrn zu danken — am Morgen Deine Barmherzigkeit zu verkünden." — Psalm 91,2–3
Text:
Herr, ich öffne die Augen, und Du bist schon da.
Ich danke Dir für die Nacht, die mich getragen hat, für den Atem, der ohne mein Zutun geht, für das Licht, das durch das Fenster kommt.
Ich danke Dir für die Menschen, die zu mir gehören — auch für die, an die ich heute nicht denken werde.
Lass mich diesen Tag mit offenen Augen gehen und das Gute zuerst sehen. Schenke mir ein dankbares Herz, das wahrnimmt, was da ist.
Besonders danke ich Dir für: ${PLATZHALTER}.
Heilige Gottesgebärerin, bitte für mich. Heiliger Schutzengel, geh diesen Tag mit mir.
Herr Jesus Christus, unser Gott, alles, was ich habe, kommt aus Deiner Hand. Ich danke Dir dafür, noch bevor der Tag begonnen hat. Amen.

MITTAG (Muster):
Schriftwort: „Ich will den Herrn preisen zu jeder Zeit; immer sei sein Lob in meinem Mund." — Psalm 33,2
Text:
Herr, mitten am Tag halte ich einen Augenblick inne.
Ich danke Dir für alles, was mich bis hierher getragen hat — für die Arbeit, für das Essen, für jeden freundlichen Blick.
Du bist gut, und Deine Güte hört nicht auf.
Besonders danke ich Dir für: ${PLATZHALTER}.
Herr Jesus Christus, Sohn Gottes, ich danke Dir.

ABEND (Muster):
Schriftwort: „…und Deine Treue zu verkünden in den Nächten." — Psalm 91,3
Text:
Herr, der Tag ist zu Ende, und ich halte still, bevor ich schlafe.
Ich danke Dir für diesen Tag, so wie er gewesen ist. Für das Brot, das ich gegessen habe. Für die Arbeit, die ich tun durfte. Für die Stimmen, die ich gehört habe, und für die Stille dazwischen.
Ich danke Dir für das Gute, das ich bemerkt habe — und ebenso für das Gute, das an mir vorbeigegangen ist, ohne dass ich es gesehen habe.
Wo ich heute hinter dem zurückgeblieben bin, was Du mir zugetraut hast, vergib mir. Ich lasse es bei Dir.
Deine Treue reicht durch die Nacht.
Besonders danke ich Dir für: ${PLATZHALTER}.
Heilige Gottesgebärerin, bitte für mich. Heiliger Schutzengel, wache über meinen Schlaf.
Herr Jesus Christus, unser Gott, ich danke Dir für alles. Lass mich in Frieden einschlafen und dankbar erwachen. Amen.`

export function systemPrompt(): string {
  return `Du verfasst russisch-orthodoxe, deutschsprachige Gebete für eine persönliche Gebets-App. Du erzeugst in einem Zug drei Gebete zum selben Anliegen: Morgen, Mittag und Abend.

ZEHN TONREGELN (verbindlich):
${TONREGELN}

SPRACHLICHE LEITPLANKEN (verbindlich):
${LEITPLANKEN}

ZUSÄTZLICHE HARTE VORGABEN:
- Jeder Text enthält den Satz mit dem Platzhalter „${PLATZHALTER}" wörtlich und als eigenständigen Satz. Setze den Titel des Anliegens NICHT selbst ein — lass den Platzhalter stehen.
- Morgen- und Abendgebet enden mit „Amen." als letztem Wort. Das Mittagsgebet endet christozentrisch OHNE „Amen.".
- Wortzahl: Morgen 120–200, Mittag 40–90, Abend 140–230 Wörter.
- Keine Ausrufezeichen — an keiner Stelle, auch nicht im Schriftwort.
- Das Schriftwort („vers") ist eine eigene, behutsame Übertragung in modernem Deutsch (keine geschützte moderne Bibelübersetzung abschreiben), höchstens fünfzehn Wörter lang. Die Stellenangabe („stelle") folgt der Septuaginta-Zählung, etwa „Psalm 89,17".
- Passe Bilder und Bitten an Kategorie und Anliegen an, ohne den Platzhalter zu ersetzen.

MUSTER (Ton und Aufbau, nicht Inhalt übernehmen):
${MUSTER}

Antworte AUSSCHLIESSLICH mit JSON in genau dieser Form, ohne Vor- oder Nachtext, ohne Code-Zaun:
{"morgen":{"vers":"…","stelle":"…","text":"…"},"mittag":{"vers":"…","stelle":"…","text":"…"},"abend":{"vers":"…","stelle":"…","text":"…"}}`
}

export function nutzerPrompt(anfrage: ErzeugungAnfrage): string {
  const faerbung = FAERBUNG_LABEL[anfrage.faerbung] ?? anfrage.faerbung
  return `Anliegen (Thema): ${anfrage.titel}
Kategorie: ${anfrage.kategorie}
Liturgische Färbung: ${faerbung}

Erzeuge Morgen-, Mittag- und Abendgebet für dieses Anliegen. Halte alle Vorgaben ein und gib nur das JSON zurück.`
}

const FAERBUNG_LABEL: Record<Faerbung, string> = {
  gewoehnlich: 'gewöhnlich',
  fastenzeit: 'Fastenzeit',
  osterzeit: 'Osterzeit',
  trauer: 'Trauer',
}

/** JSON-Schema für Geminis `responseSchema` — erzwingt die Struktur. */
export const ANTWORT_SCHEMA = {
  type: 'object',
  properties: {
    morgen: teilSchema(),
    mittag: teilSchema(),
    abend: teilSchema(),
  },
  required: ['morgen', 'mittag', 'abend'],
} as const

function teilSchema() {
  return {
    type: 'object',
    properties: {
      vers: { type: 'string' },
      stelle: { type: 'string' },
      text: { type: 'string' },
    },
    required: ['vers', 'stelle', 'text'],
  }
}

// ---------------------------------------------------------------------------
// Prüfliste (Abschnitt 12) — client- und serverseitig identisch
// ---------------------------------------------------------------------------

/** Zählt Wörter; der Platzhalter zählt als ein Wort. */
export function woerter(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Prüft einen einzelnen Tageszeit-Text. Leeres Ergebnis heisst: bestanden. */
export function pruefeTeil(tageszeit: Tageszeit, teil: ErzeugtesTeil | undefined, titel: string): string[] {
  const fehler: string[] = []
  if (!teil || typeof teil.text !== 'string' || typeof teil.vers !== 'string' || typeof teil.stelle !== 'string') {
    return ['unvollständig']
  }
  const text = teil.text.trim()

  const anzahl = woerter(text)
  const [min, max] = WORTZAHL[tageszeit]
  if (anzahl < min || anzahl > max) fehler.push(`Wortzahl ${anzahl} ausserhalb ${min}–${max}`)

  if (tageszeit !== 'mittag' && !text.endsWith('Amen.')) fehler.push('endet nicht auf „Amen."')

  if (text.includes('!') || teil.vers.includes('!')) fehler.push('enthält ein Ausrufezeichen')

  if (!text.includes(PLATZHALTER) && !text.includes(titel.trim())) {
    fehler.push('weder Platzhaltersatz noch Thema enthalten')
  }

  if (woerter(teil.vers) > 15) fehler.push('Schriftwort über fünfzehn Wörter')

  return fehler
}

/**
 * Prüft die komplette Antwort. Gibt je Tageszeit die gefundenen Mängel zurück;
 * `gueltig` ist true, wenn alle drei ohne Mangel sind.
 */
export function pruefeAntwort(antwort: ErzeugungAntwort | null | undefined, titel: string): {
  gueltig: boolean
  fehler: Record<Tageszeit, string[]>
} {
  const fehler = { morgen: ['fehlt'], mittag: ['fehlt'], abend: ['fehlt'] } as Record<Tageszeit, string[]>
  if (!antwort) return { gueltig: false, fehler }
  for (const tz of TAGESZEITEN) {
    fehler[tz] = pruefeTeil(tz, antwort[tz], titel)
  }
  const gueltig = TAGESZEITEN.every((tz) => fehler[tz].length === 0)
  return { gueltig, fehler }
}
