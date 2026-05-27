const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let sqlite3;
let createClient;

if (process.env.TURSO_DATABASE_URL) {
    createClient = require('@libsql/client').createClient;
} else {
    sqlite3 = require('sqlite3').verbose();
}

const SUPER_ADMINS = [
    { name: 'Khaled Badran', regnum: 'khaled_admin', pass: 'khaledbadran11111' },
    { name: 'Salma Mohamed', regnum: 'salma_admin', pass: 'salmamohamed11110' },
    { name: 'Abdelrahman Mamdouh', regnum: 'mamdouh_admin', pass: '11100' },
    { name: 'Ahmed Elagamy', regnum: 'ahmed_admin', pass: 'ahmedelagamy11000' },
    { name: 'Aly Lotfy', regnum: 'aly_admin', pass: 'alylotfy10000' }
];

class Database {
    constructor(dbFilePath) {
        this.isTurso = !!process.env.TURSO_DATABASE_URL;

        if (this.isTurso) {
            console.log('Connecting to Turso Cloud Database...');
            this.db = createClient({
                url: process.env.TURSO_DATABASE_URL,
                authToken: process.env.TURSO_AUTH_TOKEN
            });
            // Promise tracking database initialization
            this.initPromise = this.initSchema();
        } else {
            // Ensure directory exists for local SQLite
            const dir = path.dirname(dbFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            this.initPromise = new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(dbFilePath, (err) => {
                    if (err) {
                        console.error('Error connecting to SQLite database:', err.message);
                        reject(err);
                    } else {
                        console.log('Connected to SQLite database.');
                        this.initSchema().then(resolve).catch(reject);
                    }
                });
            });
        }
    }

    async initSchema() {
        if (this.isTurso) {
            try {
                await this.db.execute(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    regnum TEXT UNIQUE,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    name TEXT,
                    role TEXT,
                    contribution_score INTEGER DEFAULT 0
                )`);

                // Auto-migration: check if regnum column exists, if not add it dynamically
                const columnsResult = await this.db.execute("PRAGMA table_info(users)");
                const columns = columnsResult.rows || [];
                const hasRegnum = columns.some(col => col.name === 'regnum');
                if (!hasRegnum) {
                    try {
                        await this.db.execute("ALTER TABLE users ADD COLUMN regnum TEXT UNIQUE");
                        console.log('Successfully added regnum column to users table (auto-migration).');
                    } catch (alterErr) {
                        console.error('Error adding regnum column to users table:', alterErr.message);
                    }
                }

                await this.db.execute(`CREATE TABLE IF NOT EXISTS algorithms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    slug TEXT UNIQUE,
                    repo_url TEXT,
                    entry_point TEXT,
                    explanation_entry TEXT,
                    creator_id INTEGER,
                    branch TEXT DEFAULT 'main',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (creator_id) REFERENCES users(id)
                )`);

                // Auto-migration: check if branch column exists, if not add it dynamically
                const algoColumnsResult = await this.db.execute("PRAGMA table_info(algorithms)");
                const algoColumns = algoColumnsResult.rows || [];
                const hasBranch = algoColumns.some(col => col.name === 'branch');
                if (!hasBranch) {
                    try {
                        await this.db.execute("ALTER TABLE algorithms ADD COLUMN branch TEXT DEFAULT 'main'");
                        console.log('Successfully added branch column to algorithms table (auto-migration).');
                    } catch (alterErr) {
                        console.error('Error adding branch column to algorithms table:', alterErr.message);
                    }
                }

                await this.db.execute(`CREATE TABLE IF NOT EXISTS comments (
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

                await this.db.execute(`CREATE TABLE IF NOT EXISTS contributor_applications (
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

                await this.seedSuperadmins();
            } catch (err) {
                console.error('Error initializing schema on Turso:', err);
                throw err;
            }
        } else {
            return new Promise((resolve, reject) => {
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

                    const checkAlgorithmsMigration = () => {
                        this.db.all("PRAGMA table_info(algorithms)", (err, columns) => {
                            if (!err && columns && columns.length > 0) {
                                const hasBranch = columns.some(col => col.name === 'branch');
                                if (!hasBranch) {
                                    this.db.run("ALTER TABLE algorithms ADD COLUMN branch TEXT DEFAULT 'main'", (alterErr) => {
                                        if (alterErr) {
                                            console.error('Error adding branch column to algorithms table:', alterErr.message);
                                        } else {
                                            console.log('Successfully added branch column to algorithms table (auto-migration).');
                                        }
                                        this.seedSuperadmins().then(resolve).catch(reject);
                                    });
                                } else {
                                    this.seedSuperadmins().then(resolve).catch(reject);
                                }
                            } else {
                                this.seedSuperadmins().then(resolve).catch(reject);
                            }
                        });
                    };

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
                                    checkAlgorithmsMigration();
                                });
                            } else {
                                checkAlgorithmsMigration();
                            }
                        } else {
                            checkAlgorithmsMigration();
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
                        branch TEXT DEFAULT 'main',
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
            });
        }
    }

    async seedSuperadmins() {
        for (const admin of SUPER_ADMINS) {
            try {
                // Use internal execute directly to avoid deadlock waiting on initPromise
                const row = await this._getInternal(`SELECT id FROM users WHERE regnum = ? OR name = ?`, [admin.regnum, admin.name]);
                if (row) {
                    continue; // Admin already exists
                }
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(admin.pass, salt);
                await this._runInternal(
                    `INSERT INTO users (regnum, name, password_hash, role, contribution_score) VALUES (?, ?, ?, ?, ?)`,
                    [admin.regnum, admin.name, hash, 'superadmin', 0]
                );
                console.log(`Successfully seeded superadmin ${admin.name}.`);
            } catch (err) {
                console.error(`Error seeding superadmin ${admin.name}:`, err.message || err);
            }
        }
    }

    // Helper functions for internal use during seeding to bypass initPromise check
    _runInternal(sql, params = []) {
        if (this.isTurso) {
            return this.db.execute({ sql, args: params }).then(result => {
                const changes = result.rowsAffected;
                let id = null;
                if (result.lastInsertRowid !== undefined) {
                    id = typeof result.lastInsertRowid === 'bigint' ? Number(result.lastInsertRowid) : result.lastInsertRowid;
                }
                return { id, changes };
            });
        } else {
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, changes: this.changes });
                });
            });
        }
    }

    _getInternal(sql, params = []) {
        if (this.isTurso) {
            return this.db.execute({ sql, args: params }).then(result => {
                return result.rows[0] || null;
            });
        } else {
            return new Promise((resolve, reject) => {
                this.db.get(sql, params, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }
    }

    // Public functions wrapped to wait for schema initialization first
    async run(sql, params = []) {
        if (this.initPromise) await this.initPromise;
        return this._runInternal(sql, params);
    }

    async get(sql, params = []) {
        if (this.initPromise) await this.initPromise;
        return this._getInternal(sql, params);
    }

    async all(sql, params = []) {
        if (this.initPromise) await this.initPromise;
        if (this.isTurso) {
            return this.db.execute({ sql, args: params }).then(result => {
                return result.rows;
            });
        } else {
            return new Promise((resolve, reject) => {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }
}

module.exports = Database;
