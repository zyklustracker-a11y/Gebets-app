/**
 * Anmeldung und Abgleich (Spezifikation, Abschnitt 8).
 *
 * - Firebase Auth, ausschliesslich Google. Die Anmeldung ist optional; ohne
 *   Konto läuft alles lokal weiter. IndexedDB ist die Wahrheit, Firestore ist
 *   Beiwerk.
 * - Firestore spiegelt die lokalen Daten unter `nutzer/{uid}/…`. Das Korpus
 *   wird nicht abgeglichen.
 * - Beidseitig, bei Start und bei jeder Änderung. Letzter Schreibvorgang
 *   gewinnt (`geaendertAm`); keine Konfliktauflösung.
 *
 * Jeder Firestore-Fehler wird verschluckt — der lokale Betrieb darf nie darunter
 * leiden.
 */

import type { Table } from 'dexie'
import { useEffect, useState } from 'react'

import { db } from './db'
import { firebaseKonfiguriert, holeAuth, holeFirestore } from './firebase'

// Die abzugleichenden Tabellen (Spezifikation, Abschnitt 8). Gebetszeiten und
// das Korpus gehören bewusst nicht dazu.
type SyncSatz = { id: string; geaendertAm?: string; [feld: string]: unknown }
const TABELLEN: { name: string; tabelle: Table<SyncSatz, string> }[] = [
  { name: 'themen', tabelle: db.themen as unknown as Table<SyncSatz, string> },
  { name: 'gedenknamen', tabelle: db.gedenknamen as unknown as Table<SyncSatz, string> },
  { name: 'journal', tabelle: db.journal as unknown as Table<SyncSatz, string> },
  { name: 'protokoll', tabelle: db.protokoll as unknown as Table<SyncSatz, string> },
  { name: 'einstellungen', tabelle: db.einstellungen as unknown as Table<SyncSatz, string> },
]

const jetzt = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Anmeldung
// ---------------------------------------------------------------------------

export interface Konto {
  uid: string
  email: string
}

export function useKonto(): Konto | null {
  const [konto, setKonto] = useState<Konto | null>(null)

  useEffect(() => {
    if (!firebaseKonfiguriert()) return
    let abmelden = () => {}
    void (async () => {
      const auth = await holeAuth()
      const { onAuthStateChanged } = await import('firebase/auth')
      abmelden = onAuthStateChanged(auth, (nutzer) => {
        setKonto(nutzer ? { uid: nutzer.uid, email: nutzer.email ?? '' } : null)
      })
    })()
    return () => abmelden()
  }, [])

  return konto
}

export async function anmelden(): Promise<void> {
  const auth = await holeAuth()
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
  await signInWithPopup(auth, new GoogleAuthProvider())
}

export async function abmelden(): Promise<void> {
  const auth = await holeAuth()
  const { signOut } = await import('firebase/auth')
  await signOut(auth)
}

// ---------------------------------------------------------------------------
// Abgleich
// ---------------------------------------------------------------------------

type FirestoreModul = typeof import('firebase/firestore')
let fsModul: FirestoreModul | null = null
async function fs(): Promise<FirestoreModul> {
  if (!fsModul) fsModul = await import('firebase/firestore')
  return fsModul
}

/** Verhindert, dass vom Server angewandte Schreibvorgänge zurück-synchronisiert werden. */
let anwendungsTiefe = 0
let kette: Promise<void> = Promise.resolve()
function syncSchreiben(fn: () => Promise<void>): Promise<void> {
  kette = kette.then(async () => {
    anwendungsTiefe++
    try {
      await fn()
    } finally {
      anwendungsTiefe--
    }
  })
  return kette
}

function entfernenUndefiniert(obj: SyncSatz): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out
}

let aktiveUid: string | null = null
const schmutzig = new Map<string, Set<string>>()
const geloescht = new Map<string, Set<string>>()
const hookAbmeldungen: (() => void)[] = []
const snapshotAbmeldungen: (() => void)[] = []
let flushGeplant = false

function merken(karte: Map<string, Set<string>>, tabelle: string, id: string) {
  const menge = karte.get(tabelle) ?? new Set<string>()
  menge.add(id)
  karte.set(tabelle, menge)
}

function flushPlanen() {
  if (flushGeplant || !aktiveUid) return
  flushGeplant = true
  setTimeout(() => {
    flushGeplant = false
    void flush().catch(() => {})
  }, 250)
}

async function flush(): Promise<void> {
  const uid = aktiveUid
  if (!uid) return
  const { doc, setDoc, deleteDoc } = await fs()
  const datenbank = await holeFirestore()

  for (const { name, tabelle } of TABELLEN) {
    const zuSchreiben = schmutzig.get(name)
    if (zuSchreiben) {
      schmutzig.set(name, new Set())
      for (const id of zuSchreiben) {
        const satz = await tabelle.get(id)
        if (satz) await setDoc(doc(datenbank, 'nutzer', uid, name, id), entfernenUndefiniert(satz)).catch(() => {})
      }
    }
    const zuLoeschen = geloescht.get(name)
    if (zuLoeschen) {
      geloescht.set(name, new Set())
      for (const id of zuLoeschen) {
        await deleteDoc(doc(datenbank, 'nutzer', uid, name, id)).catch(() => {})
      }
    }
  }
}

function hooksRegistrieren() {
  for (const { name, tabelle } of TABELLEN) {
    const roh = tabelle as unknown as {
      hook(ereignis: 'creating', fn: (pk: string, obj: SyncSatz) => void): void
      hook(ereignis: 'updating', fn: (mods: Partial<SyncSatz>, pk: string) => Partial<SyncSatz> | void): void
      hook(ereignis: 'deleting', fn: (pk: string) => void): void
    }
    const beiCreate = (pk: string, obj: SyncSatz) => {
      if (anwendungsTiefe > 0) return
      obj.geaendertAm = jetzt()
      merken(schmutzig, name, obj.id ?? pk)
      flushPlanen()
    }
    const beiUpdate = (_mods: Partial<SyncSatz>, pk: string) => {
      if (anwendungsTiefe > 0) return
      merken(schmutzig, name, pk)
      flushPlanen()
      return { geaendertAm: jetzt() }
    }
    const beiDelete = (pk: string) => {
      if (anwendungsTiefe > 0) return
      merken(geloescht, name, pk)
      flushPlanen()
    }
    roh.hook('creating', beiCreate)
    roh.hook('updating', beiUpdate)
    roh.hook('deleting', beiDelete)
    const hookRoh = tabelle as unknown as { hook(e: string): { unsubscribe(fn: unknown): void } }
    hookAbmeldungen.push(
      () => hookRoh.hook('creating').unsubscribe(beiCreate),
      () => hookRoh.hook('updating').unsubscribe(beiUpdate),
      () => hookRoh.hook('deleting').unsubscribe(beiDelete),
    )
  }
}

/** Einmaliger Abgleich in beide Richtungen beim Start. */
async function ersterAbgleich(uid: string) {
  const { collection, doc, getDocs, setDoc } = await fs()
  const datenbank = await holeFirestore()

  for (const { name, tabelle } of TABELLEN) {
    const schnappschuss = await getDocs(collection(datenbank, 'nutzer', uid, name))
    const fern = new Map<string, SyncSatz>()
    schnappschuss.forEach((d) => fern.set(d.id, d.data() as SyncSatz))
    const lokal = await tabelle.toArray()

    // Lokal neuer oder nur lokal vorhanden → hochladen.
    for (const l of lokal) {
      const f = fern.get(l.id)
      const lz = l.geaendertAm ?? ''
      const fz = f?.geaendertAm ?? ''
      if (!f || lz > fz) {
        const satz = l.geaendertAm ? l : { ...l, geaendertAm: jetzt() }
        await setDoc(doc(datenbank, 'nutzer', uid, name, l.id), entfernenUndefiniert(satz)).catch(() => {})
        if (!l.geaendertAm) await syncSchreiben(() => tabelle.put(satz).then(() => {}))
      }
    }
    // Fern neuer oder nur fern vorhanden → übernehmen.
    for (const [id, f] of fern) {
      const l = lokal.find((x) => x.id === id)
      const lz = l?.geaendertAm ?? ''
      const fz = f.geaendertAm ?? ''
      if (!l || fz > lz) await syncSchreiben(() => tabelle.put(f).then(() => {}))
    }
  }
}

/** Laufende Änderungen vom Server übernehmen. */
async function schnappschuesseStarten(uid: string) {
  const { collection, onSnapshot } = await fs()
  const datenbank = await holeFirestore()

  for (const { name, tabelle } of TABELLEN) {
    const ab = onSnapshot(collection(datenbank, 'nutzer', uid, name), (schnappschuss) => {
      schnappschuss.docChanges().forEach((aenderung) => {
        const id = aenderung.doc.id
        if (aenderung.type === 'removed') {
          void syncSchreiben(() => tabelle.delete(id))
          return
        }
        const f = aenderung.doc.data() as SyncSatz
        void syncSchreiben(async () => {
          const l = await tabelle.get(id)
          if (!l || (f.geaendertAm ?? '') > (l.geaendertAm ?? '')) await tabelle.put(f)
        })
      })
    })
    snapshotAbmeldungen.push(ab)
  }
}

export async function startenAbgleich(uid: string): Promise<void> {
  if (aktiveUid === uid) return
  stoppenAbgleich()
  aktiveUid = uid
  hooksRegistrieren()
  try {
    await ersterAbgleich(uid)
    await schnappschuesseStarten(uid)
  } catch {
    // Firestore ist Beiwerk — bei Fehlern läuft alles lokal weiter.
  }
}

export function stoppenAbgleich(): void {
  aktiveUid = null
  for (const ab of snapshotAbmeldungen.splice(0)) ab()
  for (const ab of hookAbmeldungen.splice(0)) ab()
  schmutzig.clear()
  geloescht.clear()
}
