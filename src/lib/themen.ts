/**
 * Themenverwaltung über Dexie. Themen sind das Herzstück: Kategorien werden
 * an- und abgewählt, eigene Themen als Freitext angelegt.
 */

import { db } from './db'
import { kategorieName } from './kategorien'
import type { Thema } from './types'

/** Legt ein eigenes Thema an (Freitext). */
export async function themaAnlegen(titel: string, kategorie: string): Promise<void> {
  const sauber = titel.trim()
  if (!sauber) return
  await db.themen.add({
    id: crypto.randomUUID(),
    titel: sauber,
    kategorie,
    istEigen: true,
    status: 'aktiv',
    erstelltAm: new Date().toISOString(),
  })
}

/** Wählt eine Kategorie an oder ab (legt ein Kategorie-Thema an oder entfernt es). */
export async function kategorieUmschalten(schluessel: string): Promise<void> {
  const vorhanden = await db.themen.where('kategorie').equals(schluessel).filter((t) => !t.istEigen).first()
  if (vorhanden) {
    await db.themen.delete(vorhanden.id)
  } else {
    await db.themen.add({
      id: crypto.randomUUID(),
      titel: kategorieName(schluessel),
      kategorie: schluessel,
      istEigen: false,
      status: 'aktiv',
      erstelltAm: new Date().toISOString(),
    })
  }
}

/** Schaltet ein eigenes Thema zwischen aktiv und pausiert um. */
export async function themaStatusUmschalten(id: string): Promise<void> {
  const thema = await db.themen.get(id)
  if (!thema) return
  await db.themen.update(id, { status: thema.status === 'aktiv' ? 'pausiert' : 'aktiv' })
}

/**
 * Schliesst ein Anliegen ab: Status „erhört", Datum und die Antwort auf
 * „Wie hat Gott geantwortet?" (Spezifikation, Abschnitt 11). Die Antwort ist
 * freiwillig. Erhörte Anliegen erscheinen fortan im Archiv.
 */
export async function themaAbschliessen(id: string, notiz: string): Promise<void> {
  const thema = await db.themen.get(id)
  if (!thema) return
  const antwort = notiz.trim()
  await db.themen.update(id, {
    status: 'erhoert',
    abgeschlossenAm: new Date().toISOString(),
    notiz: antwort || undefined,
  })
}

/** Holt ein abgeschlossenes Anliegen zurück in die aktive Liste. */
export async function themaWiederAufnehmen(id: string): Promise<void> {
  const thema = await db.themen.get(id)
  if (!thema) return
  await db.themen.update(id, { status: 'aktiv', abgeschlossenAm: undefined })
}

/** Formuliert die Fusszeile auf „Heute" — wie viele Themen gerade aktiv sind. */
export function themenZusammenfassung(anzahl: number): string {
  if (anzahl === 0) return 'Noch keine Themen aktiv'
  if (anzahl === 1) return 'Ein Thema ist aktiv'
  const woerter = ['', 'Ein', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf']
  return `${woerter[anzahl] ?? anzahl} Themen sind aktiv`
}

export type { Thema }
