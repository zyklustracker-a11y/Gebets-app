import { describe, expect, it } from 'vitest'

import {
  faerbungFuer,
  festDesTages,
  heiligerDesTages,
  istFastentag,
  orthodoxeOstern,
} from './kalender'

/** Baut einen gregorianischen Kalendertag als UTC-Mitternacht. */
function tag(jahr: number, monat: number, tagN: number): Date {
  return new Date(Date.UTC(jahr, monat - 1, tagN))
}

describe('orthodoxeOstern', () => {
  it('trifft die Testfälle der Spezifikation', () => {
    expect(orthodoxeOstern(2026)).toEqual(tag(2026, 4, 12))
    expect(orthodoxeOstern(2027)).toEqual(tag(2027, 5, 2))
    expect(orthodoxeOstern(2028)).toEqual(tag(2028, 4, 16))
  })

  it('fällt immer auf einen Sonntag', () => {
    for (let jahr = 2024; jahr <= 2035; jahr++) {
      expect(orthodoxeOstern(jahr).getUTCDay()).toBe(0)
    }
  })
})

describe('festDesTages', () => {
  it('erkennt die festen grossen Feste (julianisch + 13 Tage)', () => {
    expect(festDesTages(tag(2027, 1, 7))).toBe('Geburt Christi')
    expect(festDesTages(tag(2026, 1, 19))).toBe('Theophanie')
    expect(festDesTages(tag(2026, 8, 19))).toBe('Verklärung')
    expect(festDesTages(tag(2026, 8, 28))).toBe('Entschlafung der Gottesgebärerin')
  })

  it('leitet die beweglichen Feste aus Ostern ab', () => {
    expect(festDesTages(tag(2026, 4, 12))).toBe('Ostern')
    expect(festDesTages(tag(2026, 4, 5))).toBe('Einzug in Jerusalem') // Ostern − 7
    expect(festDesTages(tag(2026, 5, 21))).toBe('Christi Himmelfahrt') // Ostern + 39
    expect(festDesTages(tag(2026, 5, 31))).toBe('Pfingsten') // Ostern + 49
  })

  it('gibt an einem gewöhnlichen Dienstag null zurück', () => {
    expect(festDesTages(tag(2026, 7, 28))).toBeNull()
  })
})

describe('heiligerDesTages', () => {
  it('nennt den Heiligen aus dem julianischen Kalender', () => {
    expect(heiligerDesTages(tag(2026, 10, 8))).toBe('Heiliger Sergius von Radonesch')
    expect(heiligerDesTages(tag(2026, 12, 19))).toBe('Heiliger Nikolaus')
  })

  it('gibt an einem gewöhnlichen Tag null zurück', () => {
    expect(heiligerDesTages(tag(2026, 7, 28))).toBeNull()
  })
})

describe('faerbungFuer', () => {
  it('färbt die Grosse Fastenzeit inklusive Karfreitag', () => {
    expect(faerbungFuer(tag(2026, 4, 10))).toBe('fastenzeit') // Karfreitag 2026
    expect(faerbungFuer(tag(2026, 2, 23))).toBe('fastenzeit') // Reinigungsmontag (Ostern − 48)
  })

  it('färbt die Osterzeit bis Pfingsten', () => {
    expect(faerbungFuer(tag(2026, 4, 12))).toBe('osterzeit') // Ostern
    expect(faerbungFuer(tag(2026, 4, 22))).toBe('osterzeit')
    expect(faerbungFuer(tag(2026, 5, 31))).toBe('osterzeit') // Pfingsten (Ostern + 49)
  })

  it('lässt gewöhnliche Tage gewöhnlich', () => {
    expect(faerbungFuer(tag(2026, 7, 28))).toBe('gewoehnlich') // gewöhnlicher Dienstag
    expect(faerbungFuer(tag(2027, 1, 7))).toBe('gewoehnlich') // Weihnachten ist keine Fastenzeit-Färbung
  })
})

describe('istFastentag', () => {
  it('fastet in der Grossen Fastenzeit', () => {
    expect(istFastentag(tag(2026, 4, 10))).toBe(true) // Karfreitag
    expect(istFastentag(tag(2026, 3, 10))).toBe(true) // mitten in der Fastenzeit
  })

  it('fastet an Mittwoch und Freitag der gewöhnlichen Zeit', () => {
    expect(tag(2026, 7, 29).getUTCDay()).toBe(3) // Mittwoch
    expect(istFastentag(tag(2026, 7, 29))).toBe(true)
    expect(istFastentag(tag(2026, 7, 28))).toBe(false) // Dienstag
  })

  it('fastet nicht in der Lichten Woche, auch nicht am Freitag', () => {
    expect(tag(2026, 4, 17).getUTCDay()).toBe(5) // Freitag der Lichten Woche
    expect(istFastentag(tag(2026, 4, 17))).toBe(false)
  })

  it('fastet an den strengen Einzelfastentagen unabhängig vom Wochentag', () => {
    expect(istFastentag(tag(2026, 9, 27))).toBe(true) // Kreuzerhöhung
    expect(istFastentag(tag(2026, 9, 11))).toBe(true) // Enthauptung Johannes des Täufers
  })

  it('fastet im Weihnachts- und Marienfasten', () => {
    expect(istFastentag(tag(2026, 12, 1))).toBe(true) // Weihnachtsfasten
    expect(istFastentag(tag(2026, 8, 20))).toBe(true) // Marienfasten
  })
})
