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
5. Add the environment variables:
   - Click on "Environment Variables" section
   - Add each variable (MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET) with their values
   - Make sure to add them as plain text values, not as references to secrets
6. Click "Deploy"

## Setting Up Environment Variables

There are two ways to set up environment variables in Vercel:

### Method 1: Using the Vercel Dashboard (Easiest)

1. Go to your project in the Vercel dashboard
2. Click on "Settings" → "Environment Variables"
3. Add each variable with its value
4. Click "Save"

### Method 2: Using Vercel CLI (More Secure)

For production deployments, you might want to use Vercel Secrets:

1. Install Vercel CLI: `npm install -g vercel`
2. Log in: `vercel login`
3. Add secrets:
   ```
   vercel secrets add jwt_secret "your-jwt-secret-value"
   vercel secrets add jwt_refresh_secret "your-jwt-refresh-secret-value"
   vercel secrets add mongodb_uri "your-mongodb-connection-string"
   ```
4. Update your vercel.json to use these secrets:
   ```json
   "env": {
     "JWT_SECRET": "@jwt_secret",
     "JWT_REFRESH_SECRET": "@jwt_refresh_secret",
     "MONGODB_URI": "@mongodb_uri"
   }
   ```

## Troubleshooting Common Deployment Issues

### Environment Variable Issues

If you see errors related to environment variables:
- Make sure all required environment variables are set in the Vercel dashboard
- Check that the variable names match exactly what your code expects
- For secrets, ensure they are created before referencing them with the @ symbol

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
