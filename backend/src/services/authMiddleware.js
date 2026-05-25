const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sls_secret_key_2026';

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No authorization header provided.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Access denied. Authorization format must be Bearer <token>' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains id, regnum, role, name
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
    }
}

function adminMiddleware(req, res, next) {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Access denied. Superadmin privileges required.' });
    }
    next();
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
