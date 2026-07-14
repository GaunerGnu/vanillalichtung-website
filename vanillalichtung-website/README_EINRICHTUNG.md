# VanillaLichtung-Website – Einrichtung

Diese Website ist für **GitHub Pages** vorbereitet und verwendet ausschließlich die Webadresse:

- Website: `www.vanillalichtung.de`
- Minecraft-Server: `VanillaLichtung.de`
- Minecraft-Server mit Port: `VanillaLichtung.de:PORT`

Die Hauptdomain wird durch die Website **nicht verändert**. Es wird ausschließlich ein DNS-Eintrag für die Subdomain `www` hinzugefügt.

## Inhalt des Pakets

- `index.html` – komplette Startseite
- `styles.css` – modernes responsives Design
- `script.js` – Kopierfunktion, mobiles Menü, Animationen und optionaler Live-Status
- `impressum.html` – rechtliche Vorlage mit Pflicht-Platzhaltern
- `datenschutz.html` – Datenschutzvorlage für die ausgelieferte Seite
- `404.html` – eigene Fehlerseite
- `CNAME` – setzt die GitHub-Pages-Domain auf `www.vanillalichtung.de`
- `.nojekyll` – verhindert unnötige Jekyll-Verarbeitung
- `robots.txt` und `sitemap.xml` – Suchmaschinen-Grundkonfiguration
- `assets/` – Favicon und Social-Media-Vorschau

## Vor der Veröffentlichung zwingend erledigen

Öffne `impressum.html` und `datenschutz.html` in einem Texteditor. Ersetze alle Platzhalter in eckigen Klammern:

- `[VOLLSTÄNDIGER NAME]`
- `[STRASSE UND HAUSNUMMER]`
- `[PLZ UND ORT]`
- `[POSTANSCHRIFT]`
- `[E-MAIL-ADRESSE]`
- `[VOLLSTÄNDIGER NAME UND ANSCHRIFT]`

Auch `mailto:DEINE-EMAIL-ADRESSE` muss durch deine echte Kontaktadresse ersetzt werden. Die Vorlagen sind keine Rechtsberatung.

## Variante A – einfach im GitHub-Browser hochladen

1. Erstelle unter `github.com` ein Konto oder melde dich an.
2. Klicke oben rechts auf **+ → New repository**.
3. Repository-Name, zum Beispiel: `vanillalichtung-website`.
4. Stelle es auf **Public** und erstelle das Repository.
5. Öffne das Repository und wähle **Add file → Upload files**.
6. Entpacke diese ZIP-Datei auf deinem Computer.
7. Lade **den Inhalt des Ordners** hoch – nicht den äußeren Ordner selbst. `index.html` muss direkt in der obersten Ebene des Repositorys liegen.
8. Prüfe, dass auch die Datei `CNAME` und der Ordner `assets` vorhanden sind. Die versteckte Datei `.nojekyll` ist hilfreich, aber nicht zwingend.
9. Klicke unten auf **Commit changes**.
10. Öffne **Settings → Pages**.
11. Unter **Build and deployment**:
    - Source: `Deploy from a branch`
    - Branch: `main`
    - Folder: `/ (root)`
    - Save
12. Unter **Custom domain** sollte wegen der `CNAME`-Datei bereits `www.vanillalichtung.de` stehen. Falls nicht, trage sie dort ein und speichere.

GitHub zeigt zunächst eine vorläufige Adresse wie `DEIN-NAME.github.io/vanillalichtung-website/`. Die eigene Domain funktioniert erst nach dem DNS-Schritt.

## STRATO-DNS richtig setzen – ohne die Ingame-Adresse anzufassen

Wichtig: Ändere **keinen** bestehenden A-, AAAA- oder SRV-Eintrag für `VanillaLichtung.de`. Dadurch bleibt die Hauptdomain exakt wie bisher mit dem Minecraft-Server verbunden.

Lege nur für `www` einen CNAME-Eintrag an:

- Typ: `CNAME`
- Host/Subdomain: `www`
- Ziel/Wert: `DEIN-GITHUB-BENUTZERNAME.github.io`

Das Ziel enthält **kein** `https://`, keinen Schrägstrich und nicht den Repository-Namen.

Beispiel: Lautet dein GitHub-Name `gustav123`, ist das Ziel:

`gustav123.github.io`

Im STRATO-Kundenlogin liegt dies üblicherweise unter:

`Domains → Domainverwaltung → vanillalichtung.de → DNS/Subdomainverwaltung`

Falls für `www` bereits ein A-, AAAA- oder CNAME-Eintrag existiert, ändere **nur diesen www-Eintrag**. Die Einträge der Hauptdomain `@` beziehungsweise `vanillalichtung.de` bleiben unverändert.

## HTTPS aktivieren

Nachdem GitHub den DNS-Eintrag erkannt hat:

1. Wieder **GitHub → Repository → Settings → Pages** öffnen.
2. Warten, bis die Domainprüfung erfolgreich ist.
3. **Enforce HTTPS** aktivieren.

DNS- und Zertifikatsänderungen können zeitversetzt sichtbar werden. Entferne währenddessen nicht die bisherige Minecraft-DNS-Konfiguration.

## Website lokal prüfen

Ein Doppelklick auf `index.html` zeigt bereits fast alles. Für eine realistischere lokale Vorschau kannst du im entpackten Ordner ein Terminal öffnen und ausführen:

```bash
python -m http.server 8000
```

Danach im Browser öffnen:

`http://localhost:8000`

## Inhalte später ändern

### Serveradresse

Sie steht mehrfach in `index.html` und einmal in `script.js` als:

```js
const SERVER_ADDRESS = 'VanillaLichtung.de';
```

### Freischaltungsformular

Aktuell eingetragen:

`https://forms.gle/4UyfsDZqbP4yVSKi9`

Suche projektweit nach dieser URL, um sie später zu ersetzen.

### Discord

Aktuell eingetragen:

`https://discord.gg/wDB4ukjXA`

### End-Eröffnung

Das Datum `01.08.2026` steht im Eventbereich und unter Neuigkeiten. Nach dem Event sollte der Text aktualisiert werden.

### Live-Status

Der Status wird aus Datenschutzgründen erst nach einem Klick geladen. Er verwendet:

`https://api.mcstatus.io/v2/status/java/VanillaLichtung.de?query=false`

Soll die externe Statusabfrage vollständig entfernt werden, entferne den Block mit `id="server-status"` aus `index.html` und den Status-Abschnitt aus `script.js`.

## Neue Version veröffentlichen

1. Gewünschte Dateien lokal bearbeiten.
2. Im GitHub-Repository **Add file → Upload files** wählen.
3. Geänderte Dateien hochladen und vorhandene ersetzen.
4. **Commit changes** anklicken.

GitHub Pages veröffentlicht den neuen Stand automatisch.

## Sicherheitsregel

Keine Minecraft-Serverdateien, IP-Managementdaten, Passwörter, Tokens, Backups, Logs oder Plugin-Konfigurationen in dieses öffentliche Repository hochladen. In das Website-Repository gehören ausschließlich die Dateien aus diesem Paket und später öffentliche Bilder.
