const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json()); // Erlaubt JSON im Body
app.use(cors());         // Erlaubt deiner Webseite den Zugriff

// 1. Verbindung zur MongoDB
// Die URL kommt sicher aus den Railway-Umgebungsvariablen
const mongoURI = process.env.DATABASE_URL;

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Erfolgreich mit MongoDB verbunden'))
    .catch(err => {
        console.error('❌ MongoDB Verbindungsfehler:', err);
        process.exit(1); // Stoppt den Server bei Fehler
    });

// 2. Benutzer-Modell (Schema)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 3. API-Endpunkt: REGISTRIEREN
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Prüfen ob Benutzer schon existiert
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
        }

        // Passwort verschlüsseln
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: 'Benutzer erfolgreich erstellt' });

    } catch (err) {
        console.error('Registrierungsfehler:', err);
        res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
    }
});

// 4. API-Endpunkt: LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Benutzer suchen
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Ungültiger Benutzername oder Passwort' });
        }

        // Passwort prüfen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Ungültiger Benutzername oder Passwort' });
        }

        // Erfolg
        res.json({ 
            message: 'Login erfolgreich', 
            username: user.username 
        });

    } catch (err) {
        console.error('Loginfehler:', err);
        res.status(500).json({ error: 'Serverfehler beim Login' });
    }
});

// 5. Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
});
