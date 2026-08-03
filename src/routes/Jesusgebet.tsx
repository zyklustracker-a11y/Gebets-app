import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SERIF, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'

/**
 * Bildschirm 3 · Jesusgebet — die ganze Fläche ist antippbar, jeder Tipp zählt
 * eine Wiederholung. Der Wortlaut bleibt dabei stehen und verschwindet nie
 * (Spezifikation, Abschnitt 13). Die Anzahl kommt aus den Einstellungen.
 *
 * Ist die eingestellte Zahl erreicht, ist die Einheit beendet: weitere Tipps
 * werden nicht mehr gezählt, es erscheint eine kurze Rückmeldung, und nach
 * einem Atemzug führt der Bildschirm von selbst nach „Heute" zurück.
 */

/** Wie lange die Abschlussmeldung stehen bleibt, bevor es zurückgeht. */
const RUECKKEHR_MS = 1500

export default function Jesusgebet() {
  const navigate = useNavigate()
  const [zaehler, setZaehler] = useState(0)
  const [fertig, setFertig] = useState(false)
  const uhr = useRef<number | null>(null)

  const wiederholungen = useLiveQuery(
    async () => (await db.einstellungen.get('einstellungen'))?.jesusgebetAnzahl ?? 12,
    [],
    12,
  )
  const perlen = Math.min(wiederholungen, 33)

  // Der Zähler gehört zu dieser Einheit: Ändert sich die eingestellte Zahl
  // (oder wird sie nachgeladen), beginnt sie sauber von vorn.
  useEffect(() => {
    setZaehler(0)
    setFertig(false)
  }, [wiederholungen])

  // Verlässt der Nutzer den Bildschirm vorher — Zurückwischen, Zurücktaste,
  // Benachrichtigung —, wird die geplante Rückkehr verworfen. Sonst würde auf
  // einem längst verlassenen Bildschirm navigiert. Der Zähler selbst ist
  // Zustand dieser Ansicht und ist mit ihr ohnehin verschwunden.
  useEffect(() => {
    return () => {
      if (uhr.current !== null) {
        clearTimeout(uhr.current)
        uhr.current = null
      }
    }
  }, [])

  function tippen() {
    // Nach dem Abschluss zählt nichts mehr — kein Neustart bei 0.
    if (fertig) return

    const neu = Math.min(zaehler + 1, wiederholungen)
    setZaehler(neu)

    if (neu < wiederholungen) {
      // Ein sanfter Impuls pro Wiederholung, wie ein Knoten der Tschotki.
      // Stille Rückfallebene: auf iOS ist die Vibration eingeschränkt.
      navigator.vibrate?.(12)
      return
    }

    // Die Einheit ist vollendet: ein etwas längerer Impuls als Schlusspunkt.
    setFertig(true)
    navigator.vibrate?.([16, 70, 40])
    uhr.current = window.setTimeout(() => {
      uhr.current = null
      navigate('/', { replace: true })
    }, RUECKKEHR_MS)
  }

  const gefuellt = fertig ? perlen : Math.round((zaehler / wiederholungen) * perlen)

  return (
    <div
      onClick={tippen}
      style={{ ...bildschirm, cursor: fertig ? 'default' : 'pointer', userSelect: 'none' }}
      role="button"
      aria-label="Jesusgebet zählen"
      aria-disabled={fertig}
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
            {Array.from({ length: perlen }, (_, i) => (
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
          <div
            aria-live="polite"
            style={{
              fontFamily: SERIF,
              fontSize: 17,
              color: fertig ? 'var(--gold)' : 'var(--muted)',
              letterSpacing: '0.08em',
            }}
          >
            {fertig ? 'Gebet abgeschlossen' : `${zaehler} / ${wiederholungen}`}
          </div>
        </div>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
