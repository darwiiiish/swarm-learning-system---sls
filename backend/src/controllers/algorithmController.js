const express = require('express');
const path = require('path');
const GitHubIngestor = require('../services/githubIngestor');
const ManifestValidator = require('../services/manifestValidator');
const { AlgorithmRepository } = require('../repositories/algorithmRepository');
const { authMiddleware } = require('../services/authMiddleware');

function parseGitHubUrl(url) {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
    if (!match) return null;
    const owner = match[1].toLowerCase();
    const repo = match[2].replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
    return `${owner}/${repo}`;
}

async function syncUserScore(db, userId) {
    const scoreRow = await db.get(`
        SELECT (
           CASE 
               WHEN role != 'student' THEN 0
               ELSE (
                  (SELECT COUNT(*) FROM algorithms WHERE creator_id = ?) * 10 +
                  (SELECT COUNT(*) FROM comments c 
                   LEFT JOIN algorithms a ON c.algorithm_id = a.id 
                   WHERE c.user_id = ? AND a.creator_id != ?)
               )
           END
        ) AS contribution_score
        FROM users WHERE id = ?
    `, [userId, userId, userId, userId]);
    const newScore = scoreRow ? scoreRow.contribution_score : 0;
    await db.run(`UPDATE users SET contribution_score = ? WHERE id = ?`, [newScore, userId]);
    return newScore;
}

module.exports = function(db) {
    const router = express.Router();
    const algorithmRepo = new AlgorithmRepository(db);
    const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
    const staticSimPath = isVercel
        ? '/tmp/simulations'
        : path.join(__dirname, '../../static/simulations');
    const ingestor = new GitHubIngestor(staticSimPath);

    router.get('/', async (req, res) => {
        try {
            const algorithms = await algorithmRepo.getAll();
            res.json(algorithms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/:slug', async (req, res) => {
        try {
            const algorithm = await algorithmRepo.getBySlug(req.params.slug);
            if (!algorithm) return res.status(404).json({ error: 'Not found' });
            res.json(algorithm);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/ingest', authMiddleware, async (req, res) => {
        const { repoUrl } = req.body;
        const creatorId = req.user.id;
        if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

        const targetRepoKey = parseGitHubUrl(repoUrl);
        if (!targetRepoKey) {
            return res.status(400).json({ error: 'Invalid GitHub URL. Please provide a valid URL like: https://github.com/owner/repo' });
        }

        try {
            // Check if this repository has already been ingested
            const existingAlgos = await algorithmRepo.getAll();
            const isDuplicate = existingAlgos.some(algo => {
                const key = parseGitHubUrl(algo.repo_url);
                return key === targetRepoKey;
            });

            if (isDuplicate) {
                return res.status(400).json({ error: 'This algorithm repository has already been imported.' });
            }

            const { slug, fullPath, branch } = await ingestor.ingest(repoUrl);
            const repoName = repoUrl.split('/').pop() || slug;
            const manifest = ManifestValidator.validate(fullPath, repoName);

            const result = await algorithmRepo.create({
                name: manifest.name,
                slug,
                repo_url: repoUrl,
                entry_point: 'index.html',
                explanation_entry: 'explanation.html',
                creator_id: creatorId,
                branch
            });

            // Recalculate and update the creator's score dynamically
            const newScore = await syncUserScore(db, creatorId);

            res.status(201).json({ 
                message: 'Successfully ingested', 
                algorithmId: result.id, 
                slug,
                contribution_score: newScore
            });
        } catch (error) {
            console.error('Ingestion Error:', error);
            res.status(400).json({ error: error.message });
        }
    });

    // GET /api/algorithms/:slug/comments
    // Fetch comments for an algorithm
    router.get('/:slug/comments', async (req, res) => {
        try {
            const algorithm = await algorithmRepo.getBySlug(req.params.slug);
            if (!algorithm) return res.status(404).json({ error: 'Algorithm not found' });

            const comments = await db.all(`
                SELECT c.id, c.user_id as user_id, c.message, c.is_fix_offer, c.fix_details_url, c.created_at,
                       u.name as user_name, u.role as user_role, u.regnum as user_regnum
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.algorithm_id = ?
                ORDER BY c.created_at ASC
            `, [algorithm.id]);

            res.json(comments);
        } catch (error) {
            console.error('Fetch Comments Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // POST /api/algorithms/:slug/comments
    // Add a comment to an algorithm and award contribution points
    router.post('/:slug/comments', authMiddleware, async (req, res) => {
        const { message, is_fix_offer, fix_details_url } = req.body;
        const userId = req.user.id;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Comment message is required' });
        }

        try {
            const algorithm = await algorithmRepo.getBySlug(req.params.slug);
            if (!algorithm) return res.status(404).json({ error: 'Algorithm not found' });

            // Insert new comment
            const result = await db.run(`
                INSERT INTO comments (algorithm_id, user_id, message, is_fix_offer, fix_details_url)
                VALUES (?, ?, ?, ?, ?)
            `, [
                algorithm.id,
                userId,
                message,
                is_fix_offer ? 1 : 0,
                is_fix_offer ? fix_details_url : null
            ]);

            // Recalculate and update the author's score dynamically
            const newScore = await syncUserScore(db, userId);

            // Fetch the fully populated new comment to send back
            const newComment = await db.get(`
                SELECT c.id, c.user_id as user_id, c.message, c.is_fix_offer, c.fix_details_url, c.created_at,
                       u.name as user_name, u.role as user_role, u.regnum as user_regnum
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `, [result.id]);

            res.status(201).json({
                message: 'Comment posted successfully',
                comment: newComment,
                contribution_score: newScore
            });
        } catch (error) {
            console.error('Post Comment Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
