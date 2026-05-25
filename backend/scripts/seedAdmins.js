const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to db:', err);
        process.exit(1);
    }
});

const admins = [
    { name: 'Khaled Badran', regnum: 'khaled_admin', pass: 'khaledbadran11111' },
    { name: 'Salma Mohamed', regnum: 'salma_admin', pass: 'salmamohamed11110' },
    { name: 'Abdelrahman Mamdouh', regnum: 'mamdouh_admin', pass: '11100' },
    { name: 'Ahmed Elagamy', regnum: 'ahmed_admin', pass: 'ahmedelagamy11000' },
    { name: 'Aly Lotfy', regnum: 'aly_admin', pass: 'alylotfy10000' }
];

async function seed() {
    console.log('Seeding superadmins...');
    for (const admin of admins) {
        try {
            // Check if exists
            const exists = await new Promise((resolve, reject) => {
                db.get(`SELECT id FROM users WHERE regnum = ? OR name = ?`, [admin.regnum, admin.name], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (exists) {
                console.log(`Admin ${admin.name} already exists. Skipping.`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(admin.pass, salt);

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO users (regnum, name, password_hash, role, contribution_score) VALUES (?, ?, ?, ?, ?)`,
                    [admin.regnum, admin.name, hash, 'superadmin', 0],
                    function (err) {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
            console.log(`Successfully added ${admin.name} as superadmin.`);
        } catch (error) {
            console.error(`Error adding ${admin.name}:`, error);
        }
    }
    
    db.close();
    console.log('Seeding complete.');
}

seed();
