# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Add the changes to git
git add frontend/school-frontend-app/public/index.html
git add frontend/school-frontend-app/.node-version
git add frontend/school-frontend-app/render.yaml

# Commit the changes
git commit -m "Fix missing index.html and update Node.js version"

# Push the changes to GitHub
git push

Write-Host "Fixed missing index.html and updated Node.js version."
Write-Host "These changes should resolve the build failure on Render."
