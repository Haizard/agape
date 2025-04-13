# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Update netlify.toml
$netlifyTomlPath = "netlify.toml"
$netlifyTomlContent = Get-Content -Path $netlifyTomlPath -Raw
$updatedNetlifyTomlContent = $netlifyTomlContent -replace "\[build\]\s+base = `"frontend/school-frontend-app`"\s+publish = `"build`"\s+command = `"npm install --legacy-peer-deps && node scripts/modify-login-component.js && node scripts/simple-build.js`"", "[build]`n  base = `"frontend/school-frontend-app`"`n  publish = `"build`"`n  command = `"npm install --legacy-peer-deps && node scripts/install-function-deps.js && node scripts/modify-login-component.js && node scripts/simple-build.js`"`n`n[[plugins]]`npackage = `"@netlify/plugin-functions-install-core`""
Set-Content -Path $netlifyTomlPath -Value $updatedNetlifyTomlContent

# Create the install-function-deps.js script
$scriptContent = @'
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Path to the functions directory
const functionsDir = path.join(__dirname, "..", "netlify", "functions");

// Check if the functions directory exists
if (fs.existsSync(functionsDir)) {
  console.log("Installing dependencies for Netlify Functions...");
  
  // Check if package.json exists in the functions directory
  const packageJsonPath = path.join(functionsDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      // Change to the functions directory and install dependencies
      process.chdir(functionsDir);
      execSync("npm install", { stdio: "inherit" });
      console.log("Successfully installed dependencies for Netlify Functions");
      
      // Change back to the original directory
      process.chdir(path.join(__dirname, ".."));
    } catch (error) {
      console.error("Error installing dependencies for Netlify Functions:", error.message);
      process.exit(1);
    }
  } else {
    console.log("No package.json found in the functions directory");
  }
} else {
  console.log("No functions directory found");
}
'@

$scriptPath = "frontend/school-frontend-app/scripts/install-function-deps.js"
Set-Content -Path $scriptPath -Value $scriptContent

# Add the changes to git
git add $netlifyTomlPath $scriptPath

# Commit the changes
git commit -m "Fix Netlify build error by adding functions install plugin and script"

# Push the changes to GitHub
git push

Write-Host "Changes pushed to GitHub. Netlify should automatically redeploy with the new configuration."
