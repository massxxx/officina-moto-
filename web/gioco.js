'use strict';
/* ============ Officina Moto ============ */
const SAVE = 'massi-officinamoto-v1', RECORD = 'massi-officinamoto-record';
const $ = s => document.querySelector(s);
const rnd = Math.random;
const pick = a => a[Math.floor(rnd() * a.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function fmt(n) {
  n = Math.floor(n);
  const neg = n < 0; n = Math.abs(n);
  let s;
  const d = (x) => x.toLocaleString('it-IT', { maximumFractionDigits: x < 10 ? 2 : x < 100 ? 1 : 0 });
  if (n < 1e5) s = n.toLocaleString('it-IT');
  else if (n < 1e6) s = d(n / 1e3) + ' mila';
  else if (n < 1e9) s = d(n / 1e6) + ' mln';
  else if (n < 1e12) s = d(n / 1e9) + ' mld';
  else if (n < 1e15) s = d(n / 1e12) + ' bln';
  else s = n.toExponential(2).replace('.', ',');
  return (neg ? '−' : '') + s;
}
const eur = n => '€ ' + fmt(n);
function durata(sec) {
  sec = Math.floor(sec);
  const g = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
  if (g) return g + ' g ' + h + ' h';
  if (h) return h + ' h ' + m + ' min';
  if (m) return m + ' min';
  return sec + ' s';
}

/* ---------- DATI ---------- */
const ATTREZZI = [
  { id: 'chiavi', nome: 'Cassetta chiavi', costo: 0, ic: '🧰', desc: 'Chiavi fisse, a bussola e cacciaviti: bastano per i lavori di base.' },
  { id: 'tester', nome: 'Multimetro', costo: 400, ic: '📟', desc: 'Misura tensione, corrente e resistenza: serve per trovare i guasti elettrici. Sblocca batteria, regolatore, luci e LED.' },
  { id: 'dinamo', nome: 'Chiave dinamometrica', costo: 900, ic: '🔩', desc: 'Stringe i bulloni alla coppia giusta (in newton-metro) indicata dal costruttore. Sblocca ammortizzatore e fasce; freni e ciclistica più veloci.', bonus: { freni: 1.3, ciclistica: 1.3 } },
  { id: 'smonta', nome: 'Smontagomme ed equilibratrice', costo: 2200, ic: '🛞', desc: 'Toglie lo pneumatico dal cerchio, poi l\'equilibratrice lo bilancia con i pesetti per non far vibrare la ruota. Sblocca il cambio gomme.' },
  { id: 'compressore', nome: 'Compressore', costo: 4000, ic: '💨', desc: 'Aria compressa per avvitatori e pistole di pulizia: tutti i lavori dei meccanici sono il 20% più veloci.', bonusAll: 1.2 },
  { id: 'vacuo', nome: 'Vacuometro', costo: 6000, ic: '⏲️', desc: 'Misura la depressione nei condotti di aspirazione per sincronizzare carburatori e corpi farfallati. Sblocca il carburatore.' },
  { id: 'pressa', nome: 'Pressa idraulica', costo: 12000, ic: '🗜️', desc: 'Spinge fuori e dentro cuscinetti e paraoli senza rovinarli. Sblocca forcella e cuscinetti di sterzo.' },
  { id: 'obd', nome: 'Diagnosi elettronica', costo: 25000, ic: '💻', desc: 'Si collega alla centralina, legge i codici di errore e i valori dei sensori. Sblocca iniettori e mappatura.' },
  { id: 'cabina', nome: 'Cabina di verniciatura', costo: 60000, ic: '🎨', desc: 'Ambiente chiuso con aria filtrata e forno: la vernice asciuga senza polvere. Sblocca la verniciatura.' },
  { id: 'tig', nome: 'Saldatrice TIG', costo: 120000, ic: '⚡', desc: 'Salda acciaio inox e alluminio con un arco protetto da gas argon: per scarichi e telaietti. Sblocca gli scarichi artigianali.' },
  { id: 'rulli', nome: 'Banco prova a rulli', costo: 120000, ic: '📈', desc: 'La ruota posteriore spinge su un rullo e il banco misura potenza e coppia alla ruota. Sblocca le moto da pista e la squadra corse.' },
];
const ATT = Object.fromEntries(ATTREZZI.map(a => [a.id, a]));

// gioco: bulloni | regola | tieni ; cat: motore trasmissione freni ciclistica elettrica carrozzeria
const PEZZI = {
  candela:   { nome: 'Candela', cat: 'motore', t: 8, paga: 25, costo: 12, gioco: 'regola', req: 'chiavi', desc: 'Fa la scintilla che accende la miscela di aria e benzina nel cilindro: se è consumata il motore parte male e perde colpi.', nota: 'Regola la distanza tra gli elettrodi: di solito tra 0,6 e 0,9 mm.' },
  filtro:    { nome: 'Filtro aria', cat: 'motore', t: 6, paga: 20, costo: 15, gioco: 'bulloni', req: 'chiavi', desc: 'Trattiene polvere e sporco dell\'aria che entra nel motore: se è intasato il motore "soffoca", spinge meno e consuma di più.' },
  olio:      { nome: 'Olio motore e filtro', cat: 'motore', t: 10, paga: 35, costo: 30, gioco: 'tieni', req: 'chiavi', desc: 'L\'olio lubrifica e raffredda le parti che si muovono nel motore; col tempo perde le sue qualità e si cambia insieme al filtro.', nota: 'Il livello si legge con la moto dritta: deve stare tra MIN e MAX.' },
  catena:    { nome: 'Kit catena, corona e pignone', cat: 'trasmissione', t: 18, paga: 70, costo: 90, gioco: 'regola', req: 'chiavi', desc: 'Porta la forza dal cambio alla ruota posteriore. Si cambiano tutti e tre insieme: una catena allungata consuma i denti e "strappa".', nota: 'Tendi la catena: di solito 2–3 cm di gioco a metà del ramo inferiore.' },
  pastiglie: { nome: 'Pastiglie freno', cat: 'freni', t: 10, paga: 40, costo: 35, gioco: 'bulloni', req: 'chiavi', desc: 'Stringono il disco e frenano per attrito: quando il materiale si consuma frenano poco e rigano il disco.' },
  liqfreni:  { nome: 'Liquido freni', cat: 'freni', t: 12, paga: 40, costo: 15, gioco: 'tieni', req: 'chiavi', desc: 'Porta la pressione dalla leva alle pinze. Assorbe umidità e col calore fa bolle: la leva diventa spugnosa. Si cambia ogni due anni circa.', nota: 'Rabbocca il liquido DOT 4 nella vaschetta fino tra MIN e MAX.' },
  gomme:     { nome: 'Pneumatici', cat: 'ciclistica', t: 16, paga: 60, costo: 120, gioco: 'bulloni', req: 'smonta', desc: 'Sono l\'unico contatto con la strada: con il battistrada consumato tengono poco, soprattutto sul bagnato. Va controllata anche la pressione.' },
  batteria:  { nome: 'Batteria', cat: 'elettrica', t: 6, paga: 25, costo: 60, gioco: 'bulloni', req: 'tester', desc: 'Accumula energia per l\'avviamento e le luci. Una batteria da 12 V carica misura circa 12,6–12,8 V a riposo: molto meno vuol dire scarica o rovinata.' },
  regolatore:{ nome: 'Regolatore di tensione', cat: 'elettrica', t: 12, paga: 55, costo: 80, gioco: 'bulloni', req: 'tester', desc: 'Trasforma la corrente alternata del generatore in continua a circa 14 V per ricaricare la batteria: se si guasta la batteria si scarica o si rovina.' },
  luci:      { nome: 'Luci e frecce', cat: 'elettrica', t: 6, paga: 20, costo: 20, gioco: 'bulloni', req: 'tester', desc: 'Faro, stop e frecce funzionanti sono obbligatori per circolare: spesso il guasto è una lampadina o un contatto ossidato.' },
  frizione:  { nome: 'Dischi frizione', cat: 'trasmissione', t: 22, paga: 90, costo: 110, gioco: 'bulloni', req: 'chiavi', desc: 'I dischi frizione staccano e attaccano il motore al cambio: quando sono consumati il motore sale di giri ma la moto non accelera (slitta).' },
  carburatore:{ nome: 'Carburatore', cat: 'motore', t: 20, paga: 80, costo: 40, gioco: 'regola', req: 'vacuo', desc: 'Sulle moto più vecchie mescola aria e benzina nelle giuste proporzioni: se i getti sono sporchi il minimo è irregolare e il motore singhiozza.', nota: 'Gira la vite della miscela e cerca il minimo più regolare.' },
  iniettore: { nome: 'Iniettore', cat: 'motore', t: 18, paga: 90, costo: 120, gioco: 'regola', req: 'obd', desc: 'Sulle moto moderne spruzza la benzina nebulizzata, comandato dalla centralina: se è sporco il motore perde potenza e consuma.', nota: 'Prova del getto al banco: deve uscire una nebbia fine e uniforme.' },
  forcella:  { nome: 'Paraoli forcella', cat: 'ciclistica', t: 24, paga: 100, costo: 50, gioco: 'bulloni', req: 'pressa', desc: 'Tengono l\'olio dentro gli steli della forcella: se perdono, la forcella frena male le oscillazioni e l\'olio può finire sul freno.' },
  mono:      { nome: 'Ammortizzatore posteriore', cat: 'ciclistica', t: 18, paga: 85, costo: 220, gioco: 'bulloni', req: 'dinamo', desc: 'Assorbe le buche con una molla e frena il rimbalzo con l\'olio: se è scarico la moto "galleggia" e rimbalza.' },
  cinghia:   { nome: 'Cinghia del variatore', cat: 'trasmissione', t: 14, paga: 45, costo: 35, gioco: 'bulloni', req: 'chiavi', desc: 'Negli scooter porta il moto alla ruota con un cambio automatico continuo: se è consumata lo scooter non spinge.' },
  rulli:     { nome: 'Rulli del variatore', cat: 'trasmissione', t: 10, paga: 35, costo: 20, gioco: 'bulloni', req: 'chiavi', desc: 'Con la forza centrifuga si spostano verso l\'esterno e cambiano il rapporto: se sono ovalizzati lo scooter ha buchi in accelerazione.' },
  refrigerante:{ nome: 'Liquido refrigerante', cat: 'motore', t: 10, paga: 35, costo: 20, gioco: 'tieni', req: 'chiavi', desc: 'Porta il calore dal motore al radiatore: se manca o è vecchio il motore scalda troppo.', nota: 'Si rabbocca a motore freddo: a caldo il circuito è in pressione.' },
  valvole:   { nome: 'Gioco valvole', cat: 'motore', t: 26, paga: 110, costo: 10, gioco: 'regola', req: 'chiavi', desc: 'È la piccola distanza tra valvola e punteria, in centesimi di millimetro: se è sbagliata il motore ticchetta o perde compressione.', nota: 'Infila lo spessimetro: deve scorrere con un leggero attrito.' },
  fasce:     { nome: 'Fasce del pistone', cat: 'motore', t: 40, paga: 180, costo: 90, gioco: 'bulloni', req: 'dinamo', desc: 'Fanno tenuta tra pistone e cilindro: quando sono consumate il motore brucia olio e fuma blu.' },
  sterzo:    { nome: 'Cuscinetti di sterzo', cat: 'ciclistica', t: 20, paga: 80, costo: 45, gioco: 'bulloni', req: 'pressa', desc: 'Fanno girare il manubrio liscio: se sono segnati lo sterzo va a scatti al centro e la moto è instabile in frenata.' },
  // personalizzazioni
  vernice:   { nome: 'Verniciatura', cat: 'carrozzeria', custom: .15, t: 30, paga: 260, costo: 150, gioco: 'tieni', req: 'cabina', desc: 'Fondo, colore e trasparente in cabina: la moto torna come nuova o cambia del tutto.', nota: 'Spruzza: riempi lo strato fino alla zona giusta, senza colature.' },
  scarico:   { nome: 'Scarico artigianale', cat: 'carrozzeria', custom: .12, t: 28, paga: 230, costo: 250, gioco: 'regola', req: 'tig', desc: 'Uno scarico fatto a mano cambia suono e peso; per circolare su strada deve essere omologato.', nota: 'Allinea i tubi e salda nel punto giusto.' },
  sella:     { nome: 'Sella su misura', cat: 'carrozzeria', custom: .06, t: 12, paga: 70, costo: 80, gioco: 'bulloni', req: 'chiavi', desc: 'Imbottitura e rivestimento rifatti a mano: più comoda e più bella.' },
  led:       { nome: 'Luci a LED', cat: 'elettrica', custom: .05, t: 10, paga: 60, costo: 60, gioco: 'bulloni', req: 'tester', desc: 'Consumano meno e fanno più luce delle lampadine; su strada devono essere omologate.' },
  mappa:     { nome: 'Mappatura centralina', cat: 'elettrica', custom: .10, t: 16, paga: 140, costo: 0, gioco: 'regola', req: 'obd', soloInj: true, desc: 'Si riscrivono le tabelle della centralina (benzina e anticipo) per far rendere meglio il motore.', nota: 'Trova l\'anticipo migliore senza arrivare al battito in testa.' },
  banco:     { nome: 'Messa a punto al banco', cat: 'motore', t: 25, paga: 220, costo: 0, gioco: 'regola', req: 'rulli', desc: 'Sul banco a rulli si misura la curva di potenza e si regola il motore finché rende al massimo.', nota: 'Ferma l\'ago sul picco della curva di potenza.' },
};
const RIPARAZIONI = ['candela', 'filtro', 'olio', 'catena', 'pastiglie', 'liqfreni', 'gomme', 'batteria', 'regolatore', 'luci', 'frizione', 'carburatore', 'iniettore', 'forcella', 'mono', 'cinghia', 'rulli', 'refrigerante', 'valvole', 'fasce', 'sterzo'];
const CUSTOM = ['vernice', 'scarico', 'sella', 'led', 'mappa'];

const SINTOMI = [
  { t: 'Parte male e perde colpi', c: ['candela', 'carburatore', 'iniettore', 'filtro'] },
  { t: 'Fa un rumore metallico dalla trasmissione', c: ['catena'], noScooter: true },
  { t: 'Frena poco', c: ['pastiglie', 'liqfreni'] },
  { t: 'La leva del freno è spugnosa', c: ['liqfreni'] },
  { t: 'Il motore sale di giri ma la moto non accelera', c: ['frizione'], noScooter: true },
  { t: 'Il motore sale di giri ma lo scooter non spinge', c: ['cinghia', 'rulli'], soloScooter: true },
  { t: 'La batteria è sempre scarica', c: ['batteria', 'regolatore'] },
  { t: 'Il motore scalda troppo', c: ['refrigerante', 'olio'] },
  { t: 'Esce fumo blu dallo scarico', c: ['fasce'] },
  { t: 'Ticchetta dalla testa del motore', c: ['valvole'] },
  { t: 'C\'è olio sugli steli della forcella', c: ['forcella'] },
  { t: 'Rimbalza sulle buche', c: ['mono'] },
  { t: 'Lo sterzo va a scatti al centro', c: ['sterzo'] },
  { t: 'Scivola in curva sul bagnato', c: ['gomme'] },
  { t: 'Il faro non si accende', c: ['luci'] },
  { t: 'Consuma tanto e non spinge', c: ['filtro', 'iniettore', 'carburatore', 'candela'] },
];

const TIPI = {
  scooter:  { nome: 'Scooter', val: 1400, fama: 0, carb: .5 },
  naked:    { nome: 'Naked', val: 5000, fama: 1, carb: .3 },
  enduro:   { nome: 'Enduro', val: 5500, fama: 2, carb: .3 },
  motard:   { nome: 'Motard', val: 6500, fama: 3, carb: .2 },
  custom:   { nome: 'Custom', val: 9000, fama: 4, carb: .2 },
  sportiva: { nome: 'Sportiva', val: 12000, fama: 6, carb: 0 },
  epoca:    { nome: 'D\'epoca', val: 8000, fama: 8, carb: 1 },
  pista:    { nome: 'Da pista', val: 20000, fama: 10, carb: 0, req: 'rulli' },
};
const MARCHE = ['Valtaro', 'Ardena', 'Ferrini', 'Kobayama', 'Tauro', 'Brera', 'Ondina', 'Saetta', 'Corniglio', 'Baganza'];
const MODELLI = {
  scooter: ['Città 125', 'Ventola 50', 'Brezza 150', 'Zip 125'],
  naked: ['Lupa 700', 'Strada 900', 'Nuda 650', 'Grinta 800'],
  enduro: ['Sterrato 450', 'Monte 700', 'Calanco 300', 'Crinale 900'],
  motard: ['Curva 450', 'Gimkana 500', 'Tornante 690'],
  custom: ['Prateria 1200', 'Lungavia 900', 'Tramonto 1600'],
  sportiva: ['Fulmine 1000', 'Freccia 600', 'Lampo RR', 'Picco 1100'],
  epoca: ['Sport 1972', 'Tre Valvole 1968', 'Gran Turismo 1975', 'Falchetto 1961', 'Bialbero 1958'],
  pista: ['Corsa SBK', 'Pista 600 R', 'GP Replica', 'Track 1000'],
};
const COLORI = ['#d62828', '#f77f00', '#fcbf49', '#2a9d8f', '#277da1', '#6a4c93', '#e5e5e5', '#222831', '#3a7d44', '#b5838d'];

const SEDI = [
  { nome: 'Garage di casa', costo: 0, fama: 0, ponti: 2, mag: 2, paga: 1, vend: 1, muro: '#4a4036', pav: '#5b5b5b' },
  { nome: 'Officina in paese', costo: 9000, fama: 3, ponti: 4, mag: 4, paga: 1.25, vend: 1.05, muro: '#3c5a6e', pav: '#62666b' },
  { nome: 'Capannone artigianale', costo: 70000, fama: 6, ponti: 6, mag: 6, paga: 1.5, vend: 1.1, muro: '#6b6f74', pav: '#4f5b66' },
  { nome: 'Concessionaria', costo: 500000, fama: 10, ponti: 8, mag: 10, paga: 1.8, vend: 1.3, muro: '#e8e2d4', pav: '#9aa0a6' },
  { nome: 'Centro tecnico', costo: 4500000, fama: 15, ponti: 10, mag: 14, paga: 2.3, vend: 1.4, muro: '#2d3b55', pav: '#7d8794' },
  { nome: 'Polo dei motori', costo: 45000000, fama: 21, ponti: 12, mag: 20, paga: 3, vend: 1.6, muro: '#1e1e24', pav: '#c0c4ca' },
];
const NOMI_MECC = ['Gino', 'Carla', 'Tonino', 'Ivana', 'Bruno', 'Marta', 'Nello', 'Sara', 'Dario', 'Lucia', 'Pippo', 'Rita'];
const NOMI_CLIENTI = ['Sig. Rossi', 'Giulia', 'Marco', 'Sig.ra Bianchi', 'Luca', 'Elena', 'Andrea', 'Franco', 'Chiara', 'Paolo', 'Teresa', 'Davide', 'Anna', 'Il postino', 'Don Mario', 'Vale'];

const STAT_CORSA = [
  { id: 'motore', nome: 'Motore', peso: 3, desc: 'Più cavalli: pistoni, alberi a camme e scarico da gara.' },
  { id: 'ciclistica', nome: 'Sospensioni', peso: 2, desc: 'Forcella e mono regolabili: la moto resta stabile in curva.' },
  { id: 'freni', nome: 'Freni', peso: 2, desc: 'Pinze radiali e dischi più grandi: si frena più tardi.' },
  { id: 'gomme', nome: 'Gomme', peso: 2, desc: 'Slick e termocoperte: più aderenza appena si esce dai box.' },
];
const CAMPIONATI = ['Trofeo Regionale', 'Campionato Italiano', 'Campionato Europeo', 'Campionato Mondiale'];
const CIRCUITI = ['Circuito del Taro', 'Pista dei Calanchi', 'Autodromo Val Baganza', 'Circuito delle Colline', 'Anello di Pietralunga', 'Circuito della Bassa'];
const PILOTI = ['R. Bocchi', 'L. Ferraro', 'M. Sato', 'J. Weber', 'A. Costa', 'T. Morel', 'D. Silva', 'K. Tanaka', 'P. Rossetti', 'F. Novak', 'S. Lund'];
const PUNTI = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4];
const GIRI = 5, DURATA_GARA = 22;

/* ---------- STATO ---------- */
let S;
function nuovoStato() {
  return {
    v: 1, soldi: 400, fama: 0, sede: 0,
    ponti: [{ mecc: null, lav: null }],
    attrezzi: { chiavi: true }, clienti: [], usato: [], magazzino: [], autoAcc: true,
    squadra: null,
    st: { lavori: 0, mano: 0, diag: 0, streak: 0, best: 0, usatoV: 0, epocaV: 0, custom: 0, tipi: {}, guad: 0, gare: 0, podi: 0, vitt: 0, titoli: 0, via: 0, tierMax: -1 },
    cheat: nuovoTrucchi(),
    trag: {}, tempo: 0, ultimo: Date.now(), tCli: 2, tUs: 0, id: 1, inizio: Date.now(),
  };
}
function nuovoTrucchi() { return { menu: false, soldiInf: false, tempo: 1, mecIst: false, raffica: false, facile: false, auto: false, vinci: false }; }
const TR = () => S.cheat || (S.cheat = nuovoTrucchi());
function carica() {
  try { const t = localStorage.getItem(SAVE); if (t) { const o = JSON.parse(t); if (o && o.v === 1) return o; } } catch (e) {}
  return null;
}
function salva() {
  S.ultimo = Date.now();
  try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {}
  try {
    const r = leggiRecord();
    const n = { guad: Math.max(r.guad || 0, S.st.guad), titoli: Math.max(r.titoli || 0, S.st.titoli), fama: Math.max(r.fama || 0, famaLvl()), lavori: Math.max(r.lavori || 0, S.st.lavori) };
    localStorage.setItem(RECORD, JSON.stringify(n));
  } catch (e) {}
}
function leggiRecord() { try { return JSON.parse(localStorage.getItem(RECORD)) || {}; } catch (e) { return {}; } }

/* ---------- FAMA ---------- */
const sogliaFama = n => Math.round(12 * Math.pow(n, 2.1));
function famaLvl(p = S.fama) { let n = 0; while (p >= sogliaFama(n + 1)) n++; return n; }
function aggiungiFama(x) {
  const prima = famaLvl(); S.fama += x; const dopo = famaLvl();
  if (dopo > prima) {
    toast('⭐ Fama livello ' + dopo + '!', true);
    const nuovi = Object.entries(TIPI).filter(([k, t]) => t.fama > prima && t.fama <= dopo).map(([k, t]) => t.nome);
    if (nuovi.length) toast('Arrivano clienti con moto ' + nuovi.join(', '));
  }
}
const multPaga = () => (1 + 0.1 * famaLvl()) * SEDI[S.sede].paga;

/* ---------- MOTO E LAVORI ---------- */
function tipiDisponibili() { const f = famaLvl(); return Object.keys(TIPI).filter(k => TIPI[k].fama <= f && (!TIPI[k].req || S.attrezzi[TIPI[k].req])); }
function nuovaMoto(tipo) {
  tipo = tipo || pick(tipiDisponibili());
  const T = TIPI[tipo];
  return { tipo, marca: pick(MARCHE), modello: pick(MODELLI[tipo]), colore: pick(COLORI), inj: rnd() >= T.carb };
}
const nomeMoto = m => m.marca + ' ' + m.modello;
function pezzoAdatto(p, m) {
  const P = PEZZI[p];
  if (!S.attrezzi[P.req]) return false;
  if (m.tipo === 'scooter' && (p === 'catena' || p === 'frizione')) return false;
  if (m.tipo !== 'scooter' && (p === 'cinghia' || p === 'rulli')) return false;
  if (p === 'carburatore' && m.inj) return false;
  if ((p === 'iniettore' || p === 'mappa') && !m.inj) return false;
  return true;
}
function fattoreMoto(m) { return Math.pow(TIPI[m.tipo].val / 4000, 0.35); }
function calcolaPaga(m, pezzi, extra = 1) {
  let s = pezzi.reduce((a, p) => a + PEZZI[p].paga, 0);
  return Math.round(s * fattoreMoto(m) * multPaga() * extra);
}
function nuovoCliente() {
  const m = nuovaMoto();
  const ripar = RIPARAZIONI.filter(p => pezzoAdatto(p, m));
  const cust = CUSTOM.filter(p => pezzoAdatto(p, m));
  let sub, guasti = [], sintomo = null, extra = 1;
  const r = rnd();
  if (m.tipo === 'pista') {
    sub = 'pista';
    guasti = ['banco'].concat(shuffle(ripar.filter(p => PEZZI[p].cat !== 'elettrica')).slice(0, ri(1, 2)));
    extra = 1.3;
  } else if (cust.length && r < 0.2) {
    sub = 'custom';
    guasti = shuffle(cust.slice()).slice(0, ri(1, Math.min(2, cust.length)));
    extra = 1.2;
  } else if (r < 0.45) {
    sub = 'tagliando';
    guasti = ['olio', 'filtro', 'candela'].filter(p => pezzoAdatto(p, m));
    if (rnd() < .4 && pezzoAdatto('liqfreni', m)) guasti.push('liqfreni');
    if (m.tipo !== 'scooter' && rnd() < .3 && pezzoAdatto('valvole', m)) guasti.push('valvole');
  } else {
    sub = 'guasto';
    const possibili = SINTOMI.filter(x => (!x.noScooter || m.tipo !== 'scooter') && (!x.soloScooter || m.tipo === 'scooter') && x.c.some(p => pezzoAdatto(p, m)));
    const sx = pick(possibili);
    sintomo = sx.t;
    const cause = sx.c.filter(p => pezzoAdatto(p, m));
    guasti = shuffle(cause.slice()).slice(0, rnd() < .3 && cause.length > 1 ? 2 : 1);
    if (rnd() < .35) { const alt = ripar.filter(p => !guasti.includes(p)); if (alt.length) guasti.push(pick(alt)); }
    extra = 1.1;
  }
  const paga = calcolaPaga(m, guasti, extra) + (sintomo ? Math.round(15 * fattoreMoto(m) * multPaga()) : 0);
  return { id: S.id++, nome: pick(NOMI_CLIENTI), moto: m, sub, guasti, sintomo, paga, attesa: 150 };
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function nuovoUsato() {
  const m = nuovaMoto();
  const ripar = RIPARAZIONI.filter(p => pezzoAdatto(p, m));
  const n = clamp(ri(2, m.tipo === 'epoca' ? 7 : 5), 1, ripar.length);
  const guasti = shuffle(ripar.slice()).slice(0, n);
  const base = TIPI[m.tipo].val;
  const prezzo = Math.round(base * (0.36 - n * 0.025) * (0.92 + rnd() * 0.16) / 10) * 10;
  return { id: S.id++, moto: m, guasti, tot: n, prezzo, custom: [], scade: 300 };
}
function valoreUsato(it) {
  const base = TIPI[it.moto.tipo].val;
  const rotti = it.guasti.length;
  if (rotti) return Math.round(base * Math.max(0.15, 0.3 - rotti * 0.03));
  let bonus = it.custom.reduce((a, p) => a + PEZZI[p].custom, 0);
  let v = base * 0.62 * (1 + bonus) * SEDI[S.sede].vend * (1 + 0.025 * famaLvl());
  if (it.moto.tipo === 'epoca') v *= 1.25;
  return Math.round(v);
}

function lavoroDaCliente(c) {
  const tasks = [];
  if (c.sub === 'guasto') tasks.push({ p: 'diagnosi', done: false, prog: 0 });
  for (const g of c.guasti) tasks.push({ p: g, done: false, prog: 0, pagato: true });
  return { kind: 'cliente', c, tasks, diagnosticato: c.sub !== 'guasto' };
}
function lavoroDaUsato(it) {
  return { kind: 'usato', it, tasks: it.guasti.map(p => ({ p, done: false, prog: 0, pagato: false })), diagnosticato: true };
}

/* ---------- MECCANICI E PONTI ---------- */
const velMecc = m => Math.pow(1.3, m.lvl);
function bonusAttrezzi(cat) {
  let b = 1;
  for (const a of ATTREZZI) if (S.attrezzi[a.id]) { if (a.bonusAll) b *= a.bonusAll; if (a.bonus && a.bonus[cat]) b *= a.bonus[cat]; }
  return b;
}
function tempoTask(p, mecc) {
  const t = p === 'diagnosi' ? 6 : PEZZI[p].t;
  const cat = p === 'diagnosi' ? 'elettrica' : PEZZI[p].cat;
  return t / (velMecc(mecc) * bonusAttrezzi(cat));
}
const costoPonte = () => Math.round(300 * Math.pow(2.6, S.ponti.length - 1));
const nMecc = () => S.ponti.filter(p => p.mecc).length;
const costoMecc = () => Math.round(700 * Math.pow(2.3, nMecc()));
const costoCorso = m => Math.round(500 * Math.pow(2.05, m.lvl));
function taskCorrente(lav) {
  for (const t of lav.tasks) if (!t.done) return t;
  return null;
}
function pontiLiberi() { return S.ponti.map((p, i) => i).filter(i => !S.ponti[i].lav); }

/* ---------- AZIONI ---------- */
function accettaCliente(id, ip) {
  const k = S.clienti.findIndex(c => c.id === id); if (k < 0) return;
  if (ip == null) { const lib = pontiLiberi(); lib.sort((a, b) => (S.ponti[a].mecc ? 1 : 0) - (S.ponti[b].mecc ? 1 : 0)); ip = lib[0]; }
  if (ip == null) { toast('Nessun ponte libero'); return; }
  const c = S.clienti.splice(k, 1)[0];
  S.ponti[ip].lav = lavoroDaCliente(c);
  dirty();
}
function rifiutaCliente(id) { S.clienti = S.clienti.filter(c => c.id !== id); dirty(); }
function completaTask(ip, t, aMano) {
  const P = S.ponti[ip]; const lav = P.lav; if (!lav || t.done) return;
  t.done = true; t.prog = 1;
  if (t.p === 'diagnosi') { lav.diagnosticato = true; }
  else if (lav.kind === 'usato') {
    const it = lav.it;
    if (PEZZI[t.p].custom) { it.custom.push(t.p); S.st.custom++; aggiungiFama(2); }
    else { it.guasti = it.guasti.filter(g => g !== t.p); }
  }
  if (aMano) S.st.mano++;
  if (lav.tasks.every(x => x.done)) finisciLavoro(ip);
  dirty();
}
function finisciLavoro(ip) {
  const P = S.ponti[ip]; const lav = P.lav;
  if (lav.kind === 'cliente') {
    const c = lav.c;
    guadagna(c.paga, ip);
    aggiungiFama(1 + c.guasti.length + (c.sub === 'pista' ? 3 : 0));
    S.st.lavori++;
    S.st.tipi[c.moto.tipo] = 1;
    if (c.sub === 'custom') S.st.custom += c.guasti.length;
    P.lav = null;
  } else {
    lav.pronta = true;
    if (!P.mecc || !lav.notificata) { lav.notificata = true; }
  }
}
function guadagna(x, ip) {
  S.soldi += x; S.st.guad += x;
  if (ip != null) floaters.push({ ip, txt: '+' + eur(x), t: 0 });
}
function spendi(x) { if (TR().soldiInf) return true; if (S.soldi < x) { toast('Non hai abbastanza soldi'); return false; } S.soldi -= x; return true; }
function pagaRicambio(t) {
  if (t.pagato || t.p === 'diagnosi') return true;
  if (TR().soldiInf) { t.pagato = true; return true; }
  const c = PEZZI[t.p].costo;
  if (S.soldi < c) return false;
  S.soldi -= c; t.pagato = true; return true;
}
function compraUsato(id) {
  const k = S.usato.findIndex(u => u.id === id); if (k < 0) return;
  const it = S.usato[k];
  const lib = pontiLiberi();
  if (!lib.length && S.magazzino.length >= SEDI[S.sede].mag) { toast('Ponti e magazzino pieni'); return; }
  if (!spendi(it.prezzo)) return;
  S.usato.splice(k, 1);
  if (lib.length) { lib.sort((a, b) => (S.ponti[a].mecc ? 1 : 0) - (S.ponti[b].mecc ? 1 : 0)); S.ponti[lib[0]].lav = lavoroDaUsato(it); toast(nomeMoto(it.moto) + ' è sul ponte ' + (lib[0] + 1)); }
  else { S.magazzino.push(it); toast(nomeMoto(it.moto) + ' è in magazzino'); }
  dirty();
}
function vendiUsato(it, ip) {
  const v = valoreUsato(it);
  guadagna(v, ip);
  if (!it.guasti.length) {
    S.st.usatoV++; aggiungiFama(4 + it.custom.length);
    S.st.tipi[it.moto.tipo] = 1;
    if (it.moto.tipo === 'epoca') S.st.epocaV++;
  } else aggiungiFama(1);
  toast('Venduta ' + nomeMoto(it.moto) + ' per ' + eur(v));
  if (ip != null) S.ponti[ip].lav = null; else S.magazzino = S.magazzino.filter(x => x !== it);
  dirty();
}
function alMagazzino(ip) {
  if (S.magazzino.length >= SEDI[S.sede].mag) { toast('Magazzino pieno'); return; }
  const lav = S.ponti[ip].lav; S.magazzino.push(lav.it); S.ponti[ip].lav = null; dirty();
}
function sulPonte(it) {
  const lib = pontiLiberi(); if (!lib.length) { toast('Nessun ponte libero'); return; }
  lib.sort((a, b) => (S.ponti[a].mecc ? 1 : 0) - (S.ponti[b].mecc ? 1 : 0));
  S.magazzino = S.magazzino.filter(x => x !== it);
  S.ponti[lib[0]].lav = lavoroDaUsato(it); dirty();
}
function personalizza(ip, p) {
  const lav = S.ponti[ip].lav; if (!lav || lav.kind !== 'usato') return;
  if (lav.it.custom.includes(p) || lav.tasks.some(t => t.p === p && !t.done)) return;
  lav.tasks.push({ p, done: false, prog: 0, pagato: false }); lav.pronta = false; dirty();
}
function compraPonte() {
  if (S.ponti.length >= SEDI[S.sede].ponti) { toast('Serve una sede più grande'); return; }
  if (!spendi(costoPonte())) return;
  S.ponti.push({ mecc: null, lav: null }); toast('Nuovo ponte sollevatore!'); dirty();
}
function assumi() {
  const ip = S.ponti.findIndex(p => !p.mecc); if (ip < 0) { toast('Prima compra un altro ponte'); return; }
  if (!spendi(costoMecc())) return;
  const usati = S.ponti.filter(p => p.mecc).map(p => p.mecc.nome);
  const nome = NOMI_MECC.find(n => !usati.includes(n)) || ('Meccanico ' + (ip + 1));
  S.ponti[ip].mecc = { nome, lvl: 0 }; toast(nome + ' lavora al ponte ' + (ip + 1)); dirty();
}
function corso(ip) { const m = S.ponti[ip].mecc; if (!m) return; if (!spendi(costoCorso(m))) return; m.lvl++; toast(m.nome + ' sale al livello ' + (m.lvl + 1)); dirty(); }
function compraAttrezzo(id) { if (S.attrezzi[id]) return; if (!spendi(ATT[id].costo)) return; S.attrezzi[id] = true; toast(ATT[id].ic + ' ' + ATT[id].nome + ' comprato'); dirty(); }
function compraSede(i) {
  const s = SEDI[i]; if (i !== S.sede + 1) return;
  if (famaLvl() < s.fama) { toast('Serve fama ' + s.fama); return; }
  if (!spendi(s.costo)) return;
  S.sede = i; toast('🏠 Benvenuti nella nuova sede: ' + s.nome + '!', true); dirty();
}

/* ---------- SQUADRA CORSE ---------- */
const COSTO_SQUADRA = 150000;
function fondaSquadra() {
  if (S.sede < 2 || !S.attrezzi.rulli) { toast('Servono il capannone e il banco a rulli'); return; }
  if (!spendi(COSTO_SQUADRA)) return;
  S.squadra = { stat: { motore: 0, ciclistica: 0, freni: 0, gomme: 0 }, pilota: 0, tier: 0, gara: 0, punti: new Array(12).fill(0), ultimo: null, colore: pick(COLORI) };
  toast('🏁 Nasce la squadra corse!', true); dirty();
}
const costoStat = l => Math.round(8000 * Math.pow(1.5, l));
const costoPilota = l => Math.round(12000 * Math.pow(1.55, l));
function perfSquadra() { const q = S.squadra; return 10 + STAT_CORSA.reduce((a, s) => a + s.peso * q.stat[s.id], 0) + 3 * q.pilota; }
function forzaTier(t) { return t < 4 ? [15, 40, 90, 170][t] : 170 * Math.pow(1.5, t - 3); }
function premioTier(t) { return t < 4 ? [6000, 30000, 160000, 900000][t] : 900000 * Math.pow(1.75, t - 3); }
function nomeTier(t) { return t < 4 ? CAMPIONATI[t] : 'Mondiale, stagione ' + (t - 2); }
let gara = null; // {t, ris:[{nome,ord,col,noi}], ...}
function avviaGara() {
  const q = S.squadra; if (!q || gara) return;
  const F = forzaTier(q.tier);
  const mia = perfSquadra();
  const par = PILOTI.map((n, i) => ({ nome: n, perf: F * (0.78 + 0.44 * i / 10), noi: false, col: COLORI[i % COLORI.length] }));
  par.push({ nome: 'Il tuo pilota', perf: mia, noi: true, col: q.colore });
  for (const p of par) p.sc = p.perf * (0.88 + 0.24 * rnd());
  if (TR().vinci) { const me = par.find(p => p.noi); me.sc = Math.max(...par.filter(p => !p.noi).map(p => p.sc)) * 1.05; }
  const ord = par.slice().sort((a, b) => b.sc - a.sc);
  ord.forEach((p, i) => { p.pos = i; p.fase = rnd() * 6; });
  gara = { t: 0, par, circ: CIRCUITI[q.gara % CIRCUITI.length] };
  scheda = 'corse'; dirty();
}
function finisciGara() {
  const q = S.squadra; const g = gara; gara = null;
  const ord = g.par.slice().sort((a, b) => a.pos - b.pos);
  const nomi = PILOTI.concat(['Il tuo pilota']);
  ord.forEach((p, i) => { const k = p.noi ? 11 : PILOTI.indexOf(p.nome); q.punti[k] += PUNTI[i]; });
  const pos = ord.findIndex(p => p.noi);
  const f = [1, .7, .5, .3, .25, .2, .15, .12, .1, .08, .06, .05][pos];
  const premio = Math.round(premioTier(q.tier) * f);
  guadagna(premio);
  S.st.gare++; if (pos < 3) S.st.podi++; if (pos === 0) S.st.vitt++;
  aggiungiFama(pos === 0 ? 8 : pos < 3 ? 5 : 2);
  q.ultimo = { circ: g.circ, pos: pos + 1, premio, ord: ord.map(p => p.nome) };
  q.gara++;
  let fine = '';
  if (q.gara >= CIRCUITI.length) {
    const cl = q.punti.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
    const primo = cl[0].i === 11;
    if (primo) {
      S.st.titoli++; S.st.tierMax = Math.max(S.st.tierMax, q.tier);
      const bonus = Math.round(premioTier(q.tier) * 3);
      guadagna(bonus); aggiungiFama(15);
      fine = '🏆 CAMPIONI: ' + nomeTier(q.tier) + '! Premio ' + eur(bonus);
      q.tier++;
    } else fine = 'Campionato finito: ' + (cl.findIndex(x => x.i === 11) + 1) + '° posto. Si riparte!';
    q.ultimo.fine = fine;
    q.gara = 0; q.punti = new Array(12).fill(0);
  }
  toast('🏁 ' + g.circ + ': ' + (pos + 1) + '° posto, ' + eur(premio), pos < 3);
  if (fine) toast(fine, true);
  dirty();
}

/* ---------- TRAGUARDI ---------- */
const TRAGUARDI = [
  ['prima', '🔧', 'Prima chiave', 'Finisci il primo lavoro', s => s.st.lavori >= 1],
  ['l10', '🧑‍🔧', 'Clienti affezionati', '10 lavori finiti', s => s.st.lavori >= 10],
  ['l100', '📋', 'Cento schede', '100 lavori finiti', s => s.st.lavori >= 100],
  ['l1000', '🏭', 'Mille moto', '1.000 lavori finiti', s => s.st.lavori >= 1000],
  ['l10000', '🌍', 'Officina leggendaria', '10.000 lavori finiti', s => s.st.lavori >= 10000],
  ['diag', '🩺', 'Orecchio fino', '25 diagnosi giuste al primo colpo', s => s.st.diag >= 25],
  ['mano', '✋', 'Mani sporche di grasso', '100 lavori fatti a mano', s => s.st.mano >= 100],
  ['perf', '🎯', 'Mano ferma', '15 minigiochi di fila senza errori', s => s.st.best >= 15],
  ['us1', '🏷️', 'Primo affare', 'Rivendi la prima moto usata riparata', s => s.st.usatoV >= 1],
  ['us25', '🚚', 'Commerciante', 'Rivendi 25 moto usate riparate', s => s.st.usatoV >= 25],
  ['epoca', '🕰️', 'Restauratore', 'Rivendi una moto d\'epoca restaurata', s => s.st.epocaV >= 1],
  ['epoca10', '🏛️', 'Museo vivente', 'Rivendi 10 moto d\'epoca restaurate', s => s.st.epocaV >= 10],
  ['cu1', '🎨', 'Tocco personale', 'Prima personalizzazione', s => s.st.custom >= 1],
  ['cu50', '✨', 'Preparatore', '50 personalizzazioni', s => s.st.custom >= 50],
  ['tipi', '🏍️', 'Tutte le moto', 'Lavora su tutti gli 8 tipi di moto', s => Object.keys(s.st.tipi).length >= 8],
  ['g1', '💶', 'Primo stipendio', 'Guadagna 1.000 € in totale', s => s.st.guad >= 1e3],
  ['g2', '💰', 'Gruzzolo', 'Guadagna 100 mila €', s => s.st.guad >= 1e5],
  ['g3', '🏦', 'Milionario', 'Guadagna 1 milione', s => s.st.guad >= 1e6],
  ['g4', '💎', 'Impero', 'Guadagna 100 milioni', s => s.st.guad >= 1e8],
  ['g5', '👑', 'Re dei motori', 'Guadagna 10 miliardi', s => s.st.guad >= 1e10],
  ['s1', '🏪', 'In paese', 'Apri l\'officina in paese', s => s.sede >= 1],
  ['s2', '🏗️', 'Capannone', 'Passa al capannone', s => s.sede >= 2],
  ['s3', '🏬', 'Concessionario', 'Apri la concessionaria', s => s.sede >= 3],
  ['s5', '🏟️', 'Polo dei motori', 'Arriva all\'ultima sede', s => s.sede >= 5],
  ['p6', '⬆️', 'Sei ponti', 'Sei ponti sollevatori', s => s.ponti.length >= 6],
  ['p12', '🛗', 'Dodici ponti', 'Dodici ponti sollevatori', s => s.ponti.length >= 12],
  ['m1', '👷', 'Il primo aiuto', 'Assumi un meccanico', s => s.ponti.some(p => p.mecc)],
  ['m10', '🎓', 'Capo officina', 'Un meccanico al livello 10', s => s.ponti.some(p => p.mecc && p.mecc.lvl >= 9)],
  ['att', '🧰', 'Attrezzatura completa', 'Compra tutti gli attrezzi', s => ATTREZZI.every(a => s.attrezzi[a.id])],
  ['sq', '🏁', 'Squadra corse', 'Fonda la squadra corse', s => !!s.squadra],
  ['gara', '🚦', 'Semaforo verde', 'Corri la prima gara', s => s.st.gare >= 1],
  ['podio', '🥉', 'Sul podio', 'Arriva tra i primi tre', s => s.st.podi >= 1],
  ['vitt', '🥇', 'Prima vittoria', 'Vinci una gara', s => s.st.vitt >= 1],
  ['t0', '🏆', 'Campione regionale', 'Vinci il Trofeo Regionale', s => s.st.tierMax >= 0],
  ['t1', '🇮🇹', 'Campione italiano', 'Vinci il Campionato Italiano', s => s.st.tierMax >= 1],
  ['t2', '🇪🇺', 'Campione europeo', 'Vinci il Campionato Europeo', s => s.st.tierMax >= 2],
  ['t3', '🌐', 'Campione del mondo', 'Vinci il Mondiale', s => s.st.tierMax >= 3],
  ['t10', '🐐', 'Leggenda', 'Vinci 10 campionati', s => s.st.titoli >= 10],
  ['f10', '⭐', 'Conosciuti in zona', 'Fama livello 10', s => famaLvl(s.fama) >= 10],
  ['f20', '🌟', 'Famosi in Italia', 'Fama livello 20', s => famaLvl(s.fama) >= 20],
  ['f35', '💫', 'Famosi nel mondo', 'Fama livello 35', s => famaLvl(s.fama) >= 35],
  ['via', '🌙', 'Officina sempre aperta', 'Guadagna mentre il gioco è chiuso', s => s.st.via >= 1],
  ['ore1', '⏱️', 'Un\'ora in officina', 'Gioca per un\'ora', s => s.tempo >= 3600],
  ['ore10', '🕰️', 'Di casa', 'Gioca per 10 ore', s => s.tempo >= 36000],
];
function controllaTraguardi() {
  for (const [id, ic, nome, , f] of TRAGUARDI) {
    if (!S.trag[id] && f(S)) { S.trag[id] = Date.now(); toast(ic + ' Traguardo: ' + nome, true); dirty(); }
  }
}

/* ---------- LOGICA A TEMPO ---------- */
function intervalloClienti() { if (TR().raffica) return 0.3; return Math.max(0.25, 14 / ((1 + 0.45 * (S.ponti.length - 1)) * (1 + 0.2 * S.sede) * (1 + 0.04 * famaLvl()))); }
const maxCoda = () => 3 + S.ponti.length;
function tick(dt) {
  S.tempo += dt;
  // clienti
  S.tCli -= dt;
  if (S.tCli <= 0) {
    S.tCli = intervalloClienti() * (0.7 + 0.6 * rnd());
    if (S.clienti.length < maxCoda()) { S.clienti.push(nuovoCliente()); dirty(true); }
  }
  for (const c of S.clienti) c.attesa -= dt;
  const n0 = S.clienti.length; S.clienti = S.clienti.filter(c => c.attesa > 0); if (S.clienti.length !== n0) dirty(true);
  // usato
  S.tUs -= dt;
  if (S.tUs <= 0) { S.tUs = 40; if (S.usato.length < 4) { S.usato.push(nuovoUsato()); dirty(true); } }
  for (const u of S.usato) u.scade -= dt;
  const u0 = S.usato.length; S.usato = S.usato.filter(u => u.scade > 0); if (S.usato.length !== u0) dirty(true);
  // meccanici
  S.ponti.forEach((P, ip) => {
    if (!P.mecc) return;
    if (!P.lav && S.autoAcc && S.clienti.length) {
      const k = S.clienti.findIndex(c => c.sub !== 'custom' || c.guasti.every(p => S.attrezzi[PEZZI[p].req]));
      if (k >= 0) { P.lav = lavoroDaCliente(S.clienti.splice(k, 1)[0]); dirty(true); }
    }
    const lav = P.lav; if (!lav) return;
    const t = taskCorrente(lav); if (!t) return;
    if (!pagaRicambio(t)) { lav.aspetta = true; return; }
    lav.aspetta = false;
    t.prog += TR().mecIst ? 1 : dt / tempoTask(t.p, P.mecc);
    if (t.prog >= 1) completaTask(ip, t, false);
  });
  controllaTraguardi();
}

/* ---------- GUADAGNI A GIOCO CHIUSO ---------- */
function stimaOraria() {
  // media di guadagno al secondo di ogni meccanico che accetta clienti da solo
  if (!S.autoAcc) return { rate: 0, lavPerSec: 0 };
  let rate = 0, lps = 0;
  const camp = [];
  for (let i = 0; i < 40; i++) camp.push(nuovoCliente());
  S.id -= 40;
  const arrivi = 1 / (intervalloClienti());
  for (const P of S.ponti) {
    if (!P.mecc) continue;
    let paga = 0, tempo = 0;
    for (const c of camp) { paga += c.paga; tempo += (c.sub === 'guasto' ? tempoTask('diagnosi', P.mecc) : 0) + c.guasti.reduce((a, p) => a + tempoTask(p, P.mecc), 0); }
    const r = 1 / (tempo / camp.length);
    rate += r * paga / camp.length; lps += r;
  }
  // non più lavori di quanti clienti arrivano
  if (lps > arrivi) { rate *= arrivi / lps; lps = arrivi; }
  return { rate: rate * 0.9, lavPerSec: lps * 0.9 };
}
function applicaAssenza(sec, mostra) {
  if (sec < 30) return;
  const { rate, lavPerSec } = stimaOraria();
  const soldi = Math.floor(rate * sec), lav = Math.floor(lavPerSec * sec);
  S.tempoVia = (S.tempoVia || 0) + sec;
  if (soldi > 0) {
    S.soldi += soldi; S.st.guad += soldi; S.st.lavori += lav; S.st.via++;
    S.fama += Math.floor(lav * 1.5);
    if (mostra) modale(`<h3>🌙 Mentre eri via</h3><p>Sei stato via <b>${durata(sec)}</b>.</p><p>I meccanici hanno finito <b>${fmt(lav)}</b> lavori e guadagnato <b class="prezzo">${eur(soldi)}</b>.</p><button class="b" data-act="chiudi">Bene!</button>`);
  }
  // i clienti in attesa se ne sono andati, il mercato si rinnova
  S.clienti = S.clienti.filter(c => (c.attesa -= sec) > 0);
  S.usato = S.usato.filter(u => (u.scade -= sec) > 0);
  dirty();
}

/* ---------- INTERFACCIA ---------- */
let scheda = 'officina', _dirty = true, dita = false;
function dirty(soft) { _dirty = true; }
const pan = $('#pannello');
function badge() {
  const nb = document.querySelector('[data-tab="clienti"]');
  let b = nb.querySelector('.badge');
  const n = S.clienti.length;
  if (n) { if (!b) { b = document.createElement('span'); b.className = 'badge'; nb.appendChild(b); } b.textContent = n; }
  else if (b) b.remove();
  const no = document.querySelector('[data-tab="officina"]');
  let b2 = no.querySelector('.badge');
  const pronte = S.ponti.filter(p => p.lav && p.lav.pronta).length;
  if (pronte) { if (!b2) { b2 = document.createElement('span'); b2.className = 'badge'; b2.style.background = 'var(--ok)'; no.appendChild(b2); } b2.textContent = pronte; }
  else if (b2) b2.remove();
}
function tagSub(sub) {
  return { tagliando: '<span class="tag ta">tagliando</span>', guasto: '<span class="tag cl">guasto</span>', custom: '<span class="tag cu">personalizzazione</span>', pista: '<span class="tag pi">pista</span>' }[sub] || '';
}
function render() {
  _dirty = false;
  badge();
  const top = pan.scrollTop;
  let h = '';
  if (scheda === 'officina') h = rOfficina();
  else if (scheda === 'clienti') h = rClienti();
  else if (scheda === 'mercato') h = rMercato();
  else if (scheda === 'negozio') h = rNegozio();
  else if (scheda === 'corse') h = rCorse();
  else if (scheda === 'traguardi') h = rTraguardi();
  pan.innerHTML = h;
  pan.scrollTop = top;
  aggiornaVivi();
}
function nomeTask(t, lav) {
  if (t.p === 'diagnosi') return '🩺 Trova il guasto';
  const P = PEZZI[t.p];
  return (P.custom ? '✨ ' : '🔧 ') + P.nome;
}
function rOfficina() {
  let h = `<h2>${SEDI[S.sede].nome}</h2>`;
  S.ponti.forEach((P, ip) => {
    const m = P.mecc;
    const mh = m ? `<span class="mecc">👷 ${m.nome} · liv. ${m.lvl + 1}</span>` : `<span class="sub">nessun meccanico</span>`;
    if (!P.lav) {
      h += `<div class="card vuoto"><div class="riga"><div class="sp"><span class="tit">Ponte ${ip + 1}</span> · libero<br>${mh}</div>`;
      if (S.clienti.length) h += `<button class="b pic" data-act="prendi" data-ip="${ip}">Prendi cliente</button>`;
      if (S.magazzino.length) h += `<button class="b pic sec" data-act="tab" data-v="mercato">Magazzino</button>`;
      h += `</div></div>`;
      return;
    }
    const lav = P.lav;
    const moto = lav.kind === 'cliente' ? lav.c.moto : lav.it.moto;
    h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">Ponte ${ip + 1}</span> · ${nomeMoto(moto)} <span class="sub">(${TIPI[moto.tipo].nome}${moto.inj ? ', iniezione' : ', carburatore'})</span><br>`;
    if (lav.kind === 'cliente') h += `<span class="tag cl">${lav.c.nome}</span>${tagSub(lav.c.sub)} <span class="prezzo">${eur(lav.c.paga)}</span>`;
    else h += `<span class="tag us">usato tuo</span> vale <span class="prezzo" data-val="${ip}">${eur(valoreUsato(lav.it))}</span>`;
    h += `<br>${mh}</div></div>`;
    if (lav.kind === 'cliente' && lav.c.sintomo) h += `<div class="sub" style="margin:4px 0">💬 «${lav.c.sintomo}»</div>`;
    const cur = taskCorrente(lav);
    lav.tasks.forEach((t, k) => {
      const nascosto = !lav.diagnosticato && t.p !== 'diagnosi';
      if (nascosto) return;
      const costo = (!t.pagato && t.p !== 'diagnosi' && PEZZI[t.p].costo) ? ` <span class="sub">ricambio ${eur(PEZZI[t.p].costo)}</span>` : '';
      h += `<div class="task ${t.done ? 'fatto' : ''}"><div class="n">${nomeTask(t, lav)}${costo}${m && t === cur ? `<div class="pb"><i data-prog="${ip}"></i></div>` : ''}</div>`;
      if (!t.done) {
        const ok = t.p === 'diagnosi' || lav.diagnosticato;
        const primo = t.p === 'diagnosi' || lav.tasks[0].p !== 'diagnosi' || lav.tasks[0].done;
        h += `<button class="b pic" data-act="mano" data-ip="${ip}" data-k="${k}" ${ok && primo ? '' : 'disabled'}>Fai tu</button>`;
      } else h += '✅';
      h += `</div>`;
    });
    if (!lav.diagnosticato) h += `<div class="sub">I pezzi da cambiare si scoprono dopo la diagnosi.</div>`;
    if (lav.aspetta) h += `<div class="sub" style="color:var(--ko)">${m ? m.nome : 'Il meccanico'} aspetta i soldi per il ricambio.</div>`;
    if (lav.kind === 'usato') {
      const it = lav.it;
      const fattiC = it.custom.concat(lav.tasks.filter(t => !t.done).map(t => t.p));
      const disp = CUSTOM.filter(p => pezzoAdatto(p, it.moto) && !fattiC.includes(p));
      if (!it.guasti.length && disp.length) {
        h += `<div class="sub" style="margin-top:6px">Personalizza (aumenta il valore):</div><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px">`;
        for (const p of disp) h += `<button class="b pic sec" data-act="pers" data-ip="${ip}" data-p="${p}">${PEZZI[p].nome} +${Math.round(PEZZI[p].custom * 100)}%</button>`;
        h += `</div>`;
      }
      h += `<div class="riga" style="margin-top:8px;gap:6px;flex-wrap:wrap"><button class="b ${lav.pronta ? 'ok' : 'sec'} pic" data-act="vendiP" data-ip="${ip}">Vendi ${eur(valoreUsato(it))}</button><button class="b sec pic" data-act="mag" data-ip="${ip}">In magazzino</button></div>`;
      if (it.guasti.length) h += `<div class="nota">Se la vendi ancora rotta prendi poco: ripara tutto prima.</div>`;
    }
    h += `</div>`;
  });
  if (S.ponti.length < SEDI[S.sede].ponti) h += `<div class="card vuoto"><div class="riga"><div class="sp">Nuovo ponte sollevatore</div><button class="b pic" data-act="ponte">${eur(costoPonte())}</button></div></div>`;
  if (S.st.lavori < 3) h += `<div class="nota">Consiglio: vai su 🧑 Clienti, accetta un lavoro e premi «Fai tu». Con i soldi compra un ponte e assumi un meccanico che lavori anche quando non giochi.</div>`;
  return h;
}
function rClienti() {
  let h = `<h2>Clienti in attesa (${S.clienti.length}/${maxCoda()})</h2>`;
  if (nMecc()) h += `<label class="sw card"><input type="checkbox" data-act="auto" ${S.autoAcc ? 'checked' : ''}> I meccanici prendono i clienti da soli (anche a gioco chiuso)</label>`;
  if (!S.clienti.length) h += `<div class="card vuoto">Nessuno per ora: arriveranno presto.</div>`;
  const lib = pontiLiberi().length;
  for (const c of S.clienti) {
    const m = c.moto;
    let cosa = c.sub === 'guasto' ? '💬 «' + c.sintomo + '»' : c.guasti.map(p => PEZZI[p].nome).join(', ');
    h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">${c.nome}</span> ${tagSub(c.sub)}<br>${nomeMoto(m)} <span class="sub">(${TIPI[m.tipo].nome})</span><br><span class="sub">${cosa}</span></div><div style="text-align:right"><div class="prezzo">${eur(c.paga)}</div><div class="sub">⏳ ${Math.ceil(c.attesa)} s</div></div></div>`;
    h += `<div class="riga" style="margin-top:6px;justify-content:flex-end;gap:6px"><button class="b sec pic" data-act="rifiuta" data-id="${c.id}">Rifiuta</button><button class="b pic" data-act="accetta" data-id="${c.id}" ${lib ? '' : 'disabled'}>Accetta</button></div></div>`;
  }
  if (!lib && S.clienti.length) h += `<div class="nota">Tutti i ponti sono occupati.</div>`;
  return h;
}
function rMercato() {
  let h = `<h2>Moto usate in vendita</h2>`;
  if (!S.usato.length) h += `<div class="card vuoto">Nessuna moto ora: ne arriva una ogni 40 secondi circa.</div>`;
  for (const u of S.usato) {
    const m = u.moto;
    h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">${nomeMoto(m)}</span> <span class="sub">(${TIPI[m.tipo].nome})</span><br><span class="sub">${u.tot} guasti · riparata vale circa ${eur(valoreUsato({ moto: m, guasti: [], custom: [] }))}</span><br><span class="sub">⏳ ancora ${durata(u.scade)}</span></div><button class="b pic" data-act="compraU" data-id="${u.id}">${eur(u.prezzo)}</button></div></div>`;
  }
  h += `<h2>Magazzino (${S.magazzino.length}/${SEDI[S.sede].mag})</h2>`;
  if (!S.magazzino.length) h += `<div class="card vuoto">Vuoto.</div>`;
  S.magazzino.forEach((it, k) => {
    h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">${nomeMoto(it.moto)}</span><br><span class="sub">${it.guasti.length ? it.guasti.length + ' guasti da riparare' : 'riparata'}${it.custom.length ? ' · ' + it.custom.map(p => PEZZI[p].nome).join(', ') : ''}</span></div></div><div class="riga" style="margin-top:6px;gap:6px;justify-content:flex-end"><button class="b sec pic" data-act="vendiM" data-k="${k}">Vendi ${eur(valoreUsato(it))}</button><button class="b pic" data-act="ponteM" data-k="${k}">Sul ponte</button></div></div>`;
  });
  h += `<div class="nota">Compri moto rotte, le ripari (i ricambi li paghi tu) e le rivendi. Con le personalizzazioni valgono di più; le moto d'epoca restaurate valgono il 25% in più.</div>`;
  return h;
}
function rNegozio() {
  const f = famaLvl();
  let h = `<h2>Ponti e meccanici</h2>`;
  h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">Ponte sollevatore</span><br><span class="sub">${S.ponti.length} di ${SEDI[S.sede].ponti} per questa sede</span></div><button class="b pic" data-act="ponte" ${S.ponti.length >= SEDI[S.sede].ponti ? 'disabled' : ''}>${eur(costoPonte())}</button></div></div>`;
  const libero = S.ponti.some(p => !p.mecc);
  h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">Assumi un meccanico</span><br><span class="sub">Si paga una volta sola. Lavora sul suo ponte anche quando il gioco è chiuso.</span></div><button class="b pic" data-act="assumi" ${libero ? '' : 'disabled'}>${eur(costoMecc())}</button></div>${libero ? '' : '<div class="nota">Ogni ponte ha già il suo meccanico: compra un ponte.</div>'}</div>`;
  S.ponti.forEach((P, ip) => {
    if (!P.mecc) return;
    h += `<div class="card"><div class="riga"><div class="sp"><span class="mecc">👷 ${P.mecc.nome}</span> · ponte ${ip + 1} · liv. ${P.mecc.lvl + 1}<br><span class="sub">velocità ×${velMecc(P.mecc).toFixed(2).replace('.', ',')}</span></div><button class="b pic sec" data-act="corso" data-ip="${ip}">Corso ${eur(costoCorso(P.mecc))}</button></div></div>`;
  });
  h += `<h2>Attrezzi</h2>`;
  for (const a of ATTREZZI) {
    if (a.costo === 0) continue;
    const ha = S.attrezzi[a.id];
    h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">${a.ic} ${a.nome}</span><br><span class="sub">${a.desc}</span></div>${ha ? '✅' : `<button class="b pic" data-act="attr" data-id="${a.id}">${eur(a.costo)}</button>`}</div></div>`;
  }
  h += `<h2>Sedi</h2>`;
  SEDI.forEach((s, i) => {
    let dx;
    if (i <= S.sede) dx = i === S.sede ? '📍 qui' : '✅';
    else if (i === S.sede + 1) dx = f >= s.fama ? `<button class="b pic" data-act="sede" data-i="${i}">${eur(s.costo)}</button>` : `<span class="sub">serve fama ${s.fama}</span>`;
    else dx = '🔒';
    h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">${s.nome}</span><br><span class="sub">${s.ponti} ponti · magazzino ${s.mag} · clienti pagano ×${String(s.paga).replace('.', ',')} · usato ×${String(s.vend).replace('.', ',')}</span></div>${dx}</div></div>`;
  });
  return h;
}
function rCorse() {
  let h = `<h2>Squadra corse</h2>`;
  const q = S.squadra;
  if (!q) {
    const ok = S.sede >= 2 && S.attrezzi.rulli;
    h += `<div class="card"><p>Prepara una moto da gara, scegli il pilota e corri i campionati: Regionale, Italiano, Europeo, Mondiale e poi una stagione dopo l'altra, sempre più difficili.</p><p class="sub">Servono: ${S.sede >= 2 ? '✅' : '❌'} il capannone artigianale (o una sede più grande) e ${S.attrezzi.rulli ? '✅' : '❌'} il banco prova a rulli.</p><button class="b" data-act="squadra" ${ok ? '' : 'disabled'}>Fonda la squadra · ${eur(COSTO_SQUADRA)}</button></div>`;
    return h;
  }
  const perf = perfSquadra(), F = forzaTier(q.tier);
  h += `<div class="card"><div class="tit">${nomeTier(q.tier)}</div><div class="sub">Gara ${q.gara + 1} di ${CIRCUITI.length}: ${CIRCUITI[q.gara]}</div><div class="sub">Prestazione della tua moto: <b>${fmt(perf)}</b> · avversari da ${fmt(F * 0.78)} a ${fmt(F * 1.22)}</div><div class="sub">Premio al vincitore: ${eur(premioTier(q.tier))} · titolo: ${eur(premioTier(q.tier) * 3)}</div>`;
  h += `<div style="margin-top:8px"><button class="b" data-act="gara" ${gara ? 'disabled' : ''}>${gara ? 'Gara in corso…' : '🚦 Via alla gara'}</button></div></div>`;
  if (q.ultimo) h += `<div class="card"><div class="tit">Ultima gara: ${q.ultimo.circ}</div><div>${q.ultimo.pos}° posto · ${eur(q.ultimo.premio)}</div>${q.ultimo.fine ? `<div style="color:var(--oro);margin-top:4px">${q.ultimo.fine}</div>` : ''}</div>`;
  h += `<h2>Moto da gara</h2>`;
  for (const s of STAT_CORSA) h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">${s.nome}</span> · liv. ${q.stat[s.id]}<br><span class="sub">${s.desc} (+${s.peso} prestazione)</span></div><button class="b pic" data-act="stat" data-id="${s.id}">${eur(costoStat(q.stat[s.id]))}</button></div></div>`;
  h += `<div class="card"><div class="riga"><div class="sp"><span class="tit">🧑‍✈️ Allenamento del pilota</span> · liv. ${q.pilota}<br><span class="sub">Traiettorie, staccate e partenze (+3 prestazione)</span></div><button class="b pic" data-act="pilota">${eur(costoPilota(q.pilota))}</button></div></div>`;
  h += `<h2>Classifica</h2><table class="classifica">`;
  const cl = q.punti.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  cl.forEach((x, k) => { h += `<tr class="${x.i === 11 ? 'noi' : ''}"><td>${k + 1}</td><td>${x.i === 11 ? 'Il tuo pilota' : PILOTI[x.i]}</td><td style="text-align:right">${x.p} pt</td></tr>`; });
  h += `</table>`;
  return h;
}
function rTraguardi() {
  const n = TRAGUARDI.filter(t => S.trag[t[0]]).length;
  const r = leggiRecord();
  let h = `<h2>Record</h2><div class="card"><div>💰 Guadagnato in tutto: <b>${eur(S.st.guad)}</b></div><div>🔧 Lavori: <b>${fmt(S.st.lavori)}</b> · usate rivendute: <b>${fmt(S.st.usatoV)}</b></div><div>🏆 Titoli vinti: <b>${S.st.titoli}</b> · fama ${famaLvl()}</div><div>⏱️ Tempo di gioco: <b>${durata(S.tempo)}</b>${S.tempoVia ? ' · a gioco chiuso ' + durata(S.tempoVia) : ''}</div><div class="nota">Record di sempre su questo dispositivo: ${eur(r.guad || 0)} · ${r.titoli || 0} titoli · fama ${r.fama || 0}</div></div>`;
  h += `<h2>Traguardi ${n}/${TRAGUARDI.length}</h2><div class="card">`;
  for (const [id, ic, nome, desc] of TRAGUARDI) h += `<div class="tr ${S.trag[id] ? 'si' : 'no'}"><div class="ic">${ic}</div><div><div class="tit">${nome}</div><div class="sub">${desc}</div></div></div>`;
  h += `</div><h2>I pezzi della moto</h2><div class="card">`;
  for (const k of RIPARAZIONI.concat(CUSTOM, ['banco'])) { const P = PEZZI[k]; h += `<div class="tr si"><div class="ic">${S.attrezzi[P.req] ? '🔧' : '🔒'}</div><div><div class="tit">${P.nome}</div><div class="sub">${P.desc}</div></div></div>`; }
  h += `</div>`;
  return h;
}
function aggiornaVivi() {
  $('#soldi').textContent = TR().soldiInf ? '€ ∞' : eur(S.soldi);
  const f = famaLvl(), a = sogliaFama(f), b = sogliaFama(f + 1);
  $('#famaL').textContent = '⭐ Fama ' + f + ' · ' + SEDI[S.sede].nome;
  $('#famaB').style.width = (100 * (S.fama - a) / (b - a)) + '%';
  pan.querySelectorAll('[data-prog]').forEach(el => {
    const P = S.ponti[+el.dataset.prog]; const t = P && P.lav && taskCorrente(P.lav);
    el.style.width = (t ? t.prog * 100 : 0) + '%';
  });
}

/* ---------- TOAST E MODALE ---------- */
function toast(txt, oro) {
  const el = document.createElement('div'); el.className = 'toast' + (oro ? ' tr' : ''); el.textContent = txt;
  const box = $('#toasts'); box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 2600);
}
let mgAttivo = null;
function modale(html) { $('#mbox').innerHTML = html; $('#modal').hidden = false; }
function chiudiModale() { $('#modal').hidden = true; $('#mbox').innerHTML = ''; if (mgAttivo && mgAttivo.stop) mgAttivo.stop(); mgAttivo = null; }

/* ---------- MINIGIOCHI ---------- */
function apriMano(ip, k) {
  const P = S.ponti[ip]; const lav = P.lav; if (!lav) return;
  const t = lav.tasks[k]; if (!t || t.done) return;
  if (t.p !== 'diagnosi' && !t.pagato) {
    if (!TR().soldiInf && S.soldi < PEZZI[t.p].costo) { toast('Non hai i soldi per il ricambio (' + eur(PEZZI[t.p].costo) + ')'); return; }
  }
  const fine = (ok, primoColpo) => {
    if (!ok) return;
    if (t.p !== 'diagnosi' && !pagaRicambio(t)) { toast('Non hai i soldi per il ricambio'); return; }
    if (S.ponti[ip].lav !== lav) return;
    completaTask(ip, t, true);
  };
  if (TR().auto) { if (t.p === 'diagnosi') S.st.diag++; streak(true); fine(true); return; }
  if (t.p === 'diagnosi') mgDiagnosi(lav, fine);
  else { const g = PEZZI[t.p].gioco; (g === 'bulloni' ? mgBulloni : g === 'regola' ? mgRegola : mgTieni)(t.p, fine); }
}
function streak(ok) {
  if (ok) { S.st.streak++; S.st.best = Math.max(S.st.best, S.st.streak); } else S.st.streak = 0;
}
function testa(p) {
  const P = PEZZI[p];
  return `<h3>${P.nome}</h3><div class="spieg">${P.desc}</div>`;
}
function fineMg(ok, testo, cb) {
  const m = $('#mgmsg'); if (m) { m.className = 'msg ' + (ok ? 'ok' : 'ko'); m.textContent = testo; }
  if (ok) setTimeout(() => { chiudiModale(); cb(true); }, 650);
}
function mgBulloni(p, cb) {
  const n = rnd() < .5 ? 4 : 6;
  const ord = n === 4 ? [0, 2, 1, 3] : [0, 3, 1, 4, 2, 5];
  let passo = 0, errori = 0, tempo = TR().facile ? 30 : 9, finito = false;
  let h = testa(p) + `<div class="sub">Stringi i bulloni a croce nell'ordine dei numeri: così il pezzo si appoggia in modo uniforme.</div><div class="mg" id="mgb" style="width:220px;height:220px"></div><div class="barra"><i id="mgt" style="width:100%;background:var(--ok)"></i></div><div class="msg" id="mgmsg"></div><button class="b sec" data-act="chiudi">Lascia stare</button>`;
  modale(h);
  const box = $('#mgb');
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const el = document.createElement('div'); el.className = 'bull';
    el.style.left = (110 + 78 * Math.cos(a)) + 'px'; el.style.top = (110 + 78 * Math.sin(a)) + 'px';
    el.textContent = ord.indexOf(i) + 1;
    el.addEventListener('pointerdown', ev => {
      ev.preventDefault(); if (finito) return;
      if (ord[passo] === i) { el.classList.add('ok'); passo++; vibra(15); if (passo === n) { finito = true; streak(errori === 0); fineMg(true, errori ? 'Fatto!' : 'Perfetto!', cb); } }
      else if (!el.classList.contains('ok')) { errori++; el.classList.add('ko'); vibra(60); setTimeout(() => el.classList.remove('ko'), 250); }
    });
    box.appendChild(el);
  }
  const t0 = performance.now();
  const id = setInterval(() => {
    if (finito) return clearInterval(id);
    const r = tempo - (performance.now() - t0) / 1000;
    const b = $('#mgt'); if (b) b.style.width = Math.max(0, r / tempo * 100) + '%';
    if (r <= 0) { finito = true; clearInterval(id); streak(false); fineMg(false, 'Tempo scaduto: riprova', cb); riprova(() => mgBulloni(p, cb)); }
  }, 50);
  mgAttivo = { stop: () => { finito = true; clearInterval(id); } };
}
function riprova(f) {
  const m = $('#mbox'); if (!m) return;
  const b = document.createElement('button'); b.className = 'b'; b.textContent = 'Riprova'; b.style.marginRight = '8px';
  b.onclick = () => { chiudiModale(); f(); };
  m.insertBefore(b, m.querySelector('[data-act="chiudi"]'));
}
function mgRegola(p, cb) {
  const P = PEZZI[p];
  const larg = TR().facile ? 55 : (S.attrezzi.dinamo ? 20 : 16) + (S.attrezzi.compressore ? 2 : 0);
  const z0 = 10 + rnd() * (80 - larg);
  let tent = 3, finito = false, x = 0, dir = 1, vel = 70 + rnd() * 30;
  const h = testa(p) + `<div class="sub">${P.nota || 'Ferma l\'ago nella zona verde.'}</div><div class="mg reg" id="mgr" style="width:100%"><div class="z" style="left:${z0}%;width:${larg}%"></div><div class="ago" id="ago"></div></div><div class="sub" id="mgtent">Tentativi: 3</div><div class="msg" id="mgmsg"></div><button class="b" id="ferma" style="width:100%;padding:14px;font-size:17px;margin-bottom:8px">✋ Ferma</button><button class="b sec" data-act="chiudi">Lascia stare</button>`;
  modale(h);
  let last = performance.now(), raf;
  const loop = now => {
    if (finito) return;
    const dt = (now - last) / 1000; last = now;
    x += dir * vel * dt; if (x > 100) { x = 100; dir = -1; } if (x < 0) { x = 0; dir = 1; }
    const a = $('#ago'); if (a) a.style.left = x + '%';
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  let errori = 0;
  $('#ferma').addEventListener('pointerdown', ev => {
    ev.preventDefault(); if (finito) return;
    if (x >= z0 && x <= z0 + larg) { finito = true; vibra(20); streak(errori === 0); fineMg(true, errori ? 'Regolato!' : 'Perfetto!', cb); }
    else {
      errori++; tent--; vibra(80);
      $('#mgtent').textContent = 'Tentativi: ' + tent;
      const m = $('#mgmsg'); m.className = 'msg ko'; m.textContent = x < z0 ? 'Troppo poco' : 'Troppo';
      if (tent <= 0) { finito = true; streak(false); fineMg(false, 'Da rifare: riprova', cb); riprova(() => mgRegola(p, cb)); }
      vel *= 0.9;
    }
  });
  mgAttivo = { stop: () => { finito = true; cancelAnimationFrame(raf); } };
}
function mgTieni(p, cb) {
  const P = PEZZI[p];
  const col = p === 'olio' ? '#c9a227' : p === 'liqfreni' ? '#d9c98a' : p === 'refrigerante' ? '#2fbf71' : '#' + 'e0484f';
  const MIN = TR().facile ? 35 : 55 + Math.round(rnd() * 10), MAX = TR().facile ? 92 : MIN + 16;
  let liv = 0, giu = false, finito = false;
  const h = testa(p) + `<div class="sub">${P.nota || ''} Tieni premuto per versare e lascia tra le due righe.</div><div class="serb"><div class="liq" id="liq" style="background:${col}"></div><div class="lin" style="bottom:${MAX}%">MAX</div><div class="lin" style="bottom:${MIN}%">MIN</div></div><div class="msg" id="mgmsg"></div><button class="b" id="versa" style="width:100%;padding:14px;font-size:17px;margin-bottom:8px;touch-action:none">🫗 Tieni premuto</button><button class="b sec" data-act="chiudi">Lascia stare</button>`;
  modale(h);
  let last = performance.now(), raf;
  const loop = now => {
    if (finito) return;
    const dt = (now - last) / 1000; last = now;
    if (giu) { liv += dt * 34; if (liv >= 100) { liv = 100; giu = false; esito(); } }
    const l = $('#liq'); if (l) l.style.height = liv + '%';
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const esito = () => {
    if (finito || liv === 0) return;
    if (liv >= MIN && liv <= MAX) { finito = true; streak(true); vibra(20); fineMg(true, 'Livello giusto!', cb); }
    else if (liv < MIN) { const m = $('#mgmsg'); m.className = 'msg ko'; m.textContent = 'Ancora poco: continua'; }
    else { finito = true; streak(false); vibra(80); fineMg(false, liv >= 100 ? 'Trabocca! Pulisci e riprova' : 'Troppo! Va tolto: riprova', cb); riprova(() => mgTieni(p, cb)); }
  };
  const b = $('#versa');
  b.addEventListener('pointerdown', ev => { ev.preventDefault(); if (!finito) { giu = true; last = performance.now(); } });
  const su = () => { if (giu) { giu = false; esito(); } };
  b.addEventListener('pointerup', su); b.addEventListener('pointerleave', su); b.addEventListener('pointercancel', su);
  mgAttivo = { stop: () => { finito = true; cancelAnimationFrame(raf); } };
}
function mgDiagnosi(lav, cb) {
  const c = lav.c; const m = c.moto;
  const giusto = c.guasti[0];
  const sx = SINTOMI.find(s => s.t === c.sintomo);
  const altriCause = sx ? sx.c : [];
  const cand = RIPARAZIONI.filter(p => p !== giusto && !altriCause.includes(p));
  const esche = shuffle(cand.filter(p => pezzoAdatto(p, m))).concat(shuffle(cand.filter(p => !pezzoAdatto(p, m)))).slice(0, 3);
  const opz = shuffle([giusto].concat(esche));
  let errori = 0, finito = false;
  let h = `<h3>🩺 Trova il guasto</h3><div class="spieg">${c.nome}: «${c.sintomo}»<br><span class="sub">${nomeMoto(m)} · ${m.inj ? 'iniezione elettronica' : 'carburatore'}</span></div><div class="sub">Qual è il pezzo da controllare?</div>`;
  for (const p of opz) h += `<button class="opz" data-p="${p}"${TR().facile && p === giusto ? ' style="border:2px solid var(--ok)"' : ''}>${PEZZI[p].nome}${TR().facile && p === giusto ? ' 👈' : ''}</button>`;
  h += `<div class="msg" id="mgmsg"></div><div class="spieg" id="mgsp" hidden></div><button class="b sec" data-act="chiudi">Lascia stare</button>`;
  modale(h);
  document.querySelectorAll('.opz').forEach(b => b.addEventListener('click', () => {
    if (finito) return;
    const p = b.dataset.p;
    if (p === giusto) {
      finito = true; if (!errori) S.st.diag++; streak(errori === 0); vibra(20);
      const sp = $('#mgsp'); sp.hidden = false; sp.textContent = PEZZI[p].desc;
      const m2 = $('#mgmsg'); m2.className = 'msg ok'; m2.textContent = 'Trovato!';
      setTimeout(() => { chiudiModale(); cb(true); }, 1600);
    } else {
      errori++; b.classList.add('ko'); b.disabled = true; vibra(70);
      const sp = $('#mgsp'); sp.hidden = false; sp.textContent = 'No: ' + PEZZI[p].nome.toLowerCase() + ' non dà questo sintomo. ' + PEZZI[p].desc;
    }
  }));
  mgAttivo = { stop: () => { finito = true; } };
}
function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

/* ---------- EVENTI ---------- */
document.addEventListener('click', ev => {
  const tb = ev.target.closest('[data-tab]');
  if (tb) { scheda = tb.dataset.tab; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b === tb)); pan.scrollTop = 0; render(); return; }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  switch (a) {
    case 'chiudi': chiudiModale(); break;
    case 'tab': scheda = d.v; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === scheda)); render(); break;
    case 'prendi': if (S.clienti[0]) accettaCliente(S.clienti[0].id, +d.ip); break;
    case 'accetta': accettaCliente(+d.id); break;
    case 'rifiuta': rifiutaCliente(+d.id); break;
    case 'mano': apriMano(+d.ip, +d.k); break;
    case 'pers': personalizza(+d.ip, d.p); break;
    case 'vendiP': { const l = S.ponti[+d.ip].lav; if (l && l.kind === 'usato') vendiUsato(l.it, +d.ip); break; }
    case 'mag': alMagazzino(+d.ip); break;
    case 'compraU': compraUsato(+d.id); break;
    case 'vendiM': { const it = S.magazzino[+d.k]; if (it) vendiUsato(it, null); break; }
    case 'ponteM': { const it = S.magazzino[+d.k]; if (it) sulPonte(it); break; }
    case 'ponte': compraPonte(); break;
    case 'assumi': assumi(); break;
    case 'corso': corso(+d.ip); break;
    case 'attr': compraAttrezzo(d.id); break;
    case 'sede': compraSede(+d.i); break;
    case 'squadra': fondaSquadra(); break;
    case 'gara': avviaGara(); break;
    case 'stat': { const q = S.squadra; const c = costoStat(q.stat[d.id]); if (spendi(c)) { q.stat[d.id]++; dirty(); } break; }
    case 'pilota': { const q = S.squadra; if (spendi(costoPilota(q.pilota))) { q.pilota++; dirty(); } break; }
    case 'auto': S.autoAcc = el.checked; dirty(); break;
    case 'menu': menu(); break;
    case 'esporta': { const t = $('#salvtxt'); t.value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); t.select(); try { navigator.clipboard.writeText(t.value); toast('Codice copiato'); } catch (e) {} break; }
    case 'importa': {
      try { const o = JSON.parse(decodeURIComponent(escape(atob($('#salvtxt').value.trim())))); if (o.v !== 1) throw 0; S = o; chiudiModale(); toast('Partita caricata'); salva(); dirty(); } catch (e) { toast('Codice non valido'); }
      break;
    }
    case 'codice': usaCodice($('#codice').value); break;
    case 'trucchi': menuTrucchi(); break;
    case 'trT': { const k = d.k; const T = TR(); if (k === 'tempo') T.tempo = T.tempo === 1 ? 2 : T.tempo === 2 ? 10 : 1; else T[k] = !T[k]; dirty(); menuTrucchi(); break; }
    case 'trA': azioneTrucco(d.k); menuTrucchi(); break;
    case 'reset': if (el.dataset.ok) { S = nuovoStato(); salva(); chiudiModale(); dirty(); toast('Nuova partita'); } else { el.dataset.ok = 1; el.textContent = 'Sicuro? Premi ancora'; } break;
  }
});
/* ---------- TRUCCHI ---------- */
const CODICI = {
  '1234': ['Apre il menu trucchi', () => { TR().menu = true; menuTrucchi(); return 'Menu trucchi sbloccato!'; }],
  'SOLDI': ['Soldi infiniti (acceso/spento)', () => { TR().soldiInf = !TR().soldiInf; return 'Soldi infiniti ' + (TR().soldiInf ? 'accesi' : 'spenti'); }],
  'FAMA': ['+5 livelli di fama', () => azioneTrucco('fama')],
  'TURBO': ['Tempo ×1 → ×2 → ×10', () => { const T = TR(); T.tempo = T.tempo === 1 ? 2 : T.tempo === 2 ? 10 : 1; return 'Tempo ×' + T.tempo; }],
  'RAPIDO': ['Meccanici istantanei', () => { TR().mecIst = !TR().mecIst; return 'Meccanici istantanei ' + (TR().mecIst ? 'accesi' : 'spenti'); }],
  'RAFFICA': ['Clienti a raffica', () => { TR().raffica = !TR().raffica; return 'Clienti a raffica ' + (TR().raffica ? 'accesi' : 'spenti'); }],
  'FACILE': ['Minigiochi facili', () => { TR().facile = !TR().facile; return 'Minigiochi facili ' + (TR().facile ? 'accesi' : 'spenti'); }],
  'AUTO': ['Minigiochi vinti da soli', () => { TR().auto = !TR().auto; return 'Vittoria automatica ' + (TR().auto ? 'accesa' : 'spenta'); }],
  'PILOTA': ['Vinci sempre le gare', () => { TR().vinci = !TR().vinci; return 'Vinci sempre ' + (TR().vinci ? 'acceso' : 'spento'); }],
  'GARAGE': ['Tutte le sedi, gli attrezzi, i ponti e i meccanici', () => azioneTrucco('garage')],
  'MOTO': ['Moto da gara +10 livelli', () => azioneTrucco('moto')],
  'MONDIALE': ['Salta al Campionato Mondiale', () => azioneTrucco('mondiale')],
};
function usaCodice(txt) {
  const c = String(txt || '').trim().toUpperCase();
  const x = CODICI[c];
  if (!x) { toast('Codice sbagliato'); vibra(80); return; }
  const r = x[1](); if (r) toast('😈 ' + r, true); vibra(30); dirty();
  const i = $('#codice'); if (i) i.value = '';
}
function azioneTrucco(k) {
  const T = TR();
  if (k === 'fama') { const l = famaLvl() + 5; S.fama = Math.max(S.fama, sogliaFama(l)); dirty(); return 'Fama livello ' + l; }
  if (k === 'garage') {
    for (const a of ATTREZZI) S.attrezzi[a.id] = true;
    S.sede = SEDI.length - 1; S.fama = Math.max(S.fama, sogliaFama(SEDI[S.sede].fama));
    while (S.ponti.length < SEDI[S.sede].ponti) S.ponti.push({ mecc: null, lav: null });
    const usati = S.ponti.filter(p => p.mecc).map(p => p.mecc.nome);
    S.ponti.forEach((P, i) => { if (!P.mecc) { const n = NOMI_MECC.find(x => !usati.includes(x)) || ('Meccanico ' + (i + 1)); usati.push(n); P.mecc = { nome: n, lvl: 0 }; } });
    dirty(); return 'Officina al completo!';
  }
  if (k === 'squadra' || k === 'moto' || k === 'mondiale') {
    if (!S.squadra) { S.squadra = { stat: { motore: 0, ciclistica: 0, freni: 0, gomme: 0 }, pilota: 0, tier: 0, gara: 0, punti: new Array(12).fill(0), ultimo: null, colore: pick(COLORI) }; }
    if (k === 'moto') { for (const s of STAT_CORSA) S.squadra.stat[s.id] += 10; S.squadra.pilota += 10; dirty(); return 'Moto da gara +10 livelli'; }
    if (k === 'mondiale') { if (S.squadra.tier < 3) { S.squadra.tier = 3; S.squadra.gara = 0; S.squadra.punti = new Array(12).fill(0); } dirty(); return 'Sei al Campionato Mondiale!'; }
    dirty(); return 'Squadra corse pronta';
  }
  if (k === 'mecc') { S.ponti.forEach(P => { if (P.mecc) P.mecc.lvl += 5; }); dirty(); return 'Meccanici +5 livelli'; }
}
function menuTrucchi() {
  const T = TR();
  const sw = (k, nome, desc) => `<div class="riga" style="padding:7px 0;border-top:1px solid #353a42"><div class="sp"><div class="tit">${nome}</div><div class="sub">${desc}</div></div><button class="b pic ${T[k] ? 'ok' : 'sec'}" data-act="trT" data-k="${k}">${k === 'tempo' ? '×' + T.tempo : T[k] ? 'Acceso' : 'Spento'}</button></div>`;
  const az = (k, nome) => `<button class="b sec pic" data-act="trA" data-k="${k}" style="margin:3px 3px 3px 0">${nome}</button>`;
  let h = `<h3>😈 Trucchi</h3>`;
  h += sw('soldiInf', '♾️ Soldi infiniti', 'Comprare e i ricambi non costano nulla');
  h += sw('tempo', '⏩ Tempo veloce', 'Tocca per passare da ×1 a ×2 a ×10');
  h += sw('mecIst', '⚡ Meccanici istantanei', 'Finiscono ogni pezzo in un attimo');
  h += sw('raffica', '🧑 Clienti a raffica', 'Arriva un cliente ogni 0,3 secondi');
  h += sw('facile', '🍰 Minigiochi facili', 'Zona verde enorme, più tempo, la risposta giusta indicata');
  h += sw('auto', '🤖 Minigiochi vinti da soli', '«Fai tu» finisce subito il lavoro');
  h += sw('vinci', '🥇 Vinci sempre le gare', 'Il tuo pilota arriva sempre primo');
  h += `<div style="margin-top:8px">${az('fama', '⭐ +5 fama')}${az('garage', '🏟️ Officina al completo')}${az('mecc', '👷 Meccanici +5')}${az('squadra', '🏁 Squadra corse')}${az('moto', '🏍️ Moto da gara +10')}${az('mondiale', '🌐 Salta al Mondiale')}</div>`;
  h += `<div class="nota" style="margin-top:10px"><b>Codici</b> (da scrivere nella casella del menu ⚙️):<br>${Object.entries(CODICI).map(([c, x]) => '<b>' + c + '</b> ' + x[0]).join('<br>')}</div>`;
  h += `<button class="b" data-act="chiudi" style="margin-top:10px">Chiudi</button>`;
  modale(h);
}
function menu() {
  modale(`<h3>⚙️ Partita</h3><p class="sub">La partita si salva da sola su questo dispositivo. Per spostarla (per esempio dal browser all'app) copia il codice e incollalo dall'altra parte.</p><textarea id="salvtxt" placeholder="Incolla qui un codice per caricare"></textarea><div class="riga" style="gap:6px;margin:8px 0;flex-wrap:wrap"><button class="b pic" data-act="esporta">Copia codice</button><button class="b pic sec" data-act="importa">Carica codice</button></div><div class="riga" style="gap:6px;margin:10px 0"><input id="codice" placeholder="Codice segreto" autocomplete="off" style="flex:1;min-width:0;background:#1d2026;color:var(--txt);border:1px solid #444b55;border-radius:8px;padding:9px;font-size:15px;text-transform:uppercase"><button class="b pic" data-act="codice">Usa</button></div>${TR().menu ? '<button class="b sec" data-act="trucchi" style="width:100%;margin-bottom:8px">😈 Menu trucchi</button>' : ''}<p class="sub">Officina Moto · un gioco di Massi</p><div class="riga" style="gap:6px"><button class="b sec" data-act="chiudi">Chiudi</button><button class="b sec pic" style="color:var(--ko)" data-act="reset">Ricomincia da zero</button></div>`);
}
pan.addEventListener('pointerdown', () => { dita = true; });
window.addEventListener('pointerup', () => { dita = false; });
window.addEventListener('pointercancel', () => { dita = false; });

/* ---------- SCENA ---------- */
const cv = $('#scena'), g = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const floaters = [], scintille = [];
function ridim() { DPR = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); }
window.addEventListener('resize', ridim);
function disegnaMoto(x, y, s, m, alza) {
  const tipo = m.tipo, col = m.colore;
  g.save(); g.translate(x, y); g.scale(s, s);
  const rr = tipo === 'scooter' ? 7 : tipo === 'enduro' || tipo === 'motard' ? 11 : 10;
  const dx = tipo === 'custom' ? 24 : tipo === 'scooter' ? 16 : 19;
  // ruote
  g.lineWidth = 3.5; g.strokeStyle = '#111'; g.fillStyle = '#555';
  for (const sx of [-dx, dx]) { g.beginPath(); g.arc(sx, -rr, rr, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#999'; g.beginPath(); g.arc(sx, -rr, 2.5, 0, 7); g.fill(); g.fillStyle = '#555'; }
  g.lineWidth = 2.5; g.strokeStyle = '#333';
  const ty = -rr * 2 - 6;
  if (tipo === 'scooter') {
    g.fillStyle = col; g.beginPath(); g.moveTo(-dx - 4, -rr - 6); g.quadraticCurveTo(-dx, ty - 4, -2, ty + 2); g.lineTo(dx - 8, -rr - 2); g.lineTo(-dx + 6, -rr - 2); g.closePath(); g.fill();
    g.fillRect(dx - 9, ty - 14, 5, rr + 16);
    g.fillStyle = '#222'; g.fillRect(-dx - 2, ty - 1, 16, 4);
    g.beginPath(); g.moveTo(dx - 8, ty - 14); g.lineTo(dx + 1, ty - 16); g.stroke();
  } else {
    // telaio
    g.beginPath(); g.moveTo(-dx, -rr); g.lineTo(-4, ty + 6); g.lineTo(dx - 4, ty - 2); g.lineTo(dx, -rr); g.stroke();
    // motore
    g.fillStyle = tipo === 'epoca' ? '#b8bcc2' : '#3d3d3d'; g.fillRect(-8, ty + 6, 16, 12);
    // serbatoio
    g.fillStyle = col; g.beginPath(); g.ellipse(4, ty, 11, 6, -0.08, 0, 7); g.fill();
    if (tipo === 'epoca') { g.fillStyle = '#e6e6e6'; g.beginPath(); g.ellipse(4, ty, 5, 3, 0, 0, 7); g.fill(); }
    // sella
    g.fillStyle = '#1a1a1a';
    if (tipo === 'custom') { g.fillRect(-16, ty + 3, 14, 4); } else g.fillRect(-dx + 2, ty - 2, 16, 4);
    // manubrio / forcella
    g.beginPath(); g.moveTo(dx, -rr); g.lineTo(dx - 5, ty - 6); g.stroke();
    g.beginPath(); g.moveTo(dx - 5, ty - 6); g.lineTo(dx - (tipo === 'custom' ? 12 : 9), ty - (tipo === 'custom' ? 18 : 10)); g.stroke();
    if (tipo === 'sportiva' || tipo === 'pista') { g.fillStyle = col; g.beginPath(); g.moveTo(dx - 2, ty - 10); g.lineTo(dx + 4, ty + 10); g.lineTo(dx - 12, ty + 16); g.lineTo(dx - 14, ty); g.closePath(); g.fill(); if (tipo === 'pista') { g.fillStyle = '#fff'; g.font = 'bold 7px sans-serif'; g.fillText('46', dx - 11, ty + 9); } }
    if (tipo === 'enduro' || tipo === 'motard') { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(dx - 6, -rr * 2 - 3); g.lineTo(dx + 8, -rr * 2 - 1); g.stroke(); }
    // scarico
    g.strokeStyle = '#aaa'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-4, ty + 16); g.lineTo(-dx - 2, -rr - 4); g.stroke();
  }
  g.restore();
}
function disegnaOmino(x, y, t, lavora, nome) {
  g.save(); g.translate(x, y);
  g.fillStyle = '#2b5fa8'; g.fillRect(-5, -30, 10, 18);           // tuta
  g.fillStyle = '#1f3f70'; g.fillRect(-5, -13, 4, 13); g.fillRect(1, -13, 4, 13);
  g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(0, -36, 6, 0, 7); g.fill();
  g.fillStyle = '#d62828'; g.fillRect(-6, -43, 12, 4);              // cappellino
  const a = lavora ? Math.sin(t * 9) * 0.6 - 0.6 : 0.3;
  g.strokeStyle = '#2b5fa8'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(4, -27); g.lineTo(4 + Math.cos(a) * 12, -27 + Math.sin(a) * 12); g.stroke();
  g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(4 + Math.cos(a) * 12, -27 + Math.sin(a) * 12); g.lineTo(4 + Math.cos(a) * 19, -27 + Math.sin(a) * 19); g.stroke();
  if (nome) { g.fillStyle = '#fff'; g.font = '9px sans-serif'; g.textAlign = 'center'; g.fillText(nome, 0, 8); }
  g.restore();
}
function disegnaScena(t, dt) {
  if (!W) ridim();
  if (gara) return disegnaGara(t, dt);
  const sd = SEDI[S.sede];
  g.fillStyle = sd.muro; g.fillRect(0, 0, W, H);
  const pav = H * 0.78;
  g.fillStyle = sd.pav; g.fillRect(0, pav, W, H - pav);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, pav, W, 3);
  // finestre e scaffale con gomme
  g.fillStyle = 'rgba(160,200,235,.25)';
  for (let x = W * 0.12; x < W; x += W * 0.38) { g.fillRect(x, 38, 46, 30); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(x, 38, 46, 30); g.beginPath(); g.moveTo(x + 23, 38); g.lineTo(x + 23, 68); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(W - 70, 80, 60, 4);
  g.strokeStyle = '#1a1a1a'; g.lineWidth = 4;
  for (let k = 0; k < Math.min(3, S.sede + 1); k++) { g.beginPath(); g.arc(W - 58 + k * 18, 72, 8, 0, 7); g.stroke(); }
  // insegna
  g.fillStyle = '#111'; g.fillRect(W / 2 - 90, 6, 180, 22); g.fillStyle = '#ff8a1f'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
  g.fillText('OFFICINA MOTO', W / 2, 22);
  // attrezzi appesi
  let ax = 10; g.font = '16px sans-serif'; g.textAlign = 'left';
  for (const a of ATTREZZI) if (S.attrezzi[a.id] && ax < W / 2 - 100) { g.fillText(a.ic, ax, 24); ax += 22; }
  if (S.squadra) { g.fillText('🏁', W - 30, 24); }
  // ponti
  const n = S.ponti.length;
  const slot = W / n;
  const s = clamp(slot / 95, 0.55, 1.35);
  S.ponti.forEach((P, ip) => {
    const cx = slot * (ip + 0.5);
    const lav = P.lav;
    const lift = lav ? 8 * s : 0;
    // ponte
    g.fillStyle = '#c33'; g.fillRect(cx - 32 * s, pav - lift - 5, 64 * s, 5);
    g.fillStyle = '#777'; g.fillRect(cx - 4, pav - lift, 8, lift + 2);
    if (lav) {
      const moto = lav.kind === 'cliente' ? lav.c.moto : lav.it.moto;
      disegnaMoto(cx, pav - lift - 5, s, moto);
      const tk = taskCorrente(lav);
      if (tk && P.mecc) {
        g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(cx - 25 * s, pav - 70 * s, 50 * s, 5);
        g.fillStyle = '#4aa3ff'; g.fillRect(cx - 25 * s, pav - 70 * s, 50 * s * tk.prog, 5);
        if (!lav.aspetta && rnd() < dt * 6) scintille.push({ x: cx + 10 * s, y: pav - 25 * s, vx: (rnd() - .5) * 80, vy: -rnd() * 80, v: .5 });
      }
      if (lav.pronta) { g.font = (14 * s) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('✅', cx, pav - 62 * s); }
    }
    g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(ip + 1, cx, H - 4);
    if (P.mecc) disegnaOmino(cx + 34 * s, pav, t + ip, !!(lav && taskCorrente(lav) && !lav.aspetta), slot > 70 ? P.mecc.nome : '');
  });
  // clienti in fila
  const nc = Math.min(S.clienti.length, 6);
  for (let i = 0; i < nc; i++) { g.font = '15px sans-serif'; g.textAlign = 'left'; g.fillText('🧑', W - 20 - i * 15, pav + 24 + Math.sin(t * 3 + i) * 1.5); }
  // scintille
  for (let i = scintille.length - 1; i >= 0; i--) {
    const p = scintille[i]; p.v -= dt; if (p.v <= 0) { scintille.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt;
    g.fillStyle = `rgba(255,${180 + Math.floor(rnd() * 70)},60,${p.v * 2})`; g.fillRect(p.x, p.y, 2, 2);
  }
  // soldi che salgono
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt; if (f.t > 1.6) { floaters.splice(i, 1); continue; }
    const cx = slot * ((f.ip % n) + 0.5);
    g.globalAlpha = 1 - f.t / 1.6; g.fillStyle = '#ffd23f'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center';
    g.fillText(f.txt, cx, pav - 60 * s - f.t * 30); g.globalAlpha = 1;
  }
}
function disegnaGara(t, dt) {
  gara.t += dt;
  const T = DURATA_GARA, f = clamp(gara.t / T, 0, 1);
  g.fillStyle = '#2f7a3a'; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2 + 6, rx = Math.min(W * 0.42, 300), ry = H * 0.36;
  g.strokeStyle = '#555'; g.lineWidth = 22; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.stroke();
  g.strokeStyle = '#fff'; g.lineWidth = 1; g.setLineDash([6, 6]); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.stroke(); g.setLineDash([]);
  // traguardo
  g.fillStyle = '#fff'; g.fillRect(cx - 2, cy + ry - 11, 4, 22);
  const n = gara.par.length;
  const prog = gara.par.map(p => {
    const base = f * GIRI;
    const dist = ((n - 1) / 2 - p.pos) * 0.045 * Math.pow(f, 1.3);
    const rum = 0.05 * Math.sin(gara.t * 0.9 + p.fase) * (1 - f) * Math.min(1, gara.t / 3);
    return { p, v: base + dist + rum };
  });
  prog.sort((a, b) => b.v - a.v);
  prog.forEach((o, k) => {
    const ang = Math.PI / 2 - o.v * 2 * Math.PI;
    const off = ((k % 3) - 1) * 6;
    const x = cx + (rx + off) * Math.cos(ang), y = cy + (ry + off) * Math.sin(ang);
    g.fillStyle = o.p.col; g.beginPath(); g.arc(x, y, o.p.noi ? 6 : 4.5, 0, 7); g.fill();
    if (o.p.noi) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('TU', x, y - 9); }
  });
  const mio = prog.findIndex(o => o.p.noi) + 1;
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(6, 6, 170, 40);
  g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'left';
  g.fillText(gara.circ, 12, 21);
  g.fillText('Giro ' + Math.min(GIRI, Math.floor(f * GIRI) + 1) + '/' + GIRI + ' · ' + mio + '° posto', 12, 38);
  if (gara.t >= T + 0.8) finisciGara();
}

/* ---------- CICLO ---------- */
let ultimoT = performance.now(), salvaT = 0, renderT = 0;
function ciclo(now) {
  let dt = (now - ultimoT) / 1000; ultimoT = now;
  if (dt > 5) { const via = (Date.now() - S.ultimo) / 1000; if (via > 5) applicaAssenza(via, true); S.ultimo = Date.now(); dt = 0; }
  dt = Math.min(dt, 0.25);
  tick(dt * (TR().tempo || 1));
  disegnaScena(now / 1000, dt);
  salvaT += dt; if (salvaT > 5) { salvaT = 0; salva(); }
  renderT += dt;
  if (_dirty && !dita && renderT > 0.15 && $('#modal').hidden) { renderT = 0; render(); }
  else aggiornaVivi();
  requestAnimationFrame(ciclo);
}
window.addEventListener('pagehide', salva);
// quando l'app torna dallo sfondo calcola il tempo passato
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { const via = (Date.now() - S.ultimo) / 1000; if (via > 30) applicaAssenza(via, true); S.ultimo = Date.now(); ultimoT = performance.now(); }
  else salva();
});

/* ---------- AVVIO ---------- */
(function avvio() {
  S = carica();
  if (S) {
    const via = (Date.now() - S.ultimo) / 1000;
    if (via > 30) applicaAssenza(via, true);
  } else {
    S = nuovoStato();
    S.clienti.push(nuovoCliente());
    modale(`<h3>🏍️ Officina Moto</h3><p>Hai un garage, un ponte sollevatore, una cassetta di chiavi e 400 €.</p><p>Ripara le moto dei clienti con le tue mani, compra moto usate da rimettere a posto, assumi meccanici, apri nuove sedi e fonda una squadra corse che arrivi al Mondiale.</p><p class="sub">Ogni pezzo ha una riga di spiegazione vera: imparerai come funziona una moto.</p><button class="b" data-act="chiudi">Apri l'officina</button>`);
  }
  ridim(); render();
  requestAnimationFrame(ciclo);
})();
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.id === 'codice') usaCodice(ev.target.value); });
