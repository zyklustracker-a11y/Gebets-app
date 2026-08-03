import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { ERINNERUNGSTEXTE, erinnerungstextFuer, faellige, zuercherDatum, zuercherZeit } from './benachrichtigung'
import type { AboZeit } from './benachrichtigung'
import { TAGESZEITEN } from './types'

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

describe('erinnerungstextFuer', () => {
  it('nennt die Gebetszeit beim Namen', () => {
    expect(erinnerungstextFuer('morgen')).toBe('Zeit für dein Morgengebet')
    expect(erinnerungstextFuer('mittag')).toBe('Zeit für dein Mittagsgebet')
    expect(erinnerungstextFuer('abend')).toBe('Zeit für dein Abendgebet')
  })

  it('hält auch den Text fürs Nachtgebet bereit', () => {
    expect(ERINNERUNGSTEXTE.nacht).toBe('Zeit für dein Nachtgebet')
  })

  it('deckt jede Tageszeit der App ab', () => {
    for (const tageszeit of TAGESZEITEN) {
      expect(erinnerungstextFuer(tageszeit), tageszeit).toBeTruthy()
    }
  })

  it('trägt keine persönlichen Angaben und keinen alten Ruf mehr', () => {
    for (const text of Object.values(ERINNERUNGSTEXTE)) {
      expect(text.toLowerCase()).not.toContain('herr')
    }
  })
})

describe('public/push-sw.js — der Service Worker zeigt dieselben Texte', () => {
  const quelle = readFileSync(new URL('../../public/push-sw.js', import.meta.url), 'utf8')

  it('spiegelt ERINNERUNGSTEXTE unverändert', () => {
    const block = quelle.match(/const ERINNERUNGSTEXTE = \{([^}]*)\}/)?.[1]
    expect(block, 'ERINNERUNGSTEXTE fehlt in push-sw.js').toBeTruthy()

    const gespiegelt: Record<string, string> = {}
    for (const [, schluessel, text] of block!.matchAll(/(\w+):\s*'([^']*)'/g)) {
      gespiegelt[schluessel!] = text!
    }
    expect(gespiegelt).toEqual(ERINNERUNGSTEXTE)
  })

  it('setzt keinen zweiten Textkörper — die Meldung bleibt einzeilig', () => {
    expect(quelle).not.toMatch(/\bbody\s*:/)
  })
})
