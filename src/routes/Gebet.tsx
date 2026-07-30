import { useNavigate } from 'react-router-dom'

import { Kreuz, RAND, SERIF, bildschirm, obenSafe, untenSafe } from '../components/ui'

/**
 * Bildschirm 2 · Gebetsansicht — der Kernbildschirm. Ein zusammenhängender
 * Fluss von der Eröffnung bis zum Hinweis aufs Jesusgebet. Fest verdrahtete
 * Beispieldaten (Morgengebet).
 */

const ABSAETZE = [
  'Herr, Du kennst diesen Morgen, ehe er begonnen hat. Ich lege Dir mein Herz hin, wie es ist: unruhig, ungeduldig, voll eigener Pläne.',
  'Ich bringe Dir meinen Vater. Du hast ihn mir gegeben, und Du kennst jedes Wort, das zwischen uns steht. Nimm die Härte aus meiner Stimme und die Eile aus meinem Urteil. Lehre mich, ihn anzuhören, ohne mich zu verteidigen, und ihn zu ehren, auch wenn ich ihn nicht verstehe. Schenke mir Geduld, die nicht aus meiner Kraft kommt, sondern aus Deiner Barmherzigkeit.',
  'Ich bringe Dir meine Arbeit. Ich weiss nicht, welchen Weg ich gehen soll, und ich fürchte, das Falsche zu wählen. Nimm mir die Angst vor der Entscheidung. Zeige mir nicht alles, nur den nächsten Schritt, und gib mir den Mut, ihn zu gehen.',
  'Was dieser Tag mir bringt, nehme ich aus Deiner Hand. Dir vertraue ich mich an, jetzt und alle Tage. Amen.',
]

export default function Gebet() {
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
        <Kreuz />
      </div>

      <div style={{ flex: 1, padding: `6px ${RAND}px 0` }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          Morgengebet
        </div>

        <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--muted)' }}>
          Im Namen des Vaters, des Sohnes und des Heiligen Geistes.
        </div>

        <div style={{ marginTop: 30, paddingLeft: 16, borderLeft: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, lineHeight: 1.6, textWrap: 'pretty' }}>
            Erschaffe in mir ein reines Herz, Gott, und gib mir einen neuen, festen Geist.
          </div>
          <div style={{ marginTop: 10, fontSize: 12, letterSpacing: '0.06em', color: 'var(--faint)' }}>Psalm 50,12</div>
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
            gap: 18,
          }}
        >
          {ABSAETZE.map((absatz, i) => (
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
          Nun das Jesusgebet, 12 Mal.
        </button>
      </div>

      <div
        style={{
          padding: `18px ${RAND}px 0`,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          borderTop: '1px solid var(--rule)',
        }}
      >
        <button
          onClick={() => navigate('/')}
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
        <div style={{ height: 52, padding: '0 4px', display: 'flex', alignItems: 'center', fontSize: 15, color: 'var(--muted)' }}>
          Anderes Gebet
        </div>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
