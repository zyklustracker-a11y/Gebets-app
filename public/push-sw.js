/*
 * Push-Behandlung im Service Worker. Wird über Workbox `importScripts` in den
 * generierten Service Worker eingebunden.
 *
 * Die Benachrichtigung besteht aus genau einer Zeile: dem Erinnerungstext zur
 * Gebetszeit, den der Worker mitschickt (ERINNERUNGSTEXTE in
 * src/lib/benachrichtigung.ts). Niemals Themen, Namen oder Journalinhalte.
 * Ein Tippen öffnet die Gebetsansicht der jeweiligen Tageszeit.
 *
 * Bewusst ohne `body`: Ein zweites Textfeld erschiene als Zusatzzeile unter dem
 * Erinnerungstext. Die Zeile mit dem App-Namen, die manche Systeme darüber
 * setzen, stammt vom Betriebssystem und lässt sich hier nicht abschalten — sie
 * folgt dem `name` aus public/manifest.webmanifest.
 */

/*
 * Spiegel von ERINNERUNGSTEXTE aus src/lib/benachrichtigung.ts. Der Service
 * Worker ist eine eigenständige Datei und kann nichts aus dem Bündel
 * importieren. Der Text steht deshalb auch hier: So zeigt eine bestehende
 * Installation sofort die neuen Erinnerungen, selbst wenn der Cloudflare
 * Worker noch nicht neu ausgerollt ist und alte Texte mitschickt.
 *
 * Massgeblich bleibt src/lib/benachrichtigung.ts; die Prüfung in
 * src/lib/benachrichtigung.test.ts schlägt an, wenn beide auseinanderlaufen.
 */
const ERINNERUNGSTEXTE = {
  morgen: 'Zeit für dein Morgengebet',
  mittag: 'Zeit für dein Mittagsgebet',
  abend: 'Zeit für dein Abendgebet',
  nacht: 'Zeit für dein Nachtgebet',
}

self.addEventListener('push', (event) => {
  let daten = {}
  try {
    daten = event.data ? event.data.json() : {}
  } catch (_e) {
    daten = {}
  }
  const tageszeit = daten.tageszeit || 'morgen'
  // `text` gab es früher als zweite Zeile; ältere Worker-Stände schicken es
  // vielleicht noch mit. Es wird absichtlich ignoriert.
  const titel = ERINNERUNGSTEXTE[tageszeit] || daten.titel || 'Zeit für dein Gebet'
  event.waitUntil(
    self.registration.showNotification(titel, {
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
