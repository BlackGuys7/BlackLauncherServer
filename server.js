const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// --- KONFIGURATION ---
// Railway weist den Port automatisch zu, lokal wird 3000 genutzt
const PORT = process.env.PORT || 3000;
// Das Secret kommt aus den Railway-Variablen oder ist lokal 'dev_secret'
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
// Die MongoDB URL von Railway oder lokal
const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/blacklauncher';

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors()); // Erlaubt Anfragen von Webseite & Launcher

// --- MONGODB VERBINDUNG ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB verbunden'))
    .catch(err => console.error('❌ MongoDB Fehler:', err));

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- ROUTES ---

// Startseite (damit "Cannot GET /" verschwindet)
app.get('/', (req, res) => {
    res.send('BlackLauncher API läuft online!');
});

// REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ error: 'Alle Felder ausfüllen' });

        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists)
            return res.status(400).json({ error: 'Benutzername oder E-Mail vergeben' });

        const hash = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hash });
        await user.save();

        const token = jwt.sign({ id: user._id, username }, JWT_SECRET);
        res.json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Serverfehler bei Registrierung' });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' });

        const token = jwt.sign({ id: user._id, username }, JWT_SECRET);
        res.json({ token, username, email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Serverfehler beim Login' });
    }
});

// VALIDATE TOKEN
app.get('/api/validate', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'Kein Token' });

        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'User nicht gefunden' });

        res.json({ username: user.username, email: user.email });
    } catch (err) {
        res.status(401).json({ error: 'Ungültiger Token' });
    }
});

// --- SERVER START ---
// Wichtig: '0.0.0.0' ist nötig für Railway Networking
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server aktiv auf Port ${PORT}`);
});
