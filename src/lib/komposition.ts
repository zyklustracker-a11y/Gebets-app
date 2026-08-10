/**
 * Setzt ein Gebet aus seinen Bausteinen zu einem Fliesstext zusammen
 * (Spezifikation, Abschnitt 14). Reine Funktion ohne Datenbank, damit die
 * Übergänge testbar sind.
 *
 * Der Grundkorpus liefert einen vollständigen Text inklusive eigener Fürbitte
 * und Schluss. Ein liturgisches Modul ergänzt oder überschreibt nur:
 *
 *   eroeffnung      ersetzt die gewöhnliche Eröffnung
 *   festeinschub    kommt nach dem Themengebet und vor der Fürbitte
 *   fuerbitteZusatz wird der Fürbitte vorangestellt
 *   schluss         ersetzt abends die Schlussformel
 *
 * Jeder Einschub ist ein eigenständiger Absatz ohne Anschlusswort, damit die
 * Übergänge unsichtbar bleiben und es nicht nach Blöcken klingt.
 */

import { traegersatz } from './themenbezug'
import type { Modul, Tageszeit } from './types'

const STANDARD_EROEFFNUNG = 'Im Namen des Vaters, des Sohnes und des Heiligen Geistes.'

const TAGESZEIT_LABEL: Record<Tageszeit, string> = {
  morgen: 'Morgengebet',
  mittag: 'Mittagsgebet',
  abend: 'Abendgebet',
}

// Ab hier gehört der Rest des Grundtextes zur Fürbitte und zur Schlussformel;
// Einschübe kommen davor. Deckt auch den kurzen Mittagsschluss ab
// („Herr Jesus Christus, Sohn Gottes …").
const GRENZE = /^(Heilige Gottesgebärerin|Heiliger Schutzengel|Allheilige Gottesgebärerin|Himmlischer König|Herr Jesus Christus)/

// Nur die abendliche Schlussformel wird überschrieben.
const SCHLUSS = /^Herr Jesus Christus, unser Gott/

export interface Zusammensetzung {
  tageszeitLabel: string
  eroeffnung: string
  vers: string
  stelle: string
  absaetze: string[]
}

export interface KompositionEingabe {
  korpustext: string
  vers: string
  stelle: string
  tageszeit: Tageszeit
  modul: Modul | null
  /** Titel eines eigenen Themas für `{{anliegen}}`, sonst null. */
  eigenesTitel: string | null
  /** Kategorie des eigenen Themas — bestimmt die Wendung des Trägersatzes. */
  eigenesKategorie?: string | null
  /** Name des Heiligen für `{{heiliger}}` in generischen Modulen, sonst null. */
  heiligerName: string | null
  /** Aktive Gedenknamen für die Fürbitte (Lebende), sonst leer. */
  lebende?: string[]
  /** Aktive Gedenknamen für die Fürbitte (Entschlafene), sonst leer. */
  entschlafene?: string[]
}

/** Fügt Namen zu einer deutschen Aufzählung: „A", „A und B", „A, B und C". */
function nennung(namen: string[]): string {
  if (namen.length <= 1) return namen[0] ?? ''
  return `${namen.slice(0, -1).join(', ')} und ${namen[namen.length - 1]}`
}

/**
 * Die Fürbitte um die Gedenkliste. Jeder Teil ist ein eigenständiger Absatz
 * ohne Anschlusswort, damit er sich unbemerkt in die Fürbitte fügt.
 */
function gedenkAbsaetze(lebende: string[], entschlafene: string[]): string[] {
  const absaetze: string[] = []
  if (lebende.length > 0) {
    absaetze.push(`Gedenke, o Herr, ${nennung(lebende)} und behüte sie auf allen ihren Wegen.`)
  }
  if (entschlafene.length > 0) {
    absaetze.push(`Gib den entschlafenen ${nennung(entschlafene)} Ruhe, o Herr, wo Dein Licht leuchtet.`)
  }
  return absaetze
}

/**
 * Setzt das Anliegen ein — oder entfernt den Trägersatz, wenn keines vorliegt.
 *
 * Ersetzt wird die *ganze Zeile* mit dem Platzhalter, nicht nur der Platzhalter
 * selbst. Früher wurde der Titel roh in den vorgefundenen Satz gesetzt, und
 * dessen Rektion passte dann nicht mehr („… ich bitte Dich um Angst vor der
 * Zukunft"). Jetzt liefert `traegersatz` einen kasusneutralen Satz in
 * Doppelpunktform, und wie der Satz im Grundgebet einmal lautete, ist gleich.
 */
function anliegenEinsetzen(
  text: string,
  titel: string | null,
  kategorie: string | null,
  tageszeit: Tageszeit,
): string {
  const satz = titel ? traegersatz(titel, kategorie, tageszeit) : null
  return text
    .split('\n')
    .flatMap((zeile) => {
      if (!zeile.includes('{{anliegen}}')) return [zeile]
      return satz ? [satz] : []
    })
    .join('\n')
}

/** Füllt `{{heiliger}}` oder verwirft den Baustein, wenn kein Name da ist. */
function heiligerEinsetzen(text: string | null, name: string | null): string | null {
  if (!text) return null
  if (!text.includes('{{heiliger}}')) return text
  return name ? text.split('{{heiliger}}').join(name) : null
}

export function zusammensetzen(eingabe: KompositionEingabe): Zusammensetzung {
  const { korpustext, vers, stelle, tageszeit, modul, eigenesTitel, heiligerName } = eingabe

  const zeilen = anliegenEinsetzen(korpustext, eigenesTitel, eingabe.eigenesKategorie ?? null, tageszeit)
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean)

  // Grenze zwischen Themengebet und Fürbitte/Schluss finden.
  let grenze = zeilen.findIndex((z) => GRENZE.test(z))
  if (grenze === -1) grenze = zeilen.length

  const kopf = zeilen.slice(0, grenze)
  const schwanz = zeilen.slice(grenze)

  // Gedenkliste in die Fürbitte einweben — an derselben Stelle, an der die
  // allgemeine Fürbitte steht, also unmittelbar vor der Schlussformel. Nicht
  // mittags: dort bleibt das Gebet bewusst kurz (wie der Fürbitte-Zusatz).
  const lebende = eingabe.lebende ?? []
  const entschlafene = eingabe.entschlafene ?? []
  if (tageszeit !== 'mittag' && (lebende.length > 0 || entschlafene.length > 0)) {
    let ziel = schwanz.findIndex((z) => SCHLUSS.test(z))
    if (ziel === -1) ziel = schwanz.length
    schwanz.splice(ziel, 0, ...gedenkAbsaetze(lebende, entschlafene))
  }

  // Schluss abends überschreiben.
  if (tageszeit === 'abend' && modul?.schluss) {
    let ci = -1
    for (let i = 0; i < schwanz.length; i++) if (SCHLUSS.test(schwanz[i]!)) ci = i
    if (ci >= 0) schwanz[ci] = modul.schluss
    else schwanz.push(modul.schluss)
  }

  const einschub = heiligerEinsetzen(modul?.einschub[tageszeit] ?? null, heiligerName)
  // Der Fürbitte-Zusatz gehört zur Fürbitte — die gibt es nur morgens und
  // abends. Das Mittagsgebet bleibt bewusst kurz.
  const zusatz = tageszeit === 'mittag' ? null : heiligerEinsetzen(modul?.fuerbitteZusatz ?? null, heiligerName)

  const absaetze = [
    ...kopf,
    ...(einschub ? [einschub] : []),
    ...(zusatz ? [zusatz] : []),
    ...schwanz,
  ]

  return {
    tageszeitLabel: TAGESZEIT_LABEL[tageszeit],
    eroeffnung: modul?.eroeffnung ?? STANDARD_EROEFFNUNG,
    vers,
    stelle,
    absaetze,
  }
}
