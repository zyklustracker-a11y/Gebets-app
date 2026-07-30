/**
 * Baut `data/module.json` aus `docs/7_Liturgische_Module.md`.
 *
 * Das Dokument ist Prosa; dieses Skript kennt die Struktur je Teil und
 * überführt sie in die anwendbaren Module (Teil H). Eröffnung, die drei
 * Einschübe, Fürbitte-Zusatz, Schluss und Priorität kommen aus dem Dokument;
 * die Zuordnung von Kennung, Typ und Prioritätswert liegt in der Tabelle unten.
 *
 * Nicht als eigenes Modul ausgegeben:
 *   A1, A3  — gewöhnliche Vorgabe ohne Einschub
 *   A2, A4  — liefern nur Eröffnung/Schluss bzw. das Ephräm-Gebet und werden in
 *             die Oster- und Fastenmodule eingearbeitet
 *   D9, D10 — verweisen auf C3 (Himmelfahrt) und C4 (Pfingsten)
 *
 * Ausführen mit  `npm run module`.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const STANDARD_EROEFFNUNG = 'Im Namen des Vaters, des Sohnes und des Heiligen Geistes.'

// Kennung, Typ und Priorität je Dokumentcode (Teil H). Niedrigster Wert gewinnt.
const ANGEWENDET = {
  B1: ['grosse-fastenzeit', 'fastenzeit', 30, 'ephraem'],
  B2: ['karwoche', 'osterkreis', 10],
  B3: ['weihnachtsfasten', 'fastenzeit', 30],
  B4: ['apostelfasten', 'fastenzeit', 30],
  B5: ['marienfasten', 'fastenzeit', 30],
  B6: ['mittwoch-freitag', 'wochentag', 70],
  C1: ['ostern-lichte-woche', 'osterkreis', 10],
  C2: ['osterzeit', 'osterkreis', 30],
  C3: ['himmelfahrt', 'fest', 20],
  C4: ['pfingsten', 'fest', 20],
  D1: ['fest-geburt-gottesgebaererin', 'fest', 20],
  D2: ['fest-kreuzerhoehung', 'fest', 20],
  D3: ['fest-einfuehrung-tempel', 'fest', 20],
  D4: ['fest-geburt-christi', 'fest', 20],
  D5: ['fest-theophanie', 'fest', 20],
  D6: ['fest-begegnung', 'fest', 20],
  D7: ['fest-verkuendigung', 'fest', 20],
  D8: ['fest-einzug-jerusalem', 'fest', 20],
  D11: ['fest-verklaerung', 'fest', 20],
  D12: ['fest-entschlafung', 'fest', 20],
  E1: ['fest-pokrov', 'fest', 40],
  E2: ['heiliger-nikolaus', 'heiliger', 40],
  E3: ['heiliger-serafim', 'heiliger', 40],
  E4: ['heiliger-sergius', 'heiliger', 40],
  E5: ['heilige-matrona', 'heiliger', 40],
  E6: ['fest-petrus-paulus', 'fest', 40],
  E7: ['fest-geburt-johannes', 'fest', 40],
  E8: ['fest-enthauptung-johannes', 'fest', 40],
  E9: ['ikone-kasan', 'fest', 40],
  E10: ['neumaertyrer', 'fest', 40],
  E11: ['allerheiligen', 'fest', 40],
  F1: ['seelensamstag', 'gedenken', 45],
  F2: ['radonitsa', 'gedenken', 45],
  G1: ['heiligengedenken', 'heiliger', 50],
  G2: ['namenstag', 'heiliger', 50],
  G3: ['sonntag', 'wochentag', 60],
}

const zeilen = readFileSync(join(WURZEL, 'docs/7_Liturgische_Module.md'), 'utf8').split('\n')

// --- Dokument in Blöcke je `## Code · …` zerlegen -------------------------

const bloecke = new Map()
for (let i = 0; i < zeilen.length; i++) {
  const kopf = zeilen[i].match(/^##\s+([A-G]\d+)\s+·/)
  if (!kopf) continue
  const code = kopf[1]
  const koerper = []
  let j = i + 1
  for (; j < zeilen.length; j++) {
    const l = zeilen[j]
    if (/^##?\s/.test(l) || l.trim().startsWith('---')) break
    koerper.push(l)
  }
  bloecke.set(code, koerper)
  i = j - 1
}

// --- Ein Block in Felder zerlegen ----------------------------------------

function saeubern(text) {
  const t = text.replace(/\*\*/g, '').trim()
  return t === '(keiner)' || t === '' ? null : t
}

function sammleFolgend(koerper, start) {
  const out = []
  let i = start + 1
  for (; i < koerper.length; i++) {
    const l = koerper[i].trim()
    if (l === '') break
    if (l.startsWith('**')) {
      i--
      break
    }
    if (l.startsWith('>')) continue
    if (l.startsWith('*') && l.endsWith('*')) continue
    out.push(l)
  }
  return [out.join(' '), i]
}

function blockLesen(koerper) {
  const felder = {}
  let fuehrend = null

  for (let i = 0; i < koerper.length; i++) {
    const l = koerper[i].trim()
    if (l === '' || l.startsWith('>')) continue

    // Inline-Label mit Doppelpunkt: **Eröffnung:** …
    let m = l.match(/^\*\*(Eröffnung|Schluss Abend|Fürbitte-Zusatz):\*\*\s*(.*)$/)
    if (m) {
      let wert = m[2].trim()
      if (!wert) [wert, i] = sammleFolgend(koerper, i)
      felder[m[1]] = saeubern(wert)
      continue
    }

    // Block-Label ohne Doppelpunkt: **Einschub Morgen**
    m = l.match(/^\*\*(Einschub Morgen|Einschub Mittag|Einschub Abend|Eröffnung|Fürbitte-Zusatz)\*\*$/)
    if (m) {
      let wert
      ;[wert, i] = sammleFolgend(koerper, i)
      felder[m[1]] = saeubern(wert)
      continue
    }

    // Kursive Notiz oder Auslöser-Zeile überspringen.
    if (l.startsWith('*')) continue

    // Sonst: der führende Absatz (Einschub der Feste in Teil D und E).
    if (fuehrend === null) fuehrend = saeubern(l)
  }

  return { felder, fuehrend }
}

// --- Verweise (siehe A2) auflösen ----------------------------------------

const a2 = blockLesen(bloecke.get('A2') ?? [])
const A2_EROEFFNUNG = a2.felder['Eröffnung']
const A2_SCHLUSS = a2.felder['Schluss Abend']

function eroeffnungAufloesen(wert) {
  if (!wert) return null
  if (/^siehe A2/.test(wert)) return A2_EROEFFNUNG
  return wert === STANDARD_EROEFFNUNG ? null : wert
}
function schlussAufloesen(wert) {
  if (!wert) return null
  return /^siehe A2/.test(wert) ? A2_SCHLUSS : wert
}

// --- Module bauen ---------------------------------------------------------

const module = []
for (const [code, [id, typ, prioritaet, zusatzgebet]] of Object.entries(ANGEWENDET)) {
  const roh = bloecke.get(code)
  if (!roh) throw new Error(`Block ${code} fehlt in docs/7`)
  const { felder, fuehrend } = blockLesen(roh)

  const einschub = {
    morgen: felder['Einschub Morgen'] ?? fuehrend ?? null,
    mittag: felder['Einschub Mittag'] ?? fuehrend ?? null,
    abend: felder['Einschub Abend'] ?? fuehrend ?? null,
  }

  module.push({
    id,
    typ,
    prioritaet,
    eroeffnung: eroeffnungAufloesen(felder['Eröffnung']),
    einschub,
    fuerbitteZusatz: felder['Fürbitte-Zusatz'] ?? null,
    schluss: schlussAufloesen(felder['Schluss Abend']),
    zusatzgebet: zusatzgebet ?? null,
  })
}

module.sort((a, b) => (a.prioritaet !== b.prioritaet ? a.prioritaet - b.prioritaet : a.id.localeCompare(b.id)))
writeFileSync(join(WURZEL, 'data/module.json'), JSON.stringify(module, null, 2) + '\n', 'utf8')

// --- Prüfung --------------------------------------------------------------

const nachId = new Map(module.map((m) => [m.id, m]))

// Jedes Modul mit Einschub braucht wenigstens den Morgen-Einschub.
for (const m of module) {
  const hatText = m.einschub.morgen || m.einschub.mittag || m.einschub.abend || m.eroeffnung
  if (!hatText) throw new Error(`Modul ${m.id} hat keinen Text`)
}

// Alle modulId aus heilige.json müssen ein Modul haben.
const heilige = JSON.parse(readFileSync(join(WURZEL, 'data/heilige.json'), 'utf8'))
const fehlend = [...new Set(heilige.map((h) => h.modulId).filter(Boolean))].filter((id) => !nachId.has(id))
if (fehlend.length) throw new Error(`Kein Modul für heilige.json-Verweise: ${fehlend.join(', ')}`)

const nachTyp = {}
for (const m of module) nachTyp[m.typ] = (nachTyp[m.typ] ?? 0) + 1

console.log(`Module gesamt: ${module.length}`)
console.log('Nach Typ:', nachTyp)
console.log('\nnach Priorität:')
for (const m of module) {
  console.log(`  ${String(m.prioritaet).padStart(2)}  ${m.id.padEnd(30)} ${m.typ}`)
}
console.log('\nAlle heilige.json-Verweise haben ein Modul.')
