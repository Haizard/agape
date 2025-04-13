# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the changes to git
git add frontend/school-frontend-app/scripts/render-direct-build.js
git add frontend/school-frontend-app/server-direct.js
git add frontend/school-frontend-app/package.json
git add frontend/school-frontend-app/render-direct.yaml
git add frontend/school-frontend-app/scripts/check-build.js

# Commit the changes
git commit -m "Add direct deployment configuration for actual React app on Render"

# Push the changes to GitHub
git push

Write-Host "Direct deployment configuration for actual React app pushed to GitHub."
Write-Host "To deploy your actual React app on Render:"
Write-Host "1. Go to Render Dashboard"
Write-Host "2. Create a new Web Service"
Write-Host "3. Connect your GitHub repository"
Write-Host "4. Use the following settings:"
Write-Host "   - Build Command: cd frontend/school-frontend-app && npm install && npm run build:render-direct"
Write-Host "   - Start Command: cd frontend/school-frontend-app && npm run start:direct"
Write-Host "   - Environment Variables:"
Write-Host "     - NODE_ENV: production"
Write-Host "     - REACT_APP_API_URL: https://misty-roby-haizard-17a53e2a.koyeb.app"
Write-Host "     - DISABLE_ESLINT_PLUGIN: true"
Write-Host "     - CI: false"
