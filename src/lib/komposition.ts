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

import type { Modul, Tageszeit } from './types'

const STANDARD_EROEFFNUNG = 'Im Namen des Vaters, des Sohnes und des Heiligen Geistes.'

const TAGESZEIT_LABEL: Record<Tageszeit, string> = {
  morgen: 'Morgengebet',
  mittag: 'Mittagsgebet',
  abend: 'Abendgebet',
}

// Wo im Grundtext die Fürbitte beginnt und wo die Schlussformel steht.
const FUERBITTE = /^(Heilige Gottesgebärerin|Heiliger Schutzengel|Allheilige Gottesgebärerin|Himmlischer König)/
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
  /** Name des Heiligen für `{{heiliger}}` in generischen Modulen, sonst null. */
  heiligerName: string | null
}

/** Ersetzt `{{anliegen}}` oder entfernt den ganzen Trägersatz (eigene Zeile). */
function anliegenEinsetzen(text: string, titel: string | null): string {
  if (titel) return text.split('{{anliegen}}').join(titel)
  return text
    .split('\n')
    .filter((zeile) => !zeile.includes('{{anliegen}}'))
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

  const zeilen = anliegenEinsetzen(korpustext, eigenesTitel)
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean)

  // Grenze zwischen Themengebet und Fürbitte finden.
  let grenze = zeilen.findIndex((z) => FUERBITTE.test(z))
  if (grenze === -1) grenze = zeilen.findIndex((z) => SCHLUSS.test(z))
  if (grenze === -1) grenze = zeilen.length

  const kopf = zeilen.slice(0, grenze)
  const schwanz = zeilen.slice(grenze)

  // Schluss abends überschreiben.
  if (tageszeit === 'abend' && modul?.schluss) {
    let ci = -1
    for (let i = 0; i < schwanz.length; i++) if (SCHLUSS.test(schwanz[i]!)) ci = i
    if (ci >= 0) schwanz[ci] = modul.schluss
    else schwanz.push(modul.schluss)
  }

  const einschub = heiligerEinsetzen(modul?.einschub[tageszeit] ?? null, heiligerName)
  const zusatz = heiligerEinsetzen(modul?.fuerbitteZusatz ?? null, heiligerName)

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
