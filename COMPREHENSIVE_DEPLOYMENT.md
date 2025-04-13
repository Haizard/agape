# Comprehensive Deployment Guide

This project has been configured for robust deployment on Netlify with integration to a Koyeb backend.

## Configuration Details

- **Frontend**: Hosted on Netlify
- **Backend**: Hosted on Koyeb at https://misty-roby-haizard-17a53e2a.koyeb.app
- **API Proxying**: All API requests from the frontend are proxied to the Koyeb backend
- **Fallback Mode**: Automatic fallback to static data if the backend is unavailable

## Deployment Instructions

1. Connect your GitHub repository to Netlify
2. Use the following build settings:
   - Base directory: rontend/school-frontend-app
   - Build command: 
pm install --legacy-peer-deps && npm install jsonwebtoken bcryptjs axios --no-save && node scripts/comprehensive-build.js
   - Publish directory: uild

## Environment Variables

The following environment variables are configured:

- REACT_APP_API_URL: /api (for local frontend requests)
- REACT_APP_BACKEND_URL: $koyebBackendUrl (the actual backend URL)
- REACT_APP_FALLBACK_TO_STATIC: 	rue (enables fallback mode)

## Features

This deployment includes several advanced features:

1. **API Proxying**: All API requests are proxied to your Koyeb backend
2. **Fallback Mode**: If the backend is unavailable, the app falls back to static data
3. **Auto-Login**: In fallback mode, users are automatically logged in
4. **Error Handling**: Comprehensive error handling for API requests
5. **CORS Handling**: Proper CORS configuration for cross-domain requests

## Local Development

To run the frontend locally with the Koyeb backend:

\\\
cd frontend/school-frontend-app
npm run dev:koyeb
\\\

This will start the development server with the correct API configuration.

## Troubleshooting

If you encounter any issues with the deployment:

1. Check that your Koyeb backend is running and accessible
2. Verify that CORS is properly configured on your Koyeb backend
3. Check the Netlify logs for specific error messages
4. Test API endpoints directly to ensure they're working
5. Enable fallback mode if the backend is temporarily unavailable

## Fallback Mode

Fallback mode provides a way to use the application even when the backend is unavailable:

- Set REACT_APP_FALLBACK_TO_STATIC=true to enable fallback mode
- In fallback mode, API requests that fail will return static mock data
- Users are automatically logged in with an admin account
- This allows for demonstration and testing without a working backend

## Security Considerations

- The fallback mode is intended for development and demonstration purposes only
- In production, consider disabling fallback mode for better security
- The JWT token used in fallback mode is not valid for actual authentication
