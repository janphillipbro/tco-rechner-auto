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
