// 1. Module importieren
require('dotenv').config(); // Lädt die DATABASE_URL aus deiner .env Datei
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000; // Railway gibt dir automatisch einen PORT vor

// 2. Middleware (um JSON-Daten verarbeiten zu können)
app.use(express.json());

// 3. MongoDB Verbindung
const mongoURI = process.env.DATABASE_URL;

if (!mongoURI) {
    console.error("FEHLER: DATABASE_URL ist nicht definiert! Prüfe deine .env oder Railway Variablen.");
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Erfolgreich mit MongoDB Atlas verbunden!'))
    .catch(err => console.error('❌ MongoDB Verbindungsfehler:', err));

// 4. Test-Route (damit du im Browser siehst, ob der Server läuft)
app.get('/', (req, res) => {
    res.send('Server läuft und ist mit MongoDB verbunden! 🚀');
});

// 5. Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
