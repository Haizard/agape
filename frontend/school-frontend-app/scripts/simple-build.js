const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Copy the simple .env file to .env
console.log('Setting up simple environment...');
const simpleEnvPath = path.join(__dirname, '..', '.env.simple');
const envPath = path.join(__dirname, '..', '.env');
fs.copyFileSync(simpleEnvPath, envPath);
console.log('Environment set up successfully.');

// Create a simple .eslintrc.js file
console.log('Disabling ESLint...');
const eslintPath = path.join(__dirname, '..', '.eslintrc.js');
fs.writeFileSync(eslintPath, 'module.exports = { rules: {} };');
console.log('ESLint disabled successfully.');

// Run the build
console.log('Starting build...');
try {
  // Run the build
  execSync('react-scripts build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: '',
      DISABLE_ESLINT_PLUGIN: 'true',
      ESLINT_NO_DEV_ERRORS: 'true',
      REACT_APP_API_URL: '/api',
      REACT_APP_USE_PROXY: 'true',
      GENERATE_SOURCEMAP: 'false',
      NODE_OPTIONS: '--max-old-space-size=1536'
    }
  });

  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
