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

/**
 * Öffentliche Web-Konfiguration des Firebase-Projekts. Diese Werte sind kein
 * Geheimnis — sie werden ohnehin im ausgelieferten Frontend sichtbar; die
 * Sicherheit macht allein die Firestore-Regel (nur unter der eigenen uid). Sie
 * stehen fest im Code, damit das Deployment ohne .env funktioniert; eine .env
 * kann sie bei Bedarf überschreiben.
 */
const STANDARD = {
  apiKey: 'AIzaSyAqDhLPOI6EVVbp9dc53phMn1J1Ei9qrLc',
  authDomain: 'gebet-2b02f.firebaseapp.com',
  projectId: 'gebet-2b02f',
  storageBucket: 'gebet-2b02f.firebasestorage.app',
  messagingSenderId: '484300616236',
  appId: '1:484300616236:web:300084f5552083ac379789',
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? STANDARD.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? STANDARD.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? STANDARD.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? STANDARD.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? STANDARD.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? STANDARD.appId,
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
