# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the install-function-deps.js file
git add frontend/school-frontend-app/scripts/install-function-deps.js

# Commit the changes
git commit -m "Add Netlify function dependencies installation script"

# Push the changes to GitHub
git push

Write-Host "Changes pushed to GitHub. Netlify should automatically redeploy with the new configuration."
