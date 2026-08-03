import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Bestaetigung,
  Linie,
  Papierkorb,
  RAND,
  SERIF,
  ZurueckWinkel,
  bildschirm,
  obenSafe,
  untenSafe,
} from '../components/ui'
import { db } from '../lib/db'
import { themaLoeschen, themaWiederAufnehmen } from '../lib/themen'
import type { Thema } from '../lib/types'

/**
 * Archiv erhörter Anliegen (Spezifikation, Abschnitt 11). Die abgeschlossenen
 * Themen samt Antwort auf „Wie hat Gott geantwortet?" — ein stilles Zeugnis.
 *
 * Jeder Eintrag lässt sich einzeln entfernen: nach links wischen oder auf den
 * Papierkorb tippen. Gelöscht wird erst nach einer Rückfrage.
 */

/** Ab dieser Strecke nach links gilt das Wischen als Löschwunsch. */
const WISCH_SCHWELLE = 96

function datumLang(iso?: string): string {
  if (!iso) return ''
  const datum = new Date(iso)
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(datum)
}

/**
 * Eine Zeile, die sich nach links ziehen lässt. Darunter kommt die rote
 * Löschfläche zum Vorschein; über der Schwelle löst das Loslassen die Rückfrage
 * aus. Senkrechtes Ziehen bleibt dem Blättern der Liste vorbehalten.
 */
function Wischzeile({ loeschen, children }: { loeschen: () => void; children: ReactNode }) {
  const [versatz, setVersatz] = useState(0)
  const [zieht, setZieht] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  // `null` heisst „Richtung noch offen", sonst waagerecht oder senkrecht.
  const richtung = useRef<'quer' | 'hoch' | null>(null)

  function beginnen(e: ReactPointerEvent<HTMLDivElement>) {
    start.current = { x: e.clientX, y: e.clientY }
    richtung.current = null
    setZieht(true)
  }

  function ziehen(e: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y

    if (richtung.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      richtung.current = Math.abs(dx) > Math.abs(dy) ? 'quer' : 'hoch'
      // Erst wenn die Richtung feststeht, den Zeiger übernehmen — sonst
      // schluckt die Zeile das Blättern.
      if (richtung.current === 'quer') e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (richtung.current !== 'quer') return

    // Nur nach links; nach rechts gibt es nichts zu enthüllen.
    setVersatz(Math.min(0, dx))
  }

  function beenden() {
    const ausloesen = versatz <= -WISCH_SCHWELLE
    start.current = null
    richtung.current = null
    setZieht(false)
    setVersatz(0)
    if (ausloesen) loeschen()
  }

  const enthuellt = Math.min(1, Math.abs(versatz) / WISCH_SCHWELLE)

  return (
    // Die negativen Ränder lassen die Löschfläche bis an den Bildschirmrand
    // laufen; der Inhalt behält seinen Abstand über das Innenmass unten.
    <div style={{ position: 'relative', overflow: 'hidden', margin: `0 -${RAND}px` }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          paddingRight: 18,
          background: 'var(--red)',
          color: 'var(--on-red)',
          fontSize: 15,
          opacity: enthuellt,
        }}
      >
        <Papierkorb />
        Löschen
      </div>
      <div
        onPointerDown={beginnen}
        onPointerMove={ziehen}
        onPointerUp={beenden}
        onPointerCancel={beenden}
        style={{
          position: 'relative',
          background: 'var(--bg)',
          padding: `0 ${RAND}px`,
          touchAction: 'pan-y',
          transform: `translateX(${versatz}px)`,
          transition: zieht ? 'none' : 'transform 180ms ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Eintrag({ thema, loeschen }: { thema: Thema; loeschen: () => void }) {
  const [zurueck, setZurueck] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Wischzeile loeschen={loeschen}>
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 'none' }}>
                <button onClick={() => setZurueck(true)} style={{ fontSize: 13, color: 'var(--faint)', padding: '4px 0' }}>
                  Wieder aufnehmen
                </button>
                {/* Der sichtbare Weg zum Löschen — auch ohne Wischgeste. */}
                <button
                  onClick={loeschen}
                  aria-label={`„${thema.titel}" löschen`}
                  style={{ color: 'var(--faint)', display: 'flex', padding: '4px 0' }}
                >
                  <Papierkorb />
                </button>
              </div>
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
      </Wischzeile>
      <Linie />
    </div>
  )
}

export default function Erhoert() {
  const navigate = useNavigate()
  const [zuLoeschen, setZuLoeschen] = useState<Thema | null>(null)

  const erhoert = useLiveQuery(async () => {
    const alle = await db.themen.where('status').equals('erhoert').toArray()
    return alle.sort((a, b) => (b.abgeschlossenAm ?? '').localeCompare(a.abgeschlossenAm ?? ''))
  }, [])

  async function entfernen() {
    if (!zuLoeschen) return
    await themaLoeschen(zuLoeschen.id)
    setZuLoeschen(null)
  }

  const leer = erhoert && erhoert.length === 0

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

        {leer ? (
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: SERIF, fontSize: 21, lineHeight: 1.5 }}>Hier ist es noch still.</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 280 }}>
              Erfüllt sich ein Anliegen, kannst du es bei den Themen abschliessen — dann steht es hier als stilles Zeugnis.
            </div>
            <button
              onClick={() => navigate('/themen')}
              style={{ marginTop: 6, fontSize: 15, color: 'var(--red-text)', padding: '6px 10px' }}
            >
              Zu den Themen
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column' }}>
              <Linie />
              {(erhoert ?? []).map((thema) => (
                <Eintrag key={thema.id} thema={thema} loeschen={() => setZuLoeschen(thema)} />
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, lineHeight: 1.7, color: 'var(--faint)' }}>
              Zum Entfernen nach links wischen oder auf den Papierkorb tippen.
            </div>
          </>
        )}

        <div style={{ height: 24 }} />
      </div>
      <div style={{ height: untenSafe }} />

      {zuLoeschen && (
        <Bestaetigung
          frage="Wirklich löschen?"
          hinweis={`„${zuLoeschen.titel}" wird endgültig aus den erhörten Gebeten entfernt.`}
          bestaetigen={entfernen}
          abbrechen={() => setZuLoeschen(null)}
        />
      )}
    </div>
  )
}
