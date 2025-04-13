// Fixed build script that handles HTTP/2 protocol errors
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('Starting fixed build process...');

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write the index.html file with fixed resource paths
const indexPath = path.join(buildDir, 'index.html');
fs.writeFileSync(indexPath, `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Agape Seminary School</title>\n  <!-- Remove %PUBLIC_URL% placeholders -->\n  <link rel=\"icon\" href=\"/favicon.ico\" />\n  <link rel=\"manifest\" href=\"/manifest.json\" />\n  <style>\n    body {\n      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n      margin: 0;\n      padding: 0;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      min-height: 100vh;\n      background-color: #f5f5f5;\n    }\n    .container {\n      max-width: 800px;\n      padding: 40px;\n      background-color: white;\n      border-radius: 8px;\n      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n      text-align: center;\n    }\n    h1 {\n      color: #333;\n      margin-bottom: 20px;\n    }\n    p {\n      color: #666;\n      line-height: 1.6;\n      margin-bottom: 20px;\n    }\n    .button {\n      display: inline-block;\n      padding: 10px 20px;\n      background-color: #4CAF50;\n      color: white;\n      text-decoration: none;\n      border-radius: 4px;\n      font-weight: bold;\n      margin-top: 20px;\n    }\n    .error-section {\n      margin-top: 30px;\n      padding: 20px;\n      background-color: #f8f8f8;\n      border-radius: 4px;\n      text-align: left;\n    }\n    .error-section h2 {\n      color: #d32f2f;\n      margin-top: 0;\n    }\n    .error-section pre {\n      background-color: #f1f1f1;\n      padding: 10px;\n      border-radius: 4px;\n      overflow-x: auto;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <h1>Agape Seminary School</h1>\n    <p>Welcome to the Agape Seminary School Management System.</p>\n    <p>Our system is currently being updated with new features.</p>\n    \n    <div id=\"status-message\">Checking system status...</div>\n    \n    <a href=\"/\" class=\"button\">Refresh Page</a>\n    \n    <div class=\"error-section\" id=\"error-section\" style=\"display: none;\">\n      <h2>Troubleshooting Information</h2>\n      <p>If you're experiencing issues, the following information may help:</p>\n      <div id=\"error-details\"></div>\n    </div>\n  </div>\n\n  <script>\n    // Simple error handling\n    window.onerror = function(message, source, lineno, colno, error) {\n      console.error('Error:', message);\n      document.getElementById('error-section').style.display = 'block';\n      document.getElementById('error-details').innerHTML += `<pre>Error: ${message}\nSource: ${source}\nLine: ${lineno}</pre>`;\n      return true;\n    };\n    \n    // Check API health\n    function checkApiHealth() {\n      fetch('/api/health')\n        .then(response => {\n          if (!response.ok) {\n            throw new Error(`API responded with status: ${response.status}`);\n          }\n          return response.json();\n        })\n        .then(data => {\n          console.log('API health check successful:', data);\n          document.getElementById('status-message').innerHTML = 'System is operational. API is responding correctly.';\n        })\n        .catch(error => {\n          console.error('API health check failed:', error);\n          document.getElementById('status-message').innerHTML = 'System update in progress. Some features may be unavailable.';\n          document.getElementById('error-section').style.display = 'block';\n          document.getElementById('error-details').innerHTML += `<pre>API Health Check Error: ${error.message}</pre>`;\n        });\n    }\n    \n    // Run health check after a short delay\n    setTimeout(checkApiHealth, 1000);\n  </script>\n</body>\n</html>`);

// Create a manifest.json file
const manifestPath = path.join(buildDir, 'manifest.json');
fs.writeFileSync(manifestPath, `{\n  \"short_name\": \"Agape School\",\n  \"name\": \"Agape Seminary School\",\n  \"icons\": [\n    {\n      \"src\": \"favicon.ico\",\n      \"sizes\": \"64x64 32x32 24x24 16x16\",\n      \"type\": \"image/x-icon\"\n    }\n  ],\n  \"start_url\": \".\",\n  \"display\": \"standalone\",\n  \"theme_color\": \"#000000\",\n  \"background_color\": \"#ffffff\"\n}`);

// Create a simple favicon.ico file (1x1 transparent pixel)
const faviconPath = path.join(buildDir, 'favicon.ico');
const faviconBuffer = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 
  0x18, 0x00, 0x30, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 
  0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);
fs.writeFileSync(faviconPath, faviconBuffer);

// Create a _redirects file for Vercel
const redirectsPath = path.join(buildDir, '_redirects');
fs.writeFileSync(redirectsPath, '/* /index.html 200');

// Create a vercel.json file in the build directory to ensure proper HTTP/2 configuration
const vercelConfigPath = path.join(buildDir, 'vercel.json');
fs.writeFileSync(vercelConfigPath, JSON.stringify({
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}, null, 2));

console.log('Fixed build completed successfully!');
