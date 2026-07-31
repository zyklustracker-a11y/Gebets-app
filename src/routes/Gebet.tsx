import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Knopf, Kreuz, RAND, SERIF, Textfeld, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import { alsGebetet, andersWaehlen, datumIso, ermittleGebet, komponiere, type Zusammensetzung } from '../lib/gebetsauswahl'
import { heutigerTag } from '../lib/kalender'
import { tagebuchSpeichern } from '../lib/tagebuch'
import { TAGESZEITEN, type Tageszeit } from '../lib/types'

/**
 * Bildschirm 2 · Gebetsansicht — der Kernbildschirm. Zeigt das für heute und
 * diese Tageszeit ausgewählte Gebet. Die Auswahl ist deterministisch: erneutes
 * Öffnen zeigt denselben Text, nur „Anderes Gebet" wählt neu.
 */

function istTageszeit(wert: string | undefined): wert is Tageszeit {
  return TAGESZEITEN.includes(wert as Tageszeit)
}

export default function Gebet() {
  const navigate = useNavigate()
  const { tageszeit } = useParams()
  const datum = datumIso(heutigerTag())

  const [teile, setTeile] = useState<Zusammensetzung | null>(null)
  const [nachklang, setNachklang] = useState(false)
  const [notiz, setNotiz] = useState('')
  const gueltig = istTageszeit(tageszeit)

  // Beim Öffnen die Auswahl sicherstellen (idempotent — legt nur an, was fehlt).
  useEffect(() => {
    if (gueltig) void ermittleGebet(datum, tageszeit)
  }, [gueltig, datum, tageszeit])

  const id = gueltig ? `${datum}-${tageszeit}` : ''
  const eintrag = useLiveQuery(async () => (id ? db.protokoll.get(id) : undefined), [id])

  const wiederholungen = useLiveQuery(
    async () => (await db.einstellungen.get('einstellungen'))?.jesusgebetAnzahl ?? 12,
    [],
    12,
  )

  useEffect(() => {
    let aktiv = true
    if (eintrag) void komponiere(eintrag).then((z) => aktiv && setTeile(z))
    return () => {
      aktiv = false
    }
  }, [eintrag])

  if (!gueltig) {
    navigate('/', { replace: true })
    return null
  }

  async function anderes() {
    if (!gueltig) return
    await andersWaehlen(datum, tageszeit)
  }

  async function gebetet() {
    if (!gueltig) return
    await alsGebetet(datum, tageszeit)
    // Nach dem Gebet die stille Einladung, einen Satz festzuhalten (Abschnitt 11).
    setNachklang(true)
  }

  async function festhalten() {
    await tagebuchSpeichern(id, datum, notiz)
    navigate('/')
  }

  // Der Nachklang: eigener, ruhiger Schirm nach dem Gebet — kein Banner auf dem
  // Gebet selbst. Der Satz ist freiwillig.
  if (nachklang && teile) {
    return (
      <div style={bildschirm}>
        <div style={{ padding: `${obenSafe} ${RAND}px 8px`, display: 'flex', justifyContent: 'flex-end' }}>
          <Kreuz />
        </div>
        <div style={{ flex: 1, padding: `24px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faint)' }}>
            {teile.tageszeitLabel} · gebetet
          </div>
          <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 22, lineHeight: 1.5, color: 'var(--muted)' }}>
            Möchtest du etwas festhalten?
          </div>
          <div style={{ marginTop: 18 }}>
            <Textfeld wert={notiz} aendern={setNotiz} platzhalter="Ein Satz zu diesem Gebet — oder weiter ohne Eintrag." autoFocus />
          </div>
        </div>
        <div style={{ padding: `18px ${RAND}px 0`, display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid var(--rule)' }}>
          <Knopf onClick={festhalten}>{notiz.trim() ? 'Festhalten' : 'Fertig'}</Knopf>
          <button onClick={() => navigate('/')} style={{ fontSize: 15, color: 'var(--muted)', padding: '0 4px', flex: 'none' }}>
            Ohne Eintrag
          </button>
        </div>
        <div style={{ height: untenSafe }} />
      </div>
    )
  }

  return (
    <div style={bildschirm}>
      <div style={{ padding: `${obenSafe} ${RAND}px 8px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <Kreuz />
      </div>

      <div style={{ flex: 1, padding: `6px ${RAND}px 0` }}>
        {teile && (
          <>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              {teile.tageszeitLabel}
            </div>

            <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--muted)' }}>
              {teile.eroeffnung}
            </div>

            <div style={{ marginTop: 30, paddingLeft: 16, borderLeft: '1px solid var(--rule)' }}>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, lineHeight: 1.6, textWrap: 'pretty' }}>
                {teile.vers}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, letterSpacing: '0.06em', color: 'var(--faint)' }}>{teile.stelle}</div>
            </div>

            <div
              style={{
                marginTop: 34,
                fontFamily: SERIF,
                fontSize: 20,
                lineHeight: 1.6,
                textWrap: 'pretty',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {teile.absaetze.map((absatz, i) => (
                <p key={i} style={{ margin: 0 }}>
                  {absatz}
                </p>
              ))}
            </div>

            <div style={{ margin: '36px 0 0', height: 1, background: 'var(--gold)', opacity: 0.5 }} />

            <button
              onClick={() => navigate('/jesusgebet')}
              style={{ marginTop: 22, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--muted)' }}
            >
              Nun das Jesusgebet, {wiederholungen} Mal.
            </button>
          </>
        )}
      </div>

      <div style={{ padding: `18px ${RAND}px 0`, display: 'flex', alignItems: 'center', gap: 18, borderTop: '1px solid var(--rule)' }}>
        <button
          onClick={gebetet}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 10,
            background: 'var(--red)',
            color: 'var(--on-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          Gebetet
        </button>
        <button onClick={anderes} style={{ height: 52, padding: '0 4px', display: 'flex', alignItems: 'center', fontSize: 15, color: 'var(--muted)' }}>
          Anderes Gebet
        </button>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
