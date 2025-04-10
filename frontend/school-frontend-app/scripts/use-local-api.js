/**
 * Script to switch the frontend to use the local API
 * 
 * This script restores the original .env.development file
 * allowing the frontend to connect to the local backend API.
 */

const fs = require('fs');
const path = require('path');

// Paths to environment files
const backupFile = path.join(__dirname, '..', '.env.development.local');
const targetFile = path.join(__dirname, '..', '.env.development');
const defaultContent = `REACT_APP_USE_MOCK_DATA=false
REACT_APP_API_URL=http://localhost:5000/api`;

// Check if backup file exists
if (fs.existsSync(backupFile)) {
  console.log('Restoring development environment from backup...');
  fs.copyFileSync(backupFile, targetFile);
  console.log(`Restored from backup: ${backupFile}`);
} else {
  console.log('No backup found. Creating default development environment...');
  fs.writeFileSync(targetFile, defaultContent);
  console.log('Created default development environment.');
}

console.log('Successfully switched to local API!');
console.log(`Frontend will now use API at: ${fs.readFileSync(targetFile, 'utf8').match(/REACT_APP_API_URL=(.*)/)[1]}`);
console.log('\nTo switch back to production API, run: node scripts/use-production-api.js');
