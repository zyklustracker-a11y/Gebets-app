import { describe, expect, it } from 'vitest'

import { WIEDERHOLUNGEN_MAX, istGueltig, pruefeGebet, type GebetEingabe } from './meineGebete'

function eingabe(teil: Partial<GebetEingabe> = {}): GebetEingabe {
  return { titel: 'Gebet zum heiligen Nikolaus', text: 'Heiliger Nikolaus, bitte für uns.', kategorie: '', wiederholungen: '', ...teil }
}

describe('pruefeGebet — Titel und Text sind Pflicht', () => {
  it('lässt eine vollständige Eingabe durch', () => {
    expect(istGueltig(pruefeGebet(eingabe()))).toBe(true)
  })

  it('weist einen leeren Titel ab', () => {
    const fehler = pruefeGebet(eingabe({ titel: '' }))
    expect(fehler.titel).toBeTruthy()
    expect(istGueltig(fehler)).toBe(false)
  })

  it('weist einen Titel aus lauter Leerzeichen ab', () => {
    expect(pruefeGebet(eingabe({ titel: '   ' })).titel).toBeTruthy()
  })

  it('weist einen leeren Gebetstext ab', () => {
    const fehler = pruefeGebet(eingabe({ text: '\n  \n' }))
    expect(fehler.text).toBeTruthy()
    expect(istGueltig(fehler)).toBe(false)
  })
})

describe('pruefeGebet — die Wiederholungszahl ist freiwillig', () => {
  it('nimmt ein leeres Feld hin', () => {
    expect(pruefeGebet(eingabe({ wiederholungen: '' })).wiederholungen).toBeUndefined()
  })

  it('nimmt eine ganze Zahl im Bereich hin', () => {
    expect(pruefeGebet(eingabe({ wiederholungen: '12' })).wiederholungen).toBeUndefined()
    expect(pruefeGebet(eingabe({ wiederholungen: String(WIEDERHOLUNGEN_MAX) })).wiederholungen).toBeUndefined()
  })

  it('weist Null, Kommazahlen, Text und zu grosse Zahlen ab', () => {
    for (const wert of ['0', '-3', '2,5', '2.5', 'zwölf', String(WIEDERHOLUNGEN_MAX + 1)]) {
      expect(pruefeGebet(eingabe({ wiederholungen: wert })).wiederholungen, wert).toBeTruthy()
    }
  })
})
