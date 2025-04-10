# Deployment Guide for St. John Vianney School Management System

This guide provides step-by-step instructions for deploying the St. John Vianney School Management System to Render.

## Prerequisites

- A GitHub account
- A Render account (https://render.com)
- Access to the project repository

## Deployment Steps

### 1. Prepare the Repository

1. Make sure all changes are committed to the repository
2. Ensure the following files are present in the root directory:
   - `package.json` - With correct dependencies and scripts
   - `server.js` - Express server for production
   - `render.yaml` - Render configuration
   - `.env.production` - Production environment variables

### 2. Deploy to Render

#### Option 1: Automatic Deployment (Recommended)

1. Log in to your Render account
2. Click on "New" and select "Blueprint"
3. Connect your GitHub account if not already connected
4. Select the repository containing the project
5. Render will automatically detect the `render.yaml` configuration
6. Review the settings and click "Apply"
7. Render will create the web service and deploy the application

#### Option 2: Manual Deployment

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub account if not already connected
4. Select the repository containing the project
5. Configure the following settings:
   - **Name**: `st-john-vianey-frontend` (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your deployment branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `REACT_APP_API_URL`: `https://st-john-vianey-api.onrender.com/api` (or your API URL)
   - `REACT_APP_USE_MOCK_DATA`: `false`
7. Click "Create Web Service"

### 3. Verify Deployment

1. Once the deployment is complete, Render will provide a URL for your application
2. Open the URL in a browser to verify that the application is running correctly
3. Test the main features to ensure everything is working as expected

### 4. Set Up Custom Domain (Optional)

1. In your Render dashboard, select the web service
2. Go to the "Settings" tab
3. Scroll down to the "Custom Domain" section
4. Click "Add Custom Domain"
5. Follow the instructions to configure your domain

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check the build logs for errors
   - Ensure all dependencies are correctly listed in `package.json`
   - Verify that the build command is correct

2. **Application Crashes on Start**
   - Check the logs for error messages
   - Verify that the start command is correct
   - Ensure the server.js file is properly configured

3. **API Connection Issues**
   - Verify that the `REACT_APP_API_URL` environment variable is set correctly
   - Check that the backend API is running and accessible
   - Check for CORS issues in the browser console

### Getting Help

If you encounter issues that you cannot resolve, please:

1. Check the Render documentation: https://render.com/docs
2. Contact the development team for assistance

## Maintenance

### Updating the Application

1. Make changes to the code and commit them to the repository
2. If you have automatic deployments enabled, Render will automatically deploy the changes
3. If not, manually trigger a new deployment from the Render dashboard

### Monitoring

1. Use the Render dashboard to monitor the application's performance and logs
2. Set up alerts for critical issues

## Rollback

If you need to roll back to a previous version:

1. In the Render dashboard, select the web service
2. Go to the "Deploys" tab
3. Find the previous successful deploy
4. Click "..." and select "Redeploy"
