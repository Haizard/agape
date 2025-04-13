# Vercel Unified Deployment Guide

This project is configured for unified deployment on Vercel, with both frontend and backend components hosted on the same platform.

## Deployment Steps

1. **Sign up for Vercel**:
   - Go to [vercel.com](https://vercel.com) and create an account

2. **Install Vercel CLI** (optional for local development):
   ```
   npm install -g vercel
   ```

3. **Deploy to Vercel**:
   - Via GitHub: Connect your GitHub repository in the Vercel dashboard
   - Via CLI: Run `vercel` in the project directory

4. **Set Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT token generation
   - `JWT_REFRESH_SECRET`: Secret key for JWT refresh token generation

## Project Structure

- `/frontend/school-frontend-app`: React frontend application
- `/api`: Serverless API functions for Vercel
- `/backend`: Original backend code (reference only)

## API Endpoints

- `/api/health`: Health check endpoint
- `/api/auth`: Authentication endpoint
- `/api`: Root API information

## Local Development

1. **Install dependencies**:
   ```
   npm install
   cd frontend/school-frontend-app
   npm install --legacy-peer-deps
   ```

2. **Run development server**:
   ```
   vercel dev
   ```

## Troubleshooting

- **API Connection Issues**: Verify environment variables are set correctly
- **Build Failures**: Check Vercel build logs for specific errors
- **Database Connection**: Ensure MongoDB URI is correct and accessible

## Automatic Updates

Once deployed, any changes pushed to your GitHub repository will automatically trigger a new deployment on Vercel.
