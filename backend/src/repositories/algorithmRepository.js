/**
 * IRepository Interface
 * Simulates a generic repository interface following Liskov Substitution Principle (LSP).
 */
class IRepository {
    async getById(id) { throw new Error('Method not implemented.'); }
    async getAll() { throw new Error('Method not implemented.'); }
    async create(entity) { throw new Error('Method not implemented.'); }
    async update(id, entity) { throw new Error('Method not implemented.'); }
    async delete(id) { throw new Error('Method not implemented.'); }
}

/**
 * AlgorithmRepository
 * Concrete implementation for algorithms adhering to Single Responsibility (SRP).
 */
class AlgorithmRepository extends IRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async getById(id) {
        return this.db.get(`SELECT * FROM algorithms WHERE id = ?`, [id]);
    }

    async getBySlug(slug) {
        return this.db.get(`SELECT * FROM algorithms WHERE slug = ?`, [slug]);
    }

    async getAll() {
        return this.db.all(`
            SELECT a.*, u.name as creator_name
            FROM algorithms a
            LEFT JOIN users u ON a.creator_id = u.id
            ORDER BY a.created_at DESC
        `);
    }

    async create(algorithm) {
        const { name, slug, repo_url, entry_point, explanation_entry, creator_id, branch = 'main' } = algorithm;
        return this.db.run(
            `INSERT INTO algorithms (name, slug, repo_url, entry_point, explanation_entry, creator_id, branch)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, slug, repo_url, entry_point, explanation_entry, creator_id, branch]
        );
    }
}

module.exports = { IRepository, AlgorithmRepository };
