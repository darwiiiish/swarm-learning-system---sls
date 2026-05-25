const express = require('express');
const { authMiddleware, adminMiddleware } = require('../services/authMiddleware');

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

    // GET /api/admin/users
    // List all users and their status
    router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const users = await db.all(`
                SELECT id, regnum, name, role,
                   (CASE 
                       WHEN users.role != 'student' THEN 0
                       ELSE ((SELECT COUNT(*) FROM algorithms WHERE creator_id = users.id) * 10 +
                             (SELECT COUNT(*) FROM comments c 
                              LEFT JOIN algorithms a ON c.algorithm_id = a.id 
                              WHERE c.user_id = users.id AND a.creator_id != users.id))
                    END) AS contribution_score
                FROM users ORDER BY id DESC
            `);
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE /api/admin/users/:id
    // Delete a user
    router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
        const userId = req.params.id;
        try {
            await db.run(`DELETE FROM users WHERE id = ?`, [userId]);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET /api/admin/algorithms
    // List all algorithms (for dashboard)
    router.get('/algorithms', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const algorithms = await db.all(`
                SELECT a.id, a.name, a.slug, a.repo_url, a.created_at, u.name as creator_name
                FROM algorithms a
                LEFT JOIN users u ON a.creator_id = u.id
                ORDER BY a.id DESC
            `);
            res.json(algorithms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE /api/admin/algorithms/:id
    // Delete an algorithm
    router.delete('/algorithms/:id', authMiddleware, adminMiddleware, async (req, res) => {
        const algId = req.params.id;
        try {
            // Get algorithm creator
            const algo = await db.get('SELECT creator_id FROM algorithms WHERE id = ?', [algId]);
            
            // Get all comment authors on this algorithm
            const comments = await db.all('SELECT DISTINCT user_id FROM comments WHERE algorithm_id = ?', [algId]);

            // Cascade delete comments on this algorithm
            await db.run('DELETE FROM comments WHERE algorithm_id = ?', [algId]);

            // Delete the algorithm itself
            await db.run(`DELETE FROM algorithms WHERE id = ?`, [algId]);

            // Recalculate score for creator
            if (algo) {
                await syncUserScore(db, algo.creator_id);
            }

            // Recalculate scores for comment authors
            for (const comment of comments) {
                await syncUserScore(db, comment.user_id);
            }

            res.json({ message: 'Algorithm and associated comments deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET /api/admin/comments
    // List all comments (for dashboard)
    router.get('/comments', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const comments = await db.all(`
                SELECT c.id, c.message, c.created_at, u.name as user_name, a.name as algorithm_name
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN algorithms a ON c.algorithm_id = a.id
                ORDER BY c.id DESC
            `);
            res.json(comments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE /api/admin/comments/:id
    // Delete a comment
    router.delete('/comments/:id', authMiddleware, adminMiddleware, async (req, res) => {
        const commentId = req.params.id;
        try {
            // Find comment author before deletion
            const comment = await db.get('SELECT user_id FROM comments WHERE id = ?', [commentId]);

            // Delete comment
            await db.run(`DELETE FROM comments WHERE id = ?`, [commentId]);

            // Recalculate and sync score
            if (comment) {
                await syncUserScore(db, comment.user_id);
            }

            res.json({ message: 'Comment deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
