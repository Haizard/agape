// Patched React build script for Vercel
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting patched React build process for Vercel...');

// Set environment variables for the build
process.env.CI = 'false'; // Prevents treating warnings as errors
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.ESLINT_NO_DEV_ERRORS = 'true';
process.env.REACT_APP_API_URL = '/api';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=3072';

// Create a simple .env file to ensure environment variables are available
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, `
REACT_APP_API_URL=/api
DISABLE_ESLINT_PLUGIN=true
ESLINT_NO_DEV_ERRORS=true
GENERATE_SOURCEMAP=false
`);

// Check if we need to patch the Router component
const appJsPath = path.join(__dirname, '..', 'src', 'App.js');
if (fs.existsSync(appJsPath)) {
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  
  // Only patch if not already patched
  if (!appJsContent.includes('RouterErrorBoundary')) {
    console.log('Patching App.js to fix Router issues...');
    
    // Simple pattern matching to find Router component
    let patchedContent = appJsContent;
    
    // Add import for RouterErrorBoundary
    if (patchedContent.includes('import {') && patchedContent.includes('react-router-dom')) {
      patchedContent = patchedContent.replace(
        /import {([^}]*)} from ['"]react-router-dom['"]/,
        "import {$1} from 'react-router-dom';\nimport { RouterErrorBoundary } from './utils/RouterPatch'"
      );
    } else if (patchedContent.includes("from 'react-router-dom'")) {
      patchedContent = patchedContent.replace(
        /import ([^;]*) from ['"]react-router-dom['"]/,
        "import $1 from 'react-router-dom';\nimport { RouterErrorBoundary } from './utils/RouterPatch'"
      );
    } else {
      // Add import at the top if no existing router import found
      patchedContent = "import { RouterErrorBoundary } from './utils/RouterPatch';\n" + patchedContent;
    }
    
    // Wrap Router component with RouterErrorBoundary
    if (patchedContent.includes('<BrowserRouter') || patchedContent.includes('<Router')) {
      patchedContent = patchedContent.replace(
        /(<(?:BrowserRouter|Router)[^>]*>)/g,
        '<RouterErrorBoundary>$1'
      );
      
      patchedContent = patchedContent.replace(
        /(<\/(?:BrowserRouter|Router)>)/g,
        '$1</RouterErrorBoundary>'
      );
    }
    
    fs.writeFileSync(appJsPath, patchedContent);
    console.log('App.js patched successfully');
  }
}

try {
  // Install dependencies with legacy peer deps flag
  console.log('Installing dependencies...');
  execSync('npm install --legacy-peer-deps', {
    stdio: 'inherit',
    env: process.env
  });
  
  // Run the build with CI=false to prevent treating warnings as errors
  console.log('Running build command...');
  execSync('CI=false npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false'
    }
  });
  
  console.log('React build completed successfully!');
  
  // Create a _redirects file for better routing
  console.log('Creating _redirects file...');
  const redirectsPath = path.join(__dirname, '..', 'build', '_redirects');
  fs.writeFileSync(redirectsPath, '/* /index.html 200');
  
  // Create a custom 404.html that redirects to index.html
  console.log('Creating 404.html...');
  const notFoundPath = path.join(__dirname, '..', 'build', '404.html');
  fs.writeFileSync(notFoundPath, `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      // Redirect to the main app with the current path
      window.location.href = '/' + window.location.pathname.split('/').slice(1).join('/');
    </script>
  </head>
  <body>
    <p>Redirecting to the main application...</p>
  </body>
</html>
  `);
  
  console.log('Build process completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
