/**
 * Julianischer Kirchenkalender (Spezifikation, Abschnitt 5).
 *
 * Reines TypeScript, keine npm-Abhängigkeiten, vollständig testbar. Alle
 * Berechnungen laufen über UTC-Mitternacht, damit sie unabhängig von der
 * Zeitzone des Geräts deterministisch sind. Wer „heute" braucht, nimmt
 * `heutigerTag()` — das übersetzt den lokalen Kalendertag nach UTC-Mitternacht.
 *
 * Feste Fest- und Heiligentage liegen als julianische Monat/Tag-Paare in
 * `data/heilige.json`. Der julianische Kalender liegt in dieser Epoche
 * (1900–2099) 13 Tage hinter dem gregorianischen; ein gregorianisches Datum
 * wird deshalb um 13 Tage zurückgerechnet, um es in der Tabelle zu finden.
 */

import heiligeDaten from '../../data/heilige.json'
import type { Faerbung, Heiligentag } from './types'

const MS_PRO_TAG = 86_400_000
const JULIANISCHER_VERSATZ = 13

const heilige = heiligeDaten as unknown as Heiligentag[]

/** Feste Tage, nachgeschlagen über den julianischen "Monat-Tag"-Schlüssel. */
const heiligeKarte = new Map<string, Heiligentag>(
  heilige.map((eintrag) => [`${eintrag.monat}-${eintrag.tag}`, eintrag]),
)

// ---------------------------------------------------------------------------
// Datums-Hilfen (alles UTC-Mitternacht)
// ---------------------------------------------------------------------------

function utcTag(jahr: number, monat0: number, tag: number): Date {
  return new Date(Date.UTC(jahr, monat0, tag))
}

/** Normiert eine beliebige Date auf UTC-Mitternacht ihres UTC-Kalendertags. */
function normTag(datum: Date): Date {
  return utcTag(datum.getUTCFullYear(), datum.getUTCMonth(), datum.getUTCDate())
}

function tageSpaeter(datum: Date, tage: number): Date {
  return new Date(datum.getTime() + tage * MS_PRO_TAG)
}

function gleicherTag(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime()
}

function imBereich(datum: Date, von: Date, bis: Date): boolean {
  const t = datum.getTime()
  return t >= von.getTime() && t <= bis.getTime()
}

// ---------------------------------------------------------------------------
// Osterdatum
// ---------------------------------------------------------------------------

/**
 * Orthodoxes Osterdatum (julianisch nach Meeus), zurückgegeben als
 * gregorianisches Datum (UTC-Mitternacht). Gültig 1900–2099.
 *
 * Testfälle: 2026 → 12. April · 2027 → 2. Mai · 2028 → 16. April.
 */
export function orthodoxeOstern(jahr: number): Date {
  const a = jahr % 4
  const b = jahr % 7
  const c = jahr % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const monat = Math.floor((d + e + 114) / 31) // 3 = März, 4 = April
  const tag = ((d + e + 114) % 31) + 1
  const julianisch = utcTag(jahr, monat - 1, tag)
  julianisch.setUTCDate(julianisch.getUTCDate() + JULIANISCHER_VERSATZ)
  return julianisch
}

// ---------------------------------------------------------------------------
// Feste und Heilige
// ---------------------------------------------------------------------------

/** Findet den festen Kalendereintrag zu einem gregorianischen Tag. */
function festerEintrag(datum: Date): Heiligentag | undefined {
  const julianisch = tageSpaeter(datum, -JULIANISCHER_VERSATZ)
  return heiligeKarte.get(`${julianisch.getUTCMonth() + 1}-${julianisch.getUTCDate()}`)
}

/**
 * Das Fest des Tages oder `null`. Bewegliche Feste werden aus dem Osterdatum
 * abgeleitet, feste aus `heilige.json`.
 */
export function festDesTages(datum: Date): string | null {
  const tag = normTag(datum)
  const ostern = orthodoxeOstern(tag.getUTCFullYear())

  if (gleicherTag(tag, tageSpaeter(ostern, -7))) return 'Einzug in Jerusalem'
  if (gleicherTag(tag, ostern)) return 'Ostern'
  if (gleicherTag(tag, tageSpaeter(ostern, 39))) return 'Christi Himmelfahrt'
  if (gleicherTag(tag, tageSpaeter(ostern, 49))) return 'Pfingsten'
  if (gleicherTag(tag, tageSpaeter(ostern, 56))) return 'Aller Heiligen'

  return festerEintrag(tag)?.fest ?? null
}

/** Der Heilige (oder das Gedenken) des Tages aus `heilige.json`, sonst `null`. */
export function heiligerDesTages(datum: Date): string | null {
  return festerEintrag(normTag(datum))?.name ?? null
}

/** Kennung des liturgischen Moduls für einen festen Fest- oder Heiligentag. */
export function festModulId(datum: Date): string | null {
  return festerEintrag(normTag(datum))?.modulId ?? null
}

// ---------------------------------------------------------------------------
// Färbung und Fasten
// ---------------------------------------------------------------------------

/**
 * Die liturgische Färbung des Tages. Deckt die drei jahreszeitlichen Töne ab:
 * Grosse Fastenzeit (inklusive Karwoche), Osterzeit (Ostern bis Pfingsten)
 * und sonst gewöhnliche Zeit.
 *
 * `trauer` liefert diese Funktion bewusst nicht — diese Färbung setzt das
 * Modulsystem (Abschnitt 14) an den Gedenktagen der Entschlafenen.
 */
export function faerbungFuer(datum: Date): Faerbung {
  const tag = normTag(datum)
  const ostern = orthodoxeOstern(tag.getUTCFullYear())

  if (imBereich(tag, tageSpaeter(ostern, -48), tageSpaeter(ostern, -1))) return 'fastenzeit'
  if (imBereich(tag, ostern, tageSpaeter(ostern, 49))) return 'osterzeit'
  return 'gewoehnlich'
}

function inWeihnachtsfasten(tag: Date): boolean {
  // Julianisch 15. November – 24. Dezember, gregorianisch 28.11. – 6.1.
  const m = tag.getUTCMonth() + 1
  const t = tag.getUTCDate()
  return (m === 11 && t >= 28) || m === 12 || (m === 1 && t <= 6)
}

function inMarienfasten(tag: Date): boolean {
  // Julianisch 1. – 14. August, gregorianisch 14. – 27. August.
  const m = tag.getUTCMonth() + 1
  const t = tag.getUTCDate()
  return m === 8 && t >= 14 && t <= 27
}

/**
 * Fastenfreie Wochen (сплошные седмицы), in denen die Mittwochs- und
 * Freitagsregel entfällt: Lichte Woche, Pfingstwoche, die Woche nach dem
 * Sonntag von Zöllner und Pharisäer und die Weihnachtszeit (Swjatki).
 *
 * Die Käsewoche (Butterwoche) ist bewusst nicht dabei: An ihrem Mittwoch und
 * Freitag bleibt der Fastencharakter erhalten, auch wenn kein Fleisch mehr,
 * aber noch Milchspeise erlaubt ist.
 */
function inFastenfreieWoche(tag: Date, ostern: Date): boolean {
  if (imBereich(tag, ostern, tageSpaeter(ostern, 6))) return true
  if (imBereich(tag, tageSpaeter(ostern, 50), tageSpaeter(ostern, 56))) return true
  if (imBereich(tag, tageSpaeter(ostern, -69), tageSpaeter(ostern, -63))) return true

  // Swjatki: 7. – 17. Januar gregorianisch (der 18. ist strenger Fastentag).
  const m = tag.getUTCMonth() + 1
  const t = tag.getUTCDate()
  if (m === 1 && t >= 7 && t <= 17) return true

  return false
}

/**
 * Ob an diesem Tag gefastet wird. Deckt die vier mehrtägigen Fastenzeiten ab,
 * die strengen Einzelfastentage aus dem Heiligenkalender sowie Mittwoch und
 * Freitag ausserhalb der fastenfreien Wochen.
 */
export function istFastentag(datum: Date): boolean {
  const tag = normTag(datum)
  const jahr = tag.getUTCFullYear()
  const ostern = orthodoxeOstern(jahr)

  // Grosse Fastenzeit inklusive Karwoche
  if (imBereich(tag, tageSpaeter(ostern, -48), tageSpaeter(ostern, -1))) return true

  // Apostelfasten: Montag nach Allerheiligen (Ostern + 57) bis 11. Juli greg.
  const apostelStart = tageSpaeter(ostern, 57)
  const apostelEnde = utcTag(jahr, 6, 11)
  if (apostelStart.getTime() <= apostelEnde.getTime() && imBereich(tag, apostelStart, apostelEnde)) {
    return true
  }

  if (inMarienfasten(tag) || inWeihnachtsfasten(tag)) return true

  if (festerEintrag(tag)?.strengerFastentag) return true

  const wochentag = tag.getUTCDay() // 3 = Mittwoch, 5 = Freitag
  if ((wochentag === 3 || wochentag === 5) && !inFastenfreieWoche(tag, ostern)) return true

  return false
}

// ---------------------------------------------------------------------------
// Heute
// ---------------------------------------------------------------------------

/** Ob der Tag in einer fastenfreien Woche liegt (für die Modulauswahl). */
export function istFastenfreieWoche(datum: Date): boolean {
  const tag = normTag(datum)
  return inFastenfreieWoche(tag, orthodoxeOstern(tag.getUTCFullYear()))
}

/**
 * Der heutige Kalendertag als UTC-Mitternacht. Liest die lokalen Datumsfelder,
 * damit der Tag der Ortszeit entspricht, und normiert sie auf UTC — passend zu
 * allen anderen Funktionen dieses Moduls.
 */
export function heutigerTag(): Date {
  const jetzt = new Date()
  return utcTag(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate())
}
