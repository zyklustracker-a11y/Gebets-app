import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Knopf, Linie, Overlay, RAND, SERIF, Textfeld, Ueberschrift, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import { KATEGORIEN } from '../lib/kategorien'
import { kategorieUmschalten, themaAbschliessen, themaStatusUmschalten } from '../lib/themen'
import type { Thema } from '../lib/types'

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
  const [abschluss, setAbschluss] = useState<Thema | null>(null)
  const [antwort, setAntwort] = useState('')

  // Erhörte Anliegen sind ins Archiv gewandert und stehen hier nicht mehr.
  const eigene = useLiveQuery(async () => {
    const alle = await db.themen.orderBy('erstelltAm').toArray()
    return alle.filter((t) => t.istEigen && t.status !== 'erhoert')
  }, [])

  const erhoertAnzahl = useLiveQuery(async () => db.themen.where('status').equals('erhoert').count(), [])

  function abschlussOeffnen(thema: Thema) {
    setAntwort('')
    setAbschluss(thema)
  }

  async function abschliessen() {
    if (!abschluss) return
    await themaAbschliessen(abschluss.id, antwort)
    setAbschluss(null)
    setAntwort('')
  }

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60 }}>
                      <button
                        onClick={() => themaStatusUmschalten(thema.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          color: aktiv ? undefined : 'var(--faint)',
                        }}
                        aria-label={`${thema.titel} ${aktiv ? 'pausieren' : 'aktivieren'}`}
                      >
                        <div style={{ fontFamily: SERIF, fontSize: 20 }}>{thema.titel}</div>
                        <Punkt sichtbar={aktiv} />
                      </button>
                      <button
                        onClick={() => navigate(`/themen/${thema.id}/gebete`)}
                        style={{ fontSize: 13, color: 'var(--faint)', padding: '8px 0 8px 8px', flex: 'none' }}
                      >
                        Gebete
                      </button>
                      <button
                        onClick={() => abschlussOeffnen(thema)}
                        style={{ fontSize: 13, color: 'var(--faint)', padding: '8px 0 8px 8px', flex: 'none' }}
                      >
                        Abschließen
                      </button>
                    </div>
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

        {(erhoertAnzahl ?? 0) > 0 && (
          <button
            onClick={() => navigate('/erhoert')}
            style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)' }}
          >
            Erhörte Gebete ansehen
            <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>
              <ZurueckWinkel />
            </span>
          </button>
        )}

        <div style={{ height: 24 }} />
      </div>

      <div style={{ padding: `14px ${RAND}px 0`, borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', minHeight: 56 }}>
        <button onClick={() => navigate('/themen/neu')} style={{ fontSize: 15, color: 'var(--red-text)' }}>
          Eigenes Thema hinzufügen
        </button>
      </div>
      <div style={{ height: untenSafe }} />

      {abschluss && (
        <Overlay onSchliessen={() => setAbschluss(null)}>
          <div style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
            {abschluss.titel}
          </div>
          <div style={{ marginTop: 12, fontFamily: SERIF, fontSize: 22, lineHeight: 1.4 }}>Wie hat Gott geantwortet?</div>
          <div style={{ marginTop: 14 }}>
            <Textfeld
              wert={antwort}
              aendern={setAntwort}
              platzhalter="Ein Satz, wenn du magst — oder leer lassen."
              autoFocus
            />
          </div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Knopf onClick={abschliessen}>Als erhört ablegen</Knopf>
            <button
              onClick={() => setAbschluss(null)}
              style={{ fontSize: 15, color: 'var(--muted)', padding: '0 6px', flex: 'none' }}
            >
              Abbrechen
            </button>
          </div>
        </Overlay>
      )}
    </div>
  )
}
