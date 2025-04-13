# Add the changes to git
git add netlify.toml frontend/school-frontend-app/netlify/functions/api.js

# Commit the changes
git commit -m "Fix Netlify login by updating API proxy configuration"

# Push the changes to GitHub
git push

Write-Host "Changes pushed to GitHub. Netlify should automatically redeploy with the new configuration."
Write-Host "After the deployment is complete, try logging in again."
