# Koyeb Backend Integration Instructions

This project has been configured to deploy the frontend on Netlify while communicating with a backend hosted on Koyeb.

## Configuration Details

- **Frontend**: Hosted on Netlify
- **Backend**: Hosted on Koyeb at https://misty-roby-haizard-17a53e2a.koyeb.app
- **API Proxying**: All API requests from the frontend are proxied to the Koyeb backend

## Deployment Instructions

1. Connect your GitHub repository to Netlify
2. Use the following build settings:
   - Base directory: rontend/school-frontend-app
   - Build command: 
pm run build:koyeb:script
   - Publish directory: uild

## Environment Variables

The following environment variables are configured:

- REACT_APP_API_URL: /api (for local frontend requests)
- REACT_APP_BACKEND_URL: $koyebBackendUrl (the actual backend URL)

## Troubleshooting

If you encounter any issues with the deployment:

1. Check that your Koyeb backend is running and accessible
2. Verify that CORS is properly configured on your Koyeb backend
3. Check the Netlify logs for specific error messages
4. Test API endpoints directly to ensure they're working

## Local Development

To run the frontend locally with the Koyeb backend:

\\\
cd frontend/school-frontend-app
REACT_APP_API_URL=/api REACT_APP_BACKEND_URL=https://misty-roby-haizard-17a53e2a.koyeb.app npm start
\\\

This will start the development server with the correct API configuration.
