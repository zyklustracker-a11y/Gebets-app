import { useState } from 'react'

import { SERIF, bildschirm, obenSafe, untenSafe } from '../components/ui'

/**
 * Bildschirm 3 · Jesusgebet — die ganze Fläche ist antippbar, jeder Tipp zählt
 * eine Wiederholung. Der Wortlaut bleibt dabei stehen und verschwindet nie
 * (Spezifikation, Abschnitt 13). Anzahl fest verdrahtet (12).
 */

const WIEDERHOLUNGEN = 12
const PERLEN = Math.min(WIEDERHOLUNGEN, 33)

export default function Jesusgebet() {
  const [zaehler, setZaehler] = useState(0)

  function tippen() {
    setZaehler((z) => (z >= WIEDERHOLUNGEN ? 0 : z + 1))
    // Ein sanfter Impuls pro Wiederholung, wie ein Knoten der Tschotki.
    // Stille Rückfallebene: auf iOS ist die Vibration eingeschränkt.
    navigator.vibrate?.(12)
  }

  const gefuellt = Math.round((zaehler / WIEDERHOLUNGEN) * PERLEN)

  return (
    <div
      onClick={tippen}
      style={{ ...bildschirm, cursor: 'pointer', userSelect: 'none' }}
      role="button"
      aria-label="Jesusgebet zählen"
    >
      <div style={{ height: obenSafe }} />
      <div
        style={{
          flex: 1,
          padding: '0 44px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 64,
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.6, textAlign: 'center', textWrap: 'pretty' }}>
          Herr Jesus Christus, Sohn Gottes, erbarme dich meiner, des Sünders.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 11, maxWidth: 220 }}>
            {Array.from({ length: PERLEN }, (_, i) => (
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
          <div style={{ fontFamily: SERIF, fontSize: 17, color: 'var(--muted)', letterSpacing: '0.08em' }}>
            {zaehler} / {WIEDERHOLUNGEN}
          </div>
        </div>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
