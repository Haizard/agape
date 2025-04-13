// Super simple build script
const fs = require('fs');
const path = require('path');

console.log('Starting super simple build process...');

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write the index.html file directly
const indexPath = path.join(buildDir, 'index.html');
fs.writeFileSync(indexPath, `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Agape Seminary School</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      margin: 0;\n      padding: 0;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      min-height: 100vh;\n      background-color: #f5f5f5;\n    }\n    .container {\n      max-width: 800px;\n      padding: 40px;\n      background-color: white;\n      border-radius: 8px;\n      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n      text-align: center;\n    }\n    h1 {\n      color: #333;\n      margin-bottom: 20px;\n    }\n    p {\n      color: #666;\n      line-height: 1.6;\n      margin-bottom: 20px;\n    }\n    .button {\n      display: inline-block;\n      padding: 10px 20px;\n      background-color: #4CAF50;\n      color: white;\n      text-decoration: none;\n      border-radius: 4px;\n      font-weight: bold;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <h1>Agape Seminary School</h1>\n    <p>Welcome to the Agape Seminary School Management System.</p>\n    <p>Our system is currently being updated with new features.</p>\n    <p>Please check back soon for the full experience.</p>\n    <a href=\"/\" class=\"button\">Refresh Page</a>\n  </div>\n</body>\n</html>`);

// Create a _redirects file for Vercel
const redirectsPath = path.join(buildDir, '_redirects');
fs.writeFileSync(redirectsPath, '/* /index.html 200');

console.log('Super simple build completed successfully!');
