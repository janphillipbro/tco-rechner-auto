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
