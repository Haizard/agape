# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the changes to git
git add frontend/school-frontend-app/src/App.js

# Commit the changes
git commit -m "Fix duplicate Routes import in App.js"

# Push the changes to GitHub
git push

Write-Host "Fixed App.js and pushed to GitHub."
Write-Host "This should resolve the 'Identifier Routes has already been declared' error."
