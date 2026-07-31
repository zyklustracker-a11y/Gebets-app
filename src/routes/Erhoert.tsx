import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import { themaWiederAufnehmen } from '../lib/themen'
import type { Thema } from '../lib/types'

/**
 * Archiv erhörter Anliegen (Spezifikation, Abschnitt 11). Die abgeschlossenen
 * Themen samt Antwort auf „Wie hat Gott geantwortet?" — ein stilles Zeugnis.
 */

function datumLang(iso?: string): string {
  if (!iso) return ''
  const datum = new Date(iso)
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(datum)
}

function Eintrag({ thema }: { thema: Thema }) {
  const [zurueck, setZurueck] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ fontFamily: SERIF, fontSize: 21, lineHeight: 1.4 }}>{thema.titel}</div>
          {zurueck ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
              <button onClick={() => setZurueck(false)} style={{ fontSize: 13, color: 'var(--muted)', padding: '4px 0' }}>
                Behalten
              </button>
              <button
                onClick={() => themaWiederAufnehmen(thema.id)}
                style={{ fontSize: 13, color: 'var(--red-text)', padding: '4px 0' }}
              >
                Aufnehmen
              </button>
            </div>
          ) : (
            <button
              onClick={() => setZurueck(true)}
              style={{ fontSize: 13, color: 'var(--faint)', padding: '4px 0', flex: 'none' }}
            >
              Wieder aufnehmen
            </button>
          )}
        </div>
        {thema.abgeschlossenAm && (
          <div style={{ marginTop: 6, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
            Erhört am {datumLang(thema.abgeschlossenAm)}
          </div>
        )}
        {thema.notiz && (
          <div
            style={{
              marginTop: 14,
              paddingLeft: 16,
              borderLeft: '1px solid var(--rule)',
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 19,
              lineHeight: 1.6,
              color: 'var(--muted)',
              textWrap: 'pretty',
            }}
          >
            {thema.notiz}
          </div>
        )}
      </div>
      <Linie />
    </div>
  )
}

export default function Erhoert() {
  const navigate = useNavigate()

  const erhoert = useLiveQuery(async () => {
    const alle = await db.themen.where('status').equals('erhoert').toArray()
    return alle.sort((a, b) => (b.abgeschlossenAm ?? '').localeCompare(a.abgeschlossenAm ?? ''))
  }, [])

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate(-1)} aria-label="Zurück" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Erhörte Gebete</div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Anliegen, die du abgeschlossen hast — und wie Gott geantwortet hat.
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {(erhoert ?? []).map((thema) => (
            <Eintrag key={thema.id} thema={thema} />
          ))}
        </div>

        {erhoert && erhoert.length === 0 && (
          <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--faint)' }}>
            Noch nichts abgelegt. Wenn sich ein Anliegen erfüllt, kannst du es bei den Themen abschliessen.
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
