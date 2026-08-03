# Veröffentlichen

Die App besteht aus zwei Teilen, die getrennt ausgerollt werden:

| Teil | Wohin | Was passiert dort |
| --- | --- | --- |
| App (`src/`, `public/`) | Firebase Hosting, Projekt `gebet-2b02f` | die Seite selbst |
| Worker (`worker/`) | Cloudflare Worker `gebet-benachrichtigung` | verschickt die Erinnerungen |

Seit `.github/workflows/deploy.yml` erledigt ein Push auf `main` beides von
selbst. Von Hand geht es weiterhin so:

```
npm run deploy                      # App: baut und veröffentlicht
cd worker && npx wrangler deploy    # Worker
```

---

## 1 · Cloudflare Worker von Hand ausrollen

Nötig, wenn sich etwas in `worker/` oder an den Erinnerungstexten in
`src/lib/benachrichtigung.ts` geändert hat.

```
cd worker
npx wrangler login      # einmalig, öffnet den Browser
npx wrangler deploy
```

Zum Schluss meldet wrangler die Adresse und die Cron-Zeiten
(`*/15 * * * *`). Beides sollte zu `wrangler.toml` passen.

**Die Secrets bleiben erhalten.** `VAPID_PRIVATE`, `VAPID_PUBLIC`,
`VAPID_SUBJECT` und `GROQ_API_KEY` liegen bei Cloudflare und überstehen jeden
Deploy — sie müssen nicht neu gesetzt werden. Nachsehen, was hinterlegt ist:

```
npx wrangler secret list
```

Prüfen, ob der neue Stand läuft — die Zeile zeigt den Text, der verschickt
wird:

```
npx wrangler tail
```

## 2 · Automatischer Deploy über GitHub Actions

Der Workflow `.github/workflows/deploy.yml` läuft bei jedem Push auf `main`
und lässt sich im Actions-Tab auch von Hand starten. Er prüft erst Typen und
Tests und veröffentlicht nur, wenn beides grün ist.

Er braucht drei Repository-Secrets unter
**Settings → Secrets and variables → Actions → New repository secret**:

### `FIREBASE_SERVICE_ACCOUNT`

1. [Firebase Console](https://console.firebase.google.com/) → Projekt
   `gebet-2b02f` → Zahnrad → **Projekteinstellungen** → **Dienstkonten**
2. **Neuen privaten Schlüssel generieren** → es lädt eine JSON-Datei herunter
3. Den **kompletten Inhalt** der Datei als Wert des Secrets einfügen
4. Die heruntergeladene Datei danach löschen — sie gehört nirgendwo ins Repo

Reicht das Konto nicht aus, fehlen ihm in der
[Google Cloud Console](https://console.cloud.google.com/iam-admin/iam) die
Rollen *Firebase Hosting Admin* und *Cloud Datastore Owner* (für die
Firestore-Regeln).

### `CLOUDFLARE_API_TOKEN`

1. [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) →
   **Create Token**
2. Vorlage **Edit Cloudflare Workers** verwenden
3. Auf das eigene Konto einschränken, erzeugen, den Wert einmalig kopieren

Ist dieses Secret nicht gesetzt, überspringt die Worker-Aufgabe sich selbst
und der Lauf bleibt trotzdem grün — der Hosting-Deploy läuft unabhängig davon.
Umgekehrt genauso: Ohne `FIREBASE_SERVICE_ACCOUNT` wird nur nichts
veröffentlicht, nichts schlägt fehl.

### `CLOUDFLARE_ACCOUNT_ID`

Nur nötig, wenn das Token mehrere Konten sieht. Die Kennung steht im
Dashboard rechts in der Übersicht (**Account ID**).

## 3 · Nach dem Ausrollen

Die App aktualisiert sich still beim nächsten Start
(`registerType: 'autoUpdate'` in `vite.config.ts`) — es gibt bewusst kein
Update-Banner, das ins Gebet platzt. Auf dem Telefon heisst das: App einmal
schliessen und wieder öffnen.

## Bekannte Baustelle

`npx tsc -p worker/tsconfig.json` meldet sechs Typfehler in
`worker/webpush.ts` (die neueren lib-Typen unterscheiden
`Uint8Array<ArrayBuffer>` und `<ArrayBufferLike>`). Der Worker läuft trotzdem:
wrangler bündelt mit esbuild und prüft keine Typen. Deshalb steht im Workflow
kein Prüfschritt für den Worker. Sind die Fehler bereinigt, gehört er wieder
hinein.
