/**
 * Gedenkliste (Spezifikation, Abschnitt 11). Zwei Listen — Lebende und
 * Entschlafene. Die aktiven Namen fliessen in die Fürbitte des Gebets ein,
 * an derselben Stelle, an der sonst die allgemeine Fürbitte steht
 * (`lib/komposition.ts`).
 *
 * Alles liegt lokal in Dexie und wird über `lib/sync.ts` mitgeglichen wie die
 * übrigen Nutzerdaten.
 */

import { db } from './db'
import type { Gedenkname } from './types'

export type Gedenkart = Gedenkname['art']

/** Nimmt einen Namen in eine der beiden Listen auf. */
export async function gedenknameAnlegen(name: string, art: Gedenkart): Promise<void> {
  const sauber = name.trim()
  if (!sauber) return
  await db.gedenknamen.add({
    id: crypto.randomUUID(),
    name: sauber,
    art,
    aktiv: true,
  })
}

/** Nimmt einen Namen in die Fürbitte auf oder lässt ihn ruhen. */
export async function gedenknameUmschalten(id: string): Promise<void> {
  const eintrag = await db.gedenknamen.get(id)
  if (!eintrag) return
  await db.gedenknamen.update(id, { aktiv: !eintrag.aktiv })
}

/** Entfernt einen Namen ganz aus der Gedenkliste. */
export async function gedenknameLoeschen(id: string): Promise<void> {
  await db.gedenknamen.delete(id)
}

/**
 * Die aktiven Namen je Art, alphabetisch geordnet — so liest sich die Fürbitte
 * bei jedem Öffnen gleich, unabhängig von der Reihenfolge der Aufnahme.
 */
export async function aktiveGedenknamen(): Promise<{ lebende: string[]; entschlafene: string[] }> {
  const alle = await db.gedenknamen.toArray()
  const aktive = alle.filter((g) => g.aktiv)
  const namenVon = (art: Gedenkart) =>
    aktive
      .filter((g) => g.art === art)
      .map((g) => g.name)
      .sort((a, b) => a.localeCompare(b, 'de'))
  return { lebende: namenVon('lebend'), entschlafene: namenVon('entschlafen') }
}
