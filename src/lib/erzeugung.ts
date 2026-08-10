/**
 * Gemeinsame Grundlage für die KI-Erzeugung eigener Gebete
 * (Spezifikation, Abschnitt 12). Bewusst rein: kein `fetch`, kein `import.meta`,
 * keine Datenbank — damit sowohl der Cloudflare Worker (serverseitig) als auch
 * das Frontend (clientseitig) genau dieselbe Prüfliste und denselben
 * Systemprompt verwenden. Die mitgelieferte Schriftwort-Datenbank
 * (`data/verse.json`, über `themenbezug.ts`) zählt dazu: sie ist statisch.
 *
 * Übertragen werden ausschliesslich Thementitel, Kategorie und Färbung —
 * niemals Tagebuch, Gedenknamen, Konto oder Gerätedaten.
 */

import { traegersatzVorlage, verseFuerTageszeiten } from './themenbezug'
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
  /** Schlüssel derselben Kategorie, für die Auswahl der Schriftworte. */
  kategorieSchluessel?: string
  faerbung: Faerbung
}

/** Der Platzhalter, der im Text stehen bleibt und erst beim Anzeigen füllt. */
export const PLATZHALTER = '{{anliegen}}'

/**
 * Der Wortlaut, in dem der Platzhalter stehen muss. Er ist vorgeschrieben und
 * wird geprüft: Formuliert das Modell den Satz selbst, gerät die Rektion ins
 * Rutschen, sobald der Titel eingesetzt wird („… ich bitte Dich um Angst vor
 * der Zukunft"). Die Doppelpunktform ist kasusneutral.
 */
export const TRAEGERSATZ = traegersatzVorlage(PLATZHALTER)

/**
 * Das Schriftwort je Tageszeit — von uns gewählt, nicht vom Modell.
 *
 * Ursprünglich bekam das Modell eine Liste zur Auswahl und die Prüfliste wies
 * ab, was nicht daraus stammte. Das kostete jede zweite Erzeugung: Das
 * kostenlose Modell schrieb lieber die Verse aus den Mustern ab oder erfand
 * eine Stelle. Jetzt steht der Vers vorher fest und wird nach der Antwort
 * wieder eingesetzt (`vorgabeAnwenden`) — was das Modell nicht wählt, kann es
 * auch nicht erfinden.
 */
export function versVorgabe(anfrage: ErzeugungAnfrage): Record<Tageszeit, { text: string; stelle: string }> {
  const verse = verseFuerTageszeiten(anfrage.titel, anfrage.kategorieSchluessel ?? null)
  const leer = { text: '', stelle: '' }
  if (!verse) return { morgen: leer, mittag: leer, abend: leer }
  return {
    morgen: { text: verse.morgen.text, stelle: verse.morgen.stelle },
    mittag: { text: verse.mittag.text, stelle: verse.mittag.stelle },
    abend: { text: verse.abend.text, stelle: verse.abend.stelle },
  }
}

/**
 * Setzt die vorgegebenen Schriftworte in die Antwort ein. Damit ist die
 * Stellenangabe konstruktionsbedingt echt — sie muss nicht mehr geprüft
 * werden. Der Text des Modells bleibt unberührt.
 */
export function vorgabeAnwenden(antwort: ErzeugungAntwort, anfrage: ErzeugungAnfrage): ErzeugungAntwort {
  const vorgabe = versVorgabe(anfrage)
  const teil = (tz: Tageszeit): ErzeugtesTeil => ({
    ...antwort[tz],
    vers: vorgabe[tz].text || antwort[tz]?.vers || '',
    stelle: vorgabe[tz].stelle || antwort[tz]?.stelle || '',
  })
  return { morgen: teil('morgen'), mittag: teil('mittag'), abend: teil('abend') }
}

/**
 * Erwartete Wortzahl je Tageszeit. Die Untergrenzen für Morgen und Abend sind
 * gegenüber dem Spec-Ideal (120 / 140) bewusst gelockert (100 / 120): das
 * kostenlose Modell (Groq/Llama) schreibt etwas knapper, trifft aber diesen
 * Rahmen zuverlässig. Der Systemprompt zielt weiterhin auf die vollen Längen,
 * damit die Gebete nicht an der Untergrenze kleben.
 */
export const WORTZAHL: Record<Tageszeit, readonly [number, number]> = {
  morgen: [100, 200],
  mittag: [40, 90],
  abend: [120, 230],
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
9. Der Trägersatz \`${TRAEGERSATZ}\` steht immer als eigenständiger Satz.
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
${TRAEGERSATZ}
Heilige Gottesgebärerin, bitte für mich. Heiliger Schutzengel, geh diesen Tag mit mir.
Herr Jesus Christus, unser Gott, alles, was ich habe, kommt aus Deiner Hand. Ich danke Dir dafür, noch bevor der Tag begonnen hat. Amen.

MITTAG (Muster):
Schriftwort: „Ich will den Herrn preisen zu jeder Zeit; immer sei sein Lob in meinem Mund." — Psalm 33,2
Text:
Herr, mitten am Tag halte ich einen Augenblick inne.
Ich danke Dir für alles, was mich bis hierher getragen hat — für die Arbeit, für das Essen, für jeden freundlichen Blick.
Du bist gut, und Deine Güte hört nicht auf.
${TRAEGERSATZ}
Herr Jesus Christus, Sohn Gottes, ich danke Dir.

ABEND (Muster):
Schriftwort: „…und Deine Treue zu verkünden in den Nächten." — Psalm 91,3
Text:
Herr, der Tag ist zu Ende, und ich halte still, bevor ich schlafe.
Ich danke Dir für diesen Tag, so wie er gewesen ist. Für das Brot, das ich gegessen habe. Für die Arbeit, die ich tun durfte. Für die Stimmen, die ich gehört habe, und für die Stille dazwischen.
Ich danke Dir für das Gute, das ich bemerkt habe — und ebenso für das Gute, das an mir vorbeigegangen ist, ohne dass ich es gesehen habe.
Wo ich heute hinter dem zurückgeblieben bin, was Du mir zugetraut hast, vergib mir. Ich lasse es bei Dir.
Deine Treue reicht durch die Nacht.
${TRAEGERSATZ}
Heilige Gottesgebärerin, bitte für mich. Heiliger Schutzengel, wache über meinen Schlaf.
Herr Jesus Christus, unser Gott, ich danke Dir für alles. Lass mich in Frieden einschlafen und dankbar erwachen. Amen.`

export function systemPrompt(): string {
  return `Du verfasst russisch-orthodoxe, deutschsprachige Gebete für eine persönliche Gebets-App. Du erzeugst in einem Zug drei Gebete zum selben Anliegen: Morgen, Mittag und Abend.

ZEHN TONREGELN (verbindlich):
${TONREGELN}

SPRACHLICHE LEITPLANKEN (verbindlich):
${LEITPLANKEN}

ZUSÄTZLICHE HARTE VORGABEN:
- Jeder Text enthält genau diesen Satz wörtlich, unverändert und als eigene Zeile: „${TRAEGERSATZ}". Formuliere ihn NICHT um und setze den Titel des Anliegens NICHT selbst ein — der Platzhalter bleibt stehen. Jede andere Fassung wird abgewiesen.
- Das Schriftwort ist je Tageszeit vorgegeben. Übernimm es unverändert nach „vers" und „stelle". Suche keines aus und erfinde keine Stellenangabe.
- Morgen- und Abendgebet enden mit „Amen." als letztem Wort. Das Mittagsgebet endet christozentrisch OHNE „Amen.".
- LÄNGE (wird streng geprüft): Schreibe bewusst AUSFÜHRLICH und in vielen vollständigen Sätzen. Morgengebet mindestens 165, höchstens 200 Wörter. Mittagsgebet mindestens 60, höchstens 90 Wörter. Abendgebet mindestens 200, höchstens 230 Wörter. Lieber zu lang als zu kurz — entfalte Dank und Fürbitte breit. Diese Mindestlängen sind Pflicht; unterschreite sie auf keinen Fall.
- Keine Ausrufezeichen — an keiner Stelle, auch nicht im Schriftwort.
- Der Text nimmt das gewählte Schriftwort auf: ein Bild, ein Wort daraus kehrt im Gebet wieder, damit Vers und Text zusammengehören.
- Passe Bilder und Bitten an Kategorie und Anliegen an, ohne den Platzhalter zu ersetzen.

MUSTER (Ton und Aufbau, nicht Inhalt übernehmen):
${MUSTER}

Prüfe vor der Ausgabe, dass Morgengebet mindestens 165 und Abendgebet mindestens 200 Wörter hat und beide mit „Amen." enden. Sind sie kürzer, ergänze weitere Sätze des Dankes und der Fürbitte.

Antworte AUSSCHLIESSLICH mit JSON in genau dieser Form, ohne Vor- oder Nachtext, ohne Code-Zaun:
{"morgen":{"vers":"…","stelle":"…","text":"…"},"mittag":{"vers":"…","stelle":"…","text":"…"},"abend":{"vers":"…","stelle":"…","text":"…"}}`
}

export function nutzerPrompt(anfrage: ErzeugungAnfrage): string {
  const faerbung = FAERBUNG_LABEL[anfrage.faerbung] ?? anfrage.faerbung
  const vorgabe = versVorgabe(anfrage)
  const verse = TAGESZEITEN.map((tz) => `${tz.toUpperCase()}: „${vorgabe[tz].text}" — ${vorgabe[tz].stelle}`).join('\n')
  return `Anliegen (Thema): ${anfrage.titel}
Kategorie: ${anfrage.kategorie}
Liturgische Färbung: ${faerbung}

VORGEGEBENE SCHRIFTWORTE (unverändert nach „vers" und „stelle" übernehmen, je Tageszeit das seine):
${verse}

Nimm im Text ein Bild oder ein Wort des jeweiligen Schriftworts auf, damit Vers und Gebet zusammengehören.

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

/** Staucht Leerraum und vereinheitlicht Anführungszeichen — für den Vergleich. */
function vergleichbar(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[„“”"]/g, '"').trim()
}

/**
 * Prüft einen einzelnen Tageszeit-Text. Leeres Ergebnis heisst: bestanden.
 *
 * Die Herkunft des Schriftworts wird nicht mehr geprüft: Es wird nach der
 * Antwort ohnehin durch die Vorgabe ersetzt (`vorgabeAnwenden`) und ist damit
 * konstruktionsbedingt echt.
 */
export function pruefeTeil(tageszeit: Tageszeit, teil: ErzeugtesTeil | undefined, _titel: string): string[] {
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

  // Der Trägersatz muss wörtlich stehen — nur so bleibt die Grammatik heil,
  // wenn beim Anzeigen der Titel eingesetzt wird.
  if (!vergleichbar(text).includes(vergleichbar(TRAEGERSATZ))) {
    fehler.push('Trägersatz fehlt oder ist umformuliert')
  }

  if (woerter(teil.vers) > 15) fehler.push('Schriftwort über fünfzehn Wörter')

  return fehler
}

/**
 * Prüft die komplette Antwort. Gibt je Tageszeit die gefundenen Mängel zurück;
 * `gueltig` ist true, wenn alle drei ohne Mangel sind.
 *
 * Nimmt die ganze Anfrage oder bloss den Titel entgegen — geprüft wird in
 * beiden Fällen dasselbe.
 */
export function pruefeAntwort(
  antwort: ErzeugungAntwort | null | undefined,
  anfrage: ErzeugungAnfrage | string,
): {
  gueltig: boolean
  fehler: Record<Tageszeit, string[]>
} {
  const fehler = { morgen: ['fehlt'], mittag: ['fehlt'], abend: ['fehlt'] } as Record<Tageszeit, string[]>
  if (!antwort) return { gueltig: false, fehler }

  const titel = typeof anfrage === 'string' ? anfrage : anfrage.titel

  for (const tz of TAGESZEITEN) {
    fehler[tz] = pruefeTeil(tz, antwort[tz], titel)
  }
  const gueltig = TAGESZEITEN.every((tz) => fehler[tz].length === 0)
  return { gueltig, fehler }
}
