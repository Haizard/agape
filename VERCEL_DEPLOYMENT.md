# Vercel Deployment Guide

This project is configured for deployment on Vercel with both frontend and backend components.

## Deployment Steps

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Set up environment variables:
   ```
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   ```

4. Deploy to Vercel:
   ```
   vercel
   ```

5. For production deployment:
   ```
   vercel --prod
   ```

## Project Structure

- `/frontend/school-frontend-app`: React frontend application
- `/api`: Serverless API functions for Vercel
- `/backend`: Original backend code (adapted for serverless)

## Environment Variables

The following environment variables need to be set in Vercel:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Set to "production"

## Local Development

To run the project locally with Vercel:

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Run the development server:
   ```
   vercel dev
   ```

This will start both the frontend and backend locally.

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the Vercel logs for specific error messages
2. Verify that all environment variables are set correctly
3. Make sure your MongoDB instance is accessible from Vercel
4. Check that the serverless functions are properly configured
