# TCO-Rechner Implementation Plan

> **Fuer agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Webanwendung zum TCO-Vergleich von Elektroautos und Verbrennern mit speicherbaren Fahrzeugdaten und Vergleichsrechnungen.

**Architecture:** Monolithische Express-App mit EJS-Templates, SQLite via better-sqlite3. Server-rendered, kein Client-Framework. Ein Docker-Container.

**Tech Stack:** Node.js 20, Express 4, EJS 3, better-sqlite3 11

---

### Task 1: Projekt-Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: package.json anlegen**

```json
{
  "name": "tco_rechner_auto",
  "version": "1.0.0",
  "description": "TCO Rechner fuer Elektroautos und Verbrenner",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "ejs": "^3.1.10",
    "express": "^4.21.0"
  }
}
```

- [ ] **Step 2: .gitignore anlegen**

```
node_modules/
data/*.sqlite
.DS_Store
```

- [ ] **Step 3: Dockerfile anlegen**

```dockerfile
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y python3 make gcc && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

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

- [ ] **Step 4: docker-compose.yml anlegen**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

- [ ] **Step 5: npm install ausfuehren**

Run: `npm install`
Expected: installiert express, ejs, better-sqlite3 ohne Fehler.

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore Dockerfile docker-compose.yml package-lock.json
git commit -m "chore: initial project scaffolding with Docker setup"
```

---

### Task 2: Datenbank-Modul

**Files:**
- Create: `src/db.js`

- [ ] **Step 1: src/db.js anlegen**

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tco.sqlite');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS fahrzeuge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    typ TEXT NOT NULL CHECK(typ IN ('EV', 'ICE')),
    kaufpreis REAL NOT NULL,
    leistung_kw INTEGER,
    reichweite_km INTEGER,
    stromverbrauch_kwh REAL,
    verbrauch_l REAL,
    co2_g_km INTEGER,
    hubraum_ccm INTEGER,
    wertverlust_prozent REAL,
    wartung_jaehrlich REAL,
    versicherung_jaehrlich REAL
  );

  CREATE TABLE IF NOT EXISTS vergleiche (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
    eigenkapital REAL NOT NULL,
    haltedauer_jahre INTEGER NOT NULL,
    jahreskilometer INTEGER NOT NULL,
    strompreis_ct REAL NOT NULL,
    spritpreis_ct REAL NOT NULL,
    anlagerendite_prozent REAL NOT NULL,
    kreditzins_prozent REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vergleich_fahrzeuge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vergleich_id INTEGER NOT NULL REFERENCES vergleiche(id) ON DELETE CASCADE,
    fahrzeug_id INTEGER NOT NULL REFERENCES fahrzeuge(id) ON DELETE RESTRICT,
    finanzierung TEXT NOT NULL CHECK(finanzierung IN ('cash', 'kredit')),
    kreditbetrag REAL
  );
`);

module.exports = db;
```

- [ ] **Step 2: Modul laden zum Verifizieren**

Run: `node -e "const db = require('./src/db'); console.log('Tabellen:', db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all()); db.close()"`
Expected: Listet die drei Tabellen `fahrzeuge`, `vergleiche`, `vergleich_fahrzeuge`.

- [ ] **Step 3: Commit**

```bash
git add src/db.js
git commit -m "feat: SQLite-Datenbankmodul mit Tabellen-Schema"
```

---

### Task 3: Server-Entrypoint

**Files:**
- Create: `server.js`

- [ ] **Step 1: server.js anlegen**

```javascript
const express = require('express');
const path = require('path');

const fahrzeugeRoutes = require('./src/routes/fahrzeuge');
const vergleicheRoutes = require('./src/routes/vergleiche');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/fahrzeuge', fahrzeugeRoutes);
app.use('/vergleiche', vergleicheRoutes);

app.listen(PORT, () => {
  console.log(`TCO-Rechner laeuft auf http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Server starten (erwartet Fehler wegen fehlender Routes-Dateien — das ist OK)**

Run: `timeout 3 node server.js 2>&1 || true`
Expected: Fehler `Cannot find module './src/routes/fahrzeuge'` — erwartet, wir erstellen die Datei in Task 6.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat: Express-Server mit EJS und statischen Assets"
```

---

### Task 4: CSS-Stylesheet

**Files:**
- Create: `public/style.css`

- [ ] **Step 1: public/style.css anlegen**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  background: #f5f5f5;
  line-height: 1.5;
}

nav {
  background: #1a1a1a;
  padding: 0 1.5rem;
  display: flex;
  gap: 1.5rem;
}
nav a {
  color: #fff;
  text-decoration: none;
  padding: 0.75rem 0;
  font-size: 0.95rem;
}
nav a:hover { color: #ccc; }
nav a.active { border-bottom: 2px solid #4a90d9; }

main { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; }

h1 { font-size: 1.5rem; margin-bottom: 1rem; }
h2 { font-size: 1.2rem; margin: 1.5rem 0 0.75rem; }

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
  color: #fff;
}
.btn-primary { background: #4a90d9; }
.btn-primary:hover { background: #3a7bc8; }
.btn-danger { background: #d94a4a; }
.btn-danger:hover { background: #c83a3a; }
.btn-secondary { background: #888; }
.btn-secondary:hover { background: #777; }

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
th, td {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
}
th { background: #eee; font-weight: 600; }
tr:nth-child(even) { background: #fafafa; }

form {
  background: #fff;
  padding: 1.5rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  max-width: 600px;
}
.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}
.form-group input:focus { border-color: #4a90d9; outline: none; }
.form-row { display: flex; gap: 1rem; }
.form-row .form-group { flex: 1; }
fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}
fieldset legend { font-weight: 600; font-size: 0.9rem; padding: 0 0.5rem; }

.filter-bar { margin-bottom: 1rem; display: flex; gap: 0.5rem; }
.filter-bar a {
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-decoration: none;
  background: #eee;
  color: #333;
}
.filter-bar a.active { background: #4a90d9; color: #fff; }

.actions { display: flex; gap: 0.5rem; margin-top: 1rem; }

.bar-chart { margin: 1.5rem 0; }
.bar-row { display: flex; align-items: center; margin-bottom: 0.5rem; }
.bar-label { width: 180px; font-size: 0.85rem; font-weight: 600; }
.bar-track { flex: 1; background: #eee; border-radius: 4px; height: 28px; overflow: hidden; }
.bar-fill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
  font-size: 0.8rem;
  color: #fff;
  white-space: nowrap;
}
.bar-fill.ev { background: #4a90d9; }
.bar-fill.ice { background: #d9a44a; }

.checkbox-list { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
.checkbox-item {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
.checkbox-item:hover { border-color: #4a90d9; }
.checkbox-item input { margin: 0; }
.checkbox-item.ev { border-left: 3px solid #4a90d9; }
.checkbox-item.ice { border-left: 3px solid #d9a44a; }

.summary-cards { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.summary-card {
  flex: 1;
  background: #fff;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.summary-card h3 { font-size: 0.85rem; color: #888; margin-bottom: 0.25rem; }
.summary-card .value { font-size: 1.4rem; font-weight: 700; }
.summary-card .value.positive { color: #d94a4a; }
.summary-card .value.negative { color: #4a9d4a; }

.empty-state { text-align: center; padding: 3rem 1rem; color: #888; }
.empty-state p { margin-bottom: 1rem; }

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.ev { background: #d6e8fb; color: #2a5d9a; }
.badge.ice { background: #fbe8d6; color: #9a5d2a; }

.inline-form { display: inline; }
```

- [ ] **Step 2: Commit**

```bash
git add public/style.css
git commit -m "feat: CSS-Stylesheet fuer die gesamte Anwendung"
```

---

### Task 5: Layout und Startseite

**Files:**
- Create: `src/views/layout.ejs`
- Create: `src/views/index.ejs`

- [ ] **Step 1: src/views/layout.ejs anlegen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TCO-Rechner</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a href="/" <%= active === 'index' ? 'class="active"' : '' %>>Start</a>
    <a href="/fahrzeuge" <%= active === 'fahrzeuge' ? 'class="active"' : '' %>>Fahrzeuge</a>
    <a href="/vergleiche" <%= active === 'vergleiche' ? 'class="active"' : '' %>>Vergleiche</a>
    <a href="/vergleiche/neu" <%= active === 'vergleich-neu' ? 'class="active"' : '' %>>Neuer Vergleich</a>
  </nav>
  <main>
    <%- body %>
  </main>
</body>
</html>
```

- [ ] **Step 2: src/views/index.ejs anlegen**

```html
<%- include('layout', { active: 'index' }) %>
  <h1>TCO-Rechner</h1>
  <p>Vergleiche die Gesamtkosten von Elektroautos und Verbrennern &uuml;ber die gesamte Haltedauer &ndash; inklusive Finanzierung, Wertverlust, Wartung, Versicherung und Energiekosten.</p>
  <div class="actions">
    <a href="/vergleiche/neu" class="btn btn-primary">Neuen Vergleich starten</a>
    <a href="/fahrzeuge" class="btn btn-secondary">Fahrzeuge verwalten</a>
  </div>
  <h2>Gespeicherte Vergleiche</h2>
  <p><a href="/vergleiche">Alle gespeicherten Vergleiche ansehen</a></p>
<%- include('layout-close') %>
```

- [ ] **Step 3: Anpassung — layout.ejs muss body mit include-close unterstuetzen**

Layout braucht ein `<%- body %>` das den Inhalt rendert. EJS hat kein natives Layout. Aendere den Ansatz: Nutze `include()` innerhalb jedes Templates statt Layout-Wrapping.

Ersetze `src/views/layout.ejs`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TCO-Rechner</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a href="/" <%= typeof active !== 'undefined' && active === 'index' ? 'class="active"' : '' %>>Start</a>
    <a href="/fahrzeuge" <%= typeof active !== 'undefined' && active === 'fahrzeuge' ? 'class="active"' : '' %>>Fahrzeuge</a>
    <a href="/vergleiche" <%= typeof active !== 'undefined' && active === 'vergleiche' ? 'class="active"' : '' %>>Vergleiche</a>
    <a href="/vergleiche/neu" <%= typeof active !== 'undefined' && active === 'vergleich-neu' ? 'class="active"' : '' %>>Neuer Vergleich</a>
  </nav>
  <main>
```

Und `src/views/index.ejs`:

```html
<%- include('layout', { active: 'index' }) %>
  <h1>TCO-Rechner</h1>
  <p>Vergleiche die Gesamtkosten von Elektroautos und Verbrennern &uuml;ber die gesamte Haltedauer &ndash; inklusive Finanzierung, Wertverlust, Wartung, Versicherung und Energiekosten.</p>
  <div class="actions">
    <a href="/vergleiche/neu" class="btn btn-primary">Neuen Vergleich starten</a>
    <a href="/fahrzeuge" class="btn btn-secondary">Fahrzeuge verwalten</a>
  </div>
  <h2>Gespeicherte Vergleiche</h2>
  <p><a href="/vergleiche">Alle gespeicherten Vergleiche ansehen</a></p>
</main>
</body>
</html>
```

- [ ] **Step 4: Server starten und Startseite testen**

Run: `node server.js &`
Dann: `curl -s http://localhost:3000/ | head -20`
Expected: HTML mit "TCO-Rechner" im Output.
Danach: `kill %1`

- [ ] **Step 5: Commit**

```bash
git add src/views/layout.ejs src/views/index.ejs
git commit -m "feat: Layout-Template und Startseite"
```

---

### Task 6: Fahrzeuge-Routen und CRUD

**Files:**
- Create: `src/routes/fahrzeuge.js`

- [ ] **Step 1: src/routes/fahrzeuge.js anlegen**

```javascript
const { Router } = require('express');
const db = require('../db');

const router = Router();

const DEFAULTS = {
  EV: {
    wertverlust_prozent: 12,
    wartung_jaehrlich: 400,
    versicherung_jaehrlich: 800
  },
  ICE: {
    wertverlust_prozent: 15,
    wartung_jaehrlich: 700,
    versicherung_jaehrlich: 800
  }
};

router.get('/', (req, res) => {
  const filter = req.query.typ || 'alle';
  let fahrzeuge;
  if (filter === 'alle') {
    fahrzeuge = db.prepare('SELECT * FROM fahrzeuge ORDER BY name').all();
  } else {
    fahrzeuge = db.prepare('SELECT * FROM fahrzeuge WHERE typ = ? ORDER BY name').all(filter);
  }
  res.render('fahrzeuge/liste', { fahrzeuge, filter, active: 'fahrzeuge' });
});

router.get('/neu', (req, res) => {
  res.render('fahrzeuge/formular', {
    fahrzeug: null,
    active: 'fahrzeuge',
    fehler: null,
    title: 'Neues Fahrzeug'
  });
});

router.post('/', (req, res) => {
  const { name, typ, kaufpreis, leistung_kw, reichweite_km, stromverbrauch_kwh,
          verbrauch_l, co2_g_km, hubraum_ccm, wertverlust_prozent,
          wartung_jaehrlich, versicherung_jaehrlich } = req.body;

  if (!name || !typ || !kaufpreis) {
    return res.render('fahrzeuge/formular', {
      fahrzeug: req.body, active: 'fahrzeuge', title: 'Neues Fahrzeug',
      fehler: 'Name, Typ und Kaufpreis sind Pflichtfelder.'
    });
  }

  db.prepare(`
    INSERT INTO fahrzeuge (name, typ, kaufpreis, leistung_kw, reichweite_km,
      stromverbrauch_kwh, verbrauch_l, co2_g_km, hubraum_ccm,
      wertverlust_prozent, wartung_jaehrlich, versicherung_jaehrlich)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, typ, parseFloat(kaufpreis),
    leistung_kw ? parseInt(leistung_kw) : null,
    reichweite_km ? parseInt(reichweite_km) : null,
    stromverbrauch_kwh ? parseFloat(stromverbrauch_kwh) : null,
    verbrauch_l ? parseFloat(verbrauch_l) : null,
    co2_g_km ? parseInt(co2_g_km) : null,
    hubraum_ccm ? parseInt(hubraum_ccm) : null,
    wertverlust_prozent ? parseFloat(wertverlust_prozent) : null,
    wartung_jaehrlich ? parseFloat(wartung_jaehrlich) : null,
    versicherung_jaehrlich ? parseFloat(versicherung_jaehrlich) : null
  );

  res.redirect('/fahrzeuge');
});

router.get('/:id', (req, res) => {
  const fahrzeug = db.prepare('SELECT * FROM fahrzeuge WHERE id = ?').get(req.params.id);
  if (!fahrzeug) return res.status(404).send('Nicht gefunden');

  res.render('fahrzeuge/formular', {
    fahrzeug, active: 'fahrzeuge', fehler: null,
    title: 'Fahrzeug bearbeiten'
  });
});

router.post('/:id', (req, res) => {
  const { name, typ, kaufpreis, leistung_kw, reichweite_km, stromverbrauch_kwh,
          verbrauch_l, co2_g_km, hubraum_ccm, wertverlust_prozent,
          wartung_jaehrlich, versicherung_jaehrlich } = req.body;

  if (!name || !typ || !kaufpreis) {
    const fahrzeug = db.prepare('SELECT * FROM fahrzeuge WHERE id = ?').get(req.params.id);
    return res.render('fahrzeuge/formular', {
      fahrzeug: { ...fahrzeug, ...req.body }, active: 'fahrzeuge',
      title: 'Fahrzeug bearbeiten',
      fehler: 'Name, Typ und Kaufpreis sind Pflichtfelder.'
    });
  }

  db.prepare(`
    UPDATE fahrzeuge SET name=?, typ=?, kaufpreis=?, leistung_kw=?, reichweite_km=?,
      stromverbrauch_kwh=?, verbrauch_l=?, co2_g_km=?, hubraum_ccm=?,
      wertverlust_prozent=?, wartung_jaehrlich=?, versicherung_jaehrlich=?
    WHERE id=?
  `).run(
    name, typ, parseFloat(kaufpreis),
    leistung_kw ? parseInt(leistung_kw) : null,
    reichweite_km ? parseInt(reichweite_km) : null,
    stromverbrauch_kwh ? parseFloat(stromverbrauch_kwh) : null,
    verbrauch_l ? parseFloat(verbrauch_l) : null,
    co2_g_km ? parseInt(co2_g_km) : null,
    hubraum_ccm ? parseInt(hubraum_ccm) : null,
    wertverlust_prozent ? parseFloat(wertverlust_prozent) : null,
    wartung_jaehrlich ? parseFloat(wartung_jaehrlich) : null,
    versicherung_jaehrlich ? parseFloat(versicherung_jaehrlich) : null,
    req.params.id
  );

  res.redirect('/fahrzeuge');
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM fahrzeuge WHERE id = ?').run(req.params.id);
  res.redirect('/fahrzeuge');
});

module.exports = router;
```

- [ ] **Step 2: Validieren dass Server ohne Fehler startet**

Run: `timeout 3 node server.js 2>&1 || true`
Expected: Server startet, kein `Cannot find module` Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/routes/fahrzeuge.js
git commit -m "feat: Fahrzeuge CRUD-Routen mit SQLite"
```

---

### Task 7: Fahrzeuge-Views

**Files:**
- Create: `src/views/fahrzeuge/liste.ejs`
- Create: `src/views/fahrzeuge/formular.ejs`

- [ ] **Step 1: src/views/fahrzeuge/liste.ejs anlegen**

```html
<%- include('../layout', { active }) %>
  <h1>Fahrzeuge</h1>

  <div class="filter-bar">
    <a href="/fahrzeuge" <%= filter === 'alle' ? 'class="active"' : '' %>>Alle</a>
    <a href="/fahrzeuge?typ=EV" <%= filter === 'EV' ? 'class="active"' : '' %>>Elektro</a>
    <a href="/fahrzeuge?typ=ICE" <%= filter === 'ICE' ? 'class="active"' : '' %>>Verbrenner</a>
  </div>

  <div class="actions">
    <a href="/fahrzeuge/neu" class="btn btn-primary">Neues Fahrzeug</a>
  </div>

  <% if (fahrzeuge.length === 0) { %>
    <div class="empty-state">
      <p>Noch keine Fahrzeuge angelegt.</p>
    </div>
  <% } else { %>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Typ</th>
          <th>Kaufpreis</th>
          <th>Leistung</th>
          <th>Verbrauch</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <% fahrzeuge.forEach(f => { %>
          <tr>
            <td><%= f.name %></td>
            <td><span class="badge <%= f.typ === 'EV' ? 'ev' : 'ice' %>"><%= f.typ %></span></td>
            <td><%= f.kaufpreis.toLocaleString('de-DE') %> &euro;</td>
            <td><%= f.leistung_kw || '&mdash;' %> kW</td>
            <td>
              <% if (f.typ === 'EV') { %>
                <%= f.stromverbrauch_kwh ? f.stromverbrauch_kwh + ' kWh/100km' : '&mdash;' %>
              <% } else { %>
                <%= f.verbrauch_l ? f.verbrauch_l + ' L/100km' : '&mdash;' %>
              <% } %>
            </td>
            <td>
              <a href="/fahrzeuge/<%= f.id %>" class="btn btn-secondary">Bearbeiten</a>
              <form action="/fahrzeuge/<%= f.id %>/delete" method="POST" class="inline-form">
                <button type="submit" class="btn btn-danger" onclick="return confirm('Wirklich l\u00f6schen?')">L\u00f6schen</button>
              </form>
            </td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  <% } %>
</main>
</body>
</html>
```

- [ ] **Step 2: src/views/fahrzeuge/formular.ejs anlegen**

```html
<%- include('../layout', { active }) %>
  <h1><%= title %></h1>

  <% if (fehler) { %>
    <p style="color:#d94a4a; margin-bottom:1rem;"><%= fehler %></p>
  <% } %>

  <form method="POST" action="<%= fahrzeug ? '/fahrzeuge/' + fahrzeug.id : '/fahrzeuge' %>">
    <div class="form-row">
      <div class="form-group">
        <label for="name">Name *</label>
        <input type="text" id="name" name="name" value="<%= fahrzeug ? fahrzeug.name : '' %>" required>
      </div>
      <div class="form-group">
        <label for="typ">Typ *</label>
        <select id="typ" name="typ" required>
          <option value="">Bitte w&auml;hlen</option>
          <option value="EV" <%= fahrzeug && fahrzeug.typ === 'EV' ? 'selected' : '' %>>Elektro (EV)</option>
          <option value="ICE" <%= fahrzeug && fahrzeug.typ === 'ICE' ? 'selected' : '' %>>Verbrenner (ICE)</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="kaufpreis">Kaufpreis (EUR) *</label>
        <input type="number" id="kaufpreis" name="kaufpreis" step="0.01" value="<%= fahrzeug ? fahrzeug.kaufpreis : '' %>" required>
      </div>
      <div class="form-group">
        <label for="leistung_kw">Leistung (kW)</label>
        <input type="number" id="leistung_kw" name="leistung_kw" value="<%= fahrzeug && fahrzeug.leistung_kw ? fahrzeug.leistung_kw : '' %>">
      </div>
    </div>

    <fieldset>
      <legend>EV-Daten</legend>
      <div class="form-row">
        <div class="form-group">
          <label for="reichweite_km">Reichweite (km)</label>
          <input type="number" id="reichweite_km" name="reichweite_km" value="<%= fahrzeug && fahrzeug.reichweite_km ? fahrzeug.reichweite_km : '' %>">
        </div>
        <div class="form-group">
          <label for="stromverbrauch_kwh">Stromverbrauch (kWh/100km)</label>
          <input type="number" id="stromverbrauch_kwh" name="stromverbrauch_kwh" step="0.1" value="<%= fahrzeug && fahrzeug.stromverbrauch_kwh ? fahrzeug.stromverbrauch_kwh : '' %>">
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>ICE-Daten</legend>
      <div class="form-row">
        <div class="form-group">
          <label for="verbrauch_l">Verbrauch (L/100km)</label>
          <input type="number" id="verbrauch_l" name="verbrauch_l" step="0.1" value="<%= fahrzeug && fahrzeug.verbrauch_l ? fahrzeug.verbrauch_l : '' %>">
        </div>
        <div class="form-group">
          <label for="co2_g_km">CO2 (g/km)</label>
          <input type="number" id="co2_g_km" name="co2_g_km" value="<%= fahrzeug && fahrzeug.co2_g_km ? fahrzeug.co2_g_km : '' %>">
        </div>
      </div>
      <div class="form-group">
        <label for="hubraum_ccm">Hubraum (ccm)</label>
        <input type="number" id="hubraum_ccm" name="hubraum_ccm" value="<%= fahrzeug && fahrzeug.hubraum_ccm ? fahrzeug.hubraum_ccm : '' %>">
      </div>
    </fieldset>

    <fieldset>
      <legend>Laufende Kosten (optional &ndash; Default-Werte werden verwendet)</legend>
      <div class="form-row">
        <div class="form-group">
          <label for="wertverlust_prozent">Wertverlust (% p.a.)</label>
          <input type="number" id="wertverlust_prozent" name="wertverlust_prozent" step="0.1" placeholder="EV: 12 / ICE: 15" value="<%= fahrzeug && fahrzeug.wertverlust_prozent ? fahrzeug.wertverlust_prozent : '' %>">
        </div>
        <div class="form-group">
          <label for="wartung_jaehrlich">Wartung (EUR/Jahr)</label>
          <input type="number" id="wartung_jaehrlich" name="wartung_jaehrlich" step="0.01" placeholder="EV: 400 / ICE: 700" value="<%= fahrzeug && fahrzeug.wartung_jaehrlich ? fahrzeug.wartung_jaehrlich : '' %>">
        </div>
      </div>
      <div class="form-group">
        <label for="versicherung_jaehrlich">Versicherung (EUR/Jahr)</label>
        <input type="number" id="versicherung_jaehrlich" name="versicherung_jaehrlich" step="0.01" placeholder="Default: 800" value="<%= fahrzeug && fahrzeug.versicherung_jaehrlich ? fahrzeug.versicherung_jaehrlich : '' %>">
      </div>
    </fieldset>

    <div class="actions">
      <button type="submit" class="btn btn-primary">Speichern</button>
      <a href="/fahrzeuge" class="btn btn-secondary">Abbrechen</a>
    </div>
  </form>
</main>
</body>
</html>
```

- [ ] **Step 3: Server starten und Seite testen**

Run: `node server.js &`
Dann: `curl -s http://localhost:3000/fahrzeuge | head -10`
Expected: HTML mit "Fahrzeuge" Ueberschrift.
Danach: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add src/views/fahrzeuge/
git commit -m "feat: Fahrzeuge Listen- und Formular-Views"
```

---

### Task 8: TCO-Berechnungslogik

**Files:**
- Create: `src/services/tco.js`

- [ ] **Step 1: src/services/tco.js anlegen**

```javascript
const DEFAULTS = {
  EV: { wertverlust_prozent: 12, wartung_jaehrlich: 400, versicherung_jaehrlich: 800 },
  ICE: { wertverlust_prozent: 15, wartung_jaehrlich: 700, versicherung_jaehrlich: 800 }
};

function kwToPs(kw) {
  return Math.round(kw * 1.35962);
}

function berechneKfzSteuer(fahrzeug) {
  if (fahrzeug.typ === 'EV') return 0;

  const hubraum = fahrzeug.hubraum_ccm || 2000;
  const co2 = fahrzeug.co2_g_km || 150;
  const istDiesel = (fahrzeug.verbrauch_l || 0) < 6;

  const hubraumSteuer = Math.ceil(hubraum / 100) * (istDiesel ? 9.50 : 2);

  const co2Freibetrag = 95;
  const co2Ueberschuss = Math.max(0, co2 - co2Freibetrag);
  const co2Steuer = co2Ueberschuss * 2;

  return hubraumSteuer + co2Steuer;
}

function berechneTCO(fahrzeug, params) {
  const {
    haltedauerJahre,
    jahreskilometer,
    strompreisCt,
    spritpreisCt,
    anlagerenditeProzent,
    kreditzinsProzent,
    finanzierung,
    kreditbetrag
  } = params;

  const typ = fahrzeug.typ;
  const kaufpreis = fahrzeug.kaufpreis;

  const defaults = DEFAULTS[typ];
  const wertverlustProzent = fahrzeug.wertverlust_prozent != null ? fahrzeug.wertverlust_prozent : defaults.wertverlust_prozent;
  const wartungJaehrlich = fahrzeug.wartung_jaehrlich != null ? fahrzeug.wartung_jaehrlich : defaults.wartung_jaehrlich;
  const versicherungJaehrlich = fahrzeug.versicherung_jaehrlich != null ? fahrzeug.versicherung_jaehrlich : defaults.versicherung_jaehrlich;

  const wertverlustJaehrlich = Math.round(kaufpreis * (wertverlustProzent / 100) * 100) / 100;
  const restwert = Math.round(Math.max(0, kaufpreis - (wertverlustJaehrlich * haltedauerJahre)) * 100) / 100;

  let energiekostenJaehrlich;
  if (typ === 'EV') {
    const verbrauch = fahrzeug.stromverbrauch_kwh || 18;
    energiekostenJaehrlich = Math.round((jahreskilometer / 100) * verbrauch * (strompreisCt / 100) * 100) / 100;
  } else {
    const verbrauch = fahrzeug.verbrauch_l || 7;
    energiekostenJaehrlich = Math.round((jahreskilometer / 100) * verbrauch * (spritpreisCt / 100) * 100) / 100;
  }

  const steuerJaehrlich = Math.round(berechneKfzSteuer(fahrzeug) * 100) / 100;
  const thgJaehrlich = typ === 'EV' ? 100 : 0;

  const jaehrlichePosten = {
    wertverlust: wertverlustJaehrlich,
    wartung: wartungJaehrlich,
    versicherung: versicherungJaehrlich,
    steuer: steuerJaehrlich,
    energiekosten: energiekostenJaehrlich,
    thg: -thgJaehrlich
  };

  const jaehrlicheGesamtkosten = Math.round(
    Object.values(jaehrlichePosten).reduce((a, b) => a + b, 0) * 100
  ) / 100;

  let finanzierungsKosten;
  if (finanzierung === 'kredit') {
    finanzierungsKosten = Math.round(kreditbetrag * (kreditzinsProzent / 100) * haltedauerJahre * 100) / 100;
  } else {
    finanzierungsKosten = Math.round(
      kaufpreis * (Math.pow(1 + anlagerenditeProzent / 100, haltedauerJahre) - 1) * 100
    ) / 100;
  }

  const gesamtbetriebskosten = Math.round(jaehrlicheGesamtkosten * haltedauerJahre * 100) / 100;
  const gesamtkosten = Math.round((gesamtbetriebskosten + finanzierungsKosten - restwert) * 100) / 100;
  const kostenProKm = Math.round((gesamtkosten / (haltedauerJahre * jahreskilometer)) * 10000) / 10000;

  return {
    jaehrlichePosten,
    jaehrlicheGesamtkosten,
    finanzierungsKosten,
    restwert,
    gesamtbetriebskosten,
    gesamtkosten,
    kostenProKm
  };
}

function berechneEigenkapitalVerteilung(fahrzeuge, eigenkapital, finanzierungen, kreditbetraege) {
  let remaining = eigenkapital;
  const ergebnisse = [];

  for (let i = 0; i < fahrzeuge.length; i++) {
    const fz = fahrzeuge[i];
    const finanzierung = finanzierungen[i];
    const equityUsed = Math.min(remaining, fz.kaufpreis);
    remaining -= equityUsed;

    let loanAmount = 0;
    if (finanzierung === 'kredit') {
      loanAmount = kreditbetraege[i] || Math.max(0, fz.kaufpreis - equityUsed);
    }

    ergebnisse.push({
      fahrzeugId: fz.id,
      equityUsed,
      loanAmount,
      remainingEquity: remaining
    });
  }

  ergebnisse.remainingEquity = remaining;
  return ergebnisse;
}

module.exports = { berechneTCO, berechneEigenkapitalVerteilung };
```

- [ ] **Step 2: Berechnungslogik testen**

Run: `node -e "
const { berechneTCO } = require('./src/services/tco');
const ev = { typ: 'EV', kaufpreis: 40000, stromverbrauch_kwh: 18 };
const result = berechneTCO(ev, {
  haltedauerJahre: 5, jahreskilometer: 15000, strompreisCt: 35, spritpreisCt: 1.80,
  anlagerenditeProzent: 4, kreditzinsProzent: 5, finanzierung: 'cash', kreditbetrag: 0
});
console.log('Jaehrliche Posten:', JSON.stringify(result.jaehrlichePosten, null, 2));
console.log('Gesamtkosten:', result.gesamtkosten);
console.log('Kosten pro km:', result.kostenProKm);
"`

- [ ] **Step 3: Commit**

```bash
git add src/services/tco.js
git commit -m "feat: TCO-Berechnungslogik inkl. Finanzierung"
```

---

### Task 9: Vergleiche-Routen

**Files:**
- Create: `src/routes/vergleiche.js`

- [ ] **Step 1: src/routes/vergleiche.js anlegen**

```javascript
const { Router } = require('express');
const db = require('../db');
const { berechneTCO, berechneEigenkapitalVerteilung } = require('../services/tco');

const router = Router();

router.get('/', (req, res) => {
  const vergleiche = db.prepare(`
    SELECT v.*, COUNT(vf.id) as fahrzeug_count
    FROM vergleiche v
    LEFT JOIN vergleich_fahrzeuge vf ON vf.vergleich_id = v.id
    GROUP BY v.id
    ORDER BY v.erstellt_am DESC
  `).all();

  res.render('vergleiche/liste', { vergleiche, active: 'vergleiche' });
});

router.get('/neu', (req, res) => {
  const fahrzeuge = db.prepare('SELECT * FROM fahrzeuge ORDER BY typ, name').all();
  res.render('vergleiche/neu', { fahrzeuge, active: 'vergleich-neu', fehler: null });
});

router.post('/', (req, res) => {
  const {
    name, fahrzeug_ids,
    eigenkapital, haltedauer_jahre, jahreskilometer,
    strompreis_ct, spritpreis_ct, anlagerendite_prozent, kreditzins_prozent
  } = req.body;

  const fahrzeuge = db.prepare('SELECT * FROM fahrzeuge ORDER BY typ, name').all();

  if (!fahrzeug_ids || fahrzeug_ids.length < 1) {
    return res.render('vergleiche/neu', {
      fahrzeuge, active: 'vergleich-neu',
      fehler: 'Bitte mindestens ein Fahrzeug auswaehlen.'
    });
  }

  const ids = Array.isArray(fahrzeug_ids) ? fahrzeug_ids : [fahrzeug_ids];
  const ausgewaehlte = ids.map(id => db.prepare('SELECT * FROM fahrzeuge WHERE id = ?').get(id)).filter(Boolean);

  const finanzierungenArr = ausgewaehlte.map(fz => req.body['finanzierung_' + fz.id] || 'cash');
  const kreditbetraegeArr = ausgewaehlte.map(fz => {
    const raw = req.body['kreditbetrag_' + fz.id];
    return raw ? parseFloat(raw) : null;
  });

  const params = {
    haltedauerJahre: parseInt(haltedauer_jahre) || 5,
    jahreskilometer: parseInt(jahreskilometer) || 15000,
    strompreisCt: parseFloat(strompreis_ct) || 35,
    spritpreisCt: parseFloat(spritpreis_ct) || 1.80,
    anlagerenditeProzent: parseFloat(anlagerendite_prozent) || 4,
    kreditzinsProzent: parseFloat(kreditzins_prozent) || 5,
    eigenkapital: parseFloat(eigenkapital) || 0
  };

  const eigenkapitalVerteilung = berechneEigenkapitalVerteilung(
    ausgewaehlte, params.eigenkapital, finanzierungenArr, kreditbetraegeArr
  );

  const ergebnisse = ausgewaehlte.map((fz, i) => {
    const fin = finanzierungenArr[i];
    const kredit = kreditbetraegeArr[i];
    const loanAmount = fin === 'kredit'
      ? (kredit || Math.max(0, fz.kaufpreis - eigenkapitalVerteilung[i].equityUsed))
      : 0;

    const tcoParams = {
      haltedauerJahre: params.haltedauerJahre,
      jahreskilometer: params.jahreskilometer,
      strompreisCt: params.strompreisCt,
      spritpreisCt: params.spritpreisCt,
      anlagerenditeProzent: params.anlagerenditeProzent,
      kreditzinsProzent: params.kreditzinsProzent,
      finanzierung: fin,
      kreditbetrag: loanAmount
    };

    const tco = berechneTCO(fz, tcoParams);
    return {
      fahrzeug: fz,
      finanzierung: fin,
      kreditbetrag: loanAmount,
      equityUsed: eigenkapitalVerteilung[i].equityUsed,
      tco
    };
  });

  const remainingEquity = eigenkapitalVerteilung.remainingEquity;
  let investGain = 0;
  if (remainingEquity > 0) {
    investGain = Math.round(
      remainingEquity * (Math.pow(1 + params.anlagerenditeProzent / 100, params.haltedauerJahre) - 1) * 100
    ) / 100;
  }

  res.render('vergleiche/ergebnis', {
    ergebnisse,
    params,
    remainingEquity,
    investGain,
    active: 'vergleich-neu',
    name: name || 'Vergleich'
  });
});

router.post('/speichern', (req, res) => {
  const {
    name, eigenkapital, haltedauer_jahre, jahreskilometer,
    strompreis_ct, spritpreis_ct, anlagerendite_prozent, kreditzins_prozent,
    fahrzeug_ids
  } = req.body;

  const ids = Array.isArray(fahrzeug_ids) ? fahrzeug_ids : [fahrzeug_ids];
  const finanzierungenArr = ids.map(id => req.body['finanzierung_' + id] || 'cash');
  const kreditbetraegeArr = ids.map(id => {
    const raw = req.body['kreditbetrag_' + id];
    return raw ? parseFloat(raw) : null;
  });

  const result = db.prepare(`
    INSERT INTO vergleiche (name, eigenkapital, haltedauer_jahre, jahreskilometer,
      strompreis_ct, spritpreis_ct, anlagerendite_prozent, kreditzins_prozent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name || 'Vergleich',
    parseFloat(eigenkapital) || 0,
    parseInt(haltedauer_jahre) || 5,
    parseInt(jahreskilometer) || 15000,
    parseFloat(strompreis_ct) || 35,
    parseFloat(spritpreis_ct) || 1.80,
    parseFloat(anlagerendite_prozent) || 4,
    parseFloat(kreditzins_prozent) || 5
  );

  const vergleichId = result.lastInsertRowid;

  const insertVf = db.prepare(`
    INSERT INTO vergleich_fahrzeuge (vergleich_id, fahrzeug_id, finanzierung, kreditbetrag)
    VALUES (?, ?, ?, ?)
  `);

  ids.forEach((fzId, i) => {
    insertVf.run(
      vergleichId,
      parseInt(fzId),
      finanzierungenArr[i],
      kreditbetraegeArr[i]
    );
  });

  res.redirect('/vergleiche/' + vergleichId);
});

router.get('/:id', (req, res) => {
  const vergleich = db.prepare('SELECT * FROM vergleiche WHERE id = ?').get(req.params.id);
  if (!vergleich) return res.status(404).send('Nicht gefunden');

  const vfEntries = db.prepare(`
    SELECT vf.*, f.* FROM vergleich_fahrzeuge vf
    JOIN fahrzeuge f ON f.id = vf.fahrzeug_id
    WHERE vf.vergleich_id = ?
  `).all(vergleich.id);

  const params = {
    haltedauerJahre: vergleich.haltedauer_jahre,
    jahreskilometer: vergleich.jahreskilometer,
    strompreisCt: vergleich.strompreis_ct,
    spritpreisCt: vergleich.spritpreis_ct,
    anlagerenditeProzent: vergleich.anlagerendite_prozent,
    kreditzinsProzent: vergleich.kreditzins_prozent,
    eigenkapital: vergleich.eigenkapital
  };

  const ergebnisse = vfEntries.map(vf => {
    const tco = berechneTCO(vf, {
      haltedauerJahre: params.haltedauerJahre,
      jahreskilometer: params.jahreskilometer,
      strompreisCt: params.strompreisCt,
      spritpreisCt: params.spritpreisCt,
      anlagerenditeProzent: params.anlagerenditeProzent,
      kreditzinsProzent: params.kreditzinsProzent,
      finanzierung: vf.finanzierung,
      kreditbetrag: vf.kreditbetrag || 0
    });

    return {
      fahrzeug: vf,
      finanzierung: vf.finanzierung,
      kreditbetrag: vf.kreditbetrag || 0,
      tco
    };
  });

  res.render('vergleiche/ergebnis', {
    ergebnisse,
    params,
    active: 'vergleiche',
    name: vergleich.name,
    savedId: vergleich.id
  });
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM vergleiche WHERE id = ?').run(req.params.id);
  res.redirect('/vergleiche');
});

module.exports = router;
```

- [ ] **Step 2: Server testen**

Run: `timeout 3 node server.js 2>&1 || true`
Expected: Kein Fehler, Server startet.

- [ ] **Step 3: Commit**

```bash
git add src/routes/vergleiche.js
git commit -m "feat: Vergleiche-Routen mit TCO-Berechnung und Speichern"
```

---

### Task 10: Vergleiche-Views

**Files:**
- Create: `src/views/vergleiche/neu.ejs`
- Create: `src/views/vergleiche/ergebnis.ejs`
- Create: `src/views/vergleiche/liste.ejs`

- [ ] **Step 1: src/views/vergleiche/neu.ejs anlegen**

```html
<%- include('../layout', { active }) %>
  <h1>Neuer Vergleich</h1>

  <% if (typeof fehler !== 'undefined' && fehler) { %>
    <p style="color:#d94a4a; margin-bottom:1rem;"><%= fehler %></p>
  <% } %>

  <% if (fahrzeuge.length === 0) { %>
    <div class="empty-state">
      <p>Keine Fahrzeuge vorhanden. Bitte zuerst Fahrzeuge anlegen.</p>
      <a href="/fahrzeuge/neu" class="btn btn-primary">Fahrzeug anlegen</a>
    </div>
  <% } else { %>
    <form method="POST" action="/vergleiche">
      <h2>Fahrzeuge ausw&auml;hlen</h2>
      <% fahrzeuge.forEach((f) => { %>
        <div class="checkbox-item <%= f.typ === 'EV' ? 'ev' : 'ice' %>" style="display:block; margin-bottom:0.75rem;">
          <label style="font-weight:600;">
            <input type="checkbox" name="fahrzeug_ids" value="<%= f.id %>">
            <%= f.name %>
            <span class="badge <%= f.typ === 'EV' ? 'ev' : 'ice' %>"><%= f.typ %></span>
            <%= f.kaufpreis.toLocaleString('de-DE') %> &euro;
          </label>
          <div style="margin-top:0.5rem; margin-left:1.5rem; display:flex; gap:0.5rem; align-items:center;">
            <select name="finanzierung_<%= f.id %>">
              <option value="cash">Barzahlung</option>
              <option value="kredit">Kredit</option>
            </select>
            <input type="number" name="kreditbetrag_<%= f.id %>" placeholder="Kreditbetrag (EUR)" step="0.01" style="width:180px;">
          </div>
        </div>
      <% }) %>

      <h2>Rahmenparameter</h2>
      <div class="form-row">
        <div class="form-group">
          <label for="name">Name des Vergleichs</label>
          <input type="text" id="name" name="name" placeholder="z.B. ID.3 vs Golf">
        </div>
        <div class="form-group">
          <label for="eigenkapital">Eigenkapital (EUR)</label>
          <input type="number" id="eigenkapital" name="eigenkapital" step="0.01" value="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="haltedauer_jahre">Haltedauer (Jahre)</label>
          <input type="number" id="haltedauer_jahre" name="haltedauer_jahre" value="5" min="1" max="15">
        </div>
        <div class="form-group">
          <label for="jahreskilometer">Kilometer pro Jahr</label>
          <input type="number" id="jahreskilometer" name="jahreskilometer" value="15000" min="1000">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="strompreis_ct">Strompreis (ct/kWh)</label>
          <input type="number" id="strompreis_ct" name="strompreis_ct" step="0.01" value="35">
        </div>
        <div class="form-group">
          <label for="spritpreis_ct">Spritpreis (ct/L)</label>
          <input type="number" id="spritpreis_ct" name="spritpreis_ct" step="0.01" value="1.80">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="anlagerendite_prozent">Anlagerendite (% p.a.)</label>
          <input type="number" id="anlagerendite_prozent" name="anlagerendite_prozent" step="0.1" value="4">
        </div>
        <div class="form-group">
          <label for="kreditzins_prozent">Kreditzins (% p.a.)</label>
          <input type="number" id="kreditzins_prozent" name="kreditzins_prozent" step="0.1" value="5">
        </div>
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary">Vergleich berechnen</button>
      </div>
    </form>
  <% } %>
</main>
</body>
</html>
```

- [ ] **Step 2: src/views/vergleiche/ergebnis.ejs anlegen**

```html
<%- include('../layout', { active }) %>
  <h1><%= typeof name !== 'undefined' ? name : 'Vergleichsergebnis' %></h1>

  <div class="summary-cards">
    <% let maxKosten = 0;
       ergebnisse.forEach(e => { if (e.tco.gesamtkosten > maxKosten) maxKosten = e.tco.gesamtkosten; }); %>

    <% ergebnisse.forEach(e => { %>
      <div class="summary-card">
        <h3><%= e.fahrzeug.name %> (<span class="badge <%= e.fahrzeug.typ === 'EV' ? 'ev' : 'ice' %>"><%= e.fahrzeug.typ %></span>)</h3>
        <div class="value positive"><%= Math.round(e.tco.gesamtkosten).toLocaleString('de-DE') %> &euro;</div>
        <div style="font-size:0.8rem; color:#888;">
          <%= e.tco.kostenProKm.toFixed(2).replace('.', ',') %> &euro;/km
          <% if (e.finanzierung === 'kredit') { %>
            &middot; Kredit: <%= e.kreditbetrag.toLocaleString('de-DE') %> &euro;
          <% } else { %>
            &middot; Barzahlung
          <% } %>
        </div>
      </div>
    <% }) %>
  </div>

  <h2>Gesamtkosten (Balkendiagramm)</h2>
  <div class="bar-chart">
    <% ergebnisse.forEach(e => {
      const pct = maxKosten > 0 ? (e.tco.gesamtkosten / maxKosten * 100) : 0;
    %>
      <div class="bar-row">
        <div class="bar-label"><%= e.fahrzeug.name %></div>
        <div class="bar-track">
          <div class="bar-fill <%= e.fahrzeug.typ === 'EV' ? 'ev' : 'ice' %>" style="width:<%= Math.round(pct) %>%">
            <%= Math.round(e.tco.gesamtkosten).toLocaleString('de-DE') %> &euro;
          </div>
        </div>
      </div>
    <% }) %>
  </div>

  <h2>J&auml;hrliche Kosten</h2>
  <table>
    <thead>
      <tr>
        <th>Posten</th>
        <% ergebnisse.forEach(e => { %>
          <th><%= e.fahrzeug.name %></th>
        <% }) %>
      </tr>
    </thead>
    <tbody>
      <% const posten = ['wertverlust', 'wartung', 'versicherung', 'steuer', 'energiekosten', 'thg'];
         posten.forEach(p => { %>
        <tr>
          <td>
            <% if (p === 'wertverlust') { %>Wertverlust<% } %>
            <% if (p === 'wartung') { %>Wartung<% } %>
            <% if (p === 'versicherung') { %>Versicherung<% } %>
            <% if (p === 'steuer') { %>Kfz-Steuer<% } %>
            <% if (p === 'energiekosten') { %>Energiekosten<% } %>
            <% if (p === 'thg') { %>THG-Pr&auml;mie<% } %>
          </td>
          <% ergebnisse.forEach(e => { %>
            <td<%- e.tco.jaehrlichePosten[p] < 0 ? ' style="color:#4a9d4a;"' : '' %>>
              <%= e.tco.jaehrlichePosten[p].toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> &euro;
            </td>
          <% }) %>
        </tr>
      <% }) %>
      <tr style="font-weight:700; border-top:2px solid #333;">
        <td>Summe pro Jahr</td>
        <% ergebnisse.forEach(e => { %>
          <td><%= e.tco.jaehrlicheGesamtkosten.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> &euro;</td>
        <% }) %>
      </tr>
    </tbody>
  </table>

  <h2>Finanzierungskosten</h2>
  <table>
    <thead>
      <tr><th>Posten</th><% ergebnisse.forEach(e => { %><th><%= e.fahrzeug.name %></th><% }) %></tr>
    </thead>
    <tbody>
      <tr>
        <td>Finanzierungsart</td>
        <% ergebnisse.forEach(e => { %>
          <td><%= e.finanzierung === 'kredit' ? 'Kredit' : 'Barzahlung' %></td>
        <% }) %>
      </tr>
      <tr>
        <td>Kosten</td>
        <% ergebnisse.forEach(e => { %>
          <td><%= e.tco.finanzierungsKosten.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> &euro;</td>
        <% }) %>
      </tr>
      <tr>
        <td>Restwert nach <%= params.haltedauerJahre %> Jahren</td>
        <% ergebnisse.forEach(e => { %>
          <td>-<%= e.tco.restwert.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> &euro;</td>
        <% }) %>
      </tr>
    </tbody>
  </table>

  <% if (typeof remainingEquity !== 'undefined' && remainingEquity > 0) { %>
    <p style="margin-top:1rem;">Verbleibendes Eigenkapital (<%= remainingEquity.toLocaleString('de-DE') %> &euro;) bringt bei <%= params.anlagerenditeProzent %>% Rendite &uuml;ber <%= params.haltedauerJahre %> Jahre: <strong style="color:#4a9d4a;">+<%= investGain.toLocaleString('de-DE') %> &euro;</strong></p>
  <% } %>

  <% if (typeof savedId === 'undefined') { %>
    <div class="actions">
      <form method="POST" action="/vergleiche/speichern" style="display:flex; gap:0.5rem;">
        <input type="hidden" name="name" value="<%= name || 'Vergleich' %>">
        <input type="hidden" name="eigenkapital" value="<%= params.eigenkapital %>">
        <input type="hidden" name="haltedauer_jahre" value="<%= params.haltedauerJahre %>">
        <input type="hidden" name="jahreskilometer" value="<%= params.jahreskilometer %>">
        <input type="hidden" name="strompreis_ct" value="<%= params.strompreisCt %>">
        <input type="hidden" name="spritpreis_ct" value="<%= params.spritpreisCt %>">
        <input type="hidden" name="anlagerendite_prozent" value="<%= params.anlagerenditeProzent %>">
        <input type="hidden" name="kreditzins_prozent" value="<%= params.kreditzinsProzent %>">
        <% ergebnisse.forEach((e, i) => { %>
          <input type="hidden" name="fahrzeug_ids" value="<%= e.fahrzeug.id %>">
          <input type="hidden" name="finanzierung_<%= e.fahrzeug.id %>" value="<%= e.finanzierung %>">
          <input type="hidden" name="kreditbetrag_<%= e.fahrzeug.id %>" value="<%= e.kreditbetrag %>">
        <% }) %>
        <button type="submit" class="btn btn-primary">Vergleich speichern</button>
      </form>
      <a href="/vergleiche/neu" class="btn btn-secondary">Neuer Vergleich</a>
    </div>
  <% } %>
</main>
</body>
</html>
```

- [ ] **Step 3: src/views/vergleiche/liste.ejs anlegen**

```html
<%- include('../layout', { active }) %>
  <h1>Gespeicherte Vergleiche</h1>

  <div class="actions">
    <a href="/vergleiche/neu" class="btn btn-primary">Neuer Vergleich</a>
  </div>

  <% if (vergleiche.length === 0) { %>
    <div class="empty-state">
      <p>Noch keine Vergleiche gespeichert.</p>
    </div>
  <% } else { %>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Datum</th>
          <th>Fahrzeuge</th>
          <th>Haltedauer</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <% vergleiche.forEach(v => { %>
          <tr>
            <td><%= v.name %></td>
            <td><%= new Date(v.erstellt_am + 'Z').toLocaleDateString('de-DE') %></td>
            <td><%= v.fahrzeug_count %> Fahrzeuge</td>
            <td><%= v.haltedauer_jahre %> Jahre / <%= v.jahreskilometer.toLocaleString('de-DE') %> km</td>
            <td>
              <a href="/vergleiche/<%= v.id %>" class="btn btn-secondary">Anzeigen</a>
              <form action="/vergleiche/<%= v.id %>/delete" method="POST" class="inline-form">
                <button type="submit" class="btn btn-danger" onclick="return confirm('Wirklich l\u00f6schen?')">L\u00f6schen</button>
              </form>
            </td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  <% } %>
</main>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add src/views/vergleiche/
git commit -m "feat: Vergleichs-Views (Auswahl, Ergebnis, Liste)"
```

---

### Task 11: Integrationstest und Docker-Verifikation

- [ ] **Step 1: Ist alles committet?**

Run: `git status`
Expected: Clean working tree (keine uncommitteten Aenderungen).

- [ ] **Step 2: npm install sicherstellen**

Run: `npm install`
Expected: Keine Fehler.

- [ ] **Step 3: App lokal starten und durchklicken**

Run: `node server.js &`
Dann: `sleep 2`

```bash
echo "=== Startseite ==="
curl -s http://localhost:3000/ | grep -o '<h1>[^<]*</h1>'

echo "=== Fahrzeuge-Seite ==="
curl -s http://localhost:3000/fahrzeuge | grep -o '<h1>[^<]*</h1>'

echo "=== Neues Fahrzeug Formular ==="
curl -s http://localhost:3000/fahrzeuge/neu | grep -o '<h1>[^<]*</h1>'

echo "=== Fahrzeug anlegen (EV) ==="
curl -s -X POST http://localhost:3000/fahrzeuge \
  -d "name=VW ID.3 Pro&typ=EV&kaufpreis=40000&leistung_kw=150&reichweite_km=420&stromverbrauch_kwh=16.5" \
  -o /dev/null -w "%{http_code}"

echo ""
echo "=== Fahrzeug anlegen (ICE) ==="
curl -s -X POST http://localhost:3000/fahrzeuge \
  -d "name=VW Golf 1.5 eTSI&typ=ICE&kaufpreis=30000&leistung_kw=110&verbrauch_l=5.8&co2_g_km=132&hubraum_ccm=1498" \
  -o /dev/null -w "%{http_code}"

echo ""
echo "=== Vergleich berechnen ==="
curl -s -X POST http://localhost:3000/vergleiche \
  -d "fahrzeug_ids=1&finanzierungen=cash&fahrzeug_ids=2&finanzierungen=kredit&name=ID.3 vs Golf&eigenkapital=20000&haltedauer_jahre=5&jahreskilometer=15000&strompreis_ct=35&spritpreis_ct=1.80&anlagerendite_prozent=4&kreditzins_prozent=5" \
  | grep -o '<h1>[^<]*</h1>'
```

Expected: HTTP 302 (Redirect) fuer POSTs, HTML mit Ergebnissen fuer den Vergleich.

Dann: `kill %1`

- [ ] **Step 4: Datenbank-Datei aufraeumen**

Run: `rm -f data/tco.sqlite`

- [ ] **Step 5: Docker-Build testen**

Run: `docker build -t tco-rechner .`
Expected: Build erfolgreich.

- [ ] **Step 6: Docker-Container starten und testen**

Run: `docker run -d --name tco-test -p 3000:3000 -v $(pwd)/data:/app/data tco-rechner`
Dann: `sleep 3`
Dann: `curl -s http://localhost:3000/ | grep -o '<h1>[^<]*</h1>'`
Expected: `<h1>TCO-Rechner</h1>`
Dann: `docker stop tco-test && docker rm tco-test`

- [ ] **Step 7: Commit (falls Aenderungen) und finale Verifikation**

```bash
git status
git log --oneline
```
