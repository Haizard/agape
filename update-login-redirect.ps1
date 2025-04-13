# Add the changes to git
git add netlify.toml

# Commit the changes
git commit -m "Update login redirect to use API proxy"

# Push the changes to GitHub
git push

Write-Host "Changes pushed to GitHub. Netlify should automatically redeploy with the new configuration."
Write-Host "After the deployment is complete, try logging in again."
