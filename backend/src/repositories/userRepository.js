const { IRepository } = require('./algorithmRepository');

/**
 * UserRepository
 * Concrete implementation for users adhering to Single Responsibility (SRP) and LSP.
 */
class UserRepository extends IRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async getById(id) {
        return this.db.get(`
            SELECT *,
               (CASE 
                   WHEN users.role != 'student' THEN 0
                   ELSE ((SELECT COUNT(*) FROM algorithms WHERE creator_id = users.id) * 10 +
                         (SELECT COUNT(*) FROM comments c 
                          LEFT JOIN algorithms a ON c.algorithm_id = a.id 
                          WHERE c.user_id = users.id AND a.creator_id != users.id))
                END) AS contribution_score
            FROM users WHERE id = ?
        `, [id]);
    }

    async getByRegnum(regnum) {
        return this.db.get(`
            SELECT *,
               (CASE 
                   WHEN users.role != 'student' THEN 0
                   ELSE ((SELECT COUNT(*) FROM algorithms WHERE creator_id = users.id) * 10 +
                         (SELECT COUNT(*) FROM comments c 
                          LEFT JOIN algorithms a ON c.algorithm_id = a.id 
                          WHERE c.user_id = users.id AND a.creator_id != users.id))
                END) AS contribution_score
            FROM users WHERE regnum = ?
        `, [regnum]);
    }

    async getAll() {
        return this.db.all(`
            SELECT id, regnum, name, role,
               (CASE 
                   WHEN users.role != 'student' THEN 0
                   ELSE ((SELECT COUNT(*) FROM algorithms WHERE creator_id = users.id) * 10 +
                         (SELECT COUNT(*) FROM comments c 
                          LEFT JOIN algorithms a ON c.algorithm_id = a.id 
                          WHERE c.user_id = users.id AND a.creator_id != users.id))
                END) AS contribution_score
            FROM users
            ORDER BY contribution_score DESC
        `);
    }

    async create(user) {
        const { regnum, name, password_hash, role = 'student', contribution_score = 0 } = user;
        return this.db.run(
            `INSERT INTO users (regnum, name, password_hash, role, contribution_score)
             VALUES (?, ?, ?, ?, ?)`,
            [regnum, name, password_hash, role, contribution_score]
        );
    }

    async updateScore(id, score) {
        return this.db.run(
            `UPDATE users SET contribution_score = ? WHERE id = ?`,
            [score, id]
        );
    }
}

module.exports = { UserRepository };
