const express = require('express');
const path = require('path');

const db = require('./src/db');

const fahrzeugeRoutes = require('./src/routes/fahrzeuge');
const vergleicheRoutes = require('./src/routes/vergleiche');

const count = db.prepare('SELECT COUNT(*) as cnt FROM fahrzeuge').get().cnt;
if (count === 0) {
  require('./seed');
}

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

app.use((req, res) => {
  res.status(404).send('Seite nicht gefunden');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Interner Serverfehler');
});

const server = app.listen(PORT, () => {
  console.log(`TCO-Rechner laeuft auf http://localhost:${PORT}`);
});
server.on('error', (err) => {
  console.error('Server konnte nicht gestartet werden:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Server wird beendet...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('Server wird beendet...');
  process.exit(0);
});
