const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor(dbFilePath) {
        // Ensure directory exists
        const dir = path.dirname(dbFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) {
                console.error('Error connecting to SQLite database:', err.message);
            } else {
                console.log('Connected to SQLite database.');
                this.initSchema();
            }
        });
    }

    initSchema() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                regnum TEXT UNIQUE,
                email TEXT UNIQUE,
                password_hash TEXT,
                name TEXT,
                role TEXT,
                contribution_score INTEGER DEFAULT 0
            )`);

            // Auto-migration: check if regnum column exists, if not add it dynamically
            this.db.all("PRAGMA table_info(users)", (err, columns) => {
                if (!err && columns && columns.length > 0) {
                    const hasRegnum = columns.some(col => col.name === 'regnum');
                    if (!hasRegnum) {
                        this.db.run("ALTER TABLE users ADD COLUMN regnum TEXT UNIQUE", (alterErr) => {
                            if (alterErr) {
                                console.error('Error adding regnum column to users table:', alterErr.message);
                            } else {
                                console.log('Successfully added regnum column to users table (auto-migration).');
                            }
                        });
                    }
                }
            });

            this.db.run(`CREATE TABLE IF NOT EXISTS algorithms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                slug TEXT UNIQUE,
                repo_url TEXT,
                entry_point TEXT,
                explanation_entry TEXT,
                creator_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id)
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                algorithm_id INTEGER,
                user_id INTEGER,
                message TEXT,
                is_fix_offer BOOLEAN,
                fix_details_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (algorithm_id) REFERENCES algorithms(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS contributor_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                algorithm_id INTEGER,
                applicant_id INTEGER,
                applicant_email TEXT,
                applicant_message TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (algorithm_id) REFERENCES algorithms(id),
                FOREIGN KEY (applicant_id) REFERENCES users(id)
            )`);
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = Database;
