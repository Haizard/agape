# API Testing Guide

This guide explains how to test your frontend application with different backend API environments.

## Available Scripts

The following scripts are available to help you test with different API environments:

### `npm run use-production-api`

Configures the frontend to use the production API at `https://agape-seminary-school.onrender.com/api`.

This allows you to test your local frontend against the production backend, which is useful for:
- Reproducing issues that only occur in production
- Testing if your frontend changes work with the production API
- Debugging authentication issues in production

### `npm run use-local-api`

Configures the frontend to use the local API at `http://localhost:5000/api`.

Use this to switch back to your local development environment after testing with the production API.

### `npm run test-api`

Tests the connection to the currently configured API (either local or production).

This script will:
1. Check if the API health endpoint is accessible
2. Prompt you for login credentials
3. Test authentication with the provided credentials
4. Test access to a protected endpoint (education-levels)

### `npm run dev:prod-api`

Combines `use-production-api` and `dev` commands to start the development server with the production API.

### `npm run dev:local-api`

Combines `use-local-api` and `dev` commands to start the development server with the local API.

## Debugging Authentication Issues

If you're experiencing authentication issues with the production API:

1. Run `npm run use-production-api` to configure the frontend to use the production API
2. Run `npm run test-api` to test the connection and authentication
3. Check the console output for any errors
4. Start the development server with `npm run dev` to test the frontend with the production API

### Common Issues and Solutions

#### 401 Unauthorized Errors

If you're getting 401 errors when accessing protected endpoints:

1. Check if your token is being properly stored in localStorage
2. Verify the token is being included in the Authorization header
3. Check if the token has expired (JWT tokens typically expire after 24 hours)
4. Try logging out and logging back in to get a fresh token

#### CORS Issues

If you're seeing CORS errors in the console:

1. Check if the production API has the correct CORS configuration
2. Verify that the frontend origin is allowed in the backend CORS settings
3. Make sure you're using the correct API URL

#### Network Errors

If you're seeing network errors:

1. Check if the API is accessible (run `npm run test-api`)
2. Verify your internet connection
3. Check if the API server is running

## Switching Back to Local Development

When you're done testing with the production API, don't forget to switch back to your local API:

```
npm run use-local-api
```

This will restore your local development environment.
