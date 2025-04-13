# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Create a Vercel-specific implementation script
$vercelImplementationContent = @'
/**
 * Vercel Deployment Debugging Implementation
 * 
 * This script implements the debugging framework specifically for
 * Vercel deployment environments.
 */

const fs = require('fs');
const path = require('path');

console.log('Implementing debugging framework for Vercel deployment...');

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

// Function to update index.js with the correct initialization pattern for Vercel
function updateIndexJs() {
  const indexJsPath = path.resolve('./frontend/school-frontend-app/src/index.js');
  
  if (!fileExists(indexJsPath)) {
    console.log('index.js not found. Skipping update.');
    return false;
  }
  
  console.log(`Updating ${indexJsPath} with correct initialization pattern for Vercel...`);
  
  // Create the correct index.js content for Vercel
  const correctIndexContent = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Production-safe error handling
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Add global error handler for Router errors
    const originalError = console.error;
    console.error = (...args) => {
      // Check for Router Error #299
      if (args[0] && typeof args[0] === 'string' && args[0].includes('You cannot change <Router history>')) {
        console.log('Detected Router Error #299 - See https://github.com/Haizard/agape/blob/main/frontend/school-frontend-app/docs/ERROR_299_GUIDE.md');
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  React.useEffect(() => {
    window.onerror = (message, source, lineno, colno, error) => {
      if (message && message.includes('Router history')) {
        setHasError(true);
        setError(error || { message });
        return true; // Prevent default error handling
      }
      return false;
    };

    return () => {
      window.onerror = null;
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', margin: '20px' }}>
        <h2>Navigation Error</h2>
        <p>{error && error.message}</p>
        <button 
          onClick={() => window.location.href = '/'} 
          style={{ padding: '8px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Go to Home
        </button>
        <button 
          onClick={() => setHasError(false)} 
          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return children;
};

// CORRECT INITIALIZATION PATTERN FOR VERCEL
// This pattern prevents React Router Error #299

// Step 1: Get the container element
const container = document.getElementById('root');

// Step 2: Create the root BEFORE any Router initialization
// This is critical to prevent Error #299
const root = createRoot(container);

// Step 3: Render with proper structure
// - ErrorBoundary at the outermost level
// - Single Router instance
// - No nested Routers
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
`;
  
  // Write the new index.js
  fs.writeFileSync(indexJsPath, correctIndexContent);
  console.log('index.js updated successfully with correct initialization pattern for Vercel.');
  return true;
}

// Function to update App.js to remove any Router components
function updateAppJs() {
  const appJsPath = path.resolve('./frontend/school-frontend-app/src/App.js');
  
  if (!fileExists(appJsPath)) {
    console.log('App.js not found. Skipping update.');
    return false;
  }
  
  console.log(`Checking ${appJsPath} for Router components...`);
  
  // Read the file
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Check for Router imports
  const hasRouterImport = content.includes('BrowserRouter') || 
                          content.includes('HashRouter') || 
                          content.includes('Router');
  
  // Check for Router components
  const hasRouterComponent = content.includes('<BrowserRouter') || 
                             content.includes('<HashRouter') || 
                             content.includes('<Router');
  
  if (hasRouterImport || hasRouterComponent) {
    console.log('Found Router components in App.js. Removing...');
    
    // Replace Router imports with Routes and Route imports
    content = content.replace(
      /import\s*{([^}]*)(?:BrowserRouter|HashRouter|Router)([^}]*?)}\s*from\s*['"]react-router-dom['"]/g,
      'import {$1Routes, Route$2} from \'react-router-dom\''
    );
    
    // Remove Router components but keep their children
    content = content.replace(
      /<(?:BrowserRouter|HashRouter|Router)[^>]*>([\s\S]*?)<\/(?:BrowserRouter|HashRouter|Router)>/g,
      '$1'
    );
    
    // Write the updated content
    fs.writeFileSync(appJsPath, content);
    console.log('App.js updated successfully. Router components removed.');
    return true;
  } else {
    console.log('No Router components found in App.js. No changes needed.');
    return false;
  }
}

// Function to update vercel.json
function updateVercelJson() {
  const vercelJsonPath = path.resolve('./vercel.json');
  
  if (!fileExists(vercelJsonPath)) {
    console.log('vercel.json not found. Creating new file...');
    
    // Create a new vercel.json file
    const vercelJsonContent = {
      "version": 2,
      "buildCommand": "npm run build",
      "outputDirectory": "frontend/school-frontend-app/build",
      "rewrites": [
        { "source": "/api/(.*)", "destination": "/api/$1" }
      ],
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
          ]
        },
        {
          "source": "/static/(.*)",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
          ]
        },
        {
          "source": "/api/(.*)",
          "headers": [
            { "key": "Access-Control-Allow-Origin", "value": "*" },
            { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
            { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
          ]
        }
      ]
    };
    
    // Write the file
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJsonContent, null, 2));
    console.log('vercel.json created successfully.');
    return true;
  } else {
    console.log('vercel.json found. Updating...');
    
    // Read the existing file
    let vercelJson;
    try {
      vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    } catch (e) {
      console.error('Error parsing vercel.json:', e);
      return false;
    }
    
    // Ensure the file has the necessary properties
    vercelJson.version = 2;
    vercelJson.buildCommand = vercelJson.buildCommand || "npm run build";
    vercelJson.outputDirectory = vercelJson.outputDirectory || "frontend/school-frontend-app/build";
    
    // Ensure rewrites are set up correctly
    vercelJson.rewrites = vercelJson.rewrites || [];
    const hasApiRewrite = vercelJson.rewrites.some(rewrite => 
      rewrite.source === "/api/(.*)" && rewrite.destination === "/api/$1"
    );
    
    if (!hasApiRewrite) {
      vercelJson.rewrites.push({ 
        "source": "/api/(.*)", 
        "destination": "/api/$1" 
      });
    }
    
    // Ensure headers are set up correctly
    vercelJson.headers = vercelJson.headers || [];
    
    // Write the updated file
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
    console.log('vercel.json updated successfully.');
    return true;
  }
}

// Function to update package.json
function updatePackageJson() {
  const packageJsonPath = path.resolve('./package.json');
  
  if (!fileExists(packageJsonPath)) {
    console.log('package.json not found. Skipping update.');
    return false;
  }
  
  console.log(`Updating ${packageJsonPath} for Vercel deployment...`);
  
  // Read the existing file
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (e) {
    console.error('Error parsing package.json:', e);
    return false;
  }
  
  // Update the build script
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.build = "cd frontend/school-frontend-app && npm install --legacy-peer-deps && npm run build";
  
  // Ensure Node.js version is set correctly
  packageJson.engines = packageJson.engines || {};
  packageJson.engines.node = "18.x";
  
  // Write the updated file
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json updated successfully.');
  return true;
}

// Run the implementation
try {
  // Update index.js
  const indexUpdated = updateIndexJs();
  
  // Update App.js
  const appUpdated = updateAppJs();
  
  // Update vercel.json
  const vercelJsonUpdated = updateVercelJson();
  
  // Update package.json
  const packageJsonUpdated = updatePackageJson();
  
  console.log('\nVercel Implementation Summary:');
  console.log(`- index.js updated: ${indexUpdated ? 'Yes' : 'No'}`);
  console.log(`- App.js updated: ${appUpdated ? 'Yes' : 'No'}`);
  console.log(`- vercel.json updated: ${vercelJsonUpdated ? 'Yes' : 'No'}`);
  console.log(`- package.json updated: ${packageJsonUpdated ? 'Yes' : 'No'}`);
  
  console.log('\nDebugging framework implemented for Vercel deployment!');
  console.log('React Router Error #299 should now be fixed.');
  
  console.log('\nNext Steps:');
  console.log('1. Commit and push these changes to GitHub');
  console.log('2. Deploy to Vercel');
  console.log('3. Check the Vercel logs for any errors');
  console.log('4. Test your deployed application');
} catch (error) {
  console.error('Error implementing debugging framework for Vercel:', error);
}
'@

Set-Content -Path "frontend/school-frontend-app/scripts/vercel-implementation.js" -Value $vercelImplementationContent

# Create a script to run the Vercel implementation
$runVercelScriptContent = @'
# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Run the Vercel implementation script
Write-Host "Running debugging framework implementation for Vercel..."
node frontend/school-frontend-app/scripts/vercel-implementation.js

Write-Host "Implementation for Vercel complete."
Write-Host "The debugging framework has been implemented for Vercel deployment."
Write-Host "Commit and push these changes to GitHub, then deploy to Vercel."
'@

Set-Content -Path "run-vercel-implementation.ps1" -Value $runVercelScriptContent

# Create a Vercel deployment guide
$vercelDeploymentGuideContent = @'
# Vercel Deployment Guide with Debugging Framework

This guide provides step-by-step instructions for deploying your application to Vercel with the debugging framework for React Router Error #299.

## Prerequisites

- GitHub repository connected to Vercel
- Node.js 18.x or higher
- Vercel account

## Implementation Steps

### Step 1: Implement the Debugging Framework for Vercel

Run the Vercel implementation script:

```
powershell -File run-vercel-implementation.ps1
```

This script will:
- Update index.js with the correct initialization pattern
- Remove any Router components from App.js
- Update vercel.json with the correct configuration
- Update package.json with the correct build script

### Step 2: Commit and Push Changes

Commit and push the changes to GitHub:

```
git add .
git commit -m "Implement debugging framework for Vercel deployment"
git push
```

### Step 3: Deploy to Vercel

1. Go to the Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. If you've connected your GitHub repository, Vercel will automatically detect the changes and start a new deployment
4. If not, click "Deploy" to manually trigger a deployment

### Step 4: Configure Environment Variables

Make sure to set the following environment variables in your Vercel project:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `JWT_REFRESH_SECRET`: Your JWT refresh secret key

To set environment variables:
1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add each variable with its value
4. Click "Save"

### Step 5: Verify the Deployment

1. Once the deployment is complete, click on the deployment URL
2. Test navigation throughout your application
3. Check the browser console for any errors
4. Verify that Error #299 does not occur

## Troubleshooting

If you encounter issues with your Vercel deployment:

### Build Errors

1. Check the build logs in the Vercel dashboard
2. Look for specific error messages
3. Make sure all dependencies are installed correctly
4. Verify that the build script is correct

### Runtime Errors

1. Open the browser console to check for errors
2. Look for Error #299 or other Router-related errors
3. Check that the initialization pattern is correct
4. Verify that there are no nested Router components

### API Connection Issues

1. Make sure environment variables are set correctly
2. Check that API routes are configured correctly in vercel.json
3. Verify that CORS headers are set correctly
4. Test API endpoints directly

## Monitoring

To monitor your application for Router errors:

1. Open the browser console
2. Look for messages related to Router Error #299
3. Check the error boundary for any caught errors
4. Monitor Vercel logs for server-side errors

## Conclusion

By following this guide, you should be able to deploy your application to Vercel with the debugging framework for React Router Error #299. The framework will help prevent the error from occurring and provide helpful error messages if it does occur.

If you continue to experience issues, refer to the documentation in the `docs` directory for more detailed information.
'@

Set-Content -Path "frontend/school-frontend-app/docs/VERCEL_DEPLOYMENT_GUIDE.md" -Value $vercelDeploymentGuideContent

# Add the changes to git
git add frontend/school-frontend-app/scripts/vercel-implementation.js run-vercel-implementation.ps1 frontend/school-frontend-app/docs/VERCEL_DEPLOYMENT_GUIDE.md

# Commit the changes
git commit -m "Add Vercel-specific implementation and deployment guide"

# Push the changes to GitHub
git push

Write-Host "Vercel-specific implementation and deployment guide pushed to GitHub."
Write-Host "Run 'powershell -File run-vercel-implementation.ps1' to implement the debugging framework for Vercel deployment."
