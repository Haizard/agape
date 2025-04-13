# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# 1. Create a root package.json file
$rootPackageJsonContent = @'
{
  "name": "agape-school-system",
  "version": "1.0.0",
  "description": "Agape Seminary School Management System",
  "private": true,
  "scripts": {
    "install:all": "npm install && cd frontend/school-frontend-app && npm install --legacy-peer-deps && cd ../../api && npm install",
    "build": "cd frontend/school-frontend-app && npm run build:vercel",
    "start": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "serverless-http": "^3.2.0"
  },
  "engines": {
    "node": "16.x"
  }
}
'@

Set-Content -Path "package.json" -Value $rootPackageJsonContent

# 2. Update vercel.json to use the root package.json
$vercelConfigContent = @'
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/school-frontend-app/build",
  "installCommand": "npm run install:all",
  "framework": "create-react-app",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "JWT_SECRET": "@jwt_secret",
    "JWT_REFRESH_SECRET": "@jwt_refresh_secret",
    "MONGODB_URI": "@mongodb_uri"
  }
}
'@

Set-Content -Path "vercel.json" -Value $vercelConfigContent

# 3. Create a .env.example file to show required environment variables
$envExampleContent = @'
# Required environment variables for Vercel deployment

# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT secrets
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Environment
NODE_ENV=production
'@

Set-Content -Path ".env.example" -Value $envExampleContent

# 4. Update the deployment guide with more specific instructions
$readmeContent = @'
# Vercel Deployment Guide for Agape Project

This project is configured for deployment on Vercel with both frontend and backend components.

## Important: Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

1. `MONGODB_URI`: Your MongoDB connection string
2. `JWT_SECRET`: Secret key for JWT token generation
3. `JWT_REFRESH_SECRET`: Secret key for JWT refresh token generation

## Automatic Deployment from GitHub

The easiest way to deploy this project is directly from GitHub:

1. Go to [vercel.com](https://vercel.com) and sign up or log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository (agape)
4. Configure the project settings:
   - Framework Preset: Create React App (should be auto-detected)
   - Root Directory: Leave empty (to use the project root)
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `frontend/school-frontend-app/build` (should be auto-detected)
5. Add the environment variables mentioned above
6. Click "Deploy"

## Troubleshooting Common Deployment Issues

### Package.json Not Found Error

If you see an error like "Could not read package.json", make sure:
- The root package.json file exists in your repository
- The file has valid JSON syntax
- The file includes the necessary scripts and dependencies

### MongoDB Connection Issues

If your API fails to connect to MongoDB:
- Verify that your MONGODB_URI environment variable is correctly set
- Ensure your MongoDB instance allows connections from Vercel's IP addresses
- Check that your database user has the correct permissions

### JWT Secret Issues

If authentication fails:
- Make sure both JWT_SECRET and JWT_REFRESH_SECRET are set in Vercel
- These should match the values you were using in your local development

## Testing Your Deployment

After deployment, test the following:

1. Frontend loading: Visit your Vercel deployment URL
2. API health check: Visit `https://your-vercel-url.vercel.app/api/health`
3. Authentication: Try logging in with your credentials

## Automatic Updates

Once deployed, any changes pushed to your GitHub repository will automatically trigger a new deployment on Vercel.

## Local Development with Vercel

To run the project locally with Vercel:

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Link your project:
   ```
   vercel link
   ```

3. Pull environment variables:
   ```
   vercel env pull
   ```

4. Run the development server:
   ```
   npm start
   ```
'@

Set-Content -Path "VERCEL_DEPLOYMENT_GUIDE.md" -Value $readmeContent

# 5. Add the changes to git
git add package.json vercel.json .env.example VERCEL_DEPLOYMENT_GUIDE.md

# 6. Commit the changes
git commit -m "Fix Vercel deployment by adding root package.json and updating configuration"

# 7. Push the changes to GitHub
git push

Write-Host "Vercel configuration fixed and pushed to GitHub."
Write-Host "Follow the updated instructions in VERCEL_DEPLOYMENT_GUIDE.md to deploy to Vercel."
Write-Host "Make sure to set the JWT_REFRESH_SECRET environment variable in Vercel."
