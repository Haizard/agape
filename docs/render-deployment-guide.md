# Render Deployment Guide

This guide provides detailed instructions for deploying the St. John Vianney School Management System on Render.

## Prerequisites

- A GitHub account with access to the project repository
- A Render account (sign up at [render.com](https://render.com))
- Basic knowledge of Node.js and MongoDB

## Deployment Options

### Option 1: Using the Blueprint (Recommended)

The project includes a `render.yaml` file that defines all the services needed for the application. This is the easiest way to deploy the entire stack.

1. Fork or clone the repository to your GitHub account
2. Log in to your Render account
3. Go to the Dashboard and click "New Blueprint"
4. Connect your GitHub account if you haven't already
5. Select the repository containing the project
6. Click "Apply Blueprint"
7. Render will automatically create and deploy:
   - Backend API service
   - Frontend application
   - MongoDB database
8. Once deployment is complete, you can access your application at the provided URLs

### Option 2: Manual Deployment

If you need more control over the deployment process, you can deploy each service manually.

#### Step 1: Deploy the MongoDB Database

1. Log in to your Render account
2. Go to the Dashboard and click "New" > "PostgreSQL"
3. Configure the database:
   - **Name**: st-john-vianey-db (or your preferred name)
   - **Database**: john_vianey
   - **User**: (auto-generated)
   - **Region**: Choose the region closest to your users
   - **Plan**: Select an appropriate plan (Free tier is available)
4. Click "Create Database"
5. Once created, note the connection string for use in the backend service

#### Step 2: Deploy the Backend API

1. Go to the Dashboard and click "New" > "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: st-john-vianey-api (or your preferred name)
   - **Runtime**: Node
   - **Root Directory**: backend
   - **Build Command**: npm install
   - **Start Command**: npm start
   - **Health Check Path**: /api/health
4. Add the following environment variables:
   - NODE_ENV: production
   - PORT: 5000
   - MONGODB_URI: (paste the connection string from your database)
   - JWT_SECRET: (generate a secure random string)
   - JWT_REFRESH_SECRET: (generate a secure random string)
   - USE_MOCK_DATA: false
   - Add any other variables from your .env.example file as needed
5. Click "Create Web Service"

#### Step 3: Deploy the Frontend Application

1. Go to the Dashboard and click "New" > "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: st-john-vianey-frontend (or your preferred name)
   - **Runtime**: Node
   - **Root Directory**: frontend/school-frontend-app
   - **Build Command**: npm install && npm run build
   - **Start Command**: npm start
   - **Health Check Path**: /health
4. Add the following environment variables:
   - NODE_ENV: production
   - REACT_APP_API_URL: https://your-backend-api-url.onrender.com/api (replace with your actual backend URL)
   - REACT_APP_USE_MOCK_DATA: false
5. Click "Create Web Service"

## Post-Deployment Steps

### 1. Verify Services

After deployment, verify that all services are running correctly:

1. Check the backend API by visiting `https://your-backend-api-url.onrender.com/api/health`
2. Check the frontend by visiting `https://your-frontend-url.onrender.com/health`
3. Test the full application by visiting `https://your-frontend-url.onrender.com` and logging in

### 2. Set Up Initial Data

If this is a fresh deployment, you'll need to set up initial data:

1. Create an admin user through the API or using the setup endpoint
2. Set up academic years, classes, subjects, and other required data
3. Import any existing student and teacher data

### 3. Configure Automatic Deployments

Render automatically deploys when you push changes to your repository. To configure this:

1. Go to your service in the Render dashboard
2. Click on "Settings"
3. Under "Build & Deploy", ensure "Auto-Deploy" is enabled
4. Choose the branch you want to deploy from

## Troubleshooting

### Connection Issues

If the frontend cannot connect to the backend:

1. Check that the REACT_APP_API_URL environment variable is set correctly
2. Verify that the backend service is running
3. Check CORS settings in the backend code

### Database Connection Issues

If the backend cannot connect to the database:

1. Verify the MONGODB_URI environment variable
2. Check if the database service is running
3. Check if IP allow list settings are configured correctly

### Build Failures

If the build process fails:

1. Check the build logs in the Render dashboard
2. Verify that all dependencies are correctly specified in package.json
3. Ensure that the build commands are correct for your project

## Scaling

As your application grows, you may need to scale your services:

1. Upgrade your database plan for more storage and better performance
2. Upgrade your web service plans for more CPU and memory
3. Consider adding a CDN for static assets
4. Set up caching for frequently accessed data

## Monitoring

Render provides basic monitoring for all services:

1. View logs in the Render dashboard
2. Set up alerts for service outages
3. Monitor resource usage and scale as needed

For more advanced monitoring, consider integrating with a third-party service like New Relic or Datadog.
