/*
 * Push-Behandlung im Service Worker. Wird über Workbox `importScripts` in den
 * generierten Service Worker eingebunden.
 *
 * Die Benachrichtigung zeigt nur den allgemeinen Ruf aus dem Worker — niemals
 * Themen, Namen oder Journalinhalte. Ein Tippen öffnet die Gebetsansicht der
 * jeweiligen Tageszeit.
 */

self.addEventListener('push', (event) => {
  let daten = {}
  try {
    daten = event.data ? event.data.json() : {}
  } catch (_e) {
    daten = {}
  }
  const titel = daten.titel || 'Gebet'
  const tageszeit = daten.tageszeit || 'morgen'
  event.waitUntil(
    self.registration.showNotification(titel, {
      body: daten.text || 'Zeit zum Gebet.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      lang: 'de',
      tag: 'gebet-' + tageszeit,
      data: { tageszeit },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const tageszeit = (event.notification.data && event.notification.data.tageszeit) || 'morgen'
  const ziel = '/gebet/' + tageszeit
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenster) => {
      for (const client of fenster) {
        if ('focus' in client) {
          client.navigate(ziel)
          return client.focus()
        }
      }
      return self.clients.openWindow(ziel)
    }),
  )
})
