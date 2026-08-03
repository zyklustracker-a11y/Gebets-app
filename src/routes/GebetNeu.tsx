import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import { KATEGORIEN } from '../lib/kategorien'
import {
  WIEDERHOLUNGEN_MAX,
  istGueltig,
  meinGebetAnlegen,
  meinGebetSpeichern,
  pruefeGebet,
  type Fehler,
  type GebetEingabe,
} from '../lib/meineGebete'

/**
 * Bildschirm · Eigenes Gebet — dieselbe Maske für Anlegen und Bearbeiten
 * (Punkt 2). Steht eine id in der Adresse, wird das vorhandene Gebet geändert.
 *
 * Titel und Text sind Pflicht; Kategorie und Wiederholungszahl sind freiwillig.
 * Die Meldungen erscheinen erst nach dem ersten Versuch zu sichern — die Maske
 * soll beim Tippen nicht schimpfen.
 */

// Wie auf dem Themen-Schirm zunächst eine kleine Auswahl, der Rest klappt auf.
const VORAUSWAHL = ['familie', 'dankbarkeit', 'gesundheit']

const LEER: GebetEingabe = { titel: '', text: '', kategorie: '', wiederholungen: '' }

export default function GebetNeu() {
  const navigate = useNavigate()
  const { id } = useParams()
  const bearbeiten = Boolean(id)

  const vorhanden = useLiveQuery(async () => (id ? db.meineGebete.get(id) : undefined), [id])

  const [eingabe, setEingabe] = useState<GebetEingabe>(LEER)
  const [geladen, setGeladen] = useState(!bearbeiten)
  const [gezeigt, setGezeigt] = useState(false)
  const [alleZeigen, setAlleZeigen] = useState(false)

  // Beim Bearbeiten den vorhandenen Stand genau einmal in die Maske holen —
  // spätere Tastenanschläge dürfen nicht überschrieben werden.
  useEffect(() => {
    if (!bearbeiten || geladen || !vorhanden) return
    setEingabe({
      titel: vorhanden.titel,
      text: vorhanden.text,
      kategorie: vorhanden.kategorie ?? '',
      wiederholungen: vorhanden.wiederholungen ? String(vorhanden.wiederholungen) : '',
    })
    setAlleZeigen(Boolean(vorhanden.kategorie))
    setGeladen(true)
  }, [bearbeiten, geladen, vorhanden])

  const fehler: Fehler = pruefeGebet(eingabe)
  const sichtbar: Fehler = gezeigt ? fehler : {}

  const kategorien = alleZeigen
    ? KATEGORIEN
    : KATEGORIEN.filter((k) => VORAUSWAHL.includes(k.schluessel) || k.schluessel === eingabe.kategorie)

  function aendern(feld: keyof GebetEingabe, wert: string) {
    setEingabe((alt) => ({ ...alt, [feld]: wert }))
  }

  async function sichern() {
    setGezeigt(true)
    if (!istGueltig(fehler)) return

    if (id) {
      const ok = await meinGebetSpeichern(id, eingabe)
      if (ok) navigate(`/gebete/${id}`, { replace: true })
      return
    }
    const neu = await meinGebetAnlegen(eingabe)
    if (neu) navigate(`/gebete/${neu}`, { replace: true })
  }

  return (
    <div style={bildschirm}>
      <div style={{ padding: `${obenSafe} ${RAND}px 8px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate(id ? `/gebete/${id}` : '/gebete')}
          style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}
        >
          Abbrechen
        </button>
      </div>

      <div style={{ flex: 1, padding: `24px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.5, color: 'var(--muted)' }}>
          {bearbeiten ? 'Dein Gebet ändern.' : 'Ein Gebet, das du bewahren möchtest.'}
        </div>

        <div style={{ marginTop: 26 }}>
          <Ueberschrift>Titel</Ueberschrift>
        </div>
        <input
          autoFocus={!bearbeiten}
          value={eingabe.titel}
          onChange={(e) => aendern('titel', e.target.value)}
          placeholder="Gebet zum heiligen Nikolaus"
          aria-label="Titel"
          aria-invalid={Boolean(sichtbar.titel)}
          style={{
            marginTop: 10,
            paddingBottom: 12,
            borderBottom: `1px solid ${sichtbar.titel ? 'var(--red-text)' : 'var(--rule)'}`,
            fontFamily: SERIF,
            fontSize: 21,
            lineHeight: 1.6,
            color: 'var(--ink)',
          }}
        />
        {sichtbar.titel && <Meldung>{sichtbar.titel}</Meldung>}

        <div style={{ marginTop: 32 }}>
          <Ueberschrift>Gebetstext</Ueberschrift>
        </div>
        <textarea
          value={eingabe.text}
          onChange={(e) => aendern('text', e.target.value)}
          placeholder="Den Wortlaut hier eintragen — so lang er sein mag."
          aria-label="Gebetstext"
          aria-invalid={Boolean(sichtbar.text)}
          rows={8}
          className="sx"
          style={{
            marginTop: 10,
            width: '100%',
            resize: 'none',
            font: 'inherit',
            fontFamily: SERIF,
            fontSize: 19,
            lineHeight: 1.65,
            color: 'var(--ink)',
            background: 'var(--field)',
            border: `1px solid ${sichtbar.text ? 'var(--red-text)' : 'var(--rule)'}`,
            borderRadius: 10,
            padding: '12px 14px',
            outline: 'none',
          }}
        />
        {sichtbar.text && <Meldung>{sichtbar.text}</Meldung>}

        <div style={{ marginTop: 36 }}>
          <Ueberschrift>Kategorie — freiwillig</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          <Kategoriezeile
            name="Ohne Kategorie"
            gewaehlt={eingabe.kategorie === ''}
            waehlen={() => aendern('kategorie', '')}
          />
          {kategorien.map((k) => (
            <Kategoriezeile
              key={k.schluessel}
              name={k.name}
              gewaehlt={eingabe.kategorie === k.schluessel}
              waehlen={() => aendern('kategorie', k.schluessel)}
            />
          ))}
          {!alleZeigen && (
            <>
              <button
                onClick={() => setAlleZeigen(true)}
                style={{ minHeight: 56, display: 'flex', alignItems: 'center', width: '100%', fontSize: 15, color: 'var(--faint)' }}
              >
                Alle Kategorien zeigen
              </button>
              <Linie />
            </>
          )}
        </div>

        <div style={{ marginTop: 36 }}>
          <Ueberschrift>Wiederholungen — freiwillig</Ueberschrift>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            value={eingabe.wiederholungen}
            onChange={(e) => aendern('wiederholungen', e.target.value)}
            inputMode="numeric"
            placeholder="—"
            aria-label="Wiederholungen"
            aria-invalid={Boolean(sichtbar.wiederholungen)}
            style={{
              width: 92,
              flex: 'none',
              textAlign: 'center',
              fontSize: 17,
              color: 'var(--ink)',
              background: 'var(--field)',
              border: `1px solid ${sichtbar.wiederholungen ? 'var(--red-text)' : 'var(--rule)'}`,
              borderRadius: 8,
              padding: '10px 12px',
            }}
          />
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--faint)' }}>
            Mit einer Zahl (1–{WIEDERHOLUNGEN_MAX}) bekommst du beim Beten den Zähler wie beim Jesusgebet.
          </div>
        </div>
        {sichtbar.wiederholungen && <Meldung>{sichtbar.wiederholungen}</Meldung>}

        <div style={{ height: 36 }} />
        <div style={{ paddingBottom: 20 }}>
          <button
            onClick={sichern}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 10,
              background: 'var(--red)',
              color: 'var(--on-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 500,
              opacity: istGueltig(fehler) ? 1 : 0.5,
            }}
          >
            {bearbeiten ? 'Änderung sichern' : 'Gebet aufnehmen'}
          </button>
        </div>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}

function Meldung({ children }: { children: string }) {
  return (
    <div role="alert" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--red-text)' }}>
      {children}
    </div>
  )
}

function Kategoriezeile({ name, gewaehlt, waehlen }: { name: string; gewaehlt: boolean; waehlen: () => void }) {
  return (
    <>
      <button
        onClick={waehlen}
        style={{
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          color: gewaehlt ? undefined : 'var(--muted)',
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 20 }}>{name}</div>
        {gewaehlt && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red-text)' }} />}
      </button>
      <Linie />
    </>
  )
}
