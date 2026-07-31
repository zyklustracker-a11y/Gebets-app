import { describe, expect, it } from 'vitest'

import { RUFE, faellige, rufFuer, zuercherDatum, zuercherZeit } from './benachrichtigung'
import type { AboZeit } from './benachrichtigung'

describe('zuercherZeit — Sommerzeit über Intl, ohne feste Offsets', () => {
  it('rechnet im Sommer mit +2 Stunden (MESZ)', () => {
    // 1. Juli 2026, 05:00 UTC → 07:00 in Zürich
    expect(zuercherZeit(new Date('2026-07-01T05:00:00Z'))).toBe('07:00')
  })

  it('rechnet im Winter mit +1 Stunde (MEZ)', () => {
    // 1. Januar 2026, 06:00 UTC → 07:00 in Zürich
    expect(zuercherZeit(new Date('2026-01-01T06:00:00Z'))).toBe('07:00')
  })

  it('liefert das Ortsdatum, auch über die UTC-Mitternacht hinweg', () => {
    // 20:30 UTC im Sommer ist in Zürich bereits der Folgetag, 22:30
    expect(zuercherDatum(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02')
    expect(zuercherZeit(new Date('2026-07-01T22:30:00Z'))).toBe('00:30')
  })
})

describe('faellige', () => {
  const zeiten: AboZeit[] = [
    { typ: 'morgen', uhrzeit: '07:00' },
    { typ: 'mittag', uhrzeit: '12:30' },
    { typ: 'abend', uhrzeit: '21:00' },
  ]

  it('löst eine Zeit im Fenster aus', () => {
    expect(faellige(zeiten, '07:10', new Set()).map((z) => z.typ)).toEqual(['morgen'])
  })

  it('löst eine längst vergangene Zeit nicht mehr aus', () => {
    expect(faellige(zeiten, '09:00', new Set())).toEqual([])
  })

  it('löst nichts vor der Uhrzeit aus', () => {
    expect(faellige(zeiten, '06:59', new Set())).toEqual([])
  })

  it('überspringt, was heute schon gesendet wurde', () => {
    expect(faellige(zeiten, '07:05', new Set(['morgen']))).toEqual([])
  })
})

describe('rufFuer', () => {
  it('ist deterministisch pro Tag und Tageszeit', () => {
    expect(rufFuer('2026-07-30', 'morgen')).toBe(rufFuer('2026-07-30', 'morgen'))
  })

  it('stammt immer aus der allgemeinen Rufliste', () => {
    expect(RUFE).toContain(rufFuer('2026-07-30', 'abend'))
  })
})
