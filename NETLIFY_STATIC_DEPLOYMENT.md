# Static Deployment Instructions

This project has been configured for static deployment on Netlify. There are several deployment options available:

## Option 1: Automatic Deployment via GitHub

1. Connect your GitHub repository to Netlify
2. Use the following build settings:
   - Base directory: `frontend/school-frontend-app`
   - Build command: `npm run build:static:script`
   - Publish directory: `build`

## Option 2: Manual Deployment via Netlify UI

1. Run the following command locally:
   ```
   cd frontend/school-frontend-app
   npm run build:direct
   ```
2. This will create a `build.zip` file in the frontend/school-frontend-app directory
3. Go to Netlify and use the "Deploy manually" option to upload this zip file

## Option 3: Netlify CLI Deployment

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```
2. Build the project:
   ```
   cd frontend/school-frontend-app
   npm run build:static
   ```
3. Deploy using the CLI:
   ```
   netlify deploy --dir=build
   ```

## Troubleshooting

If you encounter any issues with the deployment:

1. Make sure you're using Node.js v16 for compatibility
2. Try the manual deployment option which bypasses Netlify's build process
3. Check the Netlify logs for specific error messages
