/**
 * Dexie-Schema (Spezifikation, Abschnitt 3 und 4).
 *
 * IndexedDB ist die Wahrheit; Firestore kommt erst in Bauabschnitt 9 dazu und
 * bleibt Beiwerk. Das Korpus wird nicht hier gehalten, sondern liegt als
 * statisches JSON in `data/` — nur selbst erzeugte Gebete kommen in die
 * Datenbank.
 *
 * Zu den Indizes: IndexedDB kennt keine booleschen Schlüssel. `istEigen`,
 * `aktiv`, `benachrichtigung` und `heiligentagAnzeigen` sind deshalb bewusst
 * nicht indiziert und werden im Speicher gefiltert. Bei einem einzigen Nutzer
 * ist das folgenlos.
 */

import Dexie, { type Table } from 'dexie';

import {
  EINSTELLUNGEN_ID,
  type EigenesGebet,
  type Einstellungen,
  type Gebetseintrag,
  type Gebetszeit,
  type Gedenkname,
  type Journaleintrag,
  type Tageszeit,
  type Thema,
} from './types';

export class GebetsDatenbank extends Dexie {
  themen!: Table<Thema, string>;
  gebetszeiten!: Table<Gebetszeit, Tageszeit>;
  protokoll!: Table<Gebetseintrag, string>;
  gedenknamen!: Table<Gedenkname, string>;
  journal!: Table<Journaleintrag, string>;
  einstellungen!: Table<Einstellungen, string>;
  eigeneGebete!: Table<EigenesGebet, string>;

  constructor() {
    super('gebet');

    this.version(1).stores({
      themen: 'id, status, kategorie, erstelltAm',
      gebetszeiten: 'typ',
      // Der zusammengesetzte Index trägt die Regel „ein Gebet je Tag und
      // Tageszeit" — mehrmaliges Öffnen darf den Text nicht wechseln.
      protokoll: 'id, &[datum+tageszeit], datum, korpusId, modulId',
      gedenknamen: 'id, art, name',
      journal: 'id, gebetId, datum',
      einstellungen: 'id',
      eigeneGebete: 'id, themaId, [kategorie+tageszeit]',
    });

    this.on('populate', () => {
      void this.einstellungen.add(STANDARD_EINSTELLUNGEN);
      void this.gebetszeiten.bulkAdd(STANDARD_GEBETSZEITEN);
    });
  }
}

export const db = new GebetsDatenbank();

// ---------------------------------------------------------------------------
// Anfangsbestand
// ---------------------------------------------------------------------------

/** Die drei Zeiten aus Konzept 2.1. Benachrichtigungen bleiben zunächst aus:
 *  Die Berechtigung wird erst nach einem echten Tippen in den Einstellungen
 *  angefragt, auf iOS scheitert sie sonst (Spezifikation, Abschnitt 7). */
export const STANDARD_GEBETSZEITEN: readonly Gebetszeit[] = [
  { typ: 'morgen', uhrzeit: '07:00', aktiv: true, benachrichtigung: false },
  { typ: 'mittag', uhrzeit: '12:30', aktiv: true, benachrichtigung: false },
  { typ: 'abend', uhrzeit: '21:00', aktiv: true, benachrichtigung: false },
];

export const STANDARD_EINSTELLUNGEN: Einstellungen = {
  id: EINSTELLUNGEN_ID,
  jesusgebetAnzahl: 12,
  heiligentagAnzeigen: true,
  erscheinungsbild: 'system',
};

// ---------------------------------------------------------------------------
// Zugriff
// ---------------------------------------------------------------------------

/**
 * Liest die Einstellungen. Fällt auf den Anfangsbestand zurück, solange die
 * Datenbank noch nicht befüllt ist — keine Ansicht soll darauf warten müssen.
 */
export async function einstellungenLesen(): Promise<Einstellungen> {
  return (await db.einstellungen.get(EINSTELLUNGEN_ID)) ?? STANDARD_EINSTELLUNGEN;
}

export async function einstellungenSchreiben(
  aenderung: Partial<Omit<Einstellungen, 'id'>>,
): Promise<void> {
  await db.transaction('rw', db.einstellungen, async () => {
    const vorher = await einstellungenLesen();
    await db.einstellungen.put({ ...vorher, ...aenderung, id: EINSTELLUNGEN_ID });
  });
}

/** Die drei Gebetszeiten in der Reihenfolge Morgen, Mittag, Abend. */
export async function gebetszeitenLesen(): Promise<Gebetszeit[]> {
  const gespeichert = await db.gebetszeiten.toArray();
  if (gespeichert.length === 0) return [...STANDARD_GEBETSZEITEN];

  const nachTyp = new Map(gespeichert.map((zeit) => [zeit.typ, zeit]));
  return STANDARD_GEBETSZEITEN.map((standard) => nachTyp.get(standard.typ) ?? standard);
}
