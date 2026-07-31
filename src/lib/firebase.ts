/**
 * Firebase — dynamisch geladen (Spezifikation, Abschnitt 8).
 *
 * Die Anmeldung ist optional. Ohne Konfiguration (fehlende .env-Werte) läuft
 * die App vollständig lokal weiter; Firebase wird dann gar nicht geladen. Auch
 * mit Konfiguration wird das SDK erst beim ersten Zugriff nachgeladen, damit
 * der Start und der Offline-Betrieb schlank bleiben.
 */

import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Ob genug Konfiguration vorhanden ist, um Firebase überhaupt zu nutzen. */
export function firebaseKonfiguriert(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

let appPromise: Promise<FirebaseApp> | null = null
async function holeApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app')
      return getApps()[0] ?? initializeApp(config)
    })()
  }
  return appPromise
}

export async function holeAuth(): Promise<Auth> {
  const { getAuth } = await import('firebase/auth')
  return getAuth(await holeApp())
}

export async function holeFirestore(): Promise<Firestore> {
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(await holeApp())
}
