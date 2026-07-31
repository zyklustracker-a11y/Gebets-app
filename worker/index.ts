/**
 * Cloudflare Worker für die Benachrichtigungen (Spezifikation, Abschnitt 7).
 *
 * Zwei Aufgaben:
 *   fetch      Abo anlegen/löschen (vom Frontend)
 *   scheduled  Cron alle 15 Minuten: fällige Gebetszeiten anstossen
 *
 * Zeitzone strikt über Intl (Europe/Zurich, mit Sommerzeit) — die Logik dazu
 * liegt in ../src/lib/benachrichtigung. Der Benachrichtigungstext ist ein
 * allgemeiner Ruf und enthält niemals Themen, Namen oder Journalinhalte.
 */

import { faellige, rufFuer, titelFuer, zuercherDatum, zuercherZeit, type AboZeit } from '../src/lib/benachrichtigung'
import type { Tageszeit } from '../src/lib/types'
import { sendeWebPush, type Abo } from './webpush'

// Minimale Cloudflare-Typen, um ohne zusätzliche Abhängigkeit auszukommen.
interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }>
}
interface ExecutionContext {
  waitUntil(p: Promise<unknown>): void
}
interface Env {
  ABOS: KVNamespace
  VAPID_PUBLIC: string
  VAPID_PRIVATE: string
  VAPID_SUBJECT: string
}

interface GespeichertesAbo extends Abo {
  zeiten: AboZeit[]
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

async function aboSchluessel(endpoint: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return 'abo:' + hex.slice(0, 32)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
    const url = new URL(req.url)

    if (req.method === 'POST' && url.pathname === '/abo') {
      const { abo, zeiten } = (await req.json()) as { abo: Abo; zeiten: AboZeit[] }
      const eintrag: GespeichertesAbo = { endpoint: abo.endpoint, keys: abo.keys, zeiten }
      await env.ABOS.put(await aboSchluessel(abo.endpoint), JSON.stringify(eintrag))
      return new Response('ok', { headers: CORS })
    }

    if (req.method === 'POST' && url.pathname === '/abo/loeschen') {
      const { endpoint } = (await req.json()) as { endpoint: string }
      await env.ABOS.delete(await aboSchluessel(endpoint))
      return new Response('ok', { headers: CORS })
    }

    return new Response('Gebet — Benachrichtigungs-Worker', { headers: CORS })
  },

  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(verschickeFaellige(env))
  },
}

async function verschickeFaellige(env: Env): Promise<void> {
  const jetzt = new Date()
  const zeit = zuercherZeit(jetzt)
  const datum = zuercherDatum(jetzt)
  const vapid = { publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE, subject: env.VAPID_SUBJECT }

  const { keys } = await env.ABOS.list({ prefix: 'abo:' })
  for (const { name } of keys) {
    const roh = await env.ABOS.get(name)
    if (!roh) continue
    const abo = JSON.parse(roh) as GespeichertesAbo

    const bereits = new Set<Tageszeit>()
    for (const z of abo.zeiten) {
      if (await env.ABOS.get(merker(name, datum, z.typ))) bereits.add(z.typ)
    }

    for (const z of faellige(abo.zeiten, zeit, bereits)) {
      const nutzlast = JSON.stringify({ titel: titelFuer(z.typ), text: rufFuer(datum, z.typ), tageszeit: z.typ })
      const status = await sendeWebPush(abo, nutzlast, vapid).catch(() => 0)
      if (status === 201 || status === 200) {
        await env.ABOS.put(merker(name, datum, z.typ), '1', { expirationTtl: 60 * 60 * 48 })
      } else if (status === 404 || status === 410) {
        await env.ABOS.delete(name) // Subscription ist erloschen.
      }
    }
  }
}

function merker(aboName: string, datum: string, typ: Tageszeit): string {
  return `gesendet:${aboName}:${datum}:${typ}`
}
