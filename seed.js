const db = require('./src/db');

const fahrzeuge = [
  // --- Top 10 Verbrenner ---
  {
    name: 'VW Golf 1.5 eTSI', typ: 'ICE', kaufpreis: 30500,
    leistung_kw: 110, verbrauch_l: 5.4, co2_g_km: 123, hubraum_ccm: 1498
  },
  {
    name: 'VW Tiguan 2.0 TDI', typ: 'ICE', kaufpreis: 43500,
    leistung_kw: 110, verbrauch_l: 5.5, co2_g_km: 143, hubraum_ccm: 1968
  },
  {
    name: 'VW T-Roc 1.5 TSI', typ: 'ICE', kaufpreis: 29500,
    leistung_kw: 110, verbrauch_l: 5.7, co2_g_km: 130, hubraum_ccm: 1498
  },
  {
    name: 'Opel Corsa 1.2', typ: 'ICE', kaufpreis: 20500,
    leistung_kw: 74, verbrauch_l: 5.5, co2_g_km: 124, hubraum_ccm: 1199
  },
  {
    name: 'Skoda Octavia 2.0 TDI', typ: 'ICE', kaufpreis: 32500,
    leistung_kw: 110, verbrauch_l: 4.9, co2_g_km: 128, hubraum_ccm: 1968
  },
  {
    name: 'VW Passat 2.0 TDI', typ: 'ICE', kaufpreis: 46500,
    leistung_kw: 110, verbrauch_l: 5.3, co2_g_km: 139, hubraum_ccm: 1968
  },
  {
    name: 'BMW 320i', typ: 'ICE', kaufpreis: 44500,
    leistung_kw: 135, verbrauch_l: 6.1, co2_g_km: 138, hubraum_ccm: 1998,
    wertverlust_prozent: 16, wartung_jaehrlich: 850, versicherung_jaehrlich: 950
  },
  {
    name: 'Audi A4 35 TDI', typ: 'ICE', kaufpreis: 46000,
    leistung_kw: 120, verbrauch_l: 5.2, co2_g_km: 136, hubraum_ccm: 1968,
    wertverlust_prozent: 16, wartung_jaehrlich: 800, versicherung_jaehrlich: 950
  },
  {
    name: 'Mercedes C 200', typ: 'ICE', kaufpreis: 48000,
    leistung_kw: 150, verbrauch_l: 6.4, co2_g_km: 145, hubraum_ccm: 1991,
    wertverlust_prozent: 17, wartung_jaehrlich: 900, versicherung_jaehrlich: 1000
  },
  {
    name: 'Fiat 500 Hybrid', typ: 'ICE', kaufpreis: 18500,
    leistung_kw: 51, verbrauch_l: 4.8, co2_g_km: 109, hubraum_ccm: 999
  },

  // --- Top 10 Elektro ---
  {
    name: 'Tesla Model Y', typ: 'EV', kaufpreis: 45000,
    leistung_kw: 220, reichweite_km: 455, stromverbrauch_kwh: 16.9, ladezeit_min: 25
  },
  {
    name: 'VW ID.4 Pro', typ: 'EV', kaufpreis: 43500,
    leistung_kw: 210, reichweite_km: 520, stromverbrauch_kwh: 16.5, ladezeit_min: 28
  },
  {
    name: 'Skoda Enyaq 85', typ: 'EV', kaufpreis: 42000,
    leistung_kw: 210, reichweite_km: 560, stromverbrauch_kwh: 15.8, ladezeit_min: 28
  },
  {
    name: 'VW ID.3 Pro S', typ: 'EV', kaufpreis: 38500,
    leistung_kw: 170, reichweite_km: 550, stromverbrauch_kwh: 15.2, ladezeit_min: 30
  },
  {
    name: 'Tesla Model 3', typ: 'EV', kaufpreis: 43000,
    leistung_kw: 208, reichweite_km: 513, stromverbrauch_kwh: 15.8, ladezeit_min: 25
  },
  {
    name: 'BMW i4 eDrive35', typ: 'EV', kaufpreis: 52500,
    leistung_kw: 210, reichweite_km: 480, stromverbrauch_kwh: 17.1, ladezeit_min: 30,
    wartung_jaehrlich: 500, versicherung_jaehrlich: 900
  },
  {
    name: 'Fiat 500e', typ: 'EV', kaufpreis: 26500,
    leistung_kw: 87, reichweite_km: 320, stromverbrauch_kwh: 14.3, ladezeit_min: 35
  },
  {
    name: 'Audi Q4 e-tron 45', typ: 'EV', kaufpreis: 49000,
    leistung_kw: 210, reichweite_km: 530, stromverbrauch_kwh: 17.5, ladezeit_min: 28,
    versicherung_jaehrlich: 950
  },
  {
    name: 'Cupra Born 77 kWh', typ: 'EV', kaufpreis: 39000,
    leistung_kw: 170, reichweite_km: 540, stromverbrauch_kwh: 16.0, ladezeit_min: 35
  },
  {
    name: 'Hyundai Ioniq 5', typ: 'EV', kaufpreis: 44000,
    leistung_kw: 168, reichweite_km: 507, stromverbrauch_kwh: 17.0, ladezeit_min: 18
  }
];

const insert = db.prepare(`
  INSERT INTO fahrzeuge (name, typ, kaufpreis, leistung_kw, reichweite_km,
    stromverbrauch_kwh, verbrauch_l, co2_g_km, hubraum_ccm,
    wertverlust_prozent, wartung_jaehrlich, versicherung_jaehrlich, ladezeit_min)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM fahrzeuge').get().cnt;
if (count > 0) {
  console.log(`Datenbank enthaelt bereits ${count} Fahrzeuge. Ueberspringe Seed.`);
  process.exit(0);
}

const insertMany = db.transaction((fahrzeuge) => {
  fahrzeuge.forEach(f => {
    insert.run(
      f.name, f.typ, f.kaufpreis,
      f.leistung_kw || null,
      f.reichweite_km || null,
      f.stromverbrauch_kwh || null,
      f.verbrauch_l || null,
      f.co2_g_km || null,
      f.hubraum_ccm || null,
      f.wertverlust_prozent || null,
      f.wartung_jaehrlich || null,
      f.versicherung_jaehrlich || null,
      f.ladezeit_min || null
    );
  });
});

insertMany(fahrzeuge);
console.log(`${fahrzeuge.length} Fahrzeuge eingefuegt.`);
