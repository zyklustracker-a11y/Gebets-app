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

/** Ein schlichter Papierkorb — die sichtbare Löschmöglichkeit in Listen. */
export function Papierkorb() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.5 6h17M9 6V3.8h6V6M6.5 6l.9 14.2h9.2L17.5 6M10.2 10.4v6M13.8 10.4v6" />
    </svg>
  )
}

/**
 * Die Perlenschnur des Zählers — ein Punkt je Wiederholung, wie die Knoten
 * einer Tschotki. Geteilt zwischen Jesusgebet und eigenen Gebeten.
 */
export function Perlen({ anzahl, gefuellt }: { anzahl: number; gefuellt: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 11, maxWidth: 220 }}>
      {Array.from({ length: anzahl }, (_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: i < gefuellt ? 'var(--red)' : 'var(--rule)',
          }}
        />
      ))}
    </div>
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

/**
 * Eine kleine Liste — der Knopf neben einer Gebetszeit auf „Heute", mit dem
 * sich für diesen einen Durchgang ein Thema wählen lässt.
 */
export function Liste() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
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

/**
 * Ein ruhiges Blatt, das von unten über den Bildschirm legt — für die Frage
 * beim Abschliessen eines Anliegens. Ein Tippen daneben schliesst es.
 */
export function Overlay({ children, onSchliessen }: { children: ReactNode; onSchliessen: () => void }) {
  return (
    <div
      onClick={onSchliessen}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.32)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 14,
        paddingBottom: `max(env(safe-area-inset-bottom), 14px)`,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 365,
          background: 'var(--bg)',
          border: '1px solid var(--edge)',
          borderRadius: 14,
          padding: 22,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.24)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Die Rückfrage vor einer nicht umkehrbaren Handlung — ein Blatt wie das
 * Abschluss-Overlay, damit Löschen nie versehentlich geschieht.
 */
export function Bestaetigung({
  frage,
  hinweis,
  knopf = 'Löschen',
  bestaetigen,
  abbrechen,
}: {
  frage: string
  hinweis?: string
  knopf?: string
  bestaetigen: () => void
  abbrechen: () => void
}) {
  return (
    <Overlay onSchliessen={abbrechen}>
      <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.4 }}>{frage}</div>
      {hinweis && (
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{hinweis}</div>
      )}
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Knopf onClick={bestaetigen}>{knopf}</Knopf>
        <button
          onClick={abbrechen}
          style={{ fontSize: 15, color: 'var(--muted)', padding: '0 6px', flex: 'none' }}
        >
          Abbrechen
        </button>
      </div>
    </Overlay>
  )
}

/** Ein mehrzeiliges Eingabefeld im Ton der App (Serif, ruhige Linie). */
export function Textfeld(props: {
  wert: string
  aendern: (wert: string) => void
  platzhalter?: string
  autoFocus?: boolean
}) {
  return (
    <textarea
      autoFocus={props.autoFocus}
      value={props.wert}
      onChange={(e) => props.aendern(e.target.value)}
      placeholder={props.platzhalter}
      rows={3}
      className="sx"
      style={{
        width: '100%',
        resize: 'none',
        font: 'inherit',
        fontFamily: SERIF,
        fontSize: 19,
        lineHeight: 1.6,
        color: 'var(--ink)',
        background: 'var(--field)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        padding: '12px 14px',
        outline: 'none',
      }}
    />
  )
}

/** Die rote Haupthandlung (wie „Gebetet"). */
export function Knopf({ children, onClick, gedaempft }: { children: ReactNode; onClick: () => void; gedaempft?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        height: 50,
        borderRadius: 10,
        background: gedaempft ? 'transparent' : 'var(--red)',
        color: gedaempft ? 'var(--muted)' : 'var(--on-red)',
        border: gedaempft ? '1px solid var(--rule)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 500,
      }}
    >
      {children}
    </button>
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
