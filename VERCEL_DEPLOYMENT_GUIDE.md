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
