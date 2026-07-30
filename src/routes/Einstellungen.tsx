import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Schalter, Ueberschrift, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db, einstellungenLesen, einstellungenSchreiben } from '../lib/db'
import { JESUSGEBET_ANZAHLEN, type Erscheinungsbild } from '../lib/types'

/**
 * Bildschirm 6 · Einstellungen — an die Datenbank angebunden. Themen sind von
 * hier aus gut sichtbar oben erreichbar. Die Anmeldung bleibt bis Bauabschnitt 9
 * eine Anzeige.
 */

const ERSCHEINUNG_LABEL: Record<Erscheinungsbild, string> = {
  system: 'System',
  hell: 'Hell',
  dunkel: 'Dunkel',
}
const ERSCHEINUNG_FOLGE: Erscheinungsbild[] = ['system', 'hell', 'dunkel']

const TITEL: Record<'morgen' | 'mittag' | 'abend', string> = { morgen: 'Morgen', mittag: 'Mittag', abend: 'Abend' }

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
  const navigate = useNavigate()

  const gebetszeiten = useLiveQuery(async () => {
    const alle = await db.gebetszeiten.toArray()
    const reihenfolge = ['morgen', 'mittag', 'abend']
    return alle.sort((a, b) => reihenfolge.indexOf(a.typ) - reihenfolge.indexOf(b.typ))
  }, [])

  const einstellungen = useLiveQuery(() => einstellungenLesen(), [])

  async function zeitUmschalten(typ: 'morgen' | 'mittag' | 'abend', aktiv: boolean) {
    await db.gebetszeiten.update(typ, { aktiv: !aktiv })
  }

  async function erscheinungWeiter() {
    const jetzt = einstellungen?.erscheinungsbild ?? 'system'
    const naechste = ERSCHEINUNG_FOLGE[(ERSCHEINUNG_FOLGE.indexOf(jetzt) + 1) % ERSCHEINUNG_FOLGE.length] ?? 'system'
    await einstellungenSchreiben({ erscheinungsbild: naechste })
  }

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate('/')} aria-label="Zurück zu Heute" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Einstellungen</div>

        {/* Themen bewusst oben und gross — sie sind das Herzstück. */}
        <button
          onClick={() => navigate('/themen')}
          style={{
            marginTop: 24,
            width: '100%',
            minHeight: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--field)',
            borderRadius: 10,
            padding: '0 18px',
          }}
        >
          <span style={{ fontFamily: SERIF, fontSize: 22 }}>Themen</span>
          <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>
            <ZurueckWinkel />
          </span>
        </button>

        <Abschnitt titel="Gebetszeiten">
          {(gebetszeiten ?? []).map((zeit) => (
            <div key={zeit.typ} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 20 }}>{TITEL[zeit.typ]}</span>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>{zeit.uhrzeit.replace(/^0/, '')}</span>
                </div>
                <button onClick={() => zeitUmschalten(zeit.typ, zeit.aktiv)} aria-label={`${TITEL[zeit.typ]} anzeigen`}>
                  <Schalter an={zeit.aktiv} />
                </button>
              </div>
              <Linie />
            </div>
          ))}
        </Abschnitt>

        <Abschnitt titel="Jesusgebet">
          <div style={{ minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ fontFamily: SERIF, fontSize: 20 }}>Wiederholungen</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {JESUSGEBET_ANZAHLEN.map((anzahl) => {
                const gewaehlt = anzahl === einstellungen?.jesusgebetAnzahl
                return (
                  <button
                    key={anzahl}
                    onClick={() => einstellungenSchreiben({ jesusgebetAnzahl: anzahl })}
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
                  </button>
                )
              })}
            </div>
          </div>
          <Linie />
        </Abschnitt>

        <Abschnitt titel="Darstellung">
          <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: SERIF, fontSize: 20 }}>Heiligentag anzeigen</div>
            <button
              onClick={() => einstellungenSchreiben({ heiligentagAnzeigen: !(einstellungen?.heiligentagAnzeigen ?? true) })}
              aria-label="Heiligentag anzeigen"
            >
              <Schalter an={einstellungen?.heiligentagAnzeigen ?? true} />
            </button>
          </div>
          <Linie />
          <button
            onClick={erscheinungWeiter}
            style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ fontFamily: SERIF, fontSize: 20 }}>Erscheinungsbild</div>
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>
              {ERSCHEINUNG_LABEL[einstellungen?.erscheinungsbild ?? 'system']}
            </div>
          </button>
          <Linie />
        </Abschnitt>

        <Abschnitt titel="Anmeldung">
          <div style={{ minHeight: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20 }}>Nicht angemeldet</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>Alles läuft lokal auf diesem Gerät.</div>
            </div>
          </div>
          <Linie />
          <div style={{ padding: '14px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--faint)' }}>
            Anmeldung und Geräteabgleich kommen später. Themen und Tagebuch bleiben bis dahin auf diesem Gerät.
          </div>
        </Abschnitt>

        <div style={{ height: 28 }} />
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
