const fs = require('fs');
const path = require('path');

class ManifestValidator {
    static validate(dirPath, fallbackName) {
        const manifestPath = path.join(dirPath, 'manifest.json');
        const indexPath = path.join(dirPath, 'index.html');
        const explanationPath = path.join(dirPath, 'explanation.html');

        if (!fs.existsSync(indexPath)) {
            throw new Error('Missing index.html');
        }
        if (!fs.existsSync(explanationPath)) {
            throw new Error('Missing explanation.html');
        }

        if (fs.existsSync(manifestPath)) {
            const rawManifest = fs.readFileSync(manifestPath, 'utf8');
            try {
                const manifest = JSON.parse(rawManifest);
                return { ...manifest, name: manifest.name || fallbackName };
            } catch (e) {
                return { name: fallbackName };
            }
        }
        return { name: fallbackName };
    }
}

module.exports = ManifestValidator;
