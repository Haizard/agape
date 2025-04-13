// React build script for Vercel
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting React build process for Vercel...');

// Set environment variables for the build
process.env.CI = 'false'; // Prevents treating warnings as errors
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.ESLINT_NO_DEV_ERRORS = 'true';
process.env.REACT_APP_API_URL = '/api';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=3072';

try {
  // Install dependencies with legacy peer deps flag
  console.log('Installing dependencies...');
  execSync('npm install --legacy-peer-deps', {
    stdio: 'inherit',
    env: process.env
  });
  
  // Create a simple .env file to ensure environment variables are available
  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, `
REACT_APP_API_URL=/api
DISABLE_ESLINT_PLUGIN=true
ESLINT_NO_DEV_ERRORS=true
GENERATE_SOURCEMAP=false
  `);
  
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
  
  console.log('_redirects file created successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  
  // Create a fallback build if the React build fails
  console.log('Creating fallback build...');
  
  const buildDir = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Create a simple index.html that redirects to the actual app
  const indexPath = path.join(buildDir, 'index.html');
  fs.writeFileSync(indexPath, `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agape Seminary School</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      text-align: center;
    }
    .container {
      max-width: 800px;
      padding: 40px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .spinner {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #333;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Agape Seminary School</h1>
    <p>Loading the application...</p>
    <p>If the application doesn't load automatically, please refresh the page.</p>
  </div>
  <script>
    // Redirect to the actual app after a short delay
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  </script>
</body>
</html>
  `);
  
  // Create a _redirects file for better routing
  const redirectsPath = path.join(buildDir, '_redirects');
  fs.writeFileSync(redirectsPath, '/* /index.html 200');
  
  console.log('Fallback build created successfully!');
  process.exit(1);
}
