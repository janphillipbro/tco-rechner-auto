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
