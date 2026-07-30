/**
 * Das Startset an Kategorien (Konzept 3.1). Der Schlüssel ist der Bezug ins
 * Korpus (`kategorie` in `data/gebete.json`), der Name die Anzeige.
 */

export interface Kategorie {
  schluessel: string
  name: string
}

export const KATEGORIEN: Kategorie[] = [
  { schluessel: 'familie', name: 'Familie' },
  { schluessel: 'ehe', name: 'Ehe & Partnerschaft' },
  { schluessel: 'arbeit', name: 'Arbeit & Berufung' },
  { schluessel: 'gesundheit', name: 'Gesundheit' },
  { schluessel: 'angst', name: 'Angst & Sorge' },
  { schluessel: 'zorn', name: 'Zorn & Vergebung' },
  { schluessel: 'dankbarkeit', name: 'Dankbarkeit' },
  { schluessel: 'reue', name: 'Reue & Umkehr' },
  { schluessel: 'reinheit', name: 'Reinheit' },
  { schluessel: 'geduld', name: 'Geduld' },
  { schluessel: 'finanzen', name: 'Finanzen' },
  { schluessel: 'entscheidungen', name: 'Entscheidungen' },
  { schluessel: 'verstorbene', name: 'Verstorbene' },
  { schluessel: 'schwierige', name: 'Schwierige Menschen' },
  { schluessel: 'glaubenszweifel', name: 'Glaubenszweifel' },
  { schluessel: 'demut', name: 'Demut' },
]

export function kategorieName(schluessel: string): string {
  return KATEGORIEN.find((k) => k.schluessel === schluessel)?.name ?? schluessel
}
