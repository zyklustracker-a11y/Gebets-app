/**
 * Zugriff auf die Schriftwort-Datenbank (`data/verse.json`).
 *
 * Reservoir für die Erzeugung eigener Gebete (Spezifikation, Abschnitt 12) und
 * für spätere Erweiterungen — nicht für die tägliche Auswahl; dort steckt der
 * Vers fest im Gebet.
 */

import verseDaten from '../../data/verse.json'
import type { Vers } from './types'

const verse = verseDaten as unknown as Vers[]

export function verseNachId(id: string): Vers | undefined {
  return verse.find((v) => v.id === id)
}

/** Alle Schriftworte zu einer Kategorie. */
export function verseFuerKategorie(kategorie: string): Vers[] {
  return verse.filter((v) => v.kategorien.includes(kategorie))
}

/** Alle Schriftworte zu einer liturgischen Zeit. */
export function verseFuerLiturgie(liturgisch: string): Vers[] {
  return verse.filter((v) => v.liturgisch === liturgisch)
}

export function alleVerse(): Vers[] {
  return verse
}
