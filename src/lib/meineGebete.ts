/**
 * Von Hand angelegte Gebete (Punkt 2) — etwa eines, das der Priester
 * mitgegeben hat.
 *
 * Sie liegen wie alles andere in IndexedDB und überstehen damit jeden Neustart.
 * Nur dieser Bestand ist änder- und löschbar; das mitgelieferte Korpus aus
 * `data/gebete.json` wird hier nirgends angefasst.
 */

import { db } from './db'
import type { MeinGebet } from './types'

/** Die rohe Eingabe der Maske — Zeichenketten, noch ungeprüft. */
export interface GebetEingabe {
  titel: string
  text: string
  /** Kategorie-Schlüssel aus `kategorien.ts`; leer heisst „ohne Zuordnung". */
  kategorie: string
  /** Zählerzahl als Eingabe; leer heisst „kein Zähler". */
  wiederholungen: string
}

/** Obergrenze des Zählers — darüber wird die Perlenschnur sinnlos. */
export const WIEDERHOLUNGEN_MAX = 999

/** Je Feld eine verständliche Meldung; ein leeres Objekt heisst „in Ordnung". */
export interface Fehler {
  titel?: string
  text?: string
  wiederholungen?: string
}

export function pruefeGebet(eingabe: GebetEingabe): Fehler {
  const fehler: Fehler = {}

  if (!eingabe.titel.trim()) fehler.titel = 'Bitte gib dem Gebet einen Titel.'
  if (!eingabe.text.trim()) fehler.text = 'Bitte trage den Gebetstext ein.'

  const roh = eingabe.wiederholungen.trim()
  if (roh) {
    const zahl = Number(roh)
    if (!/^\d+$/.test(roh) || !Number.isInteger(zahl) || zahl < 1 || zahl > WIEDERHOLUNGEN_MAX) {
      fehler.wiederholungen = `Bitte eine ganze Zahl zwischen 1 und ${WIEDERHOLUNGEN_MAX} — oder das Feld leer lassen.`
    }
  }

  return fehler
}

export function istGueltig(fehler: Fehler): boolean {
  return Object.keys(fehler).length === 0
}

/** Formt die geprüfte Eingabe in die Felder des Datensatzes um. */
function ausEingabe(eingabe: GebetEingabe): Omit<MeinGebet, 'id' | 'erstelltAm'> {
  const roh = eingabe.wiederholungen.trim()
  return {
    titel: eingabe.titel.trim(),
    text: eingabe.text.trim(),
    kategorie: eingabe.kategorie.trim() || undefined,
    wiederholungen: roh ? Number(roh) : undefined,
  }
}

/**
 * Legt ein eigenes Gebet an. Gibt die id zurück, oder `null`, wenn die Eingabe
 * durchfällt — der Aufrufer zeigt dann die Meldungen aus `pruefeGebet`.
 */
export async function meinGebetAnlegen(eingabe: GebetEingabe): Promise<string | null> {
  if (!istGueltig(pruefeGebet(eingabe))) return null
  const id = crypto.randomUUID()
  await db.meineGebete.add({ id, erstelltAm: new Date().toISOString(), ...ausEingabe(eingabe) })
  return id
}

/** Übernimmt eine Bearbeitung. `false`, wenn die Eingabe durchfällt. */
export async function meinGebetSpeichern(id: string, eingabe: GebetEingabe): Promise<boolean> {
  if (!istGueltig(pruefeGebet(eingabe))) return false
  const vorhanden = await db.meineGebete.get(id)
  if (!vorhanden) return false
  // `put` statt `update`: so verschwinden geleerte Felder (etwa eine entfernte
  // Wiederholungszahl) auch wirklich aus dem Datensatz.
  await db.meineGebete.put({ ...vorhanden, ...ausEingabe(eingabe) })
  return true
}

/** Löscht ein eigenes Gebet endgültig — auch aus dem persistenten Speicher. */
export async function meinGebetLoeschen(id: string): Promise<void> {
  await db.meineGebete.delete(id)
}

/** Alle eigenen Gebete, das zuletzt angelegte zuerst. */
export async function meineGebeteLesen(): Promise<MeinGebet[]> {
  const alle = await db.meineGebete.toArray()
  return alle.sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
}

export type { MeinGebet }
