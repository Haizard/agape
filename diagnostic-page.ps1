# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# 1. Create a diagnostic HTML file with console logging and error reporting
$diagnosticHtmlContent = @'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agape Seminary School - Diagnostic Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .section h2 {
      margin-top: 0;
      color: #444;
    }
    .log {
      background-color: #333;
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
    .success {
      color: #4CAF50;
    }
    .error {
      color: #f44336;
    }
    .warning {
      color: #ff9800;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-right: 10px;
    }
    .button.secondary {
      background-color: #2196F3;
    }
    #errorOutput, #consoleOutput, #networkOutput, #envOutput {
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Agape Seminary School - Diagnostic Page</h1>
    <p>This page will help diagnose deployment issues on Vercel.</p>
    
    <div class="section">
      <h2>Browser Information</h2>
      <div id="browserInfo"></div>
    </div>
    
    <div class="section">
      <h2>Error Catching</h2>
      <p>Any JavaScript errors will be displayed below:</p>
      <div id="errorOutput" class="log"></div>
    </div>
    
    <div class="section">
      <h2>Console Output</h2>
      <p>Console messages will be displayed below:</p>
      <div id="consoleOutput" class="log"></div>
    </div>
    
    <div class="section">
      <h2>Network Requests</h2>
      <p>Testing API connectivity:</p>
      <div id="networkOutput" class="log"></div>
      <button class="button" onclick="testApiEndpoint('/api/health')">Test Health API</button>
      <button class="button secondary" onclick="testApiEndpoint('/api')">Test Root API</button>
    </div>
    
    <div class="section">
      <h2>Environment</h2>
      <p>Environment information:</p>
      <div id="envOutput" class="log"></div>
    </div>
    
    <div class="section">
      <h2>DOM Structure</h2>
      <p>Testing DOM rendering:</p>
      <div id="domTest">
        <p>If you can see this text, basic DOM rendering is working.</p>
        <div style="width: 50px; height: 50px; background-color: #4CAF50;"></div>
      </div>
    </div>
    
    <div class="section">
      <h2>Actions</h2>
      <a href="/" class="button">Refresh Page</a>
      <a href="/?clearcache=true" class="button secondary">Clear Cache & Refresh</a>
    </div>
  </div>

  <script>
    // Capture and display errors
    window.onerror = function(message, source, lineno, colno, error) {
      const errorOutput = document.getElementById('errorOutput');
      errorOutput.innerHTML += `<div class="error">ERROR: ${message}</div>`;
      return false;
    };
    
    // Capture and display console messages
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    
    console.log = function() {
      originalConsole.log.apply(console, arguments);
      const consoleOutput = document.getElementById('consoleOutput');
      consoleOutput.innerHTML += `<div>${Array.from(arguments).join(' ')}</div>`;
    };
    
    console.warn = function() {
      originalConsole.warn.apply(console, arguments);
      const consoleOutput = document.getElementById('consoleOutput');
      consoleOutput.innerHTML += `<div class="warning">WARN: ${Array.from(arguments).join(' ')}</div>`;
    };
    
    console.error = function() {
      originalConsole.error.apply(console, arguments);
      const consoleOutput = document.getElementById('consoleOutput');
      consoleOutput.innerHTML += `<div class="error">ERROR: ${Array.from(arguments).join(' ')}</div>`;
    };
    
    console.info = function() {
      originalConsole.info.apply(console, arguments);
      const consoleOutput = document.getElementById('consoleOutput');
      consoleOutput.innerHTML += `<div>INFO: ${Array.from(arguments).join(' ')}</div>`;
    };
    
    // Test API endpoint
    function testApiEndpoint(endpoint) {
      const networkOutput = document.getElementById('networkOutput');
      networkOutput.innerHTML += `<div>Testing endpoint: ${endpoint}...</div>`;
      
      fetch(endpoint)
        .then(response => {
          networkOutput.innerHTML += `<div>Status: ${response.status} ${response.statusText}</div>`;
          return response.json();
        })
        .then(data => {
          networkOutput.innerHTML += `<div class="success">Response: ${JSON.stringify(data)}</div>`;
        })
        .catch(error => {
          networkOutput.innerHTML += `<div class="error">Error: ${error.message}</div>`;
        });
    }
    
    // Display browser information
    function displayBrowserInfo() {
      const browserInfo = document.getElementById('browserInfo');
      browserInfo.innerHTML = `
        <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
        <p><strong>Platform:</strong> ${navigator.platform}</p>
        <p><strong>Cookies Enabled:</strong> ${navigator.cookieEnabled}</p>
        <p><strong>Language:</strong> ${navigator.language}</p>
        <p><strong>Online:</strong> ${navigator.onLine}</p>
        <p><strong>Window Size:</strong> ${window.innerWidth}x${window.innerHeight}</p>
      `;
    }
    
    // Display environment information
    function displayEnvironmentInfo() {
      const envOutput = document.getElementById('envOutput');
      envOutput.innerHTML += `<div><strong>URL:</strong> ${window.location.href}</div>`;
      envOutput.innerHTML += `<div><strong>Protocol:</strong> ${window.location.protocol}</div>`;
      envOutput.innerHTML += `<div><strong>Host:</strong> ${window.location.host}</div>`;
      envOutput.innerHTML += `<div><strong>Pathname:</strong> ${window.location.pathname}</div>`;
      envOutput.innerHTML += `<div><strong>Search:</strong> ${window.location.search}</div>`;
      envOutput.innerHTML += `<div><strong>Hash:</strong> ${window.location.hash}</div>`;
      
      // Check for localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        envOutput.innerHTML += `<div class="success"><strong>localStorage:</strong> Available</div>`;
      } catch (e) {
        envOutput.innerHTML += `<div class="error"><strong>localStorage:</strong> Not available - ${e.message}</div>`;
      }
      
      // Check for sessionStorage
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        envOutput.innerHTML += `<div class="success"><strong>sessionStorage:</strong> Available</div>`;
      } catch (e) {
        envOutput.innerHTML += `<div class="error"><strong>sessionStorage:</strong> Not available - ${e.message}</div>`;
      }
    }
    
    // Initialize
    window.onload = function() {
      console.log('Diagnostic page loaded');
      displayBrowserInfo();
      displayEnvironmentInfo();
      
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('clearcache')) {
        console.log('Clearing cache...');
        // Clear localStorage
        try {
          localStorage.clear();
          console.log('localStorage cleared');
        } catch (e) {
          console.error('Failed to clear localStorage:', e);
        }
        
        // Clear sessionStorage
        try {
          sessionStorage.clear();
          console.log('sessionStorage cleared');
        } catch (e) {
          console.error('Failed to clear sessionStorage:', e);
        }
      }
      
      // Test API endpoints automatically
      setTimeout(() => {
        testApiEndpoint('/api/health');
      }, 1000);
    };
    
    // Log any unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled promise rejection:', event.reason);
    });
    
    // Log any resource loading errors
    window.addEventListener('error', function(event) {
      if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
        console.error(`Failed to load resource: ${event.target.src || event.target.href}`);
      }
    }, true);
    
    console.log('Diagnostic script initialized');
  </script>
</body>
</html>
'@

# 2. Create a diagnostic build script
$diagnosticBuildScriptContent = @'
// Diagnostic build script
const fs = require('fs');
const path = require('path');

console.log('Starting diagnostic build process...');

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write the diagnostic index.html file
const indexPath = path.join(buildDir, 'index.html');
fs.writeFileSync(indexPath, `DIAGNOSTIC_HTML_CONTENT_PLACEHOLDER`);

// Create a _redirects file for Vercel
const redirectsPath = path.join(buildDir, '_redirects');
fs.writeFileSync(redirectsPath, '/* /index.html 200');

// Create a simple 404 page
const notFoundPath = path.join(buildDir, '404.html');
fs.writeFileSync(notFoundPath, `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to home page...</p>
  <script>window.location.href = '/';</script>
</body>
</html>
`);

console.log('Diagnostic build completed successfully!');
'@

# Replace the placeholder with the actual HTML content
$diagnosticBuildScriptContent = $diagnosticBuildScriptContent -replace "DIAGNOSTIC_HTML_CONTENT_PLACEHOLDER", $diagnosticHtmlContent.Replace("`"", "\`"").Replace("`n", "\n")

Set-Content -Path "frontend/school-frontend-app/scripts/diagnostic-build.js" -Value $diagnosticBuildScriptContent

# 3. Update the root package.json to use the diagnostic build script
$rootPackageJsonPath = "package.json"
$rootPackageJson = Get-Content -Path $rootPackageJsonPath -Raw | ConvertFrom-Json

# Update the build script to use the diagnostic build script
$rootPackageJson.scripts.build = "cd frontend/school-frontend-app && node scripts/diagnostic-build.js"

# Convert back to JSON and save
$rootPackageJsonContent = $rootPackageJson | ConvertTo-Json -Depth 10
Set-Content -Path $rootPackageJsonPath -Value $rootPackageJsonContent

# 4. Create a more detailed API endpoint for diagnostics
$diagnosticApiContent = @'
// Diagnostic API endpoint
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Return detailed diagnostic information
  return res.status(200).json({
    status: 'ok',
    message: 'Diagnostic API is running',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime() + ' seconds'
    },
    request: {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query
    },
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.VERCEL_ENV || 'unknown',
      url: process.env.VERCEL_URL || 'unknown'
    },
    envVars: {
      jwtSecretSet: process.env.JWT_SECRET ? 'yes' : 'no',
      jwtRefreshSecretSet: process.env.JWT_REFRESH_SECRET ? 'yes' : 'no',
      mongodbUriSet: process.env.MONGODB_URI ? 'yes' : 'no'
    }
  });
};
'@

Set-Content -Path "api/diagnostic.js" -Value $diagnosticApiContent

# 5. Add the changes to git
git add frontend/school-frontend-app/scripts/diagnostic-build.js package.json api/diagnostic.js

# 6. Commit the changes
git commit -m "Add diagnostic tools to investigate blank page issue"

# 7. Push the changes to GitHub
git push

Write-Host "Diagnostic tools pushed to GitHub."
Write-Host "Vercel should now deploy a diagnostic page that will help identify the issue."
Write-Host "Check the diagnostic page and the console output for clues about the blank page problem."
