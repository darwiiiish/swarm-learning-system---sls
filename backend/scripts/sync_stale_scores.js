const path = require('path');
const Database = require('../src/db');

const db = new Database(path.join(__dirname, '../data/database.db'));

async function syncAllScores() {
    console.log('Starting score synchronization...');
    try {
        // Fetch all users
        const users = await db.all('SELECT id, name, regnum, contribution_score FROM users');
        console.log(`Found ${users.length} users in database.`);

        for (const user of users) {
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
            `, [user.id, user.id, user.id, user.id]);

            const dynamicScore = scoreRow ? scoreRow.contribution_score : 0;

            if (user.contribution_score !== dynamicScore) {
                console.log(`Syncing user ${user.name} (${user.regnum}): ${user.contribution_score} -> ${dynamicScore}`);
                await db.run('UPDATE users SET contribution_score = ? WHERE id = ?', [dynamicScore, user.id]);
            } else {
                console.log(`User ${user.name} (${user.regnum}) is already in sync (${dynamicScore} stars).`);
            }
        }
        console.log('Score synchronization completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during synchronization:', error);
        process.exit(1);
    }
}

// Wait for database initialization
setTimeout(syncAllScores, 1000);
