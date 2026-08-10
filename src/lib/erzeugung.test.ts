import { describe, expect, it } from 'vitest'

import {
  PLATZHALTER,
  TRAEGERSATZ,
  nutzerPrompt,
  pruefeAntwort,
  versVorgabe,
  vorgabeAnwenden,
  type ErzeugungAnfrage,
  type ErzeugungAntwort,
} from './erzeugung'
import { TAGESZEITEN } from './types'
import { alleVerse } from './verse'

const ANFRAGE: ErzeugungAnfrage = {
  titel: 'Angst vor der Zukunft',
  kategorie: 'Angst & Sorge',
  kategorieSchluessel: 'angst',
  faerbung: 'gewoehnlich',
}

/** Ein Satz, der die geforderte Wortzahl auffüllt — Inhalt ist hier gleich. */
const FUELLSATZ = 'Ich danke Dir für diesen Tag und für alles, was er mir gebracht hat.'

/**
 * Eine Antwort, wie das Modell sie liefern könnte — mit erfundener Stelle,
 * aber sonst regelkonform: Wortzahl im Rahmen, Trägersatz wörtlich, richtiger
 * Schluss. So misst der Test genau das eine, worum es geht.
 */
function antwortMit(stelle: string, vers: string): ErzeugungAntwort {
  const teil = (fuellungen: number, schluss: string) => ({
    vers,
    stelle,
    text: `Herr, ich halte still.\n${Array(fuellungen).fill(FUELLSATZ).join(' ')}\n${TRAEGERSATZ}\n${schluss}`,
  })
  return {
    morgen: teil(9, 'Amen.'),
    mittag: teil(4, 'Herr Jesus Christus, Sohn Gottes, ich danke Dir.'),
    abend: teil(11, 'Amen.'),
  }
}

describe('versVorgabe', () => {
  it('gibt je Tageszeit ein echtes Schriftwort vor', () => {
    const bekannt = new Map(alleVerse().map((v) => [v.stelle, v.text]))
    const vorgabe = versVorgabe(ANFRAGE)
    for (const tz of TAGESZEITEN) {
      expect(bekannt.get(vorgabe[tz].stelle)).toBe(vorgabe[tz].text)
    }
  })

  it('wählt drei verschiedene Stellen', () => {
    const vorgabe = versVorgabe(ANFRAGE)
    expect(new Set(TAGESZEITEN.map((tz) => vorgabe[tz].stelle)).size).toBe(3)
  })

  it('ist deterministisch', () => {
    expect(versVorgabe(ANFRAGE)).toEqual(versVorgabe({ ...ANFRAGE }))
  })

  it('trägt auch ein Thema, zu dem kein Schlagwort greift', () => {
    const vorgabe = versVorgabe({ ...ANFRAGE, titel: 'Xylophon', kategorieSchluessel: undefined })
    for (const tz of TAGESZEITEN) expect(vorgabe[tz].stelle).not.toBe('')
  })
})

describe('vorgabeAnwenden', () => {
  it('ersetzt eine erfundene Stelle durch die Vorgabe', () => {
    const erfunden = antwortMit('Psalm 101,2', 'Die Liebe des Herrn umgibt den, der ihn fürchtet.')
    // Die Stelle, an der das Modell die Prüfung früher zu Fall brachte.
    expect(alleVerse().some((v) => v.stelle === 'Psalm 101,2')).toBe(false)

    const gerichtet = vorgabeAnwenden(erfunden, ANFRAGE)
    const vorgabe = versVorgabe(ANFRAGE)
    for (const tz of TAGESZEITEN) {
      expect(gerichtet[tz].stelle).toBe(vorgabe[tz].stelle)
      expect(gerichtet[tz].vers).toBe(vorgabe[tz].text)
    }
  })

  it('lässt den Text des Modells unberührt', () => {
    const roh = antwortMit('Psalm 101,2', 'Erfunden.')
    expect(vorgabeAnwenden(roh, ANFRAGE).morgen.text).toBe(roh.morgen.text)
  })

  it('macht eine sonst gültige Antwort mit falscher Stelle gültig', () => {
    const roh = antwortMit('Psalm 101,2', 'Erfunden.')
    expect(pruefeAntwort(vorgabeAnwenden(roh, ANFRAGE), ANFRAGE).gueltig).toBe(true)
  })
})

describe('pruefeAntwort — der Trägersatz bleibt Pflicht', () => {
  it('weist einen umformulierten Trägersatz ab', () => {
    const roh = antwortMit('Psalm 26,1', 'Kurz.')
    roh.morgen.text = roh.morgen.text.replace(TRAEGERSATZ, `Besonders bitte ich Dich um ${PLATZHALTER}.`)
    const ergebnis = pruefeAntwort(vorgabeAnwenden(roh, ANFRAGE), ANFRAGE)
    expect(ergebnis.gueltig).toBe(false)
    expect(ergebnis.fehler.morgen.join(' ')).toContain('Trägersatz')
  })

  it('weist einen fehlenden Trägersatz ab', () => {
    const roh = antwortMit('Psalm 26,1', 'Kurz.')
    roh.abend.text = 'Herr, ich halte still.\nAmen.'
    expect(pruefeAntwort(vorgabeAnwenden(roh, ANFRAGE), ANFRAGE).gueltig).toBe(false)
  })
})

describe('nutzerPrompt', () => {
  it('nennt die vorgegebenen Schriftworte, nicht eine Auswahlliste', () => {
    const prompt = nutzerPrompt(ANFRAGE)
    const vorgabe = versVorgabe(ANFRAGE)
    expect(prompt).toContain('VORGEGEBENE SCHRIFTWORTE')
    for (const tz of TAGESZEITEN) expect(prompt).toContain(vorgabe[tz].stelle)
  })
})
