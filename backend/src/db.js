const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const SUPER_ADMINS = [
    { name: 'Khaled Badran', regnum: 'khaled_admin', pass: 'khaledbadran11111' },
    { name: 'Salma Mohamed', regnum: 'salma_admin', pass: 'salmamohamed11110' },
    { name: 'Abdelrahman Mamdouh', regnum: 'mamdouh_admin', pass: '11100' },
    { name: 'Ahmed Elagamy', regnum: 'ahmed_admin', pass: 'ahmedelagamy11000' },
    { name: 'Aly Lotfy', regnum: 'aly_admin', pass: 'alylotfy10000' }
];

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
                                this.seedSuperadmins();
                            }
                        });
                    } else {
                        this.seedSuperadmins();
                    }
                } else {
                    this.seedSuperadmins();
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

    seedSuperadmins() {
        for (const admin of SUPER_ADMINS) {
            this.db.get(`SELECT id FROM users WHERE regnum = ? OR name = ?`, [admin.regnum, admin.name], (err, row) => {
                if (err) {
                    console.error('Error checking admin presence:', err.message);
                    return;
                }
                if (row) {
                    return; // Admin already exists
                }
                bcrypt.genSalt(10, (saltErr, salt) => {
                    if (saltErr) return;
                    bcrypt.hash(admin.pass, salt, (hashErr, hash) => {
                        if (hashErr) return;
                        this.db.run(
                            `INSERT INTO users (regnum, name, password_hash, role, contribution_score) VALUES (?, ?, ?, ?, ?)`,
                            [admin.regnum, admin.name, hash, 'superadmin', 0],
                            (insertErr) => {
                                if (insertErr) {
                                    console.error(`Error inserting superadmin ${admin.name}:`, insertErr.message);
                                } else {
                                    console.log(`Successfully seeded superadmin ${admin.name}.`);
                                }
                            }
                        );
                    });
                });
            });
        }
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
