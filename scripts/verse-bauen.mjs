/**
 * Baut `data/verse.json` aus `docs/8_Schriftwort_Datenbank.md`.
 *
 * Die Schriftwort-Datenbank ist das Reservoir für die Erzeugung eigener Gebete
 * (Spezifikation, Abschnitt 12) und für spätere Erweiterungen — nicht für die
 * tägliche Auswahl; dort steckt der Vers fest im Gebet.
 *
 * Psalmen in Septuaginta-Zählung; die masoretische Zählung steht in Klammern
 * und wandert nach `stelleMasoretisch`. Buchkürzel werden ausgeschrieben, damit
 * die Stellen wie im Korpus aussehen.
 *
 * Ausführen mit  `npm run verse`.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')

const BUCH = {
  Ps: 'Psalm',
  Mt: 'Matthäus',
  Mk: 'Markus',
  Lk: 'Lukas',
  Joh: 'Johannes',
  Röm: 'Römer',
  Gal: 'Galater',
  Eph: 'Epheser',
  Phil: 'Philipper',
  Kol: 'Kolosser',
  Hebr: 'Hebräer',
  Jak: 'Jakobus',
  Offb: 'Offenbarung',
  Spr: 'Sprüche',
  Pred: 'Prediger',
  Jes: 'Jesaja',
  Jer: 'Jeremia',
  Joel: 'Joel',
  Sirach: 'Jesus Sirach',
  Weisheit: 'Weisheit',
  Klagelieder: 'Klagelieder',
  Hoheslied: 'Hoheslied',
  Josua: 'Josua',
  Apg: 'Apostelgeschichte',
  '1 Kor': '1. Korinther',
  '2 Kor': '2. Korinther',
  '1 Thess': '1. Thessalonicher',
  '1 Tim': '1. Timotheus',
  '2 Tim': '2. Timotheus',
  '1 Petr': '1. Petrus',
  '1 Joh': '1. Johannes',
}

// Kategoriename (Abschnittsüberschrift und Spalte „auch für") → Schlüssel.
const KAT = {
  Dankbarkeit: 'dankbarkeit',
  'Arbeit & Berufung': 'arbeit',
  Arbeit: 'arbeit',
  Familie: 'familie',
  'Angst & Sorge': 'angst',
  Angst: 'angst',
  Gesundheit: 'gesundheit',
  Entscheidungen: 'entscheidungen',
  Geduld: 'geduld',
  'Ehe & Partnerschaft': 'ehe',
  Ehe: 'ehe',
  'Zorn & Vergebung': 'zorn',
  Zorn: 'zorn',
  'Schwierige Menschen': 'schwierige',
  'Reue & Umkehr': 'reue',
  Reue: 'reue',
  Demut: 'demut',
  Finanzen: 'finanzen',
  Reinheit: 'reinheit',
  Glaubenszweifel: 'glaubenszweifel',
  Verstorbene: 'verstorbene',
  // Tags aus „auch für", die keine Themen-Kategorie sind
  Ostern: 'ostern',
  Gottesgebärerin: 'gottesgebaererin',
  Heilige: 'heilige',
  Fastenzeit: 'fastenzeit',
}

// Kennung des liturgischen Verses → liturgische Zeit (aus dem id-Präfix).
const LIT = {
  'lit-fast': 'fastenzeit',
  'lit-kar': 'karwoche',
  'lit-ost': 'ostern',
  'lit-him': 'himmelfahrt',
  'lit-pfi': 'pfingsten',
  'lit-weih': 'weihnachten',
  'lit-theo': 'theophanie',
  'lit-verkl': 'verklaerung',
  'lit-kreuz': 'kreuz',
  'lit-gott': 'gottesgebaererin',
  'lit-heil': 'heilige',
}

function stelleZerlegen(roh) {
  const m = roh.trim().match(/^(\d?\s?[A-Za-zÄÖÜäöü]+)\s+(\d+,[\d–-]+)(?:\s*\((\d+,[\d–-]+)\))?$/)
  if (!m) throw new Error(`Stelle nicht erkannt: „${roh}"`)
  const buch = BUCH[m[1].trim()]
  if (!buch) throw new Error(`Unbekanntes Buch: „${m[1].trim()}" in „${roh}"`)
  return {
    stelle: `${buch} ${m[2]}`,
    // Die masoretische Angabe in Klammern gibt es nur bei den Psalmen.
    stelleMasoretisch: m[3] ? `Psalm ${m[3]}` : null,
  }
}

function kategorienAufloesen(sektion, auchRoh) {
  const schluessel = []
  const sektionKey = KAT[sektion]
  if (sektionKey) schluessel.push(sektionKey)
  const auch = (auchRoh ?? '').trim()
  if (auch && auch !== '—' && auch !== '-') {
    for (const teil of auch.split(',').map((t) => t.trim()).filter(Boolean)) {
      const key = KAT[teil]
      if (!key) throw new Error(`Unbekannte Kategorie „${teil}" (auch für)`)
      if (!schluessel.includes(key)) schluessel.push(key)
    }
  }
  return schluessel
}

const zeilen = readFileSync(join(WURZEL, 'docs/8_Schriftwort_Datenbank.md'), 'utf8').split('\n')

const verse = []
const gesehen = new Set()
let sektion = null

for (const zeile of zeilen) {
  const kopf = zeile.match(/^#\s+\d+\s+·\s+(.+?)\s*$/)
  if (kopf) {
    sektion = kopf[1].trim()
    continue
  }
  if (!zeile.trimStart().startsWith('|')) continue

  const zellen = zeile.split('|').slice(1, -1).map((z) => z.trim())
  if (zellen.length < 3) continue
  if (zellen[0] === 'ID' || zellen.every((z) => /^-*$/.test(z))) continue

  const id = zellen[0].replace(/`/g, '').trim()
  const text = zellen[1].trim()
  const { stelle, stelleMasoretisch } = stelleZerlegen(zellen[2])

  if (gesehen.has(id)) throw new Error(`Doppelte ID: ${id}`)
  gesehen.add(id)

  let kategorien = []
  let liturgisch = null
  if (id.startsWith('lit-')) {
    const praefix = id.replace(/-\d+$/, '')
    liturgisch = LIT[praefix] ?? null
    if (!liturgisch) throw new Error(`Unbekanntes liturgisches Präfix: ${praefix}`)
  } else {
    kategorien = kategorienAufloesen(sektion, zellen[3])
  }

  verse.push({ id, text, stelle, stelleMasoretisch, kategorien, liturgisch })
}

verse.sort((a, b) => a.id.localeCompare(b.id))
writeFileSync(join(WURZEL, 'data/verse.json'), JSON.stringify(verse, null, 2) + '\n', 'utf8')

// --- Zählung --------------------------------------------------------------

const thematisch = verse.filter((v) => v.liturgisch === null).length
const liturgischN = verse.length - thematisch
console.log(`Verse gesamt: ${verse.length}`)
console.log(`  thematisch: ${thematisch}`)
console.log(`  liturgisch: ${liturgischN}`)

// Die Tabellen im Dokument enthalten 226 thematische und 33 liturgische Verse.
// Die Fusszeile des Dokuments nennt 34 liturgische (260 gesamt) — sie zählt um
// eins zu hoch; massgeblich ist der tatsächliche Tabellenbestand.
const ERWARTET = { thematisch: 226, liturgisch: 33 }
if (thematisch !== ERWARTET.thematisch || liturgischN !== ERWARTET.liturgisch) {
  throw new Error(
    `Unerwarteter Bestand: ${thematisch} thematisch / ${liturgischN} liturgisch ` +
      `(erwartet ${ERWARTET.thematisch} / ${ERWARTET.liturgisch}).`,
  )
}
