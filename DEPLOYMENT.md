# Deployment Guide for Agape Seminary School System

This guide provides instructions for deploying the Agape Seminary School System to Render.

## Prerequisites

- A Render account
- Access to the GitHub repository
- MongoDB Atlas account (for the database)

## Deployment Steps

### 1. Database Setup

1. Create a MongoDB Atlas cluster if you don't already have one
2. Create a database named `agape_seminary`
3. Create a database user with read/write permissions
4. Get the connection string from MongoDB Atlas

### 2. Deploy Using Render Blueprint

The easiest way to deploy is using the Render Blueprint:

1. Fork the repository to your GitHub account
2. Log in to your Render account
3. Click on "New" and select "Blueprint"
4. Connect your GitHub account and select the forked repository
5. Render will automatically detect the `render.yaml` file
6. Review the services and click "Apply"
7. Render will create all the necessary services

### 3. Manual Deployment

If you prefer to deploy manually:

#### Backend API

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub account and select the repository
4. Configure the following settings:
   - **Name**: `agape-seminary-school`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node scripts/ensureJwtSecret.js && npm start`
   - **Health Check Path**: `/api/health`
5. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Generate a secure random string
   - `JWT_REFRESH_SECRET`: Generate a secure random string
   - `USE_MOCK_DATA`: `false`
   - `CORS_ALLOWED_ORIGINS`: `https://agape-seminary-school-system.onrender.com`
6. Click "Create Web Service"

#### Frontend

1. Click on "New" and select "Web Service"
2. Connect your GitHub account and select the repository
3. Configure the following settings:
   - **Name**: `agape-seminary-school-system`
   - **Root Directory**: `frontend/school-frontend-app`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `REACT_APP_API_URL`: `https://agape-seminary-school.onrender.com/api`
   - `REACT_APP_USE_MOCK_DATA`: `false`
5. Click "Create Web Service"

## Post-Deployment Steps

After deployment, perform the following checks:

1. Verify the backend health check endpoint is working:
   ```
   curl https://agape-seminary-school.onrender.com/api/health
   ```

2. Run the authentication test script:
   ```
   node backend/scripts/testAuth.js <username> <password>
   ```

3. Check the frontend is loading correctly:
   ```
   curl https://agape-seminary-school-system.onrender.com/health
   ```

4. Log in to the application through the browser

## Troubleshooting

### Authentication Issues

If you're experiencing authentication issues:

1. Check the JWT secret is properly set in the environment variables
2. Verify the token is being correctly stored in localStorage
3. Check the Authorization header is being sent with requests
4. Run the authentication test script to diagnose issues

### API Connection Issues

If the frontend can't connect to the API:

1. Verify the `REACT_APP_API_URL` is correctly set
2. Check CORS is properly configured
3. Verify the backend service is running
4. Check the network tab in browser developer tools for errors

### Database Connection Issues

If the backend can't connect to the database:

1. Verify the `MONGODB_URI` is correctly set
2. Check MongoDB Atlas network access settings
3. Verify the database user has the correct permissions

## Updating the Deployment

To update the deployment:

1. Push changes to the GitHub repository
2. Render will automatically rebuild and deploy the services

For manual updates:

1. Log in to Render
2. Navigate to the service you want to update
3. Click "Manual Deploy" and select "Deploy latest commit"
