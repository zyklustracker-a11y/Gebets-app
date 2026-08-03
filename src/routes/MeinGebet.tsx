import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Bestaetigung,
  Papierkorb,
  Perlen,
  RAND,
  SERIF,
  ZurueckWinkel,
  bildschirm,
  obenSafe,
  untenSafe,
} from '../components/ui'
import { db } from '../lib/db'
import { kategorieName } from '../lib/kategorien'
import { meinGebetLoeschen } from '../lib/meineGebete'

/**
 * Bildschirm · Ein eigenes Gebet (Punkt 2). Zeigt den selbst hinterlegten
 * Wortlaut und — wenn eine Wiederholungszahl gesetzt ist — denselben Zähler
 * wie das Jesusgebet. Bearbeiten und Löschen gibt es nur hier; die
 * mitgelieferten Gebete kennen beides nicht.
 */

/** Wie lange die Abschlussmeldung stehen bleibt, bevor es zurückgeht. */
const RUECKKEHR_MS = 1500

export default function MeinGebet() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [loeschen, setLoeschen] = useState(false)

  // `null` heisst „gibt es nicht", `undefined` heisst „wird noch geladen".
  const gebet = useLiveQuery(async () => (id ? ((await db.meineGebete.get(id)) ?? null) : null), [id])

  // Solange geladen wird: ruhige leere Fläche, wie auf dem Themen-Schirm.
  if (gebet === undefined) return <div style={bildschirm} />

  if (gebet === null) {
    return (
      <div style={bildschirm}>
        <div style={{ height: obenSafe }} />
        <div style={{ padding: `2px ${RAND}px 0` }}>
          <button onClick={() => navigate('/gebete')} aria-label="Zurück zu Gebete" style={{ padding: 8, margin: -8 }}>
            <ZurueckWinkel />
          </button>
        </div>
        <div style={{ flex: 1, padding: `24px ${RAND}px 0`, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--faint)' }}>
          Dieses Gebet gibt es nicht mehr.
        </div>
        <div style={{ height: untenSafe }} />
      </div>
    )
  }

  const absaetze = gebet.text.split(/\n\s*\n|\n/).filter((zeile) => zeile.trim())

  async function entfernen() {
    await meinGebetLoeschen(id)
    setLoeschen(false)
    navigate('/gebete', { replace: true })
  }

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/gebete')} aria-label="Zurück zu Gebete" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
        <button
          onClick={() => setLoeschen(true)}
          aria-label="Gebet löschen"
          style={{ padding: 8, margin: -8, color: 'var(--muted)', display: 'flex' }}
        >
          <Papierkorb />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          Eigenes Gebet{gebet.kategorie ? ` · ${kategorieName(gebet.kategorie)}` : ''}
        </div>
        <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 28, lineHeight: 1.3 }}>{gebet.titel}</div>

        <div
          style={{
            marginTop: 30,
            fontFamily: SERIF,
            fontSize: 20,
            lineHeight: 1.65,
            textWrap: 'pretty',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {absaetze.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>

        {gebet.wiederholungen ? (
          <>
            <div style={{ margin: '36px 0 0', height: 1, background: 'var(--gold)', opacity: 0.5 }} />
            <Zaehler wiederholungen={gebet.wiederholungen} fertigNach={() => navigate('/gebete', { replace: true })} />
          </>
        ) : null}

        <div style={{ height: 32 }} />
      </div>

      <div
        style={{
          padding: `14px ${RAND}px 0`,
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
        }}
      >
        <button onClick={() => navigate(`/gebete/${id}/bearbeiten`)} style={{ fontSize: 15, color: 'var(--red-text)' }}>
          Bearbeiten
        </button>
        <button
          onClick={() => setLoeschen(true)}
          style={{ fontSize: 15, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Papierkorb />
          Löschen
        </button>
      </div>
      <div style={{ height: untenSafe }} />

      {loeschen && (
        <Bestaetigung
          frage="Wirklich löschen?"
          hinweis={`„${gebet.titel}" wird endgültig entfernt.`}
          bestaetigen={entfernen}
          abbrechen={() => setLoeschen(false)}
        />
      )}
    </div>
  )
}

/**
 * Der Zähler eines eigenen Gebets — wie beim Jesusgebet: Antippen zählt, bei
 * der Zielzahl ist Schluss, danach geht es von selbst zurück. Der Timer wird
 * beim Verlassen verworfen.
 */
function Zaehler({ wiederholungen, fertigNach }: { wiederholungen: number; fertigNach: () => void }) {
  const [zaehler, setZaehler] = useState(0)
  const [fertig, setFertig] = useState(false)
  const uhr = useRef<number | null>(null)

  useEffect(() => {
    setZaehler(0)
    setFertig(false)
  }, [wiederholungen])

  useEffect(() => {
    return () => {
      if (uhr.current !== null) {
        clearTimeout(uhr.current)
        uhr.current = null
      }
    }
  }, [])

  const perlen = Math.min(wiederholungen, 33)
  const gefuellt = fertig ? perlen : Math.round((zaehler / wiederholungen) * perlen)

  function tippen() {
    if (fertig) return

    const neu = Math.min(zaehler + 1, wiederholungen)
    setZaehler(neu)

    if (neu < wiederholungen) {
      navigator.vibrate?.(12)
      return
    }

    setFertig(true)
    navigator.vibrate?.([16, 70, 40])
    uhr.current = window.setTimeout(() => {
      uhr.current = null
      fertigNach()
    }, RUECKKEHR_MS)
  }

  return (
    <button
      onClick={tippen}
      aria-label="Wiederholung zählen"
      aria-disabled={fertig}
      style={{
        marginTop: 26,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
        padding: '10px 0',
        cursor: fertig ? 'default' : 'pointer',
        userSelect: 'none',
      }}
    >
      <Perlen anzahl={perlen} gefuellt={gefuellt} />
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
      {!fertig && zaehler === 0 && (
        <div style={{ fontSize: 13, color: 'var(--faint)' }}>Zum Zählen antippen</div>
      )}
    </button>
  )
}
