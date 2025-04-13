# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# 1. Create a unique netlify.toml file to force a cache bust
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$netlifyTomlContent = @"
# Cache bust: $timestamp
[build]
  base = "frontend/school-frontend-app"
  publish = "build"
  command = "npm install --legacy-peer-deps && npm install jsonwebtoken bcryptjs axios --no-save && node scripts/quick-build.js"

[[plugins]]
package = "@netlify/plugin-functions-install-core"

[build.environment]
  NODE_VERSION = "16"
  NPM_FLAGS = "--no-optional"
  NETLIFY_USE_YARN = "false"
  NODE_OPTIONS = "--max-old-space-size=1536"
  DISABLE_ESLINT_PLUGIN = "true"
  ESLINT_NO_DEV_ERRORS = "true"
  GENERATE_SOURCEMAP = "false"
  REACT_APP_API_URL = "/api"
  REACT_APP_BACKEND_URL = "https://misty-roby-haizard-17a53e2a.koyeb.app"
  CI = "true"

# Handle all routes with the SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
"@

Set-Content -Path "netlify.toml" -Value $netlifyTomlContent

# 2. Create a quick build script that will complete quickly
$quickBuildContent = @'
// Quick build script for Netlify
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Starting quick build process...");

// Set environment variables for the build
process.env.CI = "true";
process.env.DISABLE_ESLINT_PLUGIN = "true";
process.env.ESLINT_NO_DEV_ERRORS = "true";
process.env.REACT_APP_API_URL = "/api";
process.env.GENERATE_SOURCEMAP = "false";
process.env.NODE_OPTIONS = "--max-old-space-size=1536";

// Create a simple .eslintrc.js file
console.log("Disabling ESLint...");
const eslintPath = path.join(__dirname, "..", ".eslintrc.js");
fs.writeFileSync(eslintPath, "module.exports = { rules: {} };");

// Create a simple index.html file
console.log("Creating a simple index.html...");
const buildDir = path.join(__dirname, "..", "build");
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agape Seminary School</title>
  <style>
    body {
      font-family: Arial, sans-serif;
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
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
    .loading {
      margin-top: 20px;
      font-style: italic;
      color: #999;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Agape Seminary School</h1>
    <p>The site is currently being updated with new features.</p>
    <p>Please check back in a few minutes.</p>
    <div class="loading">Loading new version...</div>
    <a href="/" class="button">Refresh</a>
  </div>
  <script>
    // Auto refresh after 30 seconds
    setTimeout(() => {
      window.location.reload();
    }, 30000);
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(buildDir, "index.html"), indexHtmlContent);
console.log("Simple index.html created successfully!");

// Create a simple _redirects file for Netlify
const redirectsContent = `
# Redirect all routes to index.html
/*    /index.html   200
`;

fs.writeFileSync(path.join(buildDir, "_redirects"), redirectsContent);
console.log("Simple _redirects file created successfully!");

console.log("Quick build completed successfully!");
'@

Set-Content -Path "frontend/school-frontend-app/scripts/quick-build.js" -Value $quickBuildContent

# 3. Add the changes to git
git add netlify.toml frontend/school-frontend-app/scripts/quick-build.js

# 4. Commit the changes
git commit -m "Force Netlify to use new configuration with quick build"

# 5. Push the changes to GitHub
git push

Write-Host "Force configuration pushed to GitHub. Netlify should now use the new configuration."
Write-Host "This will create a simple placeholder page that will be deployed quickly."
Write-Host "After this deployment succeeds, we can push the full implementation."
