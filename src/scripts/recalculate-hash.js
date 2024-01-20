/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const YAML = require('yaml');

// Found here: https://github.com/electron-userland/electron-builder/issues/3913#issuecomment-504698845
function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        hash.on('error', reject).setEncoding(encoding);
        fs.createReadStream(
            file,
            Object.assign({}, options, {
                highWaterMark: 1024 * 1024,
                /* better to use more memory but hash faster */
            })
        )
            .on('error', reject)
            .on('end', () => {
                hash.end();
                const result = hash.read();
                resolve(result);
            })
            .pipe(hash, {
                end: false,
            });
    });
}

(async function () {
    if (!process.argv[2]) {
        console.error('Missing argument - file path');
        process.exit(1);
    }

    const latestYMLPath = path.resolve(process.cwd(), process.argv[2]);
    const folder = path.dirname(latestYMLPath);

    if (!fs.existsSync(latestYMLPath)) {
        console.error('File did not exist: ', latestYMLPath);
        process.exit(1);
    }

    console.log('Recalculating hash for ', latestYMLPath);
    const latest = YAML.parse(fs.readFileSync(latestYMLPath).toString());

    const mainFile = path.join(folder, latest.path);

    latest.sha512 = await hashFile(mainFile);

    for (file of latest.files) {
        const fullPath = path.join(folder, file.url);

        file.sha512 = await hashFile(fullPath);
        file.size = fs.statSync(fullPath).size;
    }

    fs.writeFileSync(latestYMLPath, YAML.stringify(latest));

    console.log('Hash recalculated');
})();
