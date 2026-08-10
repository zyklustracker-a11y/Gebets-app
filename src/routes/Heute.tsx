import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Haken,
  Kreuz,
  Linie,
  Liste,
  Overlay,
  RAND,
  SERIF,
  Ueberschrift,
  Zahnrad,
  bildschirm,
  obenSafe,
  untenSafe,
} from '../components/ui'
import { db } from '../lib/db'
import { datumIso } from '../lib/gebetsauswahl'
import { festDesTages, heiligerDesTages, heutigerTag } from '../lib/kalender'
import { KATEGORIEN } from '../lib/kategorien'
import { themenZusammenfassung } from '../lib/themen'
import type { Tageszeit } from '../lib/types'

/**
 * Bildschirm 1 · Heute — Tagesübersicht mit den drei Gebetszeiten, an die
 * echten Daten angebunden. Das Zahnrad oben führt zu den Einstellungen; es ist
 * die einzige Navigationsmarke der App.
 *
 * Neben jeder Gebetszeit steht ein kleiner Knopf für die einmalige Themenwahl.
 * Die Karte selbst führt unverändert zum Gebet aus den aktiven Themen; der
 * Knopf öffnet die Auswahl und ruft `/gebet/:tageszeit?thema=…` auf. Diese Wahl
 * gilt nur für den einen Durchgang und ändert an den Themen nichts.
 */

const TITEL: Record<Tageszeit, string> = { morgen: 'Morgen', mittag: 'Mittag', abend: 'Abend' }

function minuten(uhrzeit: string): number {
  const [h, m] = uhrzeit.split(':')
  return Number(h) * 60 + Number(m)
}

export default function Heute() {
  const navigate = useNavigate()
  const heute = heutigerTag()
  const datum = datumIso(heute)

  // Für welche Gebetszeit die einmalige Themenwahl offen ist; sonst null.
  const [auswahl, setAuswahl] = useState<Tageszeit | null>(null)

  const gebetszeiten = useLiveQuery(async () => {
    const alle = await db.gebetszeiten.toArray()
    return alle
      .filter((z) => z.aktiv)
      .sort((a, b) => minuten(a.uhrzeit) - minuten(b.uhrzeit))
  }, [])

  const gebetetHeute = useLiveQuery(async () => {
    const eintraege = await db.protokoll.where('datum').equals(datum).toArray()
    return new Set(eintraege.filter((e) => e.gebetetAm).map((e) => e.tageszeit))
  }, [datum])

  const aktiveAnzahl = useLiveQuery(async () => {
    const alle = await db.themen.where('status').equals('aktiv').toArray()
    return alle.length
  }, [])

  // Eigene Themen für die einmalige Themenwahl — erhörte bleiben weg.
  const eigeneThemen = useLiveQuery(async () => {
    const alle = await db.themen.orderBy('erstelltAm').toArray()
    return alle.filter((t) => t.istEigen && t.status !== 'erhoert')
  }, [])

  const heiligentagAnzeigen = useLiveQuery(
    async () => (await db.einstellungen.get('einstellungen'))?.heiligentagAnzeigen ?? true,
    [],
    true,
  )

  const gebetet = gebetetHeute ?? new Set<Tageszeit>()
  const zeiten = gebetszeiten ?? []

  // „Jetzt beten": die fällige Zeit — die letzte, deren Uhrzeit vorbei ist und
  // die heute noch nicht gebetet wurde; sonst die erste offene.
  const jetztMinuten = new Date().getHours() * 60 + new Date().getMinutes()
  const offen = zeiten.filter((z) => !gebetet.has(z.typ))
  const faellig =
    [...offen].reverse().find((z) => minuten(z.uhrzeit) <= jetztMinuten)?.typ ?? offen[0]?.typ ?? null

  const wochentag = new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'UTC' }).format(heute)
  const datumLang = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(heute)
  const heiligerZeile = festDesTages(heute) ?? heiligerDesTages(heute)

  return (
    <div style={bildschirm}>
      <div style={{ height: obenSafe }} />
      <div style={{ padding: `2px ${RAND}px 0`, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/einstellungen')} aria-label="Einstellungen" style={{ padding: 8, margin: -8 }}>
          <Zahnrad />
        </button>
      </div>

      <div style={{ flex: 1, padding: `18px ${RAND}px 0`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 30 }}>
          <Kreuz />
        </div>

        <div style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1.3, textTransform: 'capitalize' }}>
          {wochentag},
          <br />
          {datumLang}
        </div>
        {heiligentagAnzeigen && heiligerZeile && (
          <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{heiligerZeile}</div>
        )}

        <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column' }}>
          <Linie />
          {zeiten.map((zeit) => {
            const jetzt = zeit.typ === faellig
            const istGebetet = gebetet.has(zeit.typ)
            return (
              <div key={zeit.typ} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Karte und Themenknopf liegen nebeneinander, damit der kleine
                    Knopf den Haupt-Tippbereich nicht überlagert. */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: jetzt ? 'var(--field)' : undefined,
                    borderRadius: jetzt ? 10 : undefined,
                    padding: jetzt ? '0 18px' : undefined,
                    margin: jetzt ? '0 -18px' : undefined,
                  }}
                >
                  <button
                    onClick={() => navigate(`/gebet/${zeit.typ}`)}
                    style={{
                      flex: 1,
                      minHeight: jetzt ? 88 : 72,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      color: jetzt ? undefined : 'var(--muted)',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: jetzt ? 23 : 21, color: jetzt ? 'var(--ink)' : undefined }}>
                        {TITEL[zeit.typ]}
                      </div>
                      {jetzt && <div style={{ marginTop: 5, fontSize: 13, color: 'var(--red-text)' }}>Jetzt beten</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, color: 'var(--muted)' }}>
                      <span>{zeit.uhrzeit.replace(/^0/, '')}</span>
                      {istGebetet && <Haken />}
                    </div>
                  </button>
                  <button
                    onClick={() => setAuswahl(zeit.typ)}
                    aria-label={`Thema für das ${TITEL[zeit.typ]}gebet wählen`}
                    style={{
                      width: 46,
                      height: 46,
                      marginRight: -10,
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Liste />
                  </button>
                </div>
                <Linie />
              </div>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: untenSafe, fontSize: 13, color: 'var(--faint)' }}>
          {themenZusammenfassung(aktiveAnzahl ?? 0)}
        </div>
      </div>

      {auswahl && (
        <Overlay onSchliessen={() => setAuswahl(null)}>
          <div style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
            {TITEL[auswahl]}
          </div>
          <div style={{ marginTop: 12, fontFamily: SERIF, fontSize: 22, lineHeight: 1.4 }}>Wofür möchtest du beten?</div>
          <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
            Nur für dieses eine Gebet. Deine Themen bleiben, wie sie sind.
          </div>

          <div className="sx" style={{ marginTop: 18, maxHeight: '46vh', overflowY: 'auto' }}>
            {eigeneThemen && eigeneThemen.length > 0 && (
              <>
                <Ueberschrift>Eigene Themen</Ueberschrift>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
                  <Linie />
                  {eigeneThemen.map((thema) => (
                    <div key={thema.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <button
                        onClick={() => navigate(`/gebet/${auswahl}?thema=${encodeURIComponent(thema.id)}`)}
                        style={{ minHeight: 48, display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left' }}
                      >
                        <span style={{ fontFamily: SERIF, fontSize: 19 }}>{thema.titel}</span>
                      </button>
                      <Linie />
                    </div>
                  ))}
                </div>
                <div style={{ height: 22 }} />
              </>
            )}

            <Ueberschrift>Kategorien</Ueberschrift>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
              <Linie />
              {KATEGORIEN.map((kategorie) => (
                <div key={kategorie.schluessel} style={{ display: 'flex', flexDirection: 'column' }}>
                  <button
                    onClick={() => navigate(`/gebet/${auswahl}?thema=${kategorie.schluessel}`)}
                    style={{ minHeight: 48, display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ fontFamily: SERIF, fontSize: 19 }}>{kategorie.name}</span>
                  </button>
                  <Linie />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setAuswahl(null)}
            style={{ marginTop: 18, fontSize: 15, color: 'var(--muted)', padding: '6px 4px' }}
          >
            Abbrechen
          </button>
        </Overlay>
      )}
    </div>
  )
}
