# Netlify Deployment Guide

This guide provides instructions for deploying the frontend application to Netlify with a proxy function to handle CORS issues.

## Deployment Steps

1. Push the latest changes to your GitHub repository:
   ```
   git add .
   git commit -m "Add Netlify Functions for API proxy"
   git push
   ```

2. Log in to Netlify and create a new site:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect to your GitHub repository
   - Configure the build settings:
     - Base directory: `frontend/school-frontend-app`
     - Build command: `npm run build`
     - Publish directory: `build`
   - Click "Deploy site"

3. After deployment, check the Functions tab in your Netlify dashboard to ensure the API proxy function is deployed correctly.

## How It Works

The deployment includes a Netlify Function that acts as a proxy between your frontend and backend:

1. The frontend makes requests to `/api/*` endpoints
2. Netlify redirects these requests to the `/.netlify/functions/api` function
3. The function forwards the requests to the actual backend API at `https://agape-seminary-school.onrender.com/api`
4. The function returns the response from the backend API with appropriate CORS headers

This approach avoids CORS issues because the frontend and the function are on the same domain.

## Troubleshooting

If you encounter any issues:

1. Check the Function logs in the Netlify dashboard
2. Verify that the API proxy function is deployed correctly
3. Make sure the redirects are configured properly in the netlify.toml file
4. Check the browser console for any errors
