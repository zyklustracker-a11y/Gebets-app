/**
 * Baut `data/gebete.json` aus den Korpusdokumenten.
 *
 *   docs/4_Gebetskorpus_Referenz.md   → Variante 1
 *   docs/5_Gebetskorpus_Variante2.md  → Variante 2
 *   docs/6_Gebetskorpus_Variante3.md  → Variante 3
 *
 * Je Dokument: 16 Kategorien × 3 Tageszeiten. Zusammen die 144 Grundgebete.
 * Vers und Stelle werden fest zu jedem Gebet übernommen; der Platzhaltersatz
 * `{{anliegen}}` bleibt erhalten (nur die Kursiv-Sternchen fallen weg).
 *
 * Ausführen mit  `npm run korpus`  nachdem die Quelldokumente ergänzt wurden.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')

const QUELLEN = [
  { datei: 'docs/4_Gebetskorpus_Referenz.md', variante: 1 },
  { datei: 'docs/5_Gebetskorpus_Variante2.md', variante: 2 },
  { datei: 'docs/6_Gebetskorpus_Variante3.md', variante: 3 },
]

// Reihenfolge und Schlüssel der 16 Kategorien (wie in src/lib/kategorien.ts).
const KATEGORIEN = [
  ['Dankbarkeit', 'dankbarkeit'],
  ['Arbeit & Berufung', 'arbeit'],
  ['Familie', 'familie'],
  ['Angst & Sorge', 'angst'],
  ['Gesundheit', 'gesundheit'],
  ['Entscheidungen', 'entscheidungen'],
  ['Geduld', 'geduld'],
  ['Ehe & Partnerschaft', 'ehe'],
  ['Zorn & Vergebung', 'zorn'],
  ['Schwierige Menschen', 'schwierige'],
  ['Reue & Umkehr', 'reue'],
  ['Demut', 'demut'],
  ['Finanzen', 'finanzen'],
  ['Reinheit', 'reinheit'],
  ['Glaubenszweifel', 'glaubenszweifel'],
  ['Verstorbene', 'verstorbene'],
]
const NAME_ZU_SCHLUESSEL = new Map(KATEGORIEN.map(([name, schluessel]) => [name, schluessel]))
const SCHLUESSEL_REIHENFOLGE = KATEGORIEN.map(([, schluessel]) => schluessel)

const TAGESZEITEN = { Morgen: 'morgen', Mittag: 'mittag', Abend: 'abend' }
const TAGESZEIT_REIHENFOLGE = ['morgen', 'mittag', 'abend']

/** Zerlegt die Verszeile in Wortlaut und Stellenangabe. */
function versZerlegen(zeile) {
  const kern = zeile.trim().replace(/^\*+/, '').replace(/\*+$/, '').trim()
  const treffer = kern.match(/^[„"“]([^"“”]*)["“”]\s*[—–-]\s*(.+)$/)
  if (!treffer) throw new Error(`Vers nicht erkannt: ${zeile}`)
  return { vers: treffer[1].trim(), stelle: treffer[2].trim() }
}

/** Liest ein Dokument und gibt seine Einträge zurück. */
function dokumentLesen(pfad, variante) {
  const zeilen = readFileSync(join(WURZEL, pfad), 'utf8').split('\n')
  const eintraege = []
  let schluessel = null

  for (let i = 0; i < zeilen.length; i++) {
    const zeile = zeilen[i]

    const kategorie = zeile.match(/^#\s+\d+\s+·\s+(.+?)\s*$/)
    if (kategorie) {
      const name = kategorie[1].trim()
      schluessel = NAME_ZU_SCHLUESSEL.get(name)
      if (!schluessel) throw new Error(`Unbekannte Kategorie „${name}" in ${pfad}`)
      continue
    }

    const tages = zeile.match(/^##\s+(Morgen|Mittag|Abend)\s*$/)
    if (!tages) continue
    if (!schluessel) throw new Error(`Tageszeit ohne Kategorie in ${pfad}, Zeile ${i + 1}`)
    const tageszeit = TAGESZEITEN[tages[1]]

    // Nächste nicht-leere Zeile ist der Vers.
    let j = i + 1
    while (j < zeilen.length && zeilen[j].trim() === '') j++
    const { vers, stelle } = versZerlegen(zeilen[j])

    // Der Text reicht bis zum nächsten Trenner oder zur nächsten Überschrift.
    const koerper = []
    let k = j + 1
    for (; k < zeilen.length; k++) {
      const l = zeilen[k]
      if (l.trim().startsWith('---') || l.startsWith('#')) break
      koerper.push(l)
    }
    const text = koerper
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n')
      .replace(/\*(\{\{anliegen\}\})\*/g, '$1')

    if (!text.includes('{{anliegen}}')) {
      throw new Error(`Platzhalter fehlt: ${schluessel}/${tageszeit}/V${variante} in ${pfad}`)
    }

    eintraege.push({
      id: `${schluessel}-${tageszeit}-gewoehnlich-0${variante}`,
      kategorie: schluessel,
      tageszeit,
      faerbung: 'gewoehnlich',
      vers,
      stelle,
      text,
      variante,
    })
    i = k - 1
  }

  return eintraege
}

// --- Einlesen -------------------------------------------------------------

const alle = QUELLEN.flatMap(({ datei, variante }) => dokumentLesen(datei, variante))

// Stabile Reihenfolge: Kategorie, Tageszeit, Variante.
alle.sort((a, b) => {
  const ka = SCHLUESSEL_REIHENFOLGE.indexOf(a.kategorie) - SCHLUESSEL_REIHENFOLGE.indexOf(b.kategorie)
  if (ka !== 0) return ka
  const ta = TAGESZEIT_REIHENFOLGE.indexOf(a.tageszeit) - TAGESZEIT_REIHENFOLGE.indexOf(b.tageszeit)
  if (ta !== 0) return ta
  return a.variante - b.variante
})

// `variante` ist nur fürs Sortieren da und gehört nicht ins Ausgabeformat.
const ausgabe = alle.map(({ variante: _weg, ...rest }) => rest)
writeFileSync(join(WURZEL, 'data/gebete.json'), JSON.stringify(ausgabe, null, 2) + '\n', 'utf8')

// --- Prüfung und Zählung --------------------------------------------------

const bestand = new Map()
for (const e of alle) {
  const schl = bestand.get(e.kategorie) ?? { morgen: new Set(), mittag: new Set(), abend: new Set() }
  schl[e.tageszeit].add(e.variante)
  bestand.set(e.kategorie, schl)
}

let luecken = 0
const kopf = 'Kategorie'.padEnd(18) + 'Morgen  Mittag  Abend'
console.log(kopf)
console.log('-'.repeat(kopf.length))
for (const [name, schluessel] of KATEGORIEN) {
  const schl = bestand.get(schluessel) ?? { morgen: new Set(), mittag: new Set(), abend: new Set() }
  const zelle = (menge) => {
    const fehlend = [1, 2, 3].filter((v) => !menge.has(v))
    if (fehlend.length) luecken += fehlend.length
    return `${menge.size}/3`.padEnd(8)
  }
  console.log(name.padEnd(18) + zelle(schl.morgen) + zelle(schl.mittag) + zelle(schl.abend))
}

console.log('-'.repeat(kopf.length))
console.log(`Einträge gesamt: ${ausgabe.length}`)
console.log(`Kategorien: ${bestand.size}/16`)
console.log(`Fehlende Varianten: ${luecken}`)

if (ausgabe.length !== 144 || bestand.size !== 16 || luecken !== 0) {
  console.error('\nFEHLER: Der Korpus ist nicht vollständig (erwartet: 144 Einträge, 16 Kategorien, keine Lücken).')
  process.exit(1)
}
console.log('\nVollständig: 144 Einträge, 16 Kategorien × 3 Tageszeiten × 3 Varianten.')
