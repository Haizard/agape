# Manual Netlify Deployment Instructions

Due to configuration issues with automatic deployment, please follow these manual steps to deploy the frontend to Netlify:

## Steps for Manual Deployment

1. Go to [Netlify](https://app.netlify.com/) and log in to your account
2. Click on "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure the build settings as follows:
   - **Base directory**: `frontend/school-frontend-app`
   - **Build command**: `CI= npm run build`
   - **Publish directory**: `build`
5. Add the following environment variables:
   - `REACT_APP_API_URL`: `https://agape-seminary-school.onrender.com/api`
   - `REACT_APP_USE_MOCK_DATA`: `false`
   - `NODE_ENV`: `production`
6. Click "Deploy site"

## Troubleshooting

If you encounter any issues during deployment:

1. Make sure you've entered the correct base directory path: `frontend/school-frontend-app`
2. Ensure the build command includes `CI=` to prevent treating warnings as errors
3. Verify that the publish directory is set to `build` (not `dist` or any other folder)
4. Check that all environment variables are correctly set

## Important Notes

- Do not use automatic configuration detection as it may cause path duplication issues
- Always manually specify the base directory, build command, and publish directory
- The frontend is a standard React application built with Create React App
