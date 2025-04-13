# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the changes to git
git add frontend/school-frontend-app/render.yaml
git add frontend/school-frontend-app/package.json
git add frontend/school-frontend-app/server.js
git add frontend/school-frontend-app/.env
git add frontend/school-frontend-app/.env.production

# Commit the changes
git commit -m "Remove sample site and configure for real React app deployment on Render"

# Push the changes to GitHub
git push

Write-Host "Changes for real React app deployment on Render pushed to GitHub."
Write-Host "To deploy your actual React app on Render:"
Write-Host "1. Go to Render Dashboard"
Write-Host "2. Create a new Web Service (or Blueprint)"
Write-Host "3. Connect your GitHub repository"
Write-Host "4. Render will automatically use the configuration in render.yaml"
