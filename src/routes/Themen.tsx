import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import { KATEGORIEN } from '../lib/kategorien'
import { kategorieUmschalten, themaStatusUmschalten } from '../lib/themen'

/**
 * Bildschirm 4 · Themen — das Herzstück. Eigene Themen und Kategorien werden
 * an- und abgewählt; angetippte Themen kommen in den nächsten Gebeten vor.
 */

function Punkt({ sichtbar }: { sichtbar: boolean }) {
  return (
    <span
      style={{ width: 7, height: 7, borderRadius: '50%', background: sichtbar ? 'var(--red-text)' : 'transparent', flex: 'none' }}
    />
  )
}

export default function Themen() {
  const navigate = useNavigate()

  const eigene = useLiveQuery(async () => {
    const alle = await db.themen.orderBy('erstelltAm').toArray()
    return alle.filter((t) => t.istEigen)
  }, [])

  const aktiveKategorien = useLiveQuery(async () => {
    const alle = await db.themen.toArray()
    return new Set(alle.filter((t) => !t.istEigen && t.status === 'aktiv').map((t) => t.kategorie))
  }, [])

  const kategorienAktiv = aktiveKategorien ?? new Set<string>()

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate('/')} aria-label="Zurück zu Heute" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Themen</div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Angetippte Themen kommen in den nächsten Gebeten vor.
        </div>

        {eigene && eigene.length > 0 && (
          <>
            <div style={{ marginTop: 36 }}>
              <Ueberschrift>Eigene Themen</Ueberschrift>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
              <Linie />
              {eigene.map((thema) => {
                const aktiv = thema.status === 'aktiv'
                return (
                  <div key={thema.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      onClick={() => themaStatusUmschalten(thema.id)}
                      style={{
                        minHeight: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        width: '100%',
                        color: aktiv ? undefined : 'var(--faint)',
                      }}
                    >
                      <div style={{ fontFamily: SERIF, fontSize: 20 }}>{thema.titel}</div>
                      <Punkt sichtbar={aktiv} />
                    </button>
                    <Linie />
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div style={{ marginTop: 32 }}>
          <Ueberschrift>Kategorien</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {KATEGORIEN.map((kategorie) => {
            const aktiv = kategorienAktiv.has(kategorie.schluessel)
            return (
              <div key={kategorie.schluessel} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => kategorieUmschalten(kategorie.schluessel)}
                  style={{
                    minHeight: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    width: '100%',
                    color: aktiv ? 'var(--ink)' : 'var(--faint)',
                  }}
                >
                  <div style={{ fontFamily: SERIF, fontSize: 20 }}>{kategorie.name}</div>
                  <Punkt sichtbar={aktiv} />
                </button>
                <Linie />
              </div>
            )
          })}
        </div>
        <div style={{ height: 24 }} />
      </div>

      <div style={{ padding: `14px ${RAND}px 0`, borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', minHeight: 56 }}>
        <button onClick={() => navigate('/themen/neu')} style={{ fontSize: 15, color: 'var(--red-text)' }}>
          Eigenes Thema hinzufügen
        </button>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
