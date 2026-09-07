VANILLALICHTUNG – WEBSITE MIT PROFESSIONELLER FÖRDERER-INTEGRATION
================================================================

Dieses Paket basiert auf der hochgeladenen aktuellen VanillaLichtung-Website.
Der Förderer-Kauf läuft sichtbar auf vanillalichtung.de; Tebex bleibt im Hintergrund
für Checkout, Zahlungen, Abos, Steuern, Refunds/Chargebacks und Minecraft-Auslieferung.

WAS NEU IST
-----------
- neue professionelle Seite: /unterstuetzen.html
- eingebetteter Tebex-Checkout über die offizielle Headless API + Tebex.js
- Minecraft-Name wird vor dem Checkout erfasst und an den Tebex-Warenkorb gebunden
- Paket wird über den Slug "foerderer" automatisch gefunden; keine Paket-ID im Code nötig
- eigener Button "Abo & Käufe verwalten" über das offizielle Tebex Payment Portal
- klare Kennzeichnung: Förderer ist rein kosmetisch, keinerlei Gameplay-Vorteile
- Startseite, FAQ, Discord-Link und Texte wurden an das neue Modell angepasst
- veraltete Aussage "kein Shop" entfernt; weiterhin ausdrücklich kein Pay-to-Win
- Kontakt-/Datenschutztexte wurden um Tebex und den Förderer-Kauf ergänzt
- keine Tebex-Storefront muss als sichtbare Hauptwebsite verwendet werden

NUR 1 WERT MUSS VOR DEM UPLOAD EINGETRAGEN WERDEN
--------------------------------------------------
Datei öffnen:
  tebex-config.js

Diese Zeile:
  publicToken: "HIER_TEBEX_PUBLIC_TOKEN_EINTRAGEN",

ersetzen durch deinen Tebex PUBLIC TOKEN / Webstore Identifier.

Du findest ihn im Tebex Creator Panel unter:
  Developers -> API Keys -> Public Token

WICHTIG:
- Der Public Token darf im Frontend stehen; er wird von der Headless API benötigt.
- NIEMALS den Private Key in HTML/JS/GitHub eintragen oder irgendwo veröffentlichen.
- packageSlug bleibt "foerderer", weil dein Tebex-Paket bereits diesen Slug besitzt.

TEBEX-SEITE
-----------
Dein bestehendes Paket "✦ Förderer" bleibt in Tebex bestehen, inklusive:
- 4,99 €
- Einmalkauf oder monatlich automatisch
- Game-Server-Commands für Kauf, Renewal, Removal, Refund und Chargeback
- verbundenem VanillaLichtung-Game-Server

Wenn die neue Website live ist und der Headless-Checkout getestet wurde:
  Settings -> Project -> Enable Webstore Management Features
kann für den Tebex-gehosteten Webstore deaktiviert werden, wenn du ausschließlich
dein eigenes Frontend verwenden möchtest. Die Backend-Funktionen bleiben aktiv.

UPLOAD AUF GITHUB
-----------------
1. Diese Dateien vollständig entpacken.
2. In deinem bestehenden GitHub-Pages-Repository die Dateien dieses Pakets hochladen.
3. index.html muss weiterhin direkt auf oberster Repository-Ebene liegen.
4. CNAME NICHT löschen.
5. Committen und GitHub Pages kurz aktualisieren lassen.

TEST VOR LIVEGANG
-----------------
1. Tebex Checkout Test Mode aktivieren.
2. https://www.vanillalichtung.de/unterstuetzen.html öffnen.
3. Einen echten Minecraft-Java-Namen eingeben.
4. "Sicher zum Checkout" klicken.
5. Prüfen, dass der dunkle Tebex-Checkout direkt aus der Seite heraus öffnet.
6. Testzahlung durchführen.
7. Prüfen, dass dein Game-Server den foerdererkauf-Befehl erhält.
8. Förderer-Status / TAB / Chat / Monatsstand prüfen.
9. Test Mode wieder deaktivieren.
10. Projekt bei Tebex zur Review einreichen.

DATENSCHUTZ / RECHTLICHES
-------------------------
Die Website lädt Tebex.js erst, wenn der Nutzer den Checkout oder die Abo-Verwaltung
bewusst startet. Die Datenschutzerklärung wurde entsprechend ergänzt.

Die bisherige Kontaktseite nennt weiterhin keine persönlichen Betreiberdaten. Durch
die Monetarisierung können zusätzliche gesetzliche Informationspflichten entstehen.
Vor dem öffentlichen Livegang solltest du prüfen, welche Pflichtangaben für deinen
konkreten Betrieb in Deutschland erforderlich sind. Es wurden bewusst keine persönlichen
Daten ergänzt, die du nicht ausdrücklich für die Website bereitgestellt hast.

Technische Grundlage: Tebex Headless API + Tebex.js. Keine Private Keys im Frontend.
