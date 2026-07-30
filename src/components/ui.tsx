/**
 * Geteilte Bausteine aus dem Design-Entwurf `design/Gebet.dc.html`.
 *
 * Farben und Masse stammen unverändert aus dem Entwurf. Statt der dortigen
 * Telefonattrappe (fester Rahmen, Statusleiste „9:41", Home-Indikator) nutzt die
 * echte App die volle Fläche und die Safe-Area-Abstände des Geräts.
 */

import type { CSSProperties, ReactNode } from 'react'

/** Seitlicher Rand der Bildschirme, wie im Entwurf. */
export const RAND = 30

export const SERIF = "'EB Garamond', Georgia, serif"

/** Grundgerüst eines Bildschirms: volle Höhe, zentriert, in den Designfarben. */
export const bildschirm: CSSProperties = {
  width: '100%',
  maxWidth: 393,
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)',
  color: 'var(--ink)',
}

/** Abstand oben statt der Statusleiste des Entwurfs. */
export const obenSafe = 'max(env(safe-area-inset-top), 20px)'

/** Abstand unten statt des Home-Indikators des Entwurfs. */
export const untenSafe = 'max(env(safe-area-inset-bottom), 20px)'

/** Feine Trennlinie zwischen Listenzeilen. */
export function Linie() {
  return <div style={{ height: 1, background: 'var(--rule)' }} />
}

/** Kleine Überschrift über einer Liste (Versalien, gesperrt). */
export function Ueberschrift({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--faint)',
      }}
    >
      {children}
    </div>
  )
}

/** Das orthodoxe Kreuz mit drei Balken — das einzige Ornament der App. */
export function Kreuz() {
  const balken = 'var(--gold)'
  return (
    <span style={{ width: 22, height: 30, position: 'relative', display: 'block' }} aria-hidden>
      <span style={{ position: 'absolute', left: 10, top: 2, width: 1.5, height: 26, background: balken }} />
      <span style={{ position: 'absolute', left: 6.5, top: 6, width: 9, height: 1.5, background: balken }} />
      <span style={{ position: 'absolute', left: 2, top: 12, width: 18, height: 1.5, background: balken }} />
      <span
        style={{ position: 'absolute', left: 4, top: 21, width: 14, height: 1.5, background: balken, transform: 'rotate(18deg)' }}
      />
    </span>
  )
}

/** Der kleine Haken neben einer bereits gebeteten Zeit. */
export function Haken() {
  return (
    <span style={{ width: 14, height: 9, position: 'relative', display: 'block' }} aria-hidden>
      <span style={{ position: 'absolute', left: 0, top: 4, width: 6, height: 1.5, background: 'var(--gold)', transform: 'rotate(45deg)' }} />
      <span style={{ position: 'absolute', left: 4, top: 3, width: 11, height: 1.5, background: 'var(--gold)', transform: 'rotate(-45deg)' }} />
    </span>
  )
}

/** Ein ruhiges Zahnrad — die einzige Navigationsmarke, oben auf „Heute". */
export function Zahnrad() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

/** Ein Zurück-Winkel für die Kopfzeilen von Themen und Einstellungen. */
export function ZurueckWinkel() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

/** Ein Schalter, wie in den Einstellungen. */
export function Schalter({ an, beschriftung }: { an: boolean; beschriftung?: string }) {
  return (
    <div
      role="switch"
      aria-checked={an}
      aria-label={beschriftung}
      style={{
        width: 46,
        height: 26,
        borderRadius: 7,
        background: an ? 'var(--red)' : 'var(--field)',
        border: an ? 'none' : '1px solid var(--rule)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: an ? 'flex-end' : 'flex-start',
        padding: '0 4px',
        flex: 'none',
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 5, background: an ? 'var(--on-red)' : 'var(--rule)' }} />
    </div>
  )
}
