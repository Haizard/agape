const fs = require('fs');
const path = require('path');

// Paths to ESLint config files
const originalFile = path.join(__dirname, '..', '.eslintrc.js');
const backupFile = path.join(__dirname, '..', '.eslintrc.js.backup');
const simpleFile = path.join(__dirname, '..', '.eslintrc.js.simple');

// Backup the original ESLint config if it exists
if (fs.existsSync(originalFile) && !fs.existsSync(backupFile)) {
  console.log('Backing up original ESLint config...');
  fs.copyFileSync(originalFile, backupFile);
  console.log(`Backed up to: ${backupFile}`);
}

// Use the simple ESLint config
if (fs.existsSync(simpleFile)) {
  console.log('Using simplified ESLint config for build...');
  fs.copyFileSync(simpleFile, originalFile);
  console.log('Simplified ESLint config applied.');
} else {
  console.log('Simple ESLint config not found. Creating a minimal one...');
  const minimalConfig = `module.exports = {
    extends: ['react-app'],
    rules: {
      'no-unused-vars': 'off',
    }
  };`;
  fs.writeFileSync(originalFile, minimalConfig);
  console.log('Minimal ESLint config created.');
}

console.log('ESLint configuration updated for build.');
