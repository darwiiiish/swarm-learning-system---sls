const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.cors = app.use(cors());
app.use(express.json());

// Serve static simulation files
app.use('/simulations', express.static(path.join(__dirname, '../static/simulations')));

// Dependency Injection setup
const db = new Database(path.join(__dirname, '../data/database.db'));

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Swarm Learning Platform API is running.' });
});

// Import and inject dependencies into controllers
const authController = require('./controllers/authController')(db);
app.use('/api/auth', authController);

const algorithmController = require('./controllers/algorithmController')(db);
app.use('/api/algorithms', algorithmController);

const adminController = require('./controllers/adminController')(db);
app.use('/api/admin', adminController);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
