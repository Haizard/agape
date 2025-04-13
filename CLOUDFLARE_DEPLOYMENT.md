# Cloudflare Pages Deployment Guide

This project is configured for deployment on Cloudflare Pages with integration to a Koyeb backend.

## Deployment Steps

1. Log in to the Cloudflare Dashboard
2. Go to Pages > Create a project
3. Connect your GitHub repository
4. Configure the build settings:
   - Production branch: `main`
   - Build command: `cd frontend/school-frontend-app && npm install --legacy-peer-deps && npm run build:cloudflare`
   - Build output directory: `frontend/school-frontend-app/build`
5. Add the following environment variables:
   - `DISABLE_ESLINT_PLUGIN`: `true`
   - `ESLINT_NO_DEV_ERRORS`: `true`
   - `GENERATE_SOURCEMAP`: `false`
   - `REACT_APP_API_URL`: `/api`
   - `REACT_APP_BACKEND_URL`: `https://misty-roby-haizard-17a53e2a.koyeb.app`
6. Click "Save and Deploy"

## Troubleshooting

If you encounter build errors:

1. Check the build logs for specific error messages
2. Try increasing the Node.js version in the Cloudflare Pages settings
3. Verify that all environment variables are set correctly
4. Try a manual deployment by uploading the build folder directly

## API Proxying

Cloudflare Pages uses the `_routes.json` file to configure API proxying. This file is automatically created during the build process and will proxy all `/api/*` requests to your Koyeb backend.

## Local Development

To run the frontend locally with the Koyeb backend:

```
cd frontend/school-frontend-app
REACT_APP_API_URL=/api REACT_APP_BACKEND_URL=https://misty-roby-haizard-17a53e2a.koyeb.app npm start
```
