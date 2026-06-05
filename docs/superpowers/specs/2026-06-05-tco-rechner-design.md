# TCO-Rechner Design

## Overview

Webanwendung zum Vergleich der Total Cost of Ownership (TCO) von Elektroautos und Verbrennern über eine einstellbare Haltedauer. Fahrzeugdaten werden in einer Datenbank gespeichert und sind wiederverwendbar. Die Anwendung läuft als einzelner Docker-Container mit SQLite.

**Stack:** Node.js + Express + EJS + better-sqlite3
**Sprache:** Deutsch (UI und Inhalte)
**Deployment:** Docker (single container), Volume-Mount fuer SQLite-Datei

---

## Architektur

```
tco_rechner_auto/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js                 # Express entry point
├── src/
│   ├── db.js                 # SQLite init + better-sqlite3 setup
│   ├── routes/
│   │   ├── fahrzeuge.js      # CRUD vehicles
│   │   └── vergleiche.js     # Comparison engine + saved comparisons
│   ├── services/
│   │   └── tco.js            # Core TCO calculation logic
│   └── views/
│       ├── layout.ejs        # Base layout (header, nav, footer)
│       ├── index.ejs         # Start page
│       ├── fahrzeuge/
│       │   ├── liste.ejs     # Vehicle list with type filter
│       │   └── formular.ejs  # Create/edit vehicle form
│       └── vergleiche/
│           ├── neu.ejs       # Comparison setup (select vehicles, params)
│           ├── ergebnis.ejs  # Results table + bar chart
│           └── liste.ejs     # Saved comparisons
├── public/
│   └── style.css             # Minimal CSS
└── data/                     # SQLite file (Docker volume mount target)
```

Server-rendered EJS templates, no client-side framework, no build pipeline.

---

## Datenmodell (SQLite)

### Tabelle `fahrzeuge`

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | z.B. "VW ID.3 Pro" |
| typ | TEXT | "EV" oder "ICE" |
| kaufpreis | REAL | Bruttolistenpreis oder realer Kaufpreis |
| leistung_kw | INTEGER | kW |
| reichweite_km | INTEGER | Nur EV, elektrische Reichweite |
| stromverbrauch_kwh | REAL | Nur EV, kWh/100km |
| verbrauch_l | REAL | Nur ICE, L/100km |
| co2_g_km | INTEGER | CO2 g/km (fuer Kfz-Steuer bei ICE) |
| hubraum_ccm | INTEGER | Hubraum ccm (fuer Kfz-Steuer bei ICE) |
| wertverlust_prozent | REAL | Jaehrlicher Wertverlust in %, nullable → Default |
| wartung_jaehrlich | REAL | Jaehrliche Wartungskosten, nullable → Default |
| versicherung_jaehrlich | REAL | Jaehrliche Versicherung, nullable → Default |

### Tabelle `vergleiche`

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | Bezeichnung des Vergleichs |
| erstellt_am | TEXT | ISO-Datum |
| eigenkapital | REAL | Verfuegbares Eigenkapital |
| haltedauer_jahre | INTEGER | Haltedauer in Jahren |
| jahreskilometer | INTEGER | km pro Jahr |
| strompreis_ct | REAL | Strompreis ct/kWh |
| spritpreis_ct | REAL | Spritpreis ct/L |
| anlagerendite_prozent | REAL | Rendite fuer Opportunitaetsrechnung |
| kreditzins_prozent | REAL | Kreditzinssatz p.a. |

### Join-Tabelle `vergleich_fahrzeuge`

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER PK | |
| vergleich_id | INTEGER FK | |
| fahrzeug_id | INTEGER FK | |
| finanzierung | TEXT | "cash" oder "kredit" |
| kreditbetrag | REAL | Nur bei "kredit", nullable |

---

## Default-Werte

Wenn ein Fahrzeug-Feld nicht gepflegt ist, kommen folgende Werte zum Einsatz:

| Parameter | EV | ICE |
|---|---|---|
| Wertverlust | 12% p.a. | 15% p.a. |
| Wartung | 400 EUR/Jahr | 700 EUR/Jahr |
| Versicherung | 800 EUR/Jahr | 800 EUR/Jahr |
| THG-Praemie | 100 EUR/Jahr (Gutschrift) | — |

---

## Berechnungslogik

Berechnung pro Fahrzeug, pro Jahr der Haltedauer. Alle Betraege in EUR.

### Jaehrliche Kosten

| Posten | Berechnung |
|---|---|
| Wertverlust | kaufpreis × wertverlust_prozent (linear, gleicher Betrag jedes Jahr) |
| Wartung | wartung_jaehrlich (optional + Reifen) |
| Versicherung | versicherung_jaehrlich |
| Kfz-Steuer | ICE: hubraum/CO2-basiert; EV: 0 EUR (bis 2030) |
| Energiekosten | jahreskilometer / 100 × verbrauch × preis |
| THG-Praemie | Nur EV: -100 EUR/Jahr (Gutschrift) |
| Wallbox | Einmalkosten / haltedauer_jahre (nur EV, falls angesetzt) |

### Finanzierungskosten

Pro Fahrzeug je nach Finanzierungsart:

**Kredit:**
- Kreditbetrag = kaufpreis − anteiliges Eigenkapital (wenn Eigenkapital < Kaufpreis)
- Zinskosten = Kreditbetrag × kreditzins_prozent × haltedauer_jahre (vereinfacht)

**Barzahlung (Cash):**
- Wenn Kaufpreis < verfuegbares Eigenkapital: Rest wird investiert
- Opportunitaetsgewinn = (eigenkapital − kaufpreis) × (1 + anlagerendite)^haltedauer − (eigenkapital − kaufpreis)
- Entgangener Zinseszins (Kaufpreis-Teil): kaufpreis × (1 + anlagerendite)^haltedauer − kaufpreis

**Eigenkapital-Verteilung:**
- Eigenkapital wird prioritaer auf guenstigere Fahrzeuge verteilt
- Verbleibender Kreditbedarf = max(0, kaufpreis − verfuegbares Eigenkapital)
- Verbleibendes Investitionskapital = max(0, verfuegbares Eigenkapital − kaufpreis)

### Gesamtkosten

- Summe aller jaehrlichen Kosten ueber Haltedauer
- + Finanzierungskosten (Zinsen oder Opportunitaetskosten)
- − Restwert am Ende (kaufpreis − haltedauer × wertverlust)
- − Investitionsgewinn (falls Cash mit Restgeld)

### Ergebnisdarstellung

- Tabelle: Jaehrliche Kosten pro Fahrzeug (aufgegliedert)
- Gesamtkosten-Balken (CSS-only)
- Kosten pro km (Gesamtkosten / (haltedauer × jahreskilometer))

---

## UI-Flow

1. **Startseite** (`/`) — Navigation zu Fahrzeugen und Vergleichen
2. **Fahrzeugliste** (`/fahrzeuge`) — Tabelle aller Fahrzeuge, Filter nach Typ (EV/ICE/Alle), Links zum Bearbeiten/Loeschen
3. **Fahrzeug anlegen/bearbeiten** (`/fahrzeuge/neu`, `/fahrzeuge/:id`) — Formular, nur relevante Felder je nach Typ einblenden, Default-Werte als Placeholder
4. **Neuer Vergleich** (`/vergleiche/neu`) — Fahrzeuge auswaehlen (Checkboxen), Parameter eingeben (Eigenkapital, Haltedauer, km, Preise, Rendite, Zins), pro Fahrzeug Finanzierungsart waehlen
5. **Ergebnis** (`/vergleiche/:id`) — Kostentabelle + Balkendiagramm + Speichern-Button
6. **Gespeicherte Vergleiche** (`/vergleiche`) — Liste aller gespeicherten Vergleiche

---

## Docker

```dockerfile
# Multi-stage build
# Stage 1: Build (better-sqlite3 needs native compilation)
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y python3 make gcc
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Runtime
FROM node:20-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/server.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server.js"]
```

`docker-compose.yml` mit Volume-Mount fuer `./data:/app/data`.

---

## Constraints

- Kein Client-Side-Framework, kein Build-Step
- Keine externe Datenbank (SQLite)
- Formulare: POST/Redirect/GET-Muster, serverseitige Validierung
- CSS ohne Framework, minimale Gestaltung
- Alle Texte auf Deutsch
- Kein Authentifizierungssystem (lokale Einzelbenutzer-Anwendung)
