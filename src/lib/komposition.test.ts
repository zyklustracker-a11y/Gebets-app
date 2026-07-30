import { describe, expect, it } from 'vitest'

import { zusammensetzen } from './komposition'
import { korpusNachId } from './korpus'
import { modulNachId } from './liturgie'
import type { Tageszeit } from './types'

function bauen(korpusId: string, tageszeit: Tageszeit, modulId: string | null, eigenesTitel: string | null = null) {
  const g = korpusNachId(korpusId)
  if (!g) throw new Error(`Korpus fehlt: ${korpusId}`)
  return zusammensetzen({
    korpustext: g.text,
    vers: g.vers,
    stelle: g.stelle,
    tageszeit,
    modul: modulId ? (modulNachId(modulId) ?? null) : null,
    eigenesTitel,
    heiligerName: null,
  })
}

describe('zusammensetzen — Ostersonntag', () => {
  const z = bauen('dankbarkeit-morgen-gewoehnlich-01', 'morgen', 'ostern-lichte-woche', 'Klarheit über den Jobwechsel')

  it('ersetzt die Eröffnung durch den Ostergruss', () => {
    expect(z.eroeffnung.startsWith('Christus ist auferstanden von den Toten')).toBe(true)
  })

  it('fügt den Festeinschub als eigenen Absatz ein', () => {
    expect(z.absaetze.some((a) => a.startsWith('Christus ist auferstanden. Herr, ich danke Dir für diesen Morgen'))).toBe(true)
  })

  it('stellt der Fürbitte den Zusatz voran, direkt vor der gewöhnlichen Fürbitte', () => {
    const zusatz = z.absaetze.indexOf('Heilige Gottesgebärerin, freue dich mit uns.')
    const fuerbitte = z.absaetze.findIndex((a) => a.startsWith('Heilige Gottesgebärerin, bitte für mich'))
    expect(zusatz).toBeGreaterThanOrEqual(0)
    expect(zusatz).toBeLessThan(fuerbitte)
  })

  it('setzt das eigene Anliegen ein und lässt keinen Platzhalter zurück', () => {
    const text = z.absaetze.join('\n')
    expect(text).toContain('Klarheit über den Jobwechsel')
    expect(text).not.toContain('{{')
  })
})

describe('zusammensetzen — Entschlafung der Gottesgebärerin (Fest an gewöhnlicher Eröffnung)', () => {
  const z = bauen('dankbarkeit-morgen-gewoehnlich-01', 'morgen', 'fest-entschlafung')

  it('behält die gewöhnliche Eröffnung', () => {
    expect(z.eroeffnung).toBe('Im Namen des Vaters, des Sohnes und des Heiligen Geistes.')
  })

  it('fügt den Festeinschub und die Fürbitte zum Fest ein', () => {
    expect(z.absaetze.some((a) => a.startsWith('Herr, ich danke Dir für Deine Mutter und für ihren Übergang'))).toBe(true)
    expect(z.absaetze).toContain('Allheilige Gottesgebärerin, rette uns.')
  })
})

describe('zusammensetzen — Schluss abends überschreiben', () => {
  it('ersetzt in der Osterzeit die abendliche Schlussformel', () => {
    const z = bauen('dankbarkeit-abend-gewoehnlich-01', 'abend', 'osterzeit')
    const letzte = z.absaetze[z.absaetze.length - 1] ?? ''
    expect(letzte).toContain('Du hast dem Tod die Macht genommen')
    // Die gewöhnliche Schlussformel darf nicht danebenstehen.
    expect(z.absaetze.filter((a) => a.startsWith('Herr Jesus Christus, unser Gott')).length).toBe(1)
  })
})

describe('zusammensetzen — Mittag bleibt kurz', () => {
  it('ein Fest schiebt mittags nichts ein', () => {
    const ohne = bauen('familie-mittag-gewoehnlich-01', 'mittag', null)
    const mitFest = bauen('familie-mittag-gewoehnlich-01', 'mittag', 'fest-entschlafung')
    expect(mitFest.absaetze).toEqual(ohne.absaetze)
    expect(mitFest.absaetze.join('\n')).not.toContain('Allheilige Gottesgebärerin')
  })

  it('die Osterzeit behält ihre kurze Mittagsform, vor der Schlusszeile', () => {
    const z = bauen('dankbarkeit-mittag-gewoehnlich-01', 'mittag', 'osterzeit')
    const einschub = z.absaetze.indexOf('Christus ist auferstanden. Ich danke Dir für diese Gewissheit in dieser Stunde.')
    const schluss = z.absaetze.findIndex((a) => a.startsWith('Herr Jesus Christus, Sohn Gottes'))
    expect(einschub).toBeGreaterThanOrEqual(0)
    expect(einschub).toBeLessThan(schluss)
  })
})

// Zum Mitlesen: das fertig zusammengesetzte Ostergebet.
describe('Leseprobe', () => {
  it('Ostersonntag, Morgen', () => {
    const z = bauen('dankbarkeit-morgen-gewoehnlich-01', 'morgen', 'ostern-lichte-woche', 'Klarheit über den Jobwechsel')
    const text = [z.eroeffnung, '', `${z.vers} (${z.stelle})`, '', ...z.absaetze].join('\n')
    console.log('\n----- Ostersonntag, Morgen -----\n' + text + '\n--------------------------------\n')
    expect(text.length).toBeGreaterThan(0)
  })
})
