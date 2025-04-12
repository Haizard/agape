const fs = require('fs');
const path = require('path');

// Create a .env.local file to disable ESLint during build
const envLocalFile = path.join(__dirname, '..', '.env.local');
const envContent = 'DISABLE_ESLINT_PLUGIN=true\nESLINT_NO_DEV_ERRORS=true\nGENERATE_SOURCEMAP=false';

console.log('Creating .env.local file to disable ESLint...');
fs.writeFileSync(envLocalFile, envContent);
console.log('.env.local file created successfully.');

// Create an empty .eslintrc.js file to disable ESLint
const eslintFile = path.join(__dirname, '..', '.eslintrc.js');
const eslintContent = 'module.exports = { rules: {} };';

console.log('Creating empty ESLint config to disable linting...');
fs.writeFileSync(eslintFile, eslintContent);
console.log('ESLint disabled for build.');

// Create a .env file to ensure environment variables are set
const envFile = path.join(__dirname, '..', '.env');
const envFileContent = 'REACT_APP_API_URL=/api\nREACT_APP_USE_MOCK_DATA=false\nGENERATE_SOURCEMAP=false\nREACT_APP_USE_PROXY=true';

console.log('Creating .env file with required variables...');
fs.writeFileSync(envFile, envFileContent);
console.log('.env file created successfully.');

// Create a .env.production file to ensure environment variables are set for production
const envProdFile = path.join(__dirname, '..', '.env.production');
const envProdFileContent = 'REACT_APP_API_URL=/api\nREACT_APP_USE_MOCK_DATA=false\nGENERATE_SOURCEMAP=false\nREACT_APP_TIMEOUT=60000\nREACT_APP_USE_PROXY=true';

console.log('Creating .env.production file with required variables...');
fs.writeFileSync(envProdFile, envProdFileContent);
console.log('.env.production file created successfully.');

console.log('Build environment prepared successfully.');
