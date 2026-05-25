const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserRepository } = require('../repositories/userRepository');
const { authMiddleware, JWT_SECRET } = require('../services/authMiddleware');

module.exports = function(db) {
    const router = express.Router();
    const userRepo = new UserRepository(db);

    // SIGNUP ROUTE
    router.post('/signup', async (req, res) => {
        const { regnum, name, password } = req.body;
        if (!regnum || !name || !password) {
            return res.status(400).json({ error: 'regnum, name, and password are required' });
        }

        try {
            // Check uniqueness of regnum
            const existingUser = await userRepo.getByRegnum(regnum);
            if (existingUser) {
                return res.status(400).json({ error: 'Registration number is already registered.' });
            }

            // Hash password securely using bcryptjs
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Persist the user in the SQLite Database
            const result = await userRepo.create({
                regnum,
                name,
                password_hash,
                role: 'student',
                contribution_score: 0
            });

            const userId = result.id;

            // Generate JWT payload and sign
            const payload = { id: userId, regnum, name, role: 'student' };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
                message: 'Registration successful',
                token,
                user: { id: userId, regnum, name, role: 'student', contribution_score: 0 }
            });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // LOGIN ROUTE
    router.post('/login', async (req, res) => {
        const { regnum, password } = req.body;
        if (!regnum || !password) {
            return res.status(400).json({ error: 'regnum and password are required' });
        }

        try {
            // Query user
            const user = await userRepo.getByRegnum(regnum);
            if (!user) {
                return res.status(400).json({ error: 'Invalid registration number or password.' });
            }

            // Verify bcrypt hash
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid registration number or password.' });
            }

            // Generate JWT payload and sign
            const payload = { id: user.id, regnum: user.regnum, name: user.name, role: user.role };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, regnum: user.regnum, name: user.name, role: user.role, contribution_score: user.contribution_score }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // PROFILE ROUTE (/me)
    router.get('/me', authMiddleware, async (req, res) => {
        try {
            const user = await userRepo.getById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({
                id: user.id,
                regnum: user.regnum,
                name: user.name,
                role: user.role,
                contribution_score: user.contribution_score
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // LEADERBOARD ROUTE (/leaderboard)
    router.get('/leaderboard', async (req, res) => {
        try {
            const leaderboard = await userRepo.getAll();
            res.json(leaderboard);
        } catch (error) {
            console.error('Leaderboard error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
