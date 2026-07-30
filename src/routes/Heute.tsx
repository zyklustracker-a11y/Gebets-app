import { useNavigate } from 'react-router-dom'

import { Haken, Kreuz, Linie, RAND, SERIF, bildschirm, obenSafe, untenSafe } from '../components/ui'
import type { Tageszeit } from '../lib/types'

/**
 * Bildschirm 1 · Heute — Tagesübersicht mit den drei Gebetszeiten.
 * Fest verdrahtete Beispieldaten (Bauabschnitt 3); die echten Daten kommen in
 * Bauabschnitt 4.
 */

interface Zeile {
  typ: Tageszeit
  titel: string
  uhrzeit: string
  gebetet: boolean
  jetzt: boolean
}

const ZEILEN: Zeile[] = [
  { typ: 'morgen', titel: 'Morgen', uhrzeit: '7:00', gebetet: true, jetzt: false },
  { typ: 'mittag', titel: 'Mittag', uhrzeit: '12:30', gebetet: false, jetzt: true },
  { typ: 'abend', titel: 'Abend', uhrzeit: '21:00', gebetet: false, jetzt: false },
]

export default function Heute() {
  const navigate = useNavigate()

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ flex: 1, padding: `26px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 30 }}>
          <Kreuz />
        </div>

        <div style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1.3 }}>
          Donnerstag,
          <br />
          30. Juli 2026
        </div>
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Hl. Apostel Silas
          <br />
          Achte Woche nach Pfingsten
        </div>

        <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {ZEILEN.map((zeile) => (
            <div key={zeile.typ} style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                onClick={() => navigate(`/gebet/${zeile.typ}`)}
                style={{
                  minHeight: zeile.jetzt ? 88 : 72,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: zeile.jetzt ? undefined : 'var(--muted)',
                  background: zeile.jetzt ? 'var(--field)' : undefined,
                  borderRadius: zeile.jetzt ? 10 : undefined,
                  padding: zeile.jetzt ? '0 18px' : undefined,
                  margin: zeile.jetzt ? '0 -18px' : undefined,
                  width: zeile.jetzt ? 'calc(100% + 36px)' : '100%',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontSize: zeile.jetzt ? 23 : 21,
                      color: zeile.jetzt ? 'var(--ink)' : undefined,
                    }}
                  >
                    {zeile.titel}
                  </div>
                  {zeile.jetzt && <div style={{ marginTop: 5, fontSize: 13, color: 'var(--red-text)' }}>Jetzt beten</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, color: 'var(--muted)' }}>
                  <span>{zeile.uhrzeit}</span>
                  {zeile.gebetet && <Haken />}
                </div>
              </button>
              <Linie />
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: untenSafe, fontSize: 13, color: 'var(--faint)' }}>Drei Themen sind aktiv</div>
      </div>
    </div>
  )
}
