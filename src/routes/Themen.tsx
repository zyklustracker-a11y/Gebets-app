import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, bildschirm, obenSafe, untenSafe } from '../components/ui'

/**
 * Bildschirm 4 · Themen — eigene Themen und Kategorien an- und abwählen.
 * Angetippte Themen kommen in den nächsten Gebeten vor. Fest verdrahtete
 * Beispieldaten.
 */

interface EigenesThema {
  titel: string
  aktiv: boolean
}

const EIGENE: EigenesThema[] = [
  { titel: 'Geduld mit meinem Vater', aktiv: true },
  { titel: 'Klarheit über den Jobwechsel', aktiv: true },
  { titel: 'Umzug in eine andere Stadt', aktiv: false },
]

const AKTIVE_KATEGORIEN = new Set(['Familie', 'Arbeit & Berufung', 'Geduld'])

const KATEGORIEN = [
  'Familie',
  'Arbeit & Berufung',
  'Gesundheit',
  'Angst & Sorge',
  'Zorn & Vergebung',
  'Dankbarkeit',
  'Reue & Umkehr',
  'Geduld',
  'Entscheidungen',
  'Verstorbene',
]

function Punkt({ sichtbar }: { sichtbar: boolean }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: sichtbar ? 'var(--red-text)' : 'transparent',
        flex: 'none',
      }}
    />
  )
}

export default function Themen() {
  const navigate = useNavigate()

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ flex: 1, padding: `22px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Themen</div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Angetippte Themen kommen in den nächsten Gebeten vor.
        </div>

        <div style={{ marginTop: 36 }}>
          <Ueberschrift>Eigene Themen</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {EIGENE.map((thema) => (
            <div key={thema.titel} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  minHeight: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  color: thema.aktiv ? undefined : 'var(--faint)',
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 20 }}>{thema.titel}</div>
                <Punkt sichtbar={thema.aktiv} />
              </div>
              <Linie />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <Ueberschrift>Kategorien</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {KATEGORIEN.map((name) => {
            const aktiv = AKTIVE_KATEGORIEN.has(name)
            return (
              <div key={name} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    minHeight: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    color: aktiv ? 'var(--ink)' : 'var(--faint)',
                  }}
                >
                  <div style={{ fontFamily: SERIF, fontSize: 20 }}>{name}</div>
                  <Punkt sichtbar={aktiv} />
                </div>
                <Linie />
              </div>
            )
          })}
        </div>
        <div style={{ height: 24 }} />
      </div>

      <div
        style={{
          padding: `14px ${RAND}px 0`,
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          minHeight: 56,
        }}
      >
        <button onClick={() => navigate('/themen/neu')} style={{ fontSize: 15, color: 'var(--red-text)' }}>
          Eigenes Thema hinzufügen
        </button>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
