# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Update vercel.json to use the custom build
$vercelJsonContent = @'
{
  "version": 2,
  "buildCommand": null,
  "outputDirectory": "frontend/school-frontend-app/build",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ]
}
'@

Set-Content -Path "vercel.json" -Value $vercelJsonContent

# Add the changes to git
git add "vercel.json"

# Commit the changes
git commit -m "Update vercel.json for direct deployment"

# Push the changes to GitHub
git push

Write-Host "vercel.json updated for direct deployment and pushed to GitHub."
Write-Host "Vercel should now deploy the custom build without running any build commands."
