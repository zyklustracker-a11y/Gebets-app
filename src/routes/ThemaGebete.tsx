import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Knopf, Linie, RAND, SERIF, Schalter, Ueberschrift, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import {
  eigeneGebeteFuerThema,
  eigeneGebeteSpeichern,
  eigenesGebetBearbeiten,
  gebeteAnfordern,
} from '../lib/eigeneGebete'
import { kategorieName } from '../lib/kategorien'
import { erzeugungUmschalten } from '../lib/themen'
import type { EigenesGebet, Tageszeit } from '../lib/types'

/**
 * Bildschirm · Eigene Gebete (Spezifikation, Abschnitt 12). Erreichbar nach dem
 * Anlegen eines Themas und aus der Themenliste. Der Aufruf an die KI geschieht
 * nur durch bewusstes Tippen; scheitert er, bleibt es beim mitgelieferten
 * Korpus — ohne Fehlermeldung. Jeder erzeugte Text ist hier bearbeitbar.
 */

const LABEL: Record<Tageszeit, string> = { morgen: 'Morgen', mittag: 'Mittag', abend: 'Abend' }

export default function ThemaGebete() {
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const thema = useLiveQuery(() => db.themen.get(id), [id])
  const gebete = useLiveQuery(() => eigeneGebeteFuerThema(id), [id])

  const [laufend, setLaufend] = useState(false)
  const [fehlgeschlagen, setFehlgeschlagen] = useState(false)

  // Solange geladen wird bzw. das Thema nicht existiert: ruhige leere Fläche.
  if (!thema) return <div style={bildschirm} />

  const hatGebete = (gebete?.length ?? 0) > 0
  const erstelltAm = gebete?.[0]?.erstelltAm
  const erstelltText = erstelltAm ? ` (erstellt am ${new Date(erstelltAm).toLocaleDateString('de-DE')})` : ''

  async function erzeugen() {
    if (!thema) return
    setLaufend(true)
    setFehlgeschlagen(false)
    const antwort = await gebeteAnfordern({
      titel: thema.titel,
      kategorie: kategorieName(thema.kategorie),
      faerbung: 'gewoehnlich',
    })
    if (antwort) {
      await eigeneGebeteSpeichern(thema.id, thema.kategorie, 'gewoehnlich', antwort)
      setLaufend(false)
    } else {
      // Stiller Rückfall auf den Platzhalter-Weg (Abschnitt 12).
      setLaufend(false)
      setFehlgeschlagen(true)
    }
  }

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate('/themen')} aria-label="Zurück zu Themen" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          {kategorieName(thema.kategorie)}
        </div>
        <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 28, lineHeight: 1.3 }}>{thema.titel}</div>

        {/* Schalter „Nicht an die KI senden" — ist er an, verschwindet das Erzeugen. */}
        <button
          onClick={() => erzeugungUmschalten(thema.id)}
          style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%' }}
          aria-label="Nicht an die KI senden"
        >
          <div style={{ fontSize: 15, color: 'var(--ink)' }}>Nicht an die KI senden</div>
          <Schalter an={Boolean(thema.keineErzeugung)} beschriftung="Nicht an die KI senden" />
        </button>
        <div style={{ marginTop: 16 }}>
          <Linie />
        </div>

        {/* Fall 1: erzeugte Gebete vorhanden — klare Bestätigung, dann bearbeitbar. */}
        {hatGebete && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div
              style={{
                background: 'var(--field)',
                border: '1px solid var(--edge)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--gold)', fontSize: 17 }} aria-hidden>
                  ✓
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Mit KI erfolgreich erstellt</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)' }}>
                Drei eigene Gebete für „{thema.titel}" — Morgen, Mittag und Abend{erstelltText}. Sie sind auf diesem Gerät
                gespeichert, laufen offline und erscheinen in der Gebetsansicht, sobald dieses Thema an der Reihe ist. Jeden
                Text kannst du unten anpassen.
              </div>
            </div>
            {gebete!.map((gebet) => (
              <GebetBlock key={gebet.id} gebet={gebet} />
            ))}
            <button
              onClick={erzeugen}
              disabled={laufend}
              style={{ alignSelf: 'flex-start', fontSize: 14, color: 'var(--muted)', padding: '4px 0' }}
            >
              {laufend ? 'Die KI erstellt neue Gebete …' : 'Neu erzeugen lassen'}
            </button>
          </div>
        )}

        {/* Fall 2: noch keine Gebete, KI erlaubt — bewusst anbieten. */}
        {!hatGebete && !thema.keineErzeugung && (
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, lineHeight: 1.55, color: 'var(--muted)' }}>
              {fehlgeschlagen
                ? 'Gerade ließ sich kein eigenes Gebet erstellen. Dieses Thema verwendet vorerst die mitgelieferten Gebete.'
                : 'Möchtest du für dieses Thema eigene Gebete für Morgen, Mittag und Abend erstellen lassen? Übertragen werden nur Titel und Kategorie.'}
            </div>
            <div style={{ marginTop: 24 }}>
              <Knopf onClick={erzeugen}>
                {laufend ? 'Die KI erstellt deine Gebete …' : fehlgeschlagen ? 'Nochmal versuchen' : 'Eigene Gebete erstellen'}
              </Knopf>
            </div>
            <button
              onClick={() => navigate('/themen')}
              style={{ marginTop: 16, alignSelf: 'center', fontSize: 15, color: 'var(--muted)', padding: '6px 10px' }}
            >
              Später
            </button>
          </div>
        )}

        {/* Fall 3: KI abgeschaltet. */}
        {!hatGebete && thema.keineErzeugung && (
          <div style={{ marginTop: 28, fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
            Für dieses Thema ist die KI-Erzeugung ausgeschaltet. Es verwendet die mitgelieferten Gebete.
          </div>
        )}

        <div style={{ height: 28 }} />
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}

/** Ein erzeugter Text, bearbeitbar. Speichert die Änderung beim Verlassen. */
function GebetBlock({ gebet }: { gebet: EigenesGebet }) {
  const [text, setText] = useState(gebet.text)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [text])

  function sichern() {
    if (text.trim() && text !== gebet.text) void eigenesGebetBearbeiten(gebet.id, text)
  }

  return (
    <div>
      <Ueberschrift>{LABEL[gebet.tageszeit]}</Ueberschrift>
      <div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--muted)' }}>
        {gebet.vers}
        {gebet.stelle ? ` — ${gebet.stelle}` : ''}
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={sichern}
        className="sx"
        style={{
          marginTop: 12,
          width: '100%',
          resize: 'none',
          overflow: 'hidden',
          font: 'inherit',
          fontFamily: SERIF,
          fontSize: 18,
          lineHeight: 1.65,
          color: 'var(--ink)',
          background: 'var(--field)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          padding: '12px 14px',
          outline: 'none',
        }}
      />
    </div>
  )
}
