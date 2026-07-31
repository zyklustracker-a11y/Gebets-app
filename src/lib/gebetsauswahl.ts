/**
 * Gebetsauswahl (Spezifikation, Abschnitt 6).
 *
 * Zwei Zusagen dieses Moduls:
 *
 * 1. Die Auswahl ist deterministisch pro (Datum, Tageszeit). Das erste Öffnen
 *    legt einen `Gebetseintrag` an; jedes weitere Öffnen liefert genau diesen
 *    Eintrag zurück, der Text wechselt also nicht. Nur „Anderes Gebet"
 *    (`andersWaehlen`) setzt die Auswahl bewusst neu.
 * 2. Das Schriftwort steckt fest im gewählten Grundgebet (`vers`, `stelle`) und
 *    wird nicht separat gelost.
 *
 * Die liturgische Zusammensetzung (Module, Festeinschübe) übernimmt
 * `lib/komposition.ts`; welches Modul greift, bestimmt `lib/liturgie.ts`.
 */

import { db } from './db'
import { aktiveGedenknamen } from './gedenken'
import { heiligerDesTages } from './kalender'
import { zusammensetzen, type Zusammensetzung } from './komposition'
import { korpusFuer, korpusNachId } from './korpus'
import { modulFuer, modulNachId } from './liturgie'
import type { Gebetseintrag, Tageszeit } from './types'

export type { Zusammensetzung }

/** Kategorie, auf die zurückgefallen wird, wenn kein aktives Thema greift. */
const STANDARD_KATEGORIE = 'dankbarkeit'

/** Wie viele Tage ein einmal gezeigtes Gebet gesperrt bleibt. */
const SPERRE_TAGE = 14

// ---------------------------------------------------------------------------
// Datums-Hilfen (Zeichenketten „YYYY-MM-DD")
// ---------------------------------------------------------------------------

export function datumIso(datum: Date): string {
  const jahr = datum.getUTCFullYear()
  const monat = String(datum.getUTCMonth() + 1).padStart(2, '0')
  const tag = String(datum.getUTCDate()).padStart(2, '0')
  return `${jahr}-${monat}-${tag}`
}

function datumAusIso(iso: string): Date {
  const teile = iso.split('-')
  return new Date(Date.UTC(Number(teile[0]), Number(teile[1]) - 1, Number(teile[2])))
}

function datumMinusTage(iso: string, tage: number): string {
  const dt = datumAusIso(iso)
  dt.setUTCDate(dt.getUTCDate() - tage)
  return datumIso(dt)
}

/** Kleiner deterministischer Streuwert (FNV-1a), damit die Wahl variiert. */
function streuIndex(schluessel: string, laenge: number): number {
  let h = 2166136261
  for (let i = 0; i < schluessel.length; i++) {
    h ^= schluessel.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % laenge
}

// ---------------------------------------------------------------------------
// Auswahl
// ---------------------------------------------------------------------------

async function erzeugeAuswahl(
  datum: string,
  tageszeit: Tageszeit,
  ausschlussKorpusId: string | null,
): Promise<Gebetseintrag> {
  const protokoll = await db.protokoll.toArray()

  // Aktive Themen nach längster Abwesenheit sortieren: das Thema, das am
  // längsten nicht vorkam, kommt zuerst (Rotation).
  const aktive = await db.themen.where('status').equals('aktiv').toArray()
  const zuletzt = (themaId: string): string => {
    let max = ''
    for (const eintrag of protokoll) {
      if (eintrag.themenIds.includes(themaId) && eintrag.datum > max) max = eintrag.datum
    }
    return max
  }
  aktive.sort((a, b) => {
    const za = zuletzt(a.id)
    const zb = zuletzt(b.id)
    if (za !== zb) return za < zb ? -1 : 1
    return a.erstelltAm < b.erstelltAm ? -1 : 1
  })

  const gewaehlte = aktive.slice(0, Math.min(3, aktive.length))
  const hauptThema = gewaehlte[0]
  const kategorie = hauptThema?.kategorie ?? STANDARD_KATEGORIE

  // Grundgebete zur Kategorie und Tageszeit, mit Rückfall auf die Standard-
  // kategorie und zuletzt auf alles zur Tageszeit passende.
  let auswahl = korpusFuer(kategorie, tageszeit)
  if (auswahl.length === 0) auswahl = korpusFuer(STANDARD_KATEGORIE, tageszeit)

  // Wiederholungssperre: was in den letzten 14 Tagen dran war, meiden.
  const grenze = datumMinusTage(datum, SPERRE_TAGE)
  const kuerzlich = new Set(protokoll.filter((e) => e.datum > grenze).map((e) => e.korpusId))
  let frei = auswahl.filter((e) => !kuerzlich.has(e.id))
  if (frei.length === 0) frei = auswahl

  // „Anderes Gebet": das bisherige ausschliessen, sofern es Alternativen gibt.
  if (ausschlussKorpusId) {
    const ohne = frei.filter((e) => e.id !== ausschlussKorpusId)
    if (ohne.length > 0) frei = ohne
  }

  const wahl = frei[streuIndex(`${datum}-${tageszeit}-${ausschlussKorpusId ?? ''}`, frei.length)]

  // Welches liturgische Modul heute greift, hängt nur am Datum.
  const modul = modulFuer(datumAusIso(datum))

  return {
    id: `${datum}-${tageszeit}`,
    datum,
    tageszeit,
    korpusId: wahl?.id ?? '',
    themenIds: gewaehlte.map((t) => t.id),
    modulId: modul?.id,
  }
}

/**
 * Liefert das Gebet für (Datum, Tageszeit). Existiert bereits eine Auswahl,
 * wird genau sie zurückgegeben — der Text wechselt beim erneuten Öffnen nicht.
 */
export async function ermittleGebet(datum: string, tageszeit: Tageszeit): Promise<Gebetseintrag> {
  const id = `${datum}-${tageszeit}`
  const vorhanden = await db.protokoll.get(id)
  if (vorhanden) return vorhanden
  const neu = await erzeugeAuswahl(datum, tageszeit, null)
  await db.protokoll.put(neu)
  return neu
}

/** „Anderes Gebet": setzt die Auswahl bewusst neu und schliesst das bisherige aus. */
export async function andersWaehlen(datum: string, tageszeit: Tageszeit): Promise<Gebetseintrag> {
  const id = `${datum}-${tageszeit}`
  const vorhanden = await db.protokoll.get(id)
  const neu = await erzeugeAuswahl(datum, tageszeit, vorhanden?.korpusId ?? null)
  await db.protokoll.put(neu)
  return neu
}

/** Setzt den Zeitstempel „Gebetet" auf dem heutigen Eintrag. */
export async function alsGebetet(datum: string, tageszeit: Tageszeit): Promise<void> {
  const eintrag = await ermittleGebet(datum, tageszeit)
  await db.protokoll.update(eintrag.id, { gebetetAm: new Date().toISOString() })
}

// ---------------------------------------------------------------------------
// Zusammensetzung zum Anzeigen
// ---------------------------------------------------------------------------

/**
 * Baut die anzuzeigenden Teile eines Gebets: Grundgebet, `{{anliegen}}` aus dem
 * eigenen Thema und — falls eines greift — die Bausteine des liturgischen
 * Moduls. Das Zusammenfügen selbst liegt in `lib/komposition.ts`.
 */
export async function komponiere(eintrag: Gebetseintrag): Promise<Zusammensetzung | null> {
  const grundgebet = korpusNachId(eintrag.korpusId)
  if (!grundgebet) return null

  const themen = await db.themen.bulkGet(eintrag.themenIds)
  const eigenes = themen.find((t) => t?.istEigen)

  const modul = eintrag.modulId ? (modulNachId(eintrag.modulId) ?? null) : null
  const heiligerName = modul ? heiligerDesTages(datumAusIso(eintrag.datum)) : null

  const { lebende, entschlafene } = await aktiveGedenknamen()

  return zusammensetzen({
    korpustext: grundgebet.text,
    vers: grundgebet.vers,
    stelle: grundgebet.stelle,
    tageszeit: eintrag.tageszeit,
    modul,
    eigenesTitel: eigenes?.titel ?? null,
    heiligerName,
    lebende,
    entschlafene,
  })
}
