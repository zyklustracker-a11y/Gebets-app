import { defineConfig } from 'vitest/config'

// Eigene Konfiguration statt vite.config.ts: Der Kalender ist reines
// TypeScript ohne DOM, die Tests brauchen weder React noch das PWA-Plugin.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
