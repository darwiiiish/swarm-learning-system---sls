const express = require('express');
const cors = require('cors');
const path = require('path');

// Helper to resolve bundled ES modules wrapping CommonJS exports
const resolveRequire = (mod) => (mod && typeof mod === 'object' && 'default' in mod) ? mod.default : mod;

const rawDb = require('./db');

const Database = resolveRequire(rawDb);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.cors = app.use(cors());
app.use(express.json());

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;

// On Vercel (serverless environment), the local directories are read-only. We must write to /tmp.
const dbPath = isVercel
    ? path.join('/tmp', 'database.db')
    : path.join(__dirname, '../data/database.db');

const staticSimPath = isVercel
    ? '/tmp/simulations'
    : path.join(__dirname, '../static/simulations');

// Serve static simulation files
app.use('/simulations', express.static(path.join(__dirname, '../static/simulations')));
app.use('/simulations', express.static('/tmp/simulations'));
app.use('/api/simulations', express.static(path.join(__dirname, '../static/simulations')));
app.use('/api/simulations', express.static('/tmp/simulations'));

// Dependency Injection setup

const db = new Database(dbPath);

// Basic health check
app.get(['/api/health', '/health'], (req, res) => {
    res.json({ status: 'ok', message: 'Swarm Learning Platform API is running.' });
});

// Import and inject dependencies into controllers
const authController = resolveRequire(require('./controllers/authController'))(db);
app.use('/api/auth', authController);
app.use('/auth', authController); // For prefix-stripped routing under Vercel Services

const algorithmController = resolveRequire(require('./controllers/algorithmController'))(db);
app.use('/api/algorithms', algorithmController);
app.use('/algorithms', algorithmController); // For prefix-stripped routing under Vercel Services

const adminController = resolveRequire(require('./controllers/adminController'))(db);
app.use('/api/admin', adminController);
app.use('/admin', adminController); // For prefix-stripped routing under Vercel Services

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
