/**
 * Cloudflare Worker für die Benachrichtigungen (Spezifikation, Abschnitt 7).
 *
 * Zwei Aufgaben:
 *   fetch      Abo anlegen/löschen (vom Frontend)
 *   scheduled  Cron alle 15 Minuten: fällige Gebetszeiten anstossen
 *
 * Zeitzone strikt über Intl (Europe/Zurich, mit Sommerzeit) — die Logik dazu
 * liegt in ../src/lib/benachrichtigung. Der Benachrichtigungstext ist die
 * schlichte Erinnerung zur jeweiligen Gebetszeit (ERINNERUNGSTEXTE, ebenfalls
 * dort) und enthält niemals Themen, Namen oder Journalinhalte.
 */

import { erinnerungstextFuer, faellige, zuercherDatum, zuercherZeit, type AboZeit } from '../src/lib/benachrichtigung'
import {
  nutzerPrompt,
  pruefeAntwort,
  systemPrompt,
  vorgabeAnwenden,
  type ErzeugungAnfrage,
  type ErzeugungAntwort,
} from '../src/lib/erzeugung'
import type { Faerbung, Tageszeit } from '../src/lib/types'
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
  /** Groq-API-Schlüssel für die Gebetserzeugung (Abschnitt 12). */
  GROQ_API_KEY: string
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

    // Eigene Gebete erzeugen (Abschnitt 12). Nur Titel, Kategorie und Färbung
    // werden übertragen; der Gemini-Schlüssel liegt als Worker-Secret.
    if (req.method === 'POST' && url.pathname === '/erzeugen') {
      let roh: { titel?: string; kategorie?: string; kategorieSchluessel?: string; faerbung?: string }
      try {
        roh = (await req.json()) as typeof roh
      } catch {
        return new Response('ungültige Anfrage', { status: 400, headers: CORS })
      }
      const titel = (roh.titel ?? '').trim()
      if (!titel) return new Response('kein Titel', { status: 400, headers: CORS })

      const gebete = await erzeugeGebete(env, {
        titel,
        kategorie: (roh.kategorie ?? '').trim() || 'Anliegen',
        kategorieSchluessel: (roh.kategorieSchluessel ?? '').trim() || undefined,
        faerbung: normFaerbung(roh.faerbung),
      })
      if (!gebete) return new Response('Erzeugung fehlgeschlagen', { status: 502, headers: CORS })
      return new Response(JSON.stringify(gebete), { headers: { ...CORS, 'content-type': 'application/json' } })
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
      // Nur `titel` und die Tageszeit fürs Öffnen: kein zweites Textfeld, damit
      // die Meldung aus genau einer Zeile besteht.
      const nutzlast = JSON.stringify({ titel: erinnerungstextFuer(z.typ), tageszeit: z.typ })
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

// ---------------------------------------------------------------------------
// Gebetserzeugung (Abschnitt 12)
// ---------------------------------------------------------------------------

// Groq, OpenAI-kompatibel, kostenloses Kontingent (Abschnitt 12). Llama 3.3 70B
// ist kein „Denk"-Modell, daher kein Token-Overhead und keine EU-Datennutzung.
const GROQ_MODELL = 'llama-3.3-70b-versatile'

function normFaerbung(wert: string | undefined): Faerbung {
  return wert === 'fastenzeit' || wert === 'osterzeit' || wert === 'trauer' ? wert : 'gewoehnlich'
}

/**
 * Fordert die drei Gebete an und prüft sie. Fällt eine Prüfung durch, wird
 * genau einmal neu angefordert; danach `null` — das Frontend fällt dann still
 * auf den Platzhalter-Weg zurück.
 */
async function erzeugeGebete(env: Env, anfrage: ErzeugungAnfrage): Promise<ErzeugungAntwort | null> {
  // Bis zu drei Versuche: das kostenlose Modell trifft die Wortzahlen nicht
  // immer beim ersten Mal, und Groq liefert gelegentlich 503/429.
  for (let versuch = 0; versuch < 3; versuch++) {
    const roh = await groqAufruf(env, anfrage).catch(() => null)
    if (!roh) continue
    // Erst das vorgegebene Schriftwort einsetzen, dann prüfen: Die Stelle ist
    // damit immer echt, und die Prüfung gilt nur noch dem Text des Modells.
    const antwort = vorgabeAnwenden(roh, anfrage)
    if (pruefeAntwort(antwort, anfrage).gueltig) return antwort
  }
  return null
}

async function groqAufruf(env: Env, anfrage: ErzeugungAnfrage): Promise<ErzeugungAntwort | null> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODELL,
      temperature: 0.85,
      max_tokens: 2600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: nutzerPrompt(anfrage) },
      ],
    }),
  })
  if (!res.ok) return null

  const daten = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = daten.choices?.[0]?.message?.content ?? ''
  if (!text.trim()) return null

  try {
    return JSON.parse(text) as ErzeugungAntwort
  } catch {
    return null
  }
}
