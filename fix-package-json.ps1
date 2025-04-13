# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Update package.json to use the simple build script
$packageJsonPath = "package.json"
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json

# Ensure scripts property exists
if (-not $packageJson.PSObject.Properties["scripts"]) {
    $packageJson | Add-Member -Name "scripts" -Value @{} -MemberType NoteProperty
}

# Update the build script
$packageJson.scripts | Add-Member -Name "build" -Value "cd frontend/school-frontend-app && node scripts/simple-build.js" -MemberType NoteProperty -Force

# Convert back to JSON and save
$packageJsonContent = $packageJson | ConvertTo-Json -Depth 10
Set-Content -Path $packageJsonPath -Value $packageJsonContent

# Add to git
git add "package.json"

# Commit the changes
git commit -m "Fix package.json build script"

# Push the changes to GitHub
git push

Write-Host "Package.json fixed and pushed to GitHub."
