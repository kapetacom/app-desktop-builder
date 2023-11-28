const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

const execSync = require('child_process').execSync;
const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

packageJson.build = packageJson.build || {};
packageJson.build.buildVersion = commitHash;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4), 'utf8');
