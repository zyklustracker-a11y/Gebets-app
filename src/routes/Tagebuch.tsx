import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { tagebuchLesen, type TagebuchZeile } from '../lib/tagebuch'
import type { Tageszeit } from '../lib/types'

/**
 * Gebetstagebuch (Spezifikation, Abschnitt 11). Die nach dem Gebet
 * festgehaltenen Sätze, neueste zuerst, nach Thema filterbar.
 */

const TAGESZEIT_LABEL: Record<Tageszeit, string> = { morgen: 'Morgen', mittag: 'Mittag', abend: 'Abend' }

function datumLang(iso: string): string {
  const [j, m, t] = iso.split('-')
  const datum = new Date(Date.UTC(Number(j), Number(m) - 1, Number(t)))
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(datum)
}

function Filterchip({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 'none',
        height: 34,
        padding: '0 14px',
        borderRadius: 8,
        fontSize: 14,
        background: aktiv ? 'var(--red)' : 'transparent',
        color: aktiv ? 'var(--on-red)' : 'var(--muted)',
        border: `1px solid ${aktiv ? 'var(--red)' : 'var(--rule)'}`,
      }}
    >
      {label}
    </button>
  )
}

function Eintrag({ zeile }: { zeile: TagebuchZeile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 12, letterSpacing: '0.06em', color: 'var(--faint)' }}>
          <span style={{ textTransform: 'uppercase' }}>{datumLang(zeile.datum)}</span>
          {zeile.tageszeit && <span>· {TAGESZEIT_LABEL[zeile.tageszeit]}</span>}
        </div>
        <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, textWrap: 'pretty' }}>{zeile.text}</div>
        {zeile.themen.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>{zeile.themen.join(' · ')}</div>
        )}
      </div>
      <Linie />
    </div>
  )
}

export default function Tagebuch() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string | null>(null)

  const zeilen = useLiveQuery(() => tagebuchLesen(), [])

  // Die Themen, zu denen es überhaupt Einträge gibt — nur die lassen sich filtern.
  const themen = useMemo(() => {
    const gesehen = new Map<string, string>()
    for (const z of zeilen ?? []) {
      z.themenIds.forEach((id, i) => {
        const titel = z.themen[i]
        if (titel && !gesehen.has(id)) gesehen.set(id, titel)
      })
    }
    return [...gesehen.entries()].sort((a, b) => a[1].localeCompare(b[1], 'de'))
  }, [zeilen])

  const gefiltert = (zeilen ?? []).filter((z) => !filter || z.themenIds.includes(filter))

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate('/einstellungen')} aria-label="Zurück zu den Einstellungen" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0`, minHeight: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Tagebuch</div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Was du nach den Gebeten festgehalten hast.
        </div>

        {themen.length > 0 && (
          <div className="sx" style={{ marginTop: 20, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            <Filterchip label="Alle" aktiv={filter === null} onClick={() => setFilter(null)} />
            {themen.map(([id, titel]) => (
              <Filterchip key={id} label={titel} aktiv={filter === id} onClick={() => setFilter(id)} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {gefiltert.map((zeile) => (
            <Eintrag key={zeile.id} zeile={zeile} />
          ))}
        </div>

        {zeilen && gefiltert.length === 0 && (
          <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--faint)' }}>
            {filter ? 'Zu diesem Thema noch nichts festgehalten.' : 'Noch nichts festgehalten. Nach einem Gebet kannst du einen Satz notieren.'}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}
