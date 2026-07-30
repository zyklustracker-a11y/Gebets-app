import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Absolut, nicht relativ: Die App braucht echte URLs (`/themen`), und ein
  // relativer Pfad würde die Auflösung von Assets auf Unterrouten brechen.
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Kein Update-Banner, das ins Gebet platzt: Aktualisierungen werden
      // still beim nächsten Start übernommen (Spezifikation, Abschnitt 9).
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Das Manifest liegt von Hand in `public/` und ist in index.html verlinkt.
      manifest: false,
      includeAssets: ['icon.svg', 'manifest.webmanifest', '*.png', 'fonts/*.woff2'],
      workbox: {
        // Alles wird vorab in den Cache gelegt — die App muss nach der
        // Installation offline vollständig funktionieren. Korpus, Module und
        // Heiligenkalender stecken im JS-Bündel (importiertes JSON) und sind
        // damit ebenfalls Teil des Precache.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        // Grosszügiges Limit, damit das JS-Bündel mit dem Korpus sicher
        // vorab gecacht wird.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
})
