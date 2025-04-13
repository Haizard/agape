# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Create a vercel.json file for the frontend
$vercelJsonContent = @'
{
  "version": 2,
  "buildCommand": "cd frontend/school-frontend-app && npm install && npm run build",
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
      "source": "/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
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

Set-Content -Path "frontend/school-frontend-app/vercel.json" -Value $vercelJsonContent

# Create a .env file for the frontend
$envContent = @'
REACT_APP_API_URL=https://misty-roby-haizard-17a53e2a.koyeb.app
'@

Set-Content -Path "frontend/school-frontend-app/.env" -Value $envContent

# Add the changes to git
git add frontend/school-frontend-app/vercel.json frontend/school-frontend-app/.env

# Commit the changes
git commit -m "Add Vercel configuration for frontend deployment"

# Push the changes to GitHub
git push

Write-Host "Vercel configuration added and pushed to GitHub."
Write-Host "Now you can deploy the frontend to Vercel by connecting your GitHub repository."
