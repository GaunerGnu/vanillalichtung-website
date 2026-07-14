# VanillaLichtung-Website – vollständiges Austauschpaket

Dieses Paket ist die vollständige aktuelle Website für GitHub Pages.

- Website: `https://www.vanillalichtung.de`
- Minecraft-Server: `VanillaLichtung.de`
- Minecraft-Server mit Port: `VanillaLichtung.de:PORT`
- Kontakt: `vanillalichtung@gmail.com`
- Projektort: Jena

## Bereits enthalten

- moderne responsive Startseite
- Eröffnungsdatum 10.07.2026
- Minecraft Java 26.2
- überarbeiteter Text zur 32-Chunk-Sichtweite ohne Erwähnung der Simulationsdistanz
- Freischaltung, Discord, Regeln, Neuigkeiten und Vote-Seiten
- Kopierfunktion und optionaler Live-Status
- Kontakt- und Projektangaben ohne privaten Namen oder Straßenanschrift
- Datenschutzerklärung für GitHub Pages, externe Links, Live-Status, E-Mail und Google Forms
- CNAME für `www.vanillalichtung.de`
- 404-Seite, Favicon, Social-Vorschaubild, robots.txt und sitemap.xml

## Bestehende GitHub-Website aktualisieren

1. ZIP-Datei auf dem PC vollständig entpacken.
2. Im GitHub-Repository zur Registerkarte **Code** wechseln.
3. **Add file → Upload files** öffnen.
4. Alle Dateien und den Ordner `assets` aus dem entpackten Paket markieren und in GitHub ziehen.
5. GitHub zeigt die vorhandenen Dateien als geändert an. Das ist richtig.
6. Unten als Commit-Nachricht beispielsweise `Website vollständig aktualisiert` eintragen.
7. **Commit changes** anklicken.
8. GitHub Pages veröffentlicht den neuen Stand normalerweise nach kurzer Zeit automatisch.

Die `index.html` muss direkt auf der obersten Ebene des Repositorys liegen. Lade nicht nur die ZIP-Datei und nicht den äußeren Ordner hoch.

## Veraltete Dateien vermeiden

Dieses Paket verwendet weiterhin die Datei `impressum.html`, damit vorhandene Links nicht brechen. Die Seite heißt sichtbar nun **Kontakt & Projektangaben**. Nach dem Hochladen sollten keine alten rot markierten Platzhalter mehr im Repository vorhanden sein.

## Domain-Verhalten

Die beiden Adressen haben bewusst unterschiedliche Aufgaben:

- `www.vanillalichtung.de` zeigt die GitHub-Pages-Website.
- `vanillalichtung.de` bleibt per A- und SRV-Eintrag mit dem Minecraft-Server verbunden.

Wenn `vanillalichtung.de` ohne `www` in einem Browser geöffnet wird, kann deshalb die Standardseite des Minecraft-Hosters erscheinen. Das ist keine fehlerhafte Website-Datei, sondern eine Folge der getrennten DNS-Konfiguration. Zum Aufrufen der Website immer `https://www.vanillalichtung.de` verwenden.

Wenn sogar bei `https://www.vanillalichtung.de` noch die Hoster-Seite erscheint, handelt es sich meistens um einen alten DNS- oder Browser-Cache. Dann:

1. URL einschließlich `https://www.` kontrollieren.
2. Browser vollständig schließen und erneut öffnen.
3. Unter Windows eine Eingabeaufforderung als normaler Nutzer öffnen und `ipconfig /flushdns` ausführen.
4. Danach `https://www.vanillalichtung.de` erneut aufrufen.
5. In GitHub unter **Settings → Pages** prüfen, ob die Domainprüfung erfolgreich ist und **Enforce HTTPS** aktiviert wurde.

## DNS nicht verändern

Für weitere Website-Updates sind keine Änderungen bei STRATO notwendig. Insbesondere A-Record, SRV-Record, Server-IP und Minecraft-Port der Hauptdomain nicht verändern. Der CNAME der Subdomain `www` bleibt auf `gaunergnu.github.io` gerichtet.

## Rechtlicher Hinweis

Die Kontaktseite veröffentlicht entsprechend der gewünschten Privatsphäre nur das private Projekt, Jena und die Projekt-E-Mail. Sie ist deshalb bewusst als **Kontakt & Projektangaben** bezeichnet und nicht als Zusicherung eines vollständig rechtskonformen Impressums. Ob im Einzelfall zusätzliche Anbieterangaben erforderlich sind, kann verbindlich nur rechtlich geprüft werden.

## Sicherheit

Keine Minecraft-Serverdateien, Passwörter, Tokens, Backups, Logs, private Formulardaten oder Plugin-Konfigurationen in das öffentliche GitHub-Repository hochladen.
