/**
 * Zugriff auf das mitgelieferte Gebetskorpus (`data/gebete.json`).
 *
 * Der Bestand ist vorerst ein Teilausschnitt (drei Kategorien); Bauabschnitt 5
 * füllt ihn auf die 144 Grundgebete auf. Das Schriftwort (`vers`, `stelle`)
 * gehört fest zum Eintrag und wird nie separat gewählt.
 */

import gebeteDaten from '../../data/gebete.json'
import type { Korpuseintrag, Tageszeit } from './types'

const korpus = gebeteDaten as unknown as Korpuseintrag[]

export function korpusNachId(id: string): Korpuseintrag | undefined {
  return korpus.find((eintrag) => eintrag.id === id)
}

/** Alle Grundgebete zu einer Kategorie und Tageszeit. */
export function korpusFuer(kategorie: string, tageszeit: Tageszeit): Korpuseintrag[] {
  return korpus.filter((eintrag) => eintrag.kategorie === kategorie && eintrag.tageszeit === tageszeit)
}

/** Kategorien, für die überhaupt Gebete vorliegen. */
export function korpusKategorien(): Set<string> {
  return new Set(korpus.map((eintrag) => eintrag.kategorie))
}
