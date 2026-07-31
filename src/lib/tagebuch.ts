/**
 * Gebetstagebuch (Spezifikation, Abschnitt 11). Nach jedem Gebet ein optionaler
 * Satz. Der Eintrag hängt über `gebetId` am Protokolleintrag; über dessen
 * `themenIds` lässt sich das Tagebuch später nach Thema filtern, ohne den Text
 * mit einer eigenen Themenspalte zu belasten.
 *
 * Lokal in Dexie, über `lib/sync.ts` mitgeglichen.
 */

import { db } from './db'
import type { Tageszeit } from './types'

/**
 * Legt den Satz zum gegebenen Gebet ab. Ein Gebet (Datum + Tageszeit) trägt
 * genau einen Eintrag; erneutes Festhalten überschreibt ihn. Leerer Text
 * hinterlässt nichts.
 */
export async function tagebuchSpeichern(gebetId: string, datum: string, text: string): Promise<void> {
  const sauber = text.trim()
  const vorhanden = await db.journal.where('gebetId').equals(gebetId).first()
  if (!sauber) {
    if (vorhanden) await db.journal.delete(vorhanden.id)
    return
  }
  if (vorhanden) {
    await db.journal.update(vorhanden.id, { text: sauber, datum })
  } else {
    await db.journal.add({ id: crypto.randomUUID(), gebetId, datum, text: sauber })
  }
}

/** Der bereits festgehaltene Satz zu einem Gebet, falls vorhanden. */
export async function tagebuchZuGebet(gebetId: string): Promise<string> {
  const vorhanden = await db.journal.where('gebetId').equals(gebetId).first()
  return vorhanden?.text ?? ''
}

export interface TagebuchZeile {
  id: string
  datum: string
  tageszeit: Tageszeit | null
  text: string
  /** Titel der Themen, die an diesem Gebet hingen. */
  themen: string[]
  themenIds: string[]
}

const TAGESZEIT_RANG: Record<Tageszeit, number> = { abend: 0, mittag: 1, morgen: 2 }

/**
 * Alle Tagebuchsätze, neueste zuerst, mit den Themen des jeweiligen Gebets.
 * Die Verknüpfung läuft über das Protokoll; gelöschte Themen fallen still weg.
 */
export async function tagebuchLesen(): Promise<TagebuchZeile[]> {
  const [eintraege, protokoll, themen] = await Promise.all([
    db.journal.toArray(),
    db.protokoll.toArray(),
    db.themen.toArray(),
  ])
  const protokollNach = new Map(protokoll.map((p) => [p.id, p]))
  const titelNach = new Map(themen.map((t) => [t.id, t.titel]))

  const zeilen: TagebuchZeile[] = eintraege.map((e) => {
    const p = protokollNach.get(e.gebetId)
    const themenIds = p?.themenIds ?? []
    return {
      id: e.id,
      datum: e.datum,
      tageszeit: p?.tageszeit ?? null,
      text: e.text,
      themenIds,
      themen: themenIds
        .map((id) => titelNach.get(id))
        .filter((t): t is string => Boolean(t)),
    }
  })

  zeilen.sort((a, b) => {
    if (a.datum !== b.datum) return a.datum < b.datum ? 1 : -1
    const ra = a.tageszeit ? TAGESZEIT_RANG[a.tageszeit] : 3
    const rb = b.tageszeit ? TAGESZEIT_RANG[b.tageszeit] : 3
    return ra - rb
  })
  return zeilen
}
