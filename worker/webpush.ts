/**
 * Web Push aus dem Cloudflare Worker — VAPID (RFC 8292) und Payload-
 * Verschlüsselung aes128gcm (RFC 8291), umgesetzt über die Web Crypto API.
 *
 * Nur Standardkrypto, keine Abhängigkeiten. Getestet werden kann das nur gegen
 * einen echten Push-Dienst auf einem echten Gerät; der Ablauf folgt exakt den
 * beiden RFCs.
 */

const enc = new TextEncoder()

export interface Abo {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface Vapid {
  publicKey: string
  privateKey: string
  subject: string
}

function b64urlZuBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesZuB64url(b: Uint8Array): string {
  let s = ''
  for (const x of b) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function verketten(...teile: Uint8Array[]): Uint8Array {
  const laenge = teile.reduce((n, t) => n + t.length, 0)
  const out = new Uint8Array(laenge)
  let o = 0
  for (const t of teile) {
    out.set(t, o)
    o += t.length
  }
  return out
}

async function hmac(schluessel: Uint8Array, daten: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', schluessel, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, daten))
}

/** HKDF-Extract gefolgt von einem HKDF-Expand-Block (Länge ≤ 32). */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, laenge: number): Promise<Uint8Array> {
  const prk = await hmac(salt, ikm)
  const block = await hmac(prk, verketten(info, new Uint8Array([1])))
  return block.slice(0, laenge)
}

/** Verschlüsselt die Nutzlast nach RFC 8291 (Content-Encoding: aes128gcm). */
async function verschluesseln(abo: Abo, klartext: Uint8Array): Promise<Uint8Array> {
  const clientPub = b64urlZuBytes(abo.keys.p256dh) // 65 Byte, unkomprimiert
  const auth = b64urlZuBytes(abo.keys.auth) // 16 Byte

  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const serverPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey)) // 65 Byte
  const clientKey = await crypto.subtle.importKey('raw', clientPub, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const gemeinsam = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, eph.privateKey, 256))

  // IKM aus dem ECDH-Geheimnis und dem auth-Secret.
  const keyInfo = verketten(enc.encode('WebPush: info\0'), clientPub, serverPub)
  const ikm = await hkdf(auth, gemeinsam, keyInfo, 32)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  // Ein einzelner Datensatz: Klartext plus Trennbyte 0x02.
  const datensatz = verketten(klartext, new Uint8Array([2]))
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, datensatz))

  // Kopf: salt(16) | rs(4) | idlen(1) | serverPub(65)
  const rs = new Uint8Array([0, 0, 0x10, 0x00]) // 4096
  const idlen = new Uint8Array([serverPub.length])
  return verketten(salt, rs, idlen, serverPub, chiffre)
}

/** Baut den VAPID-Authorization-Header für einen Endpunkt. */
async function vapidHeader(endpoint: string, vapid: Vapid): Promise<string> {
  const aud = new URL(endpoint).origin
  const kopf = bytesZuB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const nutz = bytesZuB64url(
    enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject })),
  )
  const signaturbasis = `${kopf}.${nutz}`

  const pub = b64urlZuBytes(vapid.publicKey) // 65 Byte
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    d: vapid.privateKey,
    x: bytesZuB64url(pub.slice(1, 33)),
    y: bytesZuB64url(pub.slice(33, 65)),
    ext: true,
  }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signaturbasis)))
  const jwt = `${signaturbasis}.${bytesZuB64url(sig)}`

  return `vapid t=${jwt}, k=${vapid.publicKey}`
}

/** Verschickt eine Push-Nachricht. Gibt den HTTP-Status des Push-Dienstes zurück. */
export async function sendeWebPush(abo: Abo, nutzlast: string, vapid: Vapid, ttlSekunden = 30 * 60): Promise<number> {
  const koerper = await verschluesseln(abo, enc.encode(nutzlast))
  const autorisierung = await vapidHeader(abo.endpoint, vapid)
  const res = await fetch(abo.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttlSekunden),
      Urgency: 'normal',
      Authorization: autorisierung,
    },
    body: koerper,
  })
  return res.status
}
