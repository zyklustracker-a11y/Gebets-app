import { describe, expect, it } from 'vitest'

import { modulFuer } from './liturgie'

/** Gregorianischer Kalendertag als UTC-Mitternacht. */
function tag(jahr: number, monat: number, tagN: number): Date {
  return new Date(Date.UTC(jahr, monat - 1, tagN))
}

// Ostern 2026 = 12. April (Sonntag). Alle Offsets beziehen sich darauf.
describe('modulFuer — Prioritätsregel (es gewinnt der niedrigste Wert)', () => {
  it('Seelensamstag in der Grossen Fastenzeit: Fastenzeit (30) schlägt Gedenken (45)', () => {
    // 2. Fastensamstag = Ostern − 36 = 7. März 2026 (Samstag)
    const samstag = tag(2026, 3, 7)
    expect(samstag.getUTCDay()).toBe(6)
    expect(modulFuer(samstag)?.id).toBe('grosse-fastenzeit')
  })

  it('Freitag in der Osterzeit: Osterzeit (30) schlägt Mittwoch/Freitag (70)', () => {
    // Ostern + 12 = 24. April 2026 (Freitag)
    const freitag = tag(2026, 4, 24)
    expect(freitag.getUTCDay()).toBe(5)
    expect(modulFuer(freitag)?.id).toBe('osterzeit')
  })

  it('Fest auf einem Fasttag: das Fest (20) schlägt die Fastenzeit (30)', () => {
    // 2027 ist Ostern am 2. Mai; Verkündigung (7. April) liegt in der
    // gewöhnlichen Grossen Fastenzeit, nicht in der Karwoche.
    expect(modulFuer(tag(2027, 4, 7))?.id).toBe('fest-verkuendigung')
  })

  it('gewöhnlicher Dienstag: kein Modul', () => {
    const dienstag = tag(2026, 7, 28)
    expect(dienstag.getUTCDay()).toBe(2)
    expect(modulFuer(dienstag)).toBeNull()
  })
})

describe('modulFuer — einzelne Tage', () => {
  it('Ostersonntag: Ostern und Lichte Woche (schlägt Sonntag)', () => {
    expect(modulFuer(tag(2026, 4, 12))?.id).toBe('ostern-lichte-woche')
  })

  it('Karfreitag: Karwoche (schlägt die Grosse Fastenzeit)', () => {
    expect(modulFuer(tag(2026, 4, 10))?.id).toBe('karwoche')
  })

  it('Entschlafung der Gottesgebärerin: das Fest', () => {
    expect(modulFuer(tag(2026, 8, 28))?.id).toBe('fest-entschlafung')
  })

  it('Geburt Christi (7. Januar): das Fest, nicht das Weihnachtsfasten', () => {
    expect(modulFuer(tag(2026, 1, 7))?.id).toBe('fest-geburt-christi')
  })

  it('ein gewöhnlicher Freitag: Mittwoch/Freitag', () => {
    // 24. Juli 2026 ist ein Freitag ausserhalb aller Fastenzeiten und Feste
    const freitag = tag(2026, 7, 24)
    expect(freitag.getUTCDay()).toBe(5)
    expect(modulFuer(freitag)?.id).toBe('mittwoch-freitag')
  })
})
