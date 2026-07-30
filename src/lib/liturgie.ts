/**
 * Liturgische Zusammensetzung (Spezifikation, Abschnitt 14): Auswahl des einen
 * Moduls, das an einem Tag greift.
 *
 * Die Regel ist der heikle Teil: An einem Tag können mehrere Module in Frage
 * kommen (etwa ein Seelensamstag mitten in der Grossen Fastenzeit). Angewendet
 * wird immer nur **eines** — das mit dem niedrigsten Prioritätswert.
 *
 * Reines TypeScript, keine Datenbank — damit vollständig testbar.
 */

import moduleDaten from '../../data/module.json'
import { festModulId, istFastenfreieWoche, orthodoxeOstern } from './kalender'
import type { Modul } from './types'

const module = moduleDaten as unknown as Modul[]
const nachId = new Map(module.map((m) => [m.id, m]))

const MS_PRO_TAG = 86_400_000

export function modulNachId(id: string): Modul | undefined {
  return nachId.get(id)
}

function utcTag(datum: Date): Date {
  return new Date(Date.UTC(datum.getUTCFullYear(), datum.getUTCMonth(), datum.getUTCDate()))
}

// Feste Fastenzeiten mit gregorianischen Grenzen (Spezifikation, Abschnitt 5).
function inWeihnachtsfasten(m: number, t: number): boolean {
  return (m === 11 && t >= 28) || m === 12 || (m === 1 && t <= 6)
}
function inMarienfasten(m: number, t: number): boolean {
  return m === 8 && t >= 14 && t <= 27
}

/**
 * Sammelt alle Modulkennungen, die an einem Tag in Frage kommen. Die
 * Prioritätsregel entscheidet danach; hier wird nur eingesammelt.
 */
function kandidaten(datum: Date): string[] {
  const tag = utcTag(datum)
  const jahr = tag.getUTCFullYear()
  const ostern = orthodoxeOstern(jahr)
  const versatz = Math.round((tag.getTime() - ostern.getTime()) / MS_PRO_TAG)
  const wochentag = tag.getUTCDay() // 0 So, 3 Mi, 5 Fr, 6 Sa
  const monat = tag.getUTCMonth() + 1
  const tagImMonat = tag.getUTCDate()

  const ids: string[] = []

  // Osterkreis (aus dem Osterabstand desselben Jahres)
  if (versatz === -7) ids.push('fest-einzug-jerusalem')
  if (versatz >= -48 && versatz <= -1) ids.push('grosse-fastenzeit')
  if (versatz >= -6 && versatz <= -1) ids.push('karwoche')
  if (versatz >= 0 && versatz <= 6) ids.push('ostern-lichte-woche')
  if (versatz === 9) ids.push('radonitsa')
  if (versatz >= 7 && versatz <= 38) ids.push('osterzeit')
  if (versatz === 39) ids.push('himmelfahrt')
  if (versatz >= 49 && versatz <= 55) ids.push('pfingsten')
  if (versatz === 56) ids.push('allerheiligen')
  // Seelensamstage: Fleischfare, 2./3./4. Fastensamstag, Dreifaltigkeitssamstag
  if ([-57, -36, -29, -22, 48].includes(versatz)) ids.push('seelensamstag')

  // Feste Fastenzeiten
  if (inWeihnachtsfasten(monat, tagImMonat)) ids.push('weihnachtsfasten')
  if (inMarienfasten(monat, tagImMonat)) ids.push('marienfasten')
  const apostelEnde = Date.UTC(jahr, 6, 11) // 11. Juli
  if (tag.getTime() >= ostern.getTime() + 57 * MS_PRO_TAG && tag.getTime() <= apostelEnde) {
    ids.push('apostelfasten')
  }

  // Feste Fest- und Heiligentage aus dem Kalender
  const fest = festModulId(tag)
  if (fest) ids.push(fest)

  // Neumärtyrer: Sonntag um den 7. Februar (Fenster 4.–10. Februar)
  if (wochentag === 0 && monat === 2 && tagImMonat >= 4 && tagImMonat <= 10) ids.push('neumaertyrer')

  // Wochentagsmodule
  if (wochentag === 0) ids.push('sonntag')
  if ((wochentag === 3 || wochentag === 5) && !istFastenfreieWoche(tag)) ids.push('mittwoch-freitag')

  return ids
}

/**
 * Das an einem Tag anzuwendende Modul oder `null`. Bei mehreren Kandidaten
 * gewinnt der niedrigste Prioritätswert; es wird immer nur eines angewendet.
 */
export function modulFuer(datum: Date): Modul | null {
  let gewaehlt: Modul | null = null
  for (const id of kandidaten(datum)) {
    const modul = nachId.get(id)
    if (!modul) continue
    if (!gewaehlt || modul.prioritaet < gewaehlt.prioritaet) gewaehlt = modul
  }
  return gewaehlt
}
