/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Öffentlicher VAPID-Schlüssel (base64url) für Web Push. */
  readonly VITE_VAPID_PUBLIC_KEY?: string
  /** Basis-URL des Cloudflare Workers, z. B. https://gebet.…workers.dev */
  readonly VITE_WORKER_URL?: string

  // Firebase (optional — ohne diese Werte läuft die App rein lokal).
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
