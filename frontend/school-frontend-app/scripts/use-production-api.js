/**
 * Script to switch the frontend to use the production API
 * 
 * This script copies the .env.development.production file to .env.development
 * allowing the frontend to connect to the production backend API.
 */

const fs = require('fs');
const path = require('path');

// Paths to environment files
const sourceFile = path.join(__dirname, '..', '.env.development.production');
const targetFile = path.join(__dirname, '..', '.env.development');
const backupFile = path.join(__dirname, '..', '.env.development.local');

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file not found: ${sourceFile}`);
  process.exit(1);
}

// Backup current development environment if it exists
if (fs.existsSync(targetFile)) {
  console.log('Backing up current development environment...');
  fs.copyFileSync(targetFile, backupFile);
  console.log(`Backup created at: ${backupFile}`);
}

// Copy production environment to development
console.log('Switching to production API...');
fs.copyFileSync(sourceFile, targetFile);

console.log('Successfully switched to production API!');
console.log(`Frontend will now use API at: ${fs.readFileSync(sourceFile, 'utf8').match(/REACT_APP_API_URL=(.*)/)[1]}`);
console.log('\nTo switch back to local API, run: node scripts/use-local-api.js');
