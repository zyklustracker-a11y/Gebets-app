/**
 * Reine Logik für die Benachrichtigungen — geteilt zwischen dem Cloudflare
 * Worker und den Tests. Kein DOM, keine Cloudflare-Typen.
 *
 * Zwei Grundsätze:
 *
 * 1. Zeitzone über `Intl`, niemals mit festen Offsets. Der Cron läuft in UTC,
 *    die Uhrzeiten des Nutzers sind Ortszeit Europe/Zurich mit Sommerzeit.
 * 2. Der Benachrichtigungstext enthält niemals Themen, Namen oder Journal —
 *    nur einen allgemeinen Ruf aus dieser Liste.
 */

import type { Tageszeit } from './types'

export interface AboZeit {
  typ: Tageszeit
  /** "07:00" — Ortszeit Europe/Zurich. */
  uhrzeit: string
}

/** Allgemeine Rufe — schlicht, ohne jede persönliche Angabe. */
export const RUFE: readonly string[] = [
  'Kommt, lasst uns anbeten.',
  'Herr, öffne meine Lippen.',
  'Ein Augenblick der Stille.',
  'Der Herr ist nahe.',
  'Sei still und erkenne, dass Er Gott ist.',
  'Es ist Zeit, sich Gott zuzuwenden.',
  'Komm zur Ruhe vor Gott.',
  'Halte einen Augenblick inne.',
]

const TITEL: Record<Tageszeit, string> = {
  morgen: 'Morgengebet',
  mittag: 'Mittagsgebet',
  abend: 'Abendgebet',
}

export function titelFuer(tageszeit: Tageszeit): string {
  return TITEL[tageszeit]
}

/** Deterministischer Ruf pro (Datum, Tageszeit) — stabil über Cron-Wiederholungen. */
export function rufFuer(datum: string, tageszeit: Tageszeit): string {
  const schluessel = `${datum}-${tageszeit}`
  let h = 2166136261
  for (let i = 0; i < schluessel.length; i++) {
    h ^= schluessel.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return RUFE[Math.abs(h) % RUFE.length] ?? RUFE[0]!
}

/** Aktuelle Ortszeit Europe/Zurich als "HH:MM" — mit Sommerzeit über Intl. */
export function zuercherZeit(zeitpunkt: Date): string {
  const teile = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(zeitpunkt)
  const h = teile.find((t) => t.type === 'hour')?.value ?? '00'
  const m = teile.find((t) => t.type === 'minute')?.value ?? '00'
  // hour12:false liefert Mitternacht in manchen Umgebungen als "24".
  const hh = (h === '24' ? '00' : h).padStart(2, '0')
  return `${hh}:${m.padStart(2, '0')}`
}

/** Aktuelles Ortsdatum Europe/Zurich als "YYYY-MM-DD" — für Dedup und Merker. */
export function zuercherDatum(zeitpunkt: Date): string {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(zeitpunkt)
  const j = teile.find((t) => t.type === 'year')?.value ?? '0000'
  const mo = teile.find((t) => t.type === 'month')?.value ?? '01'
  const t = teile.find((t) => t.type === 'day')?.value ?? '01'
  return `${j}-${mo}-${t}`
}

function inMinuten(hhmm: string): number {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

/**
 * Welche Gebetszeiten jetzt fällig sind: deren Uhrzeit erreicht ist, aber
 * höchstens `fensterMinuten` her, und die heute noch nicht gesendet wurden.
 *
 * Das Fenster verhindert, dass ein Abo, das nachmittags angelegt wird, noch die
 * längst vergangene Morgenzeit auslöst. Der Vergleich läuft rein auf den bereits
 * nach Ortszeit umgerechneten "HH:MM"-Werten — ohne Offset-Arithmetik.
 */
export function faellige(
  zeiten: AboZeit[],
  jetzt: string,
  bereitsGesendet: ReadonlySet<Tageszeit>,
  fensterMinuten = 60,
): AboZeit[] {
  const j = inMinuten(jetzt)
  return zeiten.filter((z) => {
    const diff = j - inMinuten(z.uhrzeit)
    return diff >= 0 && diff < fensterMinuten && !bereitsGesendet.has(z.typ)
  })
}
