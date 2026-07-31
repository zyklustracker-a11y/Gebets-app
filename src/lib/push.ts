/**
 * Web Push im Frontend (Spezifikation, Abschnitt 7): Berechtigung, Subscription
 * und Anmeldung beim Worker.
 *
 * Wichtig für iOS: Die Berechtigung wird nur nach einem echten Tippen angefragt,
 * und Push funktioniert erst, wenn die App über „Zum Home-Bildschirm" installiert
 * ist. Fehlt das, wird ein ruhiger Hinweis zurückgegeben, keine Fehlermeldung.
 */

import type { AboZeit } from './benachrichtigung'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY
const WORKER = import.meta.env.VITE_WORKER_URL

export type Grund =
  | 'nicht-unterstuetzt'
  | 'nicht-installiert'
  | 'nicht-konfiguriert'
  | 'abgelehnt'
  | 'fehler'

export interface Ergebnis {
  ok: boolean
  grund?: Grund
}

export function pushMoeglich(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Ob die App als eigenständige PWA läuft (Voraussetzung für Push auf iOS). */
export function istInstalliert(): boolean {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true
  return standalone || iosStandalone
}

function b64UrlZuBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const roh = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(roh.length))
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i)
  return bytes
}

function aboAlsJson(sub: PushSubscription): { endpoint: string; keys: { p256dh: string; auth: string } } {
  const roh = sub.toJSON()
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: roh.keys?.p256dh ?? '', auth: roh.keys?.auth ?? '' },
  }
}

async function anWorker(pfad: string, koerper: unknown): Promise<boolean> {
  if (!WORKER) return false
  try {
    const res = await fetch(WORKER + pfad, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(koerper),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Schaltet die Erinnerungen ein: Berechtigung, Subscription, Anmeldung. */
export async function erinnerungenEinschalten(zeiten: AboZeit[]): Promise<Ergebnis> {
  if (!pushMoeglich()) return { ok: false, grund: 'nicht-unterstuetzt' }
  if (!istInstalliert()) return { ok: false, grund: 'nicht-installiert' }
  if (!VAPID || !WORKER) return { ok: false, grund: 'nicht-konfiguriert' }

  const erlaubnis = await Notification.requestPermission()
  if (erlaubnis !== 'granted') return { ok: false, grund: 'abgelehnt' }

  try {
    const reg = await navigator.serviceWorker.ready
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64UrlZuBytes(VAPID),
      }))
    const ok = await anWorker('/abo', { abo: aboAlsJson(sub), zeiten })
    return ok ? { ok: true } : { ok: false, grund: 'fehler' }
  } catch {
    return { ok: false, grund: 'fehler' }
  }
}

/** Schaltet die Erinnerungen aus: beim Worker abmelden und Subscription lösen. */
export async function erinnerungenAusschalten(): Promise<void> {
  if (!pushMoeglich()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await anWorker('/abo/loeschen', { endpoint: sub.endpoint })
  await sub.unsubscribe()
}

/** Meldet geänderte Gebetszeiten nach, falls bereits abonniert. */
export async function erinnerungenAktualisieren(zeiten: AboZeit[]): Promise<void> {
  if (!pushMoeglich() || !WORKER) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await anWorker('/abo', { abo: aboAlsJson(sub), zeiten })
}
