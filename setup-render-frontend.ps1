# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the changes to git
git add frontend/school-frontend-app/render.yaml
git add frontend/school-frontend-app/scripts/render-build.js
git add frontend/school-frontend-app/package.json

# Commit the changes
git commit -m "Set up frontend for Render deployment with proper build script"

# Push the changes to GitHub
git push

Write-Host "Changes for Render frontend deployment pushed to GitHub."
Write-Host "Now you can deploy your frontend on Render by connecting your GitHub repository."
Write-Host "Render will automatically use the configuration in render.yaml."
