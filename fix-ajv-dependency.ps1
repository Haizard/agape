# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# 1. Update the frontend package.json to add the missing dependency
$frontendPackageJsonPath = "frontend/school-frontend-app/package.json"
$frontendPackageJson = Get-Content -Path $frontendPackageJsonPath -Raw | ConvertFrom-Json

# Add ajv as a direct dependency if it doesn't exist
if (-not $frontendPackageJson.dependencies.PSObject.Properties["ajv"]) {
    $frontendPackageJson.dependencies | Add-Member -Name "ajv" -Value "^8.12.0" -MemberType NoteProperty
}

# Convert back to JSON and save
$frontendPackageJsonContent = $frontendPackageJson | ConvertTo-Json -Depth 10
Set-Content -Path $frontendPackageJsonPath -Value $frontendPackageJsonContent

# 2. Create a pre-build script to ensure ajv is properly installed
$preBuildScriptContent = @'
// Pre-build script to ensure dependencies are properly installed
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running pre-build dependency check...');

try {
  // Check if ajv is installed
  try {
    require.resolve('ajv/dist/compile/codegen');
    console.log('ajv/dist/compile/codegen is already installed');
  } catch (error) {
    console.log('Installing ajv explicitly...');
    execSync('npm install ajv@8.12.0 --no-save', { stdio: 'inherit' });
    
    // Try to resolve again to verify installation
    try {
      require.resolve('ajv/dist/compile/codegen');
      console.log('ajv/dist/compile/codegen is now installed');
    } catch (secondError) {
      console.error('Failed to install ajv properly:', secondError.message);
      // Try a different approach
      console.log('Trying alternative installation approach...');
      execSync('npm install ajv@8.12.0 ajv-keywords@5.1.0 --legacy-peer-deps --no-save', { stdio: 'inherit' });
    }
  }
  
  console.log('Pre-build dependency check completed');
} catch (error) {
  console.error('Error during pre-build dependency check:', error.message);
  // Continue with the build even if this fails
}
'@

Set-Content -Path "frontend/school-frontend-app/scripts/pre-build.js" -Value $preBuildScriptContent

# 3. Update the vercel build script to run the pre-build script
$vercelBuildScriptPath = "frontend/school-frontend-app/scripts/vercel-build.js"
$vercelBuildScriptContent = Get-Content -Path $vercelBuildScriptPath -Raw

# Add the pre-build script execution if it doesn't exist
if (-not $vercelBuildScriptContent.Contains("require('./pre-build')")) {
    $updatedVercelBuildScriptContent = $vercelBuildScriptContent -replace "console.log\(`"Starting Vercel build process for frontend\.\.\.\`"\);", "console.log(`"Starting Vercel build process for frontend...`");`n`n// Run pre-build dependency check`ntry {`n  require('./pre-build');`n} catch (error) {`n  console.error('Error running pre-build script:', error.message);`n  // Continue with the build even if this fails`n}"
    
    Set-Content -Path $vercelBuildScriptPath -Value $updatedVercelBuildScriptContent
}

# 4. Update the build command in package.json to install ajv explicitly
$rootPackageJsonPath = "package.json"
$rootPackageJson = Get-Content -Path $rootPackageJsonPath -Raw | ConvertFrom-Json

# Update the build script to install ajv explicitly
$rootPackageJson.scripts.build = "npm install ajv@8.12.0 ajv-keywords@5.1.0 --no-save && cd frontend/school-frontend-app && npm run build:vercel"

# Convert back to JSON and save
$rootPackageJsonContent = $rootPackageJson | ConvertTo-Json -Depth 10
Set-Content -Path $rootPackageJsonPath -Value $rootPackageJsonContent

# 5. Add the changes to git
git add frontend/school-frontend-app/package.json frontend/school-frontend-app/scripts/pre-build.js frontend/school-frontend-app/scripts/vercel-build.js package.json

# 6. Commit the changes
git commit -m "Fix ajv dependency issue for Vercel deployment"

# 7. Push the changes to GitHub
git push

Write-Host "Dependency fixes pushed to GitHub."
Write-Host "Vercel should now be able to build the project successfully."
