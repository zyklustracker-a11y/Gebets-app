/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Öffentlicher VAPID-Schlüssel (base64url) für Web Push. */
  readonly VITE_VAPID_PUBLIC_KEY?: string
  /** Basis-URL des Cloudflare Workers, z. B. https://gebet.…workers.dev */
  readonly VITE_WORKER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
