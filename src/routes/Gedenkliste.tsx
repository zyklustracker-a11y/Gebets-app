import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { db } from '../lib/db'
import { gedenknameAnlegen, gedenknameLoeschen, gedenknameUmschalten, type Gedenkart } from '../lib/gedenken'
import type { Gedenkname } from '../lib/types'

/**
 * Gedenkliste (Spezifikation, Abschnitt 11). Zwei Listen — Lebende und
 * Entschlafene. Angetippte Namen fliessen in die Fürbitte des Gebets ein;
 * ruhende Namen bleiben in der Liste, ohne genannt zu werden.
 */

function Punkt({ sichtbar }: { sichtbar: boolean }) {
  return (
    <span
      style={{ width: 7, height: 7, borderRadius: '50%', background: sichtbar ? 'var(--red-text)' : 'transparent', flex: 'none' }}
    />
  )
}

function Zeile({ eintrag }: { eintrag: Gedenkname }) {
  const [entfernen, setEntfernen] = useState(false)
  const aktiv = eintrag.aktiv
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 58 }}>
        <button
          onClick={() => gedenknameUmschalten(eintrag.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            color: aktiv ? undefined : 'var(--faint)',
          }}
          aria-label={`${eintrag.name} ${aktiv ? 'ruhen lassen' : 'in die Fürbitte aufnehmen'}`}
        >
          <span style={{ fontFamily: SERIF, fontSize: 20 }}>{eintrag.name}</span>
          <Punkt sichtbar={aktiv} />
        </button>
        {entfernen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setEntfernen(false)}
              style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}
            >
              Behalten
            </button>
            <button
              onClick={() => gedenknameLoeschen(eintrag.id)}
              style={{ fontSize: 13, color: 'var(--red-text)', padding: '8px 0 8px 4px' }}
            >
              Entfernen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEntfernen(true)}
            aria-label={`${eintrag.name} entfernen`}
            style={{ fontSize: 22, color: 'var(--faint)', padding: '8px 0 8px 10px', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>
      <Linie />
    </div>
  )
}

function Liste({ art, titel, hinweis }: { art: Gedenkart; titel: string; hinweis: string }) {
  const [neu, setNeu] = useState('')

  const namen = useLiveQuery(async () => {
    const alle = await db.gedenknamen.toArray()
    return alle.filter((g) => g.art === art).sort((a, b) => a.name.localeCompare(b.name, 'de'))
  }, [art])

  async function aufnehmen() {
    const sauber = neu.trim()
    if (!sauber) return
    await gedenknameAnlegen(sauber, art)
    setNeu('')
  }

  return (
    <div style={{ marginTop: 34 }}>
      <Ueberschrift>{titel}</Ueberschrift>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <Linie />
        {(namen ?? []).map((eintrag) => (
          <Zeile key={eintrag.id} eintrag={eintrag} />
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 58 }}>
          <input
            value={neu}
            onChange={(e) => setNeu(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void aufnehmen()
            }}
            placeholder={hinweis}
            style={{ flex: 1, fontFamily: SERIF, fontSize: 20, color: 'var(--ink)' }}
          />
          <button
            onClick={aufnehmen}
            aria-label={`${titel}: Namen aufnehmen`}
            style={{ fontSize: 14, color: neu.trim() ? 'var(--red-text)' : 'var(--faint)', padding: '8px 0 8px 10px' }}
          >
            Aufnehmen
          </button>
        </div>
        <Linie />
      </div>
    </div>
  )
}

export default function Gedenkliste() {
  const navigate = useNavigate()

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate('/einstellungen')} aria-label="Zurück zu den Einstellungen" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Gedenkliste</div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Angetippte Namen werden in der Fürbitte genannt — morgens und abends.
        </div>

        <Liste art="lebend" titel="Für die Lebenden" hinweis="Namen hinzufügen" />
        <Liste art="entschlafen" titel="Für die Entschlafenen" hinweis="Namen hinzufügen" />

        <div style={{ height: 24 }} />
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
