# AGENTS.md

## Projekt

TCO-Rechner — Webanwendung zum Vergleich der Total Cost of Ownership von Elektroautos und Verbrennern.

**Stack:** Node.js 20, Express 4, EJS 3, better-sqlite3 11, SQLite, Docker

## Starten

```bash
# Lokal
npm install && node server.js

# Docker
docker compose up -d --build
```

App läuft auf **http://localhost:3000**. SQLite-DB in `./data/`, persistiert via Volume-Mount.

## Konventionen

- **Commit-Prefix:** `init:` (kein Ticket-System)
- **Sprache:** Alle UI-Texte, Labels, Commit-Messages auf Deutsch
- **Kein Client-JS:** Reines Server-Rendering, kein Build-Step, kein Frontend-Framework
- **Formulare:** POST/Redirect/GET, serverseitige Validierung
- **Keine Tests** vorhanden

## Architektur

```
server.js          # Express-Einstieg, Auto-Seed bei leerer DB
seed.js            # 20 Fahrzeuge (Top 10 ICE + EV nach KBA Mai 2026)
src/
  db.js            # SQLite-Setup, Schema-Migrationen per ALTER TABLE + try/catch
  routes/          # Express-Router
  services/tco.js  # Berechnungslogik (keine DB-Abhängigkeit)
  views/           # EJS-Templates
public/style.css   # CSS (kein Framework)
```

## EJS-Layout

`layout.ejs` öffnet `<html>`, `<head>`, `<body>`, `<nav>`, `<main>`.  
Jedes Template include't es oben und schließt die Tags selbst:

```html
<%- include('../layout', { active: 'fahrzeuge' }) %>
  ...inhalt...
</main></body></html>
```

## Datenbank

- `fahrzeuge` — `listenpreis` (UVP), `kaufpreis` (realer Marktpreis), `typ` (`EV`/`ICE`), typspezifische Felder
- `vergleiche` — Parameter einer Vergleichsrechnung
- `vergleich_fahrzeuge` — Join mit `finanzierung` (`cash`/`kredit`/`leasing`), `kreditbetrag`, `leasingrate`, `sonderzahlung`, `wartung_inklusive`

Schema-Änderungen: In `db.js` sowohl `CREATE TABLE IF NOT EXISTS` als auch `ALTER TABLE` mit `try/catch` für Migrationen.

## Formular-Namenskonvention

Finanzierungsfelder pro Fahrzeug nutzen ID-basierte Namen:

```
finanzierung_<fahrzeugId>   → "cash" | "kredit" | "leasing"
kreditbetrag_<fahrzeugId>   → EUR
leasingrate_<fahrzeugId>    → EUR/Monat
sonderzahlung_<fahrzeugId>  → EUR
wartung_inklusive_<fahrzeugId> → "1" | nicht gesendet
```

## TCO-Berechnung

`src/services/tco.js` exportiert `berechneTCO(fahrzeug, params)` und `berechneEigenkapitalVerteilung()`.

- **EV:** kein Wertverlust/Restwert bei Leasing, THG-Prämie 100€/Jahr, Kfz-Steuer 0€
- **Cash:** Opportunitätskosten (entgangene Rendite auf Kaufpreis)
- **Kredit:** lineare Verzinsung (vereinfacht)
- **Leasing:** Leasingrate × 12 × Jahre + Sonderzahlung + Opp.-Kosten auf Sonderzahlung
- **Default-Werte:** EV 12%/ICE 15% Wertverlust, EV 400€/ICE 700€ Wartung, 800€ Versicherung
- **Diesel-Erkennung:** deaktiviert (immer Benziner-Steuersatz)

## Docker-Besonderheiten

- Multi-Stage-Build: `better-sqlite3` braucht `python3 make gcc` im Build-Stage
- `seed.js` muss in den Runtime-Stage kopiert werden
- `USER node`, `/app/data` mit `chown node:node`
