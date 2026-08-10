/**
 * Selbst erzeugte Gebete (Spezifikation, Abschnitt 12): Anforderung beim Worker
 * und Ablage in Dexie. Einmal gespeichert, werden sie wie Korpuseinträge
 * behandelt (`gebetsauswahl.ts`) und laufen vollständig offline.
 */

import { db } from './db'
import { pruefeAntwort, type ErzeugungAnfrage, type ErzeugungAntwort } from './erzeugung'
import { TAGESZEITEN, type EigenesGebet, type Faerbung } from './types'

const WORKER = import.meta.env.VITE_WORKER_URL

/**
 * Fordert die drei Gebete beim Worker an und prüft sie auch clientseitig.
 * Gibt `null` zurück, wenn kein Netz, keine Konfiguration oder eine Prüfung
 * durchfällt — der Aufrufer fällt dann still auf den Platzhalter-Weg zurück.
 */
export async function gebeteAnfordern(anfrage: ErzeugungAnfrage): Promise<ErzeugungAntwort | null> {
  if (!WORKER) return null
  try {
    const res = await fetch(WORKER + '/erzeugen', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(anfrage),
    })
    if (!res.ok) return null
    const antwort = (await res.json()) as ErzeugungAntwort
    return pruefeAntwort(antwort, anfrage).gueltig ? antwort : null
  } catch {
    return null
  }
}

/** Die drei erzeugten Gebete eines Themas, geordnet Morgen/Mittag/Abend. */
export async function eigeneGebeteFuerThema(themaId: string): Promise<EigenesGebet[]> {
  const alle = await db.eigeneGebete.where('themaId').equals(themaId).toArray()
  return TAGESZEITEN.map((tz) => alle.find((g) => g.tageszeit === tz)).filter((g): g is EigenesGebet => Boolean(g))
}

/** Legt die drei Gebete eines Themas an und ersetzt dabei etwaige alte. */
export async function eigeneGebeteSpeichern(
  themaId: string,
  kategorie: string,
  faerbung: Faerbung,
  antwort: ErzeugungAntwort,
): Promise<void> {
  const jetzt = new Date().toISOString()
  await db.transaction('rw', db.eigeneGebete, async () => {
    const alt = await db.eigeneGebete.where('themaId').equals(themaId).primaryKeys()
    if (alt.length) await db.eigeneGebete.bulkDelete(alt)
    await db.eigeneGebete.bulkAdd(
      TAGESZEITEN.map((tz) => ({
        id: crypto.randomUUID(),
        kategorie,
        tageszeit: tz,
        faerbung,
        vers: antwort[tz].vers,
        stelle: antwort[tz].stelle,
        text: antwort[tz].text,
        istEigen: true as const,
        themaId,
        erstelltAm: jetzt,
      })),
    )
  })
}

/** Speichert eine Nachbearbeitung eines erzeugten Textes. */
export async function eigenesGebetBearbeiten(id: string, text: string): Promise<void> {
  await db.eigeneGebete.update(id, { text, bearbeitetAm: new Date().toISOString() })
}

export async function eigenesGebetNachId(id: string): Promise<EigenesGebet | undefined> {
  return db.eigeneGebete.get(id)
}
