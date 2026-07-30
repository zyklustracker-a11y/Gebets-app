import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, bildschirm, obenSafe, untenSafe } from '../components/ui'

/**
 * Bildschirm 5 · Neues Thema — Freitext und Kategorie für ein eigenes Anliegen.
 * Fest verdrahtete Beispieldaten; die Eingabe wird in Bauabschnitt 4 lebendig.
 */

interface Kategorie {
  name: string
  gewaehlt: boolean
}

const KATEGORIEN: Kategorie[] = [
  { name: 'Familie', gewaehlt: true },
  { name: 'Geduld', gewaehlt: false },
  { name: 'Zorn & Vergebung', gewaehlt: false },
]

export default function ThemaNeu() {
  const navigate = useNavigate()

  return (
    <div style={bildschirm}>
      <div
        style={{
          padding: `${obenSafe} ${RAND}px 8px`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <button onClick={() => navigate('/themen')} style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>
          Abbrechen
        </button>
      </div>

      <div style={{ flex: 1, padding: `30px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.5, color: 'var(--muted)' }}>
          Was beschäftigt dich gerade?
        </div>

        <div
          style={{
            marginTop: 20,
            paddingBottom: 14,
            borderBottom: '1px solid var(--rule)',
            fontFamily: SERIF,
            fontSize: 21,
            lineHeight: 1.6,
            minHeight: 34,
          }}
        >
          Geduld mit meinem Vater
          <span
            style={{
              display: 'inline-block',
              width: 1.5,
              height: 22,
              background: 'var(--red)',
              verticalAlign: -4,
              marginLeft: 2,
            }}
          />
        </div>

        <div style={{ marginTop: 44 }}>
          <Ueberschrift>Kategorie</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {KATEGORIEN.map((kategorie) => (
            <div key={kategorie.name} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  minHeight: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: kategorie.gewaehlt ? undefined : 'var(--muted)',
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 20 }}>{kategorie.name}</div>
                {kategorie.gewaehlt && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red-text)' }} />
                )}
              </div>
              <Linie />
            </div>
          ))}
          <div style={{ minHeight: 56, display: 'flex', alignItems: 'center', color: 'var(--faint)' }}>
            <div style={{ fontSize: 15 }}>Alle Kategorien zeigen</div>
          </div>
          <Linie />
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: 20 }}>
          <button
            onClick={() => navigate('/themen')}
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
