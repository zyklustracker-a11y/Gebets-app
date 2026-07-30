/**
 * Datenmodell nach `docs/3_Technische_Spezifikation.md`, Abschnitt 4.
 *
 * Die Bezeichner bleiben deutsch, damit Konzept und Code beieinander bleiben
 * (Spezifikation, Abschnitt 11).
 */

export type Tageszeit = 'morgen' | 'mittag' | 'abend';

export const TAGESZEITEN: readonly Tageszeit[] = ['morgen', 'mittag', 'abend'];

/**
 * Die Färbung bleibt im Modell erhalten, steht aber vorerst durchgehend auf
 * `gewoehnlich`: Die liturgische Zeit liefert zur Laufzeit das Modulsystem
 * (Spezifikation, Abschnitt 14), nicht eine eigene Korpusfassung je Färbung.
 */
export type Faerbung = 'gewoehnlich' | 'fastenzeit' | 'osterzeit' | 'trauer';

export type Status = 'aktiv' | 'pausiert' | 'erhoert';

export type Erscheinungsbild = 'system' | 'hell' | 'dunkel';

export type JesusgebetAnzahl = 12 | 33 | 100;

export const JESUSGEBET_ANZAHLEN: readonly JesusgebetAnzahl[] = [12, 33, 100];

// ---------------------------------------------------------------------------
// Was in IndexedDB liegt
// ---------------------------------------------------------------------------

export interface Thema {
  id: string;
  /** Bei Kategorien der Kategoriename, bei eigenen Themen der Freitext. */
  titel: string;
  /** Schlüssel ins Korpus. */
  kategorie: string;
  istEigen: boolean;
  status: Status;
  /** ISO-Zeitstempel. */
  erstelltAm: string;
  abgeschlossenAm?: string;
  /** Antwort auf „Wie hat Gott geantwortet?" */
  notiz?: string;
  /**
   * Schalter „Nicht an die KI senden" (Spezifikation, Abschnitt 12). Ist er
   * gesetzt, erscheint die Schaltfläche zum Erzeugen eigener Gebete gar nicht.
   */
  keineErzeugung?: boolean;
}

export interface Gebetszeit {
  typ: Tageszeit;
  /** "07:00" — Ortszeit. */
  uhrzeit: string;
  aktiv: boolean;
  benachrichtigung: boolean;
}

/**
 * Protokoll, was wann gebetet wurde. Hält die Auswahl fest, damit dasselbe
 * (Datum, Tageszeit) beim erneuten Öffnen denselben Text zeigt.
 *
 * Das Feld `versId` aus der Spezifikation entfällt: Das Schriftwort gehört
 * fest zum Korpuseintrag (siehe `docs/9_Entscheidungen.md`, Nummer 4),
 * `korpusId` bestimmt es also mit.
 */
export interface Gebetseintrag {
  id: string;
  /** "2026-07-30" */
  datum: string;
  tageszeit: Tageszeit;
  korpusId: string;
  themenIds: string[];
  /** ISO-Zeitstempel, gesetzt beim Tippen auf „Gebetet". */
  gebetetAm?: string;
}

export interface Gedenkname {
  id: string;
  name: string;
  art: 'lebend' | 'entschlafen';
  aktiv: boolean;
}

export interface Journaleintrag {
  id: string;
  gebetId: string;
  datum: string;
  text: string;
}

export const EINSTELLUNGEN_ID = 'einstellungen';

export interface Einstellungen {
  /** Immer `EINSTELLUNGEN_ID` — die Tabelle hält genau einen Datensatz. */
  id: string;
  jesusgebetAnzahl: JesusgebetAnzahl;
  heiligentagAnzeigen: boolean;
  erscheinungsbild: Erscheinungsbild;
  kontoId?: string;
}

// ---------------------------------------------------------------------------
// Was mit der App ausgeliefert wird (`data/*.json`)
// ---------------------------------------------------------------------------

/**
 * Ein Grundgebet aus `data/gebete.json`.
 *
 * Schriftwort und Stellenangabe stehen direkt am Eintrag: Der Vers gehört zur
 * Komposition des Gebets und wird nicht täglich neu zugelost.
 */
export interface Korpuseintrag {
  id: string;
  kategorie: string;
  tageszeit: Tageszeit;
  faerbung: Faerbung;
  /** Das Schriftwort über dem Gebet, eigene Übertragung. */
  vers: string;
  /** Stellenangabe in Septuaginta-Zählung, etwa "Psalm 89,17". */
  stelle: string;
  /** Enthält `{{anliegen}}` als eigenständigen Satz. */
  text: string;
}

/**
 * Ein für ein eigenes Thema erzeugtes Gebet (Spezifikation, Abschnitt 12).
 * Liegt in IndexedDB und wird sonst wie ein Korpuseintrag behandelt.
 */
export interface EigenesGebet extends Korpuseintrag {
  istEigen: true;
  themaId: string;
  erstelltAm: string;
  /** Gesetzt, sobald der Text in der App bearbeitet wurde. */
  bearbeitetAm?: string;
}

/**
 * Ein Schriftwort aus `data/verse.json`. Reservoir für die Gebetserzeugung
 * und für Erweiterungen des Korpus — nicht für die tägliche Auswahl.
 */
export interface Vers {
  id: string;
  text: string;
  /** Septuaginta-Zählung. */
  stelle: string;
  /** Masoretische Zählung, zum Nachschlagen in westlichen Ausgaben. */
  stelleMasoretisch: string;
  kategorien: string[];
  /** Liturgische Zuordnung, sonst `null`. */
  liturgisch: string | null;
}

export type Modultyp =
  | 'osterkreis'
  | 'fest'
  | 'fastenzeit'
  | 'gedenken'
  | 'heiliger'
  | 'wochentag';

/**
 * Ein liturgisches Modul aus `data/module.json` (siehe
 * `docs/7_Liturgische_Module.md`, Teil H). Es ersetzt das Grundgebet nicht,
 * sondern liefert nur, was sich ändert.
 *
 * Prioritäten, niedrigster Wert gewinnt; es greift immer nur ein Modul:
 * Ostern und Karwoche 10 · zwölf Feste 20 · Fastenzeiten 30 · weitere Feste 40
 * · Gedenken der Entschlafenen 45 · Heiligengedenken 50 · Sonntag 60 ·
 * Mittwoch und Freitag 70.
 */
export interface Modul {
  id: string;
  typ: Modultyp;
  prioritaet: number;
  /** Ersetzt die gewöhnliche Eröffnung, sonst `null`. */
  eroeffnung: string | null;
  /** Wird nach dem Themengebet und vor der Fürbitte eingefügt. */
  einschub: Record<Tageszeit, string | null>;
  /** Wird der Fürbitte vorangestellt, sonst `null`. */
  fuerbitteZusatz: string | null;
  /** Ersetzt die gewöhnliche Schlussformel, sonst `null`. */
  schluss: string | null;
  /** Kennung eines zusätzlichen festen Gebets, etwa "ephraem". */
  zusatzgebet?: string | null;
}

/**
 * Ein Eintrag aus `data/heilige.json`. Monat und Tag sind julianisch und
 * werden beim Vergleich um 13 Tage verschoben (Spezifikation, Abschnitt 5).
 */
export interface Heiligentag {
  /** 1–12, julianisch. */
  monat: number;
  /** 1–31, julianisch. */
  tag: number;
  /** Name für die Zeile „Heiliger des Tages" und für die Fürbitte. */
  name: string;
  /** Name des Festes, falls es sich um ein Fest handelt. */
  fest?: string;
  /** Kennung eines Moduls, das an diesem Tag greift. */
  modulId?: string;
}
