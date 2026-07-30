# Entscheidungen

*Auflösung der Widersprüche zwischen Konzept, Spezifikation und Korpus.*
*Diese Datei liegt über den Dokumenten 1 und 3–8: Wo sie diesen widerspricht, gilt sie.*
*Die Quelldokumente bleiben unverändert, damit ihr Stand nachvollziehbar bleibt.*

---

## 1 · Elf Bauabschnitte

Die liturgische Zusammensetzung (Spezifikation, Abschnitt 14) ist ein eigener
Bauabschnitt und kommt **nach Abschnitt 5**. Alles danach rückt eine Nummer
weiter. Die verbindliche Reihenfolge lautet damit:

| Nr. | Abschnitt |
|---|---|
| 1 | Gerüst |
| 2 | Kalender |
| 3 | Bildschirme |
| 4 | Daten und Logik |
| 5 | Korpus anbinden |
| **6** | **Liturgische Zusammensetzung** — Module, Festeinschübe, Prioritätsregel |
| 7 | Installierbarkeit |
| 8 | Benachrichtigungen |
| 9 | Anmeldung und Abgleich |
| 10 | Eigene Themen erzeugen |
| 11 | Feinschliff |

## 2 · Korpusgrösse

Es gelten **144 Grundgebete plus 39 liturgische Module**. Die Rechnung in
Konzept 5.2 (≈ 1 150 Gebete) und die Mengenangabe in der Roadmap (~400) sind
überholt.

## 3 · Färbung

Das Feld `faerbung` bleibt im Datenmodell und im Korpusformat erhalten, steht
aber vorerst durchgehend auf `"gewoehnlich"` und ist funktionslos. Die
liturgische Zeit liefert zur Laufzeit das Modulsystem.

## 4 · Schriftwort gehört zum Gebet

Das Schriftwort ist Teil der Komposition, nicht ein täglich neu gezogenes Los.

- `data/gebete.json` bekommt `vers` und `stelle` direkt am Eintrag.
- `data/verse.json` bleibt **Reservoir** für die Gebetserzeugung und für
  Erweiterungen des Korpus — nicht für die tägliche Auswahl.
- Die 21-Tage-Wiederholungssperre für Verse entfällt. Die Sperre für Gebete
  (14 Tage, Spezifikation Abschnitt 6) bleibt.
- Schritt 5 der Gebetsauswahl in Spezifikation 6 entfällt damit.
- Folge fürs Datenmodell: `Gebetseintrag.versId` entfällt, weil `korpusId` das
  Schriftwort mitbestimmt.

## 5 · Kalender

Bleibt Bauabschnitt 2, vor den Bildschirmen. Die Reihenfolge der Roadmap in
Konzept 7 (Kalender erst in v0.2) gilt nicht.

## 6 · Ostergruss

Ohne Ausrufezeichen — „Christus ist auferstanden." Tonregel 7 und die
Prüfliste in Spezifikation 12 gelten ausnahmslos. Die Schreibweise in
Konzept 2.2 gilt nicht.

## 7 · Kirchenkalender

Bei jeder Abweichung gilt die **Spezifikation**, nie das Konzept. Insbesondere:
Weihnachtsfasten **15. November bis 24. Dezember julianisch**
(= 28. November bis 6. Januar gregorianisch). Die Angabe in Konzept 2.2 ist
falsch beschriftet.

## 8 · Dateinamen

Es gilt der Name, wie die Datei im Repository liegt. Verweise werden daran
angepasst, nicht umgekehrt. `docs/3_Technische_Spezifikation.md` verweist
entsprechend auf `1_Konzept_GebetsApp.md`.

Das in Konzept 8 erwähnte `2_Prompt_fuer_Claude_Design.md` liegt nicht im
Repository; das Design ist als `design/Gebet.dc.html` vorhanden.

## 9 · Schriftworte

260 Verse genügen. Die Angabe „~300" in Konzept 4.1 ist ein Sollwert ohne
Verbindlichkeit.
