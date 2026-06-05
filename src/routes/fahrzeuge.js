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
    leistung_kw != null && leistung_kw !== '' ? parseInt(leistung_kw) : null,
    reichweite_km != null && reichweite_km !== '' ? parseInt(reichweite_km) : null,
    stromverbrauch_kwh != null && stromverbrauch_kwh !== '' ? parseFloat(stromverbrauch_kwh) : null,
    verbrauch_l != null && verbrauch_l !== '' ? parseFloat(verbrauch_l) : null,
    co2_g_km != null && co2_g_km !== '' ? parseInt(co2_g_km) : null,
    hubraum_ccm != null && hubraum_ccm !== '' ? parseInt(hubraum_ccm) : null,
    wertverlust_prozent != null && wertverlust_prozent !== '' ? parseFloat(wertverlust_prozent) : null,
    wartung_jaehrlich != null && wartung_jaehrlich !== '' ? parseFloat(wartung_jaehrlich) : null,
    versicherung_jaehrlich != null && versicherung_jaehrlich !== '' ? parseFloat(versicherung_jaehrlich) : null
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
    leistung_kw != null && leistung_kw !== '' ? parseInt(leistung_kw) : null,
    reichweite_km != null && reichweite_km !== '' ? parseInt(reichweite_km) : null,
    stromverbrauch_kwh != null && stromverbrauch_kwh !== '' ? parseFloat(stromverbrauch_kwh) : null,
    verbrauch_l != null && verbrauch_l !== '' ? parseFloat(verbrauch_l) : null,
    co2_g_km != null && co2_g_km !== '' ? parseInt(co2_g_km) : null,
    hubraum_ccm != null && hubraum_ccm !== '' ? parseInt(hubraum_ccm) : null,
    wertverlust_prozent != null && wertverlust_prozent !== '' ? parseFloat(wertverlust_prozent) : null,
    wartung_jaehrlich != null && wartung_jaehrlich !== '' ? parseFloat(wartung_jaehrlich) : null,
    versicherung_jaehrlich != null && versicherung_jaehrlich !== '' ? parseFloat(versicherung_jaehrlich) : null,
    req.params.id
  );

  res.redirect('/fahrzeuge');
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM fahrzeuge WHERE id = ?').run(req.params.id);
  res.redirect('/fahrzeuge');
});

module.exports = router;
