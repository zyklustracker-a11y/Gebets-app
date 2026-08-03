import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Linie, RAND, SERIF, Ueberschrift, ZurueckWinkel, bildschirm, obenSafe, untenSafe } from '../components/ui'
import { KATEGORIEN, kategorieName } from '../lib/kategorien'
import { korpusFuer } from '../lib/korpus'
import { meineGebeteLesen } from '../lib/meineGebete'
import { TAGESZEITEN, type Korpuseintrag, type MeinGebet, type Tageszeit } from '../lib/types'

/**
 * Bildschirm · Gebete — die Übersicht über alles Gebetete.
 *
 * Oben die selbst angelegten Gebete, dezent als solche vermerkt; darunter das
 * mitgelieferte Korpus nach Kategorien, zum Nachlesen. Nur die eigenen sind
 * antippbar zum Bearbeiten — die mitgelieferten bleiben, wie sie sind.
 */

const TAGESZEIT_LABEL: Record<Tageszeit, string> = { morgen: 'Morgen', mittag: 'Mittag', abend: 'Abend' }

export default function Gebete() {
  const navigate = useNavigate()
  const meine = useLiveQuery(() => meineGebeteLesen(), [])

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0` }}>
        <button onClick={() => navigate('/einstellungen')} aria-label="Zurück zu Einstellungen" style={{ padding: 8, margin: -8 }}>
          <ZurueckWinkel />
        </button>
      </div>

      <div style={{ flex: 1, padding: `14px ${RAND}px 0` }}>
        <div style={{ fontFamily: SERIF, fontSize: 28 }}>Gebete</div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Die mitgelieferten Gebete zum Nachlesen — und deine eigenen, die du selbst anlegen und ändern kannst.
        </div>

        <div style={{ marginTop: 36 }}>
          <Ueberschrift>Eigene Gebete</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {(meine ?? []).map((gebet) => (
            <EigeneZeile key={gebet.id} gebet={gebet} oeffnen={() => navigate(`/gebete/${gebet.id}`)} />
          ))}
          {meine && meine.length === 0 && (
            <>
              <div style={{ padding: '18px 0', fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--faint)' }}>
                Noch kein eigenes Gebet. Hast du eines bekommen — etwa von einem Priester —, kannst du es unten aufnehmen.
              </div>
              <Linie />
            </>
          )}
        </div>

        <div style={{ marginTop: 34 }}>
          <Ueberschrift>Mitgelieferte Gebete</Ueberschrift>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {KATEGORIEN.map((kategorie) => (
            <Kategorieblock key={kategorie.schluessel} schluessel={kategorie.schluessel} name={kategorie.name} />
          ))}
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
        <button onClick={() => navigate('/gebete/neu')} style={{ fontSize: 15, color: 'var(--red-text)' }}>
          Eigenes Gebet hinzufügen
        </button>
      </div>
      <div style={{ height: untenSafe }} />
    </div>
  )
}

/** Eine Zeile der eigenen Gebete — mit dezentem Vermerk und Kategorie. */
function EigeneZeile({ gebet, oeffnen }: { gebet: MeinGebet; oeffnen: () => void }) {
  const beiwerk = [
    'Eigenes Gebet',
    gebet.kategorie ? kategorieName(gebet.kategorie) : null,
    gebet.wiederholungen ? `${gebet.wiederholungen}×` : null,
  ].filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={oeffnen}
        style={{ minHeight: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <div style={{ fontFamily: SERIF, fontSize: 20 }}>{gebet.titel}</div>
          <div style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--faint)' }}>{beiwerk.join(' · ')}</div>
        </div>
        <span style={{ display: 'inline-flex', transform: 'scaleX(-1)', flex: 'none' }}>
          <ZurueckWinkel />
        </span>
      </button>
      <Linie />
    </div>
  )
}

/** Eine Kategorie des Korpus, die sich zum Nachlesen aufklappen lässt. */
function Kategorieblock({ schluessel, name }: { schluessel: string; name: string }) {
  const [offen, setOffen] = useState(false)
  const gebete = TAGESZEITEN.flatMap((tz) => korpusFuer(schluessel, tz))

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        style={{ minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%' }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 20, color: offen ? 'var(--ink)' : undefined }}>{name}</div>
        <div style={{ fontSize: 13, color: 'var(--faint)' }}>{gebete.length}</div>
      </button>
      <Linie />
      {offen && (
        <div style={{ padding: '4px 0 14px' }}>
          {gebete.map((gebet) => (
            <Korpuszeile key={gebet.id} gebet={gebet} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Ein mitgeliefertes Gebet — nur zum Lesen, ohne Ändern und ohne Löschen. */
function Korpuszeile({ gebet }: { gebet: Korpuseintrag }) {
  const [offen, setOffen] = useState(false)

  return (
    <div style={{ paddingLeft: 14, borderLeft: '1px solid var(--rule)', marginTop: 10 }}>
      <button
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, width: '100%', padding: '6px 0' }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          {TAGESZEIT_LABEL[gebet.tageszeit]}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--muted)' }}>
          {gebet.stelle}
        </div>
      </button>
      {offen && (
        <div style={{ padding: '6px 0 10px', fontFamily: SERIF, fontSize: 18, lineHeight: 1.65, textWrap: 'pretty' }}>
          {gebet.text}
        </div>
      )}
    </div>
  )
}
