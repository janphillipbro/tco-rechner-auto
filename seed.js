const db = require('./src/db');

const fahrzeuge = [
  // --- Top 10 Verbrenner (KBA Mai 2026) ---
  {
    name: 'VW Golf 1.5 eTSI', typ: 'ICE',
    listenpreis: 34200, kaufpreis: 28200,
    leistung_kw: 110, verbrauch_l: 5.4, co2_g_km: 123, hubraum_ccm: 1498,
    versicherung_jaehrlich: 720, wartung_jaehrlich: 550
  },
  {
    name: 'VW T-Roc 1.5 TSI', typ: 'ICE',
    listenpreis: 33100, kaufpreis: 27200,
    leistung_kw: 110, verbrauch_l: 5.7, co2_g_km: 130, hubraum_ccm: 1498,
    versicherung_jaehrlich: 740, wartung_jaehrlich: 550
  },
  {
    name: 'VW Tiguan 2.0 TDI', typ: 'ICE',
    listenpreis: 48100, kaufpreis: 40300,
    leistung_kw: 110, verbrauch_l: 5.5, co2_g_km: 143, hubraum_ccm: 1968,
    versicherung_jaehrlich: 830, wartung_jaehrlich: 650
  },
  {
    name: 'Opel Corsa 1.2', typ: 'ICE',
    listenpreis: 22900, kaufpreis: 18900,
    leistung_kw: 74, verbrauch_l: 5.5, co2_g_km: 124, hubraum_ccm: 1199,
    versicherung_jaehrlich: 610, wartung_jaehrlich: 450
  },
  {
    name: 'BMW X1 sDrive18i', typ: 'ICE',
    listenpreis: 43550, kaufpreis: 37100,
    leistung_kw: 100, verbrauch_l: 6.5, co2_g_km: 148, hubraum_ccm: 1499,
    wertverlust_prozent: 16, versicherung_jaehrlich: 940, wartung_jaehrlich: 750
  },
  {
    name: 'Mini Cooper C', typ: 'ICE',
    listenpreis: 30900, kaufpreis: 26200,
    leistung_kw: 115, verbrauch_l: 5.9, co2_g_km: 133, hubraum_ccm: 1499,
    versicherung_jaehrlich: 710
  },
  {
    name: 'Skoda Octavia 2.0 TDI', typ: 'ICE',
    listenpreis: 36300, kaufpreis: 30400,
    leistung_kw: 110, verbrauch_l: 4.9, co2_g_km: 128, hubraum_ccm: 1968,
    versicherung_jaehrlich: 690, wartung_jaehrlich: 550
  },
  {
    name: 'BMW X3 xDrive20d', typ: 'ICE',
    listenpreis: 58300, kaufpreis: 50300,
    leistung_kw: 140, verbrauch_l: 6.0, co2_g_km: 157, hubraum_ccm: 1995,
    wertverlust_prozent: 16, versicherung_jaehrlich: 1020, wartung_jaehrlich: 850
  },
  {
    name: 'VW T-Cross 1.0 TSI', typ: 'ICE',
    listenpreis: 26100, kaufpreis: 21500,
    leistung_kw: 81, verbrauch_l: 5.6, co2_g_km: 128, hubraum_ccm: 999,
    versicherung_jaehrlich: 670
  },
  {
    name: 'VW Passat 2.0 TDI', typ: 'ICE',
    listenpreis: 51700, kaufpreis: 43800,
    leistung_kw: 110, verbrauch_l: 5.3, co2_g_km: 139, hubraum_ccm: 1968,
    versicherung_jaehrlich: 840, wartung_jaehrlich: 650
  },

  // --- Top 10 Elektro ---
  {
    name: 'Tesla Model Y', typ: 'EV',
    listenpreis: 44990, kaufpreis: 42990,
    leistung_kw: 220, reichweite_km: 455, stromverbrauch_kwh: 16.9, ladezeit_min: 25,
    versicherung_jaehrlich: 920
  },
  {
    name: 'VW ID.4 Pro', typ: 'EV',
    listenpreis: 48200, kaufpreis: 40900,
    leistung_kw: 210, reichweite_km: 520, stromverbrauch_kwh: 16.5, ladezeit_min: 28,
    versicherung_jaehrlich: 830
  },
  {
    name: 'Skoda Enyaq 85', typ: 'EV',
    listenpreis: 46900, kaufpreis: 39800,
    leistung_kw: 210, reichweite_km: 560, stromverbrauch_kwh: 15.8, ladezeit_min: 28,
    versicherung_jaehrlich: 790
  },
  {
    name: 'VW ID.3 Pro S', typ: 'EV',
    listenpreis: 43500, kaufpreis: 36500,
    leistung_kw: 170, reichweite_km: 550, stromverbrauch_kwh: 15.2, ladezeit_min: 30,
    versicherung_jaehrlich: 740
  },
  {
    name: 'Tesla Model 3', typ: 'EV',
    listenpreis: 42990, kaufpreis: 40990,
    leistung_kw: 208, reichweite_km: 513, stromverbrauch_kwh: 15.8, ladezeit_min: 25,
    versicherung_jaehrlich: 900
  },
  {
    name: 'BMW i4 eDrive35', typ: 'EV',
    listenpreis: 58500, kaufpreis: 50400,
    leistung_kw: 210, reichweite_km: 480, stromverbrauch_kwh: 17.1, ladezeit_min: 30,
    versicherung_jaehrlich: 960, wartung_jaehrlich: 500
  },
  {
    name: 'Fiat 500e', typ: 'EV',
    listenpreis: 29900, kaufpreis: 24900,
    leistung_kw: 87, reichweite_km: 320, stromverbrauch_kwh: 14.3, ladezeit_min: 35,
    versicherung_jaehrlich: 580
  },
  {
    name: 'Audi Q4 e-tron 45', typ: 'EV',
    listenpreis: 54800, kaufpreis: 47400,
    leistung_kw: 210, reichweite_km: 530, stromverbrauch_kwh: 17.5, ladezeit_min: 28,
    versicherung_jaehrlich: 940
  },
  {
    name: 'Cupra Born 77 kWh', typ: 'EV',
    listenpreis: 43900, kaufpreis: 36800,
    leistung_kw: 170, reichweite_km: 540, stromverbrauch_kwh: 16.0, ladezeit_min: 35,
    versicherung_jaehrlich: 740
  },
  {
    name: 'Hyundai Ioniq 5', typ: 'EV',
    listenpreis: 48900, kaufpreis: 41900,
    leistung_kw: 168, reichweite_km: 507, stromverbrauch_kwh: 17.0, ladezeit_min: 18,
    versicherung_jaehrlich: 810
  }
];

const insert = db.prepare(`
  INSERT INTO fahrzeuge (name, typ, listenpreis, kaufpreis, leistung_kw, reichweite_km,
    stromverbrauch_kwh, verbrauch_l, co2_g_km, hubraum_ccm,
    wertverlust_prozent, wartung_jaehrlich, versicherung_jaehrlich, ladezeit_min)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM fahrzeuge').get().cnt;
if (count > 0) {
  console.log(`Datenbank enthaelt bereits ${count} Fahrzeuge. Ueberspringe Seed.`);
  process.exit(0);
}

const insertMany = db.transaction((fahrzeuge) => {
  fahrzeuge.forEach(f => {
    insert.run(
      f.name, f.typ,
      f.listenpreis || null,
      f.kaufpreis,
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
