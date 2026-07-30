import type { ReactNode } from 'react'

import { Linie, RAND, SERIF, Schalter, Ueberschrift, bildschirm, obenSafe, untenSafe } from '../components/ui'

/**
 * Bildschirm 6 · Einstellungen — Gebetszeiten, Jesusgebet, Darstellung,
 * Anmeldung. Fest verdrahtete Beispieldaten; die Schalter werden in
 * Bauabschnitt 4 (und die Anmeldung in Bauabschnitt 9) lebendig.
 */

const GEBETSZEITEN = [
  { titel: 'Morgen', uhrzeit: '7:00', an: true },
  { titel: 'Mittag', uhrzeit: '12:30', an: true },
  { titel: 'Abend', uhrzeit: '21:00', an: false },
]

const WIEDERHOLUNGEN = [12, 33, 100]
const GEWAEHLTE_ANZAHL = 12

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <>
      <div style={{ marginTop: 34 }}>
        <Ueberschrift>{titel}</Ueberschrift>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <Linie />
        {children}
      </div>
    </>
  )
}

export default function Einstellungen() {
  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ flex: 1, padding: `22px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Einstellungen</div>

        <Abschnitt titel="Gebetszeiten">
          {GEBETSZEITEN.map((zeit) => (
            <div key={zeit.titel} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 20 }}>{zeit.titel}</span>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>{zeit.uhrzeit}</span>
                </div>
                <Schalter an={zeit.an} beschriftung={`${zeit.titel} benachrichtigen`} />
              </div>
              <Linie />
            </div>
          ))}
        </Abschnitt>

        <Abschnitt titel="Jesusgebet">
          <div style={{ minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ fontFamily: SERIF, fontSize: 20 }}>Wiederholungen</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {WIEDERHOLUNGEN.map((anzahl) => {
                const gewaehlt = anzahl === GEWAEHLTE_ANZAHL
                return (
                  <div
                    key={anzahl}
                    style={{
                      minWidth: 52,
                      height: 44,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      background: gewaehlt ? 'var(--red)' : 'transparent',
                      color: gewaehlt ? 'var(--on-red)' : 'var(--muted)',
                      border: `1px solid ${gewaehlt ? 'var(--red)' : 'var(--rule)'}`,
                    }}
                  >
                    {anzahl}
                  </div>
                )
              })}
            </div>
          </div>
          <Linie />
        </Abschnitt>

        <Abschnitt titel="Darstellung">
          <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: SERIF, fontSize: 20 }}>Heiligentag anzeigen</div>
            <Schalter an beschriftung="Heiligentag anzeigen" />
          </div>
          <Linie />
          <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: SERIF, fontSize: 20 }}>Erscheinungsbild</div>
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>Hell</div>
          </div>
          <Linie />
        </Abschnitt>

        <Abschnitt titel="Anmeldung">
          <div style={{ minHeight: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20 }}>Angemeldet mit Google</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>anna.weber@gmail.com</div>
            </div>
            <div style={{ minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 15, color: 'var(--red-text)' }}>
              Abmelden
            </div>
          </div>
          <Linie />
          <div style={{ padding: '14px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--faint)' }}>
            Themen und Tagebuch werden auf allen Geräten abgeglichen.
          </div>
        </Abschnitt>

        <div style={{ height: 28 }} />
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
