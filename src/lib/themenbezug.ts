/**
 * Themenbezug: verbindet ein eigenes Thema (Freitext) mit dem, was die App
 * mitbringt — mit einer Kategorie, mit einem thematisch passenden Schriftwort
 * und mit einem Trägersatz, der die deutsche Grammatik nicht bricht.
 *
 * Reine Funktionen ohne Datenbank und ohne Netz, damit sie im Frontend, im
 * Cloudflare Worker und in den Tests dieselben Ergebnisse liefern.
 *
 * Warum es dieses Modul gibt: Der Titel wurde früher roh in den Trägersatz des
 * Grundgebets gesetzt („… ich bitte Dich um Angst vor der Zukunft"), und das
 * Schriftwort gehörte fest zum Grundgebet, also zur Kategorie — nie zum
 * Freitext. Beides ist hier behoben:
 *
 *   traegersatz     baut den Satz kasusneutral um den Titel herum
 *   versFuerThema   sucht das Schriftwort nach den Wörtern des Titels
 */

import { TAGESZEITEN, type Tageszeit, type Vers } from './types'
import { verseFuerKategorie } from './verse'

// ---------------------------------------------------------------------------
// Schlagwörter je Kategorie
// ---------------------------------------------------------------------------

/**
 * Wortstämme, an denen ein Freitext erkannt wird. Kleingeschrieben und ohne
 * Umlaute (siehe `normalisieren`); Stämme statt ganzer Wörter, damit auch
 * Beugungen und Zusammensetzungen greifen („Krankheit", „erkrankt", „Krebs").
 *
 * Ein vorangestelltes `!` kennzeichnet einen entscheidenden Stamm. Sonst zählt
 * die Länge, und ein kurzes, aber eindeutiges Wort verlöre gegen ein langes,
 * beiläufiges: „Der Tod meiner Grossmutter" ginge an „grossmutter" und damit an
 * die Familie statt an die Verstorbenen.
 *
 * Der Bestand ist bewusst kuratiert und nicht vollständig — was nicht greift,
 * fällt auf die vom Nutzer gewählte Kategorie zurück.
 */
const SCHLAGWOERTER: Record<string, readonly string[]> = {
  familie: [
    'famili', 'eltern', 'mutter', 'mama', 'vater', 'papa', 'kind', 'sohn', 'tochter',
    'geschwister', 'bruder', 'schwester', 'oma', 'opa', 'grossmutter', 'grossvater',
    'enkel', 'zuhause', 'daheim', 'erziehung',
  ],
  ehe: [
    'ehe', 'ehemann', 'ehefrau', 'partner', 'beziehung', 'verlob', 'hochzeit', 'braut',
    'treue', 'scheidung', 'trennung', 'liebe',
  ],
  arbeit: [
    'arbeit', 'beruf', 'job', 'chef', 'kolleg', 'buero', 'stelle', 'bewerbung',
    'kuendig', 'projekt', 'studium', 'pruefung', 'schule', 'ausbildung', 'karriere',
    'dienst', 'auftrag',
  ],
  gesundheit: [
    'gesund', '!krank', 'schmerz', 'heilung', 'operation', 'arzt', 'aerzt', 'klinik',
    'krankenhaus', 'diagnose', 'therapie', 'genesung', 'koerper', '!krebs', 'verletzung',
    'erschoepf', 'schlaflos',
  ],
  angst: [
    '!angst', '!aengst', 'sorge', 'furcht', 'panik', 'unruhe', 'zukunft', 'ungewiss',
    'nervoes', 'stress', 'ueberford', 'druck', 'bange', 'befuercht',
  ],
  zorn: [
    'zorn', 'wut', 'aerger', 'gereizt', 'hass', 'groll', 'rache', '!vergeb', '!verzeih',
    'gekraenkt', 'streit', 'konflikt', 'versoehn', 'bitter',
  ],
  dankbarkeit: ['dank', 'freude', 'geschenk', 'segen', 'bewahrung', 'lob'],
  reue: [
    'reue', 'umkehr', 'schuld', '!suende', '!beichte', 'gewissen', 'versagt', 'fehler',
    'scham', 'busse',
  ],
  reinheit: [
    'reinheit', 'keusch', 'versuchung', 'begierde', 'unrein', 'sucht', 'alkohol',
    'masslos', 'bildschirm',
  ],
  geduld: ['!geduld', 'warten', 'langsam', 'aushalten', 'durchhalten', 'ausdauer', 'eile', 'hetze'],
  finanzen: [
    'geld', 'finanz', '!schulden', 'miete', 'rechnung', 'lohn', 'gehalt', 'armut',
    'sparen', 'existenz', 'kredit',
  ],
  entscheidungen: [
    'entscheid', 'entschluss', 'wahl', 'richtung', 'klarheit', 'umzug', 'wechsel',
    'weggabelung', 'plan',
  ],
  verstorbene: [
    '!verstorben', '!gestorben', '!todes', '!tod ', 'trauer', 'grab', '!beerdigung',
    'abschied', '!entschlafen', 'hinterblieb',
  ],
  schwierige: ['nachbar', 'feind', 'gegner', 'mobbing', 'gerede', 'verleumdung', 'schwierig'],
  glaubenszweifel: ['glaub', '!zweifel', 'leere', 'dunkelheit', 'kirche', 'sinnlos', 'ferne gottes'],
  demut: ['!demut', 'stolz', 'hochmut', 'eitel', 'anerkennung', 'geltung', 'neid', 'vergleich'],
}

/** Kategorie, auf die zurückgefallen wird, wenn nichts greift. */
const STANDARD_KATEGORIE = 'dankbarkeit'

/**
 * Kleinschreibung, Umlaute aufgelöst, alles Übrige zu Leerzeichen. So greifen
 * die Stämme unabhängig von Schreibweise und Satzzeichen.
 */
function normalisieren(text: string): string {
  return ` ${text
    .toLowerCase()
    .split('ä').join('ae')
    .split('ö').join('oe')
    .split('ü').join('ue')
    .split('ß').join('ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `
}

/** Aufschlag für einen mit `!` gekennzeichneten, entscheidenden Stamm. */
const GEWICHT_ENTSCHEIDEND = 12

/**
 * Bewertet alle Kategorien gegen den Freitext. Längere Treffer wiegen schwerer,
 * damit „Familie" gegenüber dem kürzeren „streit" gewinnt; entscheidende
 * Stämme bekommen einen festen Aufschlag.
 */
function bewerten(titel: string): { kategorie: string; punkte: number }[] {
  const text = normalisieren(titel)
  const treffer: { kategorie: string; punkte: number }[] = []
  for (const [kategorie, stämme] of Object.entries(SCHLAGWOERTER)) {
    const getroffen = stämme
      .map((eintrag) => ({ entscheidend: eintrag.startsWith('!'), stamm: eintrag.replace(/^!/, '') }))
      .filter(({ stamm }) => text.includes(stamm))

    let punkte = 0
    for (const { stamm, entscheidend } of getroffen) {
      // Steckt der Stamm in einem längeren Treffer derselben Kategorie
      // („mutter" in „grossmutter"), zählt nur der längere — sonst wöge ein
      // beiläufiges Wort doppelt.
      if (getroffen.some((a) => a.stamm !== stamm && a.stamm.includes(stamm))) continue
      punkte += stamm.length + (entscheidend ? GEWICHT_ENTSCHEIDEND : 0)
    }
    if (punkte > 0) treffer.push({ kategorie, punkte })
  }
  return treffer.sort((a, b) => (b.punkte !== a.punkte ? b.punkte - a.punkte : a.kategorie < b.kategorie ? -1 : 1))
}

/**
 * Die Kategorie, die am besten zum Freitext passt — oder `null`, wenn kein
 * Schlagwort greift. Der Aufrufer nimmt dann die vom Nutzer gewählte Kategorie:
 * eine bewusste Wahl wird nie überstimmt, es wird nur ergänzt, wo nichts steht.
 */
export function kategorieFuerThema(titel: string): string | null {
  return bewerten(titel)[0]?.kategorie ?? null
}

// ---------------------------------------------------------------------------
// Schriftwort zum Thema
// ---------------------------------------------------------------------------

/** Kleiner deterministischer Streuwert (FNV-1a), wie in `gebetsauswahl.ts`. */
function streuIndex(schluessel: string, laenge: number): number {
  let h = 2166136261
  for (let i = 0; i < schluessel.length; i++) {
    h ^= schluessel.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % laenge
}

/**
 * Alle Schriftworte, die zum Freitext passen — aus den bis zu zwei am besten
 * bewerteten Kategorien, sonst aus der gewählten, zuletzt aus der
 * Standardkategorie. „Streit in der Familie" schöpft so aus Familie und Zorn.
 */
export function verseFuerThema(titel: string, kategorie: string | null): Vers[] {
  const gefunden = bewerten(titel).slice(0, 2)
  // Abwechselnd aus beiden Kategorien, damit auch ein Ausschnitt der Liste
  // („Streit in der Familie") beide Seiten des Themas trägt.
  const listen = gefunden.map(({ kategorie: k }) => verseFuerKategorie(k))
  const verse: Vers[] = []
  const gesehen = new Set<string>()
  for (let i = 0; i < Math.max(0, ...listen.map((l) => l.length)); i++) {
    for (const liste of listen) {
      const vers = liste[i]
      if (!vers || gesehen.has(vers.id)) continue
      gesehen.add(vers.id)
      verse.push(vers)
    }
  }
  if (verse.length > 0) return verse
  if (kategorie) {
    const ausKategorie = verseFuerKategorie(kategorie)
    if (ausKategorie.length > 0) return ausKategorie
  }
  return verseFuerKategorie(STANDARD_KATEGORIE)
}

/**
 * Ein einzelnes Schriftwort zum Thema. Die Wahl ist deterministisch über
 * `schluessel` (etwa Datum und Tageszeit), damit dasselbe Gebet beim erneuten
 * Öffnen denselben Vers zeigt. `null`, wenn nichts vorliegt — dann bleibt es
 * beim Vers des Grundgebets.
 */
export function versFuerThema(titel: string, kategorie: string | null, schluessel: string): Vers | null {
  const verse = verseFuerThema(titel, kategorie)
  if (verse.length === 0) return null
  return verse[streuIndex(`${schluessel}-${titel}`, verse.length)] ?? null
}

/**
 * Je ein Schriftwort für Morgen, Mittag und Abend — nach Möglichkeit drei
 * verschiedene. Für die KI-Erzeugung (Abschnitt 12): Der Vers wird dem Modell
 * vorgegeben, statt es aus einer Liste wählen zu lassen. Was es nicht wählt,
 * kann es auch nicht erfinden.
 */
export function verseFuerTageszeiten(titel: string, kategorie: string | null): Record<Tageszeit, Vers> | null {
  const verse = verseFuerThema(titel, kategorie)
  if (verse.length === 0) return null
  const start = streuIndex(titel, verse.length)
  const gewaehlt = TAGESZEITEN.map((_, i) => verse[(start + i) % verse.length]!)
  return { morgen: gewaehlt[0]!, mittag: gewaehlt[1]!, abend: gewaehlt[2]! }
}

// ---------------------------------------------------------------------------
// Trägersatz
// ---------------------------------------------------------------------------

/**
 * Der Trägersatz steht in Doppelpunktform. Das ist der Kern der
 * Grammatikbehandlung: Nach einem Doppelpunkt steht das Thema im Nominativ und
 * unverändert, gleich welches Genus und welchen Kasus der Nutzer eingegeben
 * hat. „Besonders bringe ich Dir vor Augen: Angst vor der Zukunft." bleibt
 * richtig, wo „ich bitte Dich um Angst vor der Zukunft" falsch war.
 *
 * Je Tageszeit stehen zwei Fassungen zur Wahl, damit die Gebete nicht alle
 * gleich klingen; für Dank und für Verstorbene gibt es eigene Wendungen.
 */
const TRAEGER: Record<Tageszeit, readonly string[]> = {
  morgen: ['Besonders bringe ich Dir vor Augen', 'Besonders lege ich Dir an diesem Morgen ans Herz'],
  mittag: ['Besonders bringe ich Dir vor Augen', 'Besonders halte ich Dir mitten am Tag hin'],
  abend: ['Besonders bringe ich Dir vor Augen', 'Besonders lege ich Dir an diesem Abend ans Herz'],
}

const TRAEGER_DANK: Record<Tageszeit, readonly string[]> = {
  morgen: ['Besonders danke ich Dir für', 'Besonders danke ich Dir an diesem Morgen für'],
  mittag: ['Besonders danke ich Dir für'],
  abend: ['Besonders danke ich Dir für', 'Besonders danke ich Dir an diesem Abend für'],
}

const TRAEGER_VERSTORBENE: Record<Tageszeit, readonly string[]> = {
  morgen: ['Besonders gedenke ich vor Dir'],
  mittag: ['Besonders gedenke ich vor Dir'],
  abend: ['Besonders gedenke ich vor Dir', 'Besonders halte ich Dir an diesem Abend hin'],
}

/** Nimmt Satzzeichen am Ende weg und staucht Leerraum — der Satz setzt selbst. */
export function titelSaeubern(titel: string): string {
  return titel.trim().replace(/\s+/g, ' ').replace(/[.,;:!?\s]+$/, '')
}

/** Die Wortlaute, die der Trägersatz einer Tageszeit annehmen kann. */
function wendungen(kategorie: string | null, tageszeit: Tageszeit): readonly string[] {
  if (kategorie === 'dankbarkeit') return TRAEGER_DANK[tageszeit]
  if (kategorie === 'verstorbene') return TRAEGER_VERSTORBENE[tageszeit]
  return TRAEGER[tageszeit]
}

/**
 * Der fertige Trägersatz, etwa „Besonders bringe ich Dir vor Augen: Angst vor
 * der Zukunft." Er ersetzt im Grundgebet die ganze Zeile mit dem Platzhalter —
 * nicht nur den Platzhalter selbst. Damit ist gleich, wie der Satz drumherum
 * einmal formuliert war.
 */
export function traegersatz(titel: string, kategorie: string | null, tageszeit: Tageszeit): string | null {
  const sauber = titelSaeubern(titel)
  if (!sauber) return null
  const auswahl = wendungen(kategorie, tageszeit)
  const wendung = auswahl[streuIndex(`${sauber}-${tageszeit}`, auswahl.length)] ?? auswahl[0]
  return `${wendung}: ${sauber}.`
}

/**
 * Der Wortlaut, den die KI verwenden soll (Abschnitt 12). Sie kennt den Titel
 * nicht, schreibt also den Platzhalter — eingesetzt wird erst beim Anzeigen.
 */
export function traegersatzVorlage(platzhalter: string): string {
  return `Besonders bringe ich Dir vor Augen: ${platzhalter}.`
}
