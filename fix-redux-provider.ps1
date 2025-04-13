# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the changes to git
git add frontend/school-frontend-app/src/index.js

# Commit the changes
git commit -m "Fix Redux Provider import to use correct store"

# Push the changes to GitHub
git push

Write-Host "Fixed Redux Provider import to use correct store."
Write-Host "This should resolve the white screen issue and the 'Cannot destructure property store of i as it is null' error."
