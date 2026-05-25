const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const crypto = require('crypto');

class GitHubIngestor {
    constructor(baseDir) {
        this.baseDir = baseDir;
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    /**
     * Downloads and extracts the given GitHub repository.
     * @param {string} repoUrl - e.g., https://github.com/username/repo
     * @returns {Promise<string>} The path to the extracted simulation.
     */
    async ingest(repoUrl) {
        // Parse the URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub URL');
        }
        const [, owner, repo] = match;
        const mainZipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
        const masterZipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`;

        // Generate a unique slug
        const slug = `${owner}-${repo}-${crypto.randomBytes(4).toString('hex')}`;
        const targetDir = path.join(this.baseDir, slug);
        const zipPath = path.join(this.baseDir, `${slug}.zip`);

        try {
            // Download the zip
            let response;
            try {
                response = await axios({ url: mainZipUrl, method: 'GET', responseType: 'stream' });
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    response = await axios({ url: masterZipUrl, method: 'GET', responseType: 'stream' });
                } else {
                    throw err;
                }
            }

            const writer = fs.createWriteStream(zipPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Extract the zip
            await extract(zipPath, { dir: this.baseDir });

            // GitHub puts everything in a subfolder like repo-main, rename it to the slug
            const extractedFolderName = `${repo}-main`;
            const extractedPath = path.join(this.baseDir, extractedFolderName);
            
            if (fs.existsSync(extractedPath)) {
                fs.renameSync(extractedPath, targetDir);
            } else {
                // If it was master branch instead of main
                const masterFolderName = `${repo}-master`;
                const masterPath = path.join(this.baseDir, masterFolderName);
                if (fs.existsSync(masterPath)) {
                    fs.renameSync(masterPath, targetDir);
                } else {
                    throw new Error('Failed to find extracted directory structure.');
                }
            }

            // Cleanup zip
            fs.unlinkSync(zipPath);

            return { slug, fullPath: targetDir };
        } catch (error) {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            throw new Error(`Ingestion failed: ${error.message}`);
        }
    }
}

module.exports = GitHubIngestor;
