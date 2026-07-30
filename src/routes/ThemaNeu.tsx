import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { KATEGORIEN } from '../lib/kategorien'
import { themaAnlegen } from '../lib/themen'

/**
 * Bildschirm 5 · Neues Thema — Freitext und Kategorie für ein eigenes Anliegen.
 * Legt beim Aufnehmen ein aktives Thema in der Datenbank an.
 */

// Zunächst eine kleine Auswahl; „Alle Kategorien zeigen" klappt den Rest auf.
const VORAUSWAHL = ['familie', 'geduld', 'zorn']

export default function ThemaNeu() {
  const navigate = useNavigate()
  const [titel, setTitel] = useState('')
  const [kategorie, setKategorie] = useState('familie')
  const [alleZeigen, setAlleZeigen] = useState(false)

  const sichtbar = alleZeigen
    ? KATEGORIEN
    : KATEGORIEN.filter((k) => VORAUSWAHL.includes(k.schluessel) || k.schluessel === kategorie)

  async function aufnehmen() {
    if (!titel.trim()) return
    await themaAnlegen(titel, kategorie)
    navigate('/themen')
  }

  return (
    <div style={bildschirm}>
      <div style={{ padding: `${obenSafe} ${RAND}px 8px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/themen')} style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>
          Abbrechen
        </button>
      </div>

      <div style={{ flex: 1, padding: `30px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.5, color: 'var(--muted)' }}>
          Was beschäftigt dich gerade?
        </div>

        <input
          autoFocus
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Geduld mit meinem Vater"
          style={{
            marginTop: 20,
            paddingBottom: 14,
            borderBottom: '1px solid var(--rule)',
            fontFamily: SERIF,
            fontSize: 21,
            lineHeight: 1.6,
            color: 'var(--ink)',
          }}
        />

        <div style={{ marginTop: 44 }}>
          <Ueberschrift>Kategorie</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {sichtbar.map((k) => {
            const gewaehlt = k.schluessel === kategorie
            return (
              <div key={k.schluessel} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => setKategorie(k.schluessel)}
                  style={{
                    minHeight: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    color: gewaehlt ? undefined : 'var(--muted)',
                  }}
                >
                  <div style={{ fontFamily: SERIF, fontSize: 20 }}>{k.name}</div>
                  {gewaehlt && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red-text)' }} />}
                </button>
                <Linie />
              </div>
            )
          })}
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

        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: 20 }}>
          <button
            onClick={aufnehmen}
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
              opacity: titel.trim() ? 1 : 0.5,
            }}
          >
            Thema aufnehmen
          </button>
        </div>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
