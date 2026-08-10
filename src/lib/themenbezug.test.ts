import { describe, expect, it } from 'vitest'

import { kategorieFuerThema, titelSaeubern, traegersatz, versFuerThema, verseFuerThema } from './themenbezug'
import { TAGESZEITEN } from './types'
import { alleVerse } from './verse'

/** Die fünf Themen aus der Abnahme — sie decken die Bandbreite ab. */
const THEMEN = [
  { titel: 'Angst vor der Zukunft', kategorie: 'angst' },
  { titel: 'Dankbarkeit', kategorie: 'dankbarkeit' },
  { titel: 'Streit in der Familie', kategorie: 'familie' },
  { titel: 'Krankheit eines Freundes', kategorie: 'gesundheit' },
  { titel: 'Vergebung', kategorie: 'zorn' },
]

describe('kategorieFuerThema', () => {
  it('erkennt die Kategorie an den Wörtern des Freitexts', () => {
    for (const thema of THEMEN) {
      expect(kategorieFuerThema(thema.titel)).toBe(thema.kategorie)
    }
  })

  it('erkennt Beugungen und Zusammensetzungen', () => {
    expect(kategorieFuerThema('Meine Ängste werden grösser')).toBe('angst')
    expect(kategorieFuerThema('Meinem Vater näherkommen')).toBe('familie')
    expect(kategorieFuerThema('Schulden abbezahlen')).toBe('finanzen')
    expect(kategorieFuerThema('Der Tod meiner Grossmutter')).toBe('verstorbene')
  })

  it('gibt null zurück, wenn kein Schlagwort greift', () => {
    expect(kategorieFuerThema('Xylophon')).toBeNull()
    expect(kategorieFuerThema('')).toBeNull()
  })
})

describe('versFuerThema', () => {
  it('wählt ein Schriftwort, das zum Thema gehört', () => {
    for (const thema of THEMEN) {
      const verse = verseFuerThema(thema.titel, null)
      expect(verse.length).toBeGreaterThan(0)
      // Die erkannte Hauptkategorie steht vorn und ist im Topf vertreten.
      expect(verse[0]!.kategorien).toContain(thema.kategorie)
      expect(verse.some((v) => v.kategorien.includes(thema.kategorie))).toBe(true)
    }
  })

  it('schöpft bei zusammengesetzten Themen aus beiden Kategorien', () => {
    const kategorien = new Set(verseFuerThema('Streit in der Familie', null).flatMap((v) => v.kategorien))
    expect(kategorien.has('familie')).toBe(true)
    expect(kategorien.has('zorn')).toBe(true)
  })

  it('nimmt die gewählte Kategorie, wenn der Freitext nichts hergibt', () => {
    const verse = verseFuerThema('Xylophon', 'demut')
    expect(verse.length).toBeGreaterThan(0)
    expect(verse.every((v) => v.kategorien.includes('demut'))).toBe(true)
  })

  it('liefert immer ein Schriftwort — auch ohne jeden Anhaltspunkt', () => {
    expect(versFuerThema('Xylophon', null, '2026-08-10-morgen')).not.toBeNull()
    expect(versFuerThema('Xylophon', 'gibtsnicht', '2026-08-10-morgen')).not.toBeNull()
  })

  it('wählt deterministisch — derselbe Schlüssel, derselbe Vers', () => {
    const a = versFuerThema('Angst vor der Zukunft', 'angst', '2026-08-10-morgen')
    const b = versFuerThema('Angst vor der Zukunft', 'angst', '2026-08-10-morgen')
    expect(a?.id).toBe(b?.id)
  })

  it('gibt nur Stellen aus der mitgelieferten Datenbank zurück', () => {
    const bekannt = new Set(alleVerse().map((v) => v.stelle))
    for (const thema of THEMEN) {
      for (const tageszeit of TAGESZEITEN) {
        const vers = versFuerThema(thema.titel, thema.kategorie, `2026-08-10-${tageszeit}`)
        expect(bekannt.has(vers!.stelle)).toBe(true)
      }
    }
  })
})

describe('traegersatz', () => {
  it('setzt das Thema hinter einen Doppelpunkt, nicht in eine Rektion', () => {
    const satz = traegersatz('Angst vor der Zukunft', 'angst', 'morgen')
    expect(satz).toBe('Besonders bringe ich Dir vor Augen: Angst vor der Zukunft.')
    // Genau der Satz, an dem sich die Grammatik früher brach.
    expect(satz).not.toContain('um Angst vor der Zukunft')
  })

  it('bleibt für jedes Thema und jede Tageszeit ein ganzer Satz', () => {
    for (const thema of THEMEN) {
      for (const tageszeit of TAGESZEITEN) {
        const satz = traegersatz(thema.titel, thema.kategorie, tageszeit)!
        expect(satz.endsWith(`: ${thema.titel}.`)).toBe(true)
        expect(satz.startsWith('Besonders ')).toBe(true)
      }
    }
  })

  it('nimmt für Dank und für Verstorbene eigene Wendungen', () => {
    expect(traegersatz('Dankbarkeit', 'dankbarkeit', 'mittag')).toBe('Besonders danke ich Dir für: Dankbarkeit.')
    expect(traegersatz('Mein Grossvater', 'verstorbene', 'morgen')).toBe('Besonders gedenke ich vor Dir: Mein Grossvater.')
  })

  it('räumt Satzzeichen und Leerraum am Titel auf', () => {
    expect(titelSaeubern('  Angst   vor der Zukunft.  ')).toBe('Angst vor der Zukunft')
    // Kein doppeltes Satzzeichen, kein Ausrufezeichen (Tonregel 7).
    expect(traegersatz('Vergebung!', 'zorn', 'mittag')).toBe(traegersatz('Vergebung', 'zorn', 'mittag'))
    expect(traegersatz('Vergebung!', 'zorn', 'mittag')!.endsWith(': Vergebung.')).toBe(true)
  })

  it('gibt null zurück, wenn nach dem Aufräumen nichts bleibt', () => {
    expect(traegersatz('   ', 'angst', 'morgen')).toBeNull()
    expect(traegersatz('...', 'angst', 'morgen')).toBeNull()
  })
})
