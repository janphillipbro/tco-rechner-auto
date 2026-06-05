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
