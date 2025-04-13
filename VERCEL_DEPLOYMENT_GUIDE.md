# Vercel Deployment Guide for Agape Project

This project is configured for deployment on Vercel with both frontend and backend components.

## Automatic Deployment from GitHub

The easiest way to deploy this project is directly from GitHub:

1. Go to [vercel.com](https://vercel.com) and sign up or log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository (agape)
4. Configure the project settings:
   - Framework Preset: Create React App
   - Root Directory: Leave empty (to use the project root)
   - Build Command: Leave as is (will use the one from vercel.json)
   - Output Directory: Leave as is (will use the one from vercel.json)
5. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secret key for JWT token generation
6. Click "Deploy"

## Manual Deployment with Vercel CLI

If you prefer to deploy manually:

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Deploy from your project directory:
   ```
   cd /path/to/agape
   vercel
   ```

4. Follow the prompts to configure your project
5. For production deployment:
   ```
   vercel --prod
   ```

## Environment Variables

The following environment variables need to be set in Vercel:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Set to "production" for production deployments

## Project Structure

- `/frontend/school-frontend-app`: React frontend application
- `/api`: Serverless API functions for Vercel
- `/backend`: Original backend code (adapted for serverless)

## Testing Your Deployment

After deployment, test the following:

1. Frontend loading: Visit your Vercel deployment URL
2. API health check: Visit `https://your-vercel-url.vercel.app/api/health`
3. Authentication: Try logging in with your credentials

## Automatic Updates

Once deployed, any changes pushed to your GitHub repository will automatically trigger a new deployment on Vercel.

## Troubleshooting

If you encounter any issues:

1. Check the Vercel deployment logs in the Vercel dashboard
2. Verify that your environment variables are set correctly
3. Make sure your MongoDB instance is accessible from Vercel
4. Check that the serverless functions are properly configured

## Local Development

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
   vercel dev
   ```
