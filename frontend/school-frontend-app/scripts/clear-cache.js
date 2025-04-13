// Clear cache script for Netlify builds
console.log('Clearing build cache...');

const fs = require('fs');
const path = require('path');

// Add a timestamp to force a clean build
const timestamp = new Date().toISOString();
const cacheBusterPath = path.join(__dirname, '..', 'public', 'cache-buster.txt');

fs.writeFileSync(cacheBusterPath, `Cache buster: ${timestamp}`);
console.log(`Cache buster file created with timestamp: ${timestamp}`);

// Log environment info
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());

console.log('Cache clearing complete!');
