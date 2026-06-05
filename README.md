# TCO-Rechner Auto

Vergleicht die Total Cost of Ownership von Elektroautos und Verbrennern über die gesamte Haltedauer. Berücksichtigt Kaufpreis, Wertverlust, Wartung, Versicherung, Kfz-Steuer, Energiekosten, THG-Prämie und Finanzierungskosten.

## Starten

```bash
docker compose up -d
```

Die App läuft auf **http://localhost:3000**. Die SQLite-Datenbank wird im Ordner `./data/` persistiert.

## Nutzung

1. **Fahrzeuge anlegen** — Name, Typ (EV/ICE), Kaufpreis, Verbrauch etc.  
   Nicht gepflegte Kostenfelder erhalten sinnvolle Default-Werte.

2. **Neuer Vergleich** — Fahrzeuge auswählen, Eigenkapital, Haltedauer, Jahreskilometer, Strom-/Spritpreise, Rendite und Kreditzins angeben. Pro Fahrzeug zwischen Barzahlung und Kreditfinanzierung wählen.

3. **Ergebnis** — Jährliche Kostenaufstellung, Gesamtkosten-Balkendiagramm und Kosten pro km. Vergleiche können gespeichert und später wieder aufgerufen werden.

## Finanzierungslogik

- **Barzahlung:** Opportunitätskosten — entgangene Rendite, wenn das Geld stattdessen angelegt worden wäre
- **Kredit:** Zinskosten über die Haltedauer (vereinfachte lineare Verzinsung)
- **Eigenkapital** wird auf die gewählten Fahrzeuge verteilt; verbleibendes Eigenkapital wird mit der Anlagerendite verzinst

## Entwicklung

```bash
npm install
node server.js
```

**Stack:** Node.js 20, Express 4, EJS 3, better-sqlite3 11
