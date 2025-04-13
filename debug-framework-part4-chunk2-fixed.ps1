# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# Create the examples directory if it doesn't exist
$examplesDir = "frontend/school-frontend-app/src/examples"
if (-not (Test-Path $examplesDir)) {
    New-Item -ItemType Directory -Path $examplesDir -Force
}

# Create the scripts directory if it doesn't exist
$scriptsDir = "frontend/school-frontend-app/scripts"
if (-not (Test-Path $scriptsDir)) {
    New-Item -ItemType Directory -Path $scriptsDir -Force
}

# 1. Create a practical implementation example
$implementationExampleContent = @'
/**
 * React Router Error #299 Debugging Example
 * 
 * This file demonstrates how to use the debugging framework to diagnose
 * and fix React Router Error #299.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Import debugging tools
import { 
  initializeDebugging, 
  DebugProvider, 
  diagnoseRouterIssues, 
  diagnoseReact18Issues 
} from './utils/debug';

// Step 1: Initialize debugging with full options
initializeDebugging({
  patchReact: true,
  patchRouter: true,
  logLevel: 'debug',
  componentTracing: true,
  routerTracing: true,
  performanceTracing: true,
});

// Step 2: Get the root element
const container = document.getElementById('root');

// Step 3: Create the root BEFORE any Router initialization
const root = createRoot(container);

// Step 4: Render with proper structure
// - DebugProvider at the outermost level
// - Single Router instance
// - No nested Routers
root.render(
  <DebugProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </DebugProvider>
);

// Step 5: Run diagnostics after initialization
setTimeout(() => {
  console.log('Running router diagnostics...');
  const routerDiagnosis = diagnoseRouterIssues();
  console.log('Router diagnosis:', routerDiagnosis);
  
  console.log('Running React 18 diagnostics...');
  const react18Diagnosis = diagnoseReact18Issues();
  console.log('React 18 diagnosis:', react18Diagnosis);
  
  // Check for issues
  if (routerDiagnosis.issues.length > 0 || react18Diagnosis.issues.length > 0) {
    console.warn('Issues detected! See diagnosis for details.');
  } else {
    console.log('No issues detected. Application initialized correctly.');
  }
}, 1000);

// This structure ensures:
// 1. createRoot is called before Router initialization
// 2. Only one Router instance is created
// 3. Router is properly wrapped with debugging tools
// 4. Diagnostics are run to verify correct initialization
'@

Set-Content -Path "$examplesDir/RouterDebugExample.js" -Value $implementationExampleContent

# 2. Create a React 18 specific example
$react18ExampleContent = @'
/**
 * React 18 Integration Example
 * 
 * This file demonstrates the correct way to integrate React 18 with React Router
 * to avoid Error #299.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import debugging tools
import { DebugProvider, DebugErrorBoundary } from '../utils/debug';

// Import components
const Home = () => <div>Home Page</div>;
const About = () => <div>About Page</div>;
const NotFound = () => <div>Page Not Found</div>;

// Main App component - NO ROUTER HERE
function App() {
  return (
    <div className="App">
      <header>
        <h1>React 18 + Router Example</h1>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <footer>
        <p>Footer content</p>
      </footer>
    </div>
  );
}

// Correct initialization order
function initializeApp() {
  // Step 1: Get container
  const container = document.getElementById('root');
  
  // Step 2: Create root ONCE
  const root = createRoot(container);
  
  // Step 3: Render with proper structure
  root.render(
    <DebugProvider>
      <DebugErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DebugErrorBoundary>
    </DebugProvider>
  );
  
  // Log success
  console.log('Application initialized successfully');
}

// Export for use in index.js
export { initializeApp, App };

// This structure ensures:
// 1. createRoot is called before Router initialization
// 2. Only one Router instance is created
// 3. App component doesn't include Router (it's in the initialization)
// 4. Error boundaries catch and report any issues
'@

Set-Content -Path "$examplesDir/React18Example.js" -Value $react18ExampleContent

# 3. Create a diagnostic implementation script
$diagnosticImplementationContent = @'
/**
 * Diagnostic Implementation Script
 * 
 * This script demonstrates how to implement the debugging framework
 * in an existing React application.
 */

// Import required modules
const fs = require('fs');
const path = require('path');

console.log('Implementing diagnostic framework...');

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to modify index.js
function modifyIndexJs() {
  const indexJsPath = path.resolve('./src/index.js');
  
  if (!fileExists(indexJsPath)) {
    console.log('index.js not found. Skipping modification.');
    return false;
  }
  
  console.log(`Modifying ${indexJsPath}...`);
  
  // Read the file
  let content = fs.readFileSync(indexJsPath, 'utf8');
  
  // Check if already modified
  if (content.includes('DebugProvider')) {
    console.log('index.js already modified. Skipping.');
    return false;
  }
  
  // Add imports
  if (!content.includes('debug')) {
    const importStatement = "import { initializeDebugging, DebugProvider, DebugErrorBoundary } from './utils/debug';\n";
    
    // Find a good place to add the import
    const lastImportIndex = content.lastIndexOf('import');
    if (lastImportIndex !== -1) {
      const importEndIndex = content.indexOf(';', lastImportIndex) + 1;
      content = content.slice(0, importEndIndex) + '\n' + importStatement + content.slice(importEndIndex);
    } else {
      content = importStatement + content;
    }
  }
  
  // Add initialization
  if (!content.includes('initializeDebugging')) {
    const initCode = `
// Initialize debugging framework
initializeDebugging({
  patchReact: true,
  patchRouter: true,
  logLevel: 'debug',
  componentTracing: true,
  routerTracing: true,
});
`;
    
    // Find a good place to add the initialization
    const createRootIndex = content.indexOf('createRoot');
    if (createRootIndex !== -1) {
      const beforeCreateRoot = content.slice(0, createRootIndex);
      const lastStatementEnd = Math.max(
        beforeCreateRoot.lastIndexOf(';'),
        beforeCreateRoot.lastIndexOf('}')
      );
      
      if (lastStatementEnd !== -1) {
        content = content.slice(0, lastStatementEnd + 1) + '\n' + initCode + content.slice(lastStatementEnd + 1);
      } else {
        content = initCode + content;
      }
    } else {
      // If createRoot not found, add at the beginning
      content = initCode + content;
    }
  }
  
  // Modify render call
  if (content.includes('root.render(') && !content.includes('<DebugProvider>')) {
    content = content.replace(
      /root\.render\(\s*(<[^>]+>)/g,
      'root.render(\n  <DebugProvider>\n    <DebugErrorBoundary>\n      $1'
    );
    
    content = content.replace(
      /(<\/[^>]+>)\s*\);/g,
      '$1\n    </DebugErrorBoundary>\n  </DebugProvider>\n);'
    );
  }
  
  // Write the modified content
  fs.writeFileSync(indexJsPath, content);
  console.log('index.js modified successfully.');
  return true;
}

// Function to modify App.js
function modifyAppJs() {
  const appJsPath = path.resolve('./src/App.js');
  
  if (!fileExists(appJsPath)) {
    console.log('App.js not found. Skipping modification.');
    return false;
  }
  
  console.log(`Modifying ${appJsPath}...`);
  
  // Read the file
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Check if already modified
  if (content.includes('useRouterDebugger')) {
    console.log('App.js already modified. Skipping.');
    return false;
  }
  
  // Add imports
  if (!content.includes('debug')) {
    const importStatement = "import { useRouterDebugger } from './utils/debug';\n";
    
    // Find a good place to add the import
    const lastImportIndex = content.lastIndexOf('import');
    if (lastImportIndex !== -1) {
      const importEndIndex = content.indexOf(';', lastImportIndex) + 1;
      content = content.slice(0, importEndIndex) + '\n' + importStatement + content.slice(importEndIndex);
    } else {
      content = importStatement + content;
    }
  }
  
  // Add router debugger
  if (content.includes('function App(') && !content.includes('useRouterDebugger')) {
    const appFunctionBodyStart = content.indexOf('{', content.indexOf('function App(')) + 1;
    
    if (appFunctionBodyStart !== 0) {
      const debuggerCode = `
  // Use router debugger
  const { location, navigate, history } = useRouterDebugger();
  
  // Log current location for debugging
  console.log('Current location:', location.pathname);
`;
      
      content = content.slice(0, appFunctionBodyStart) + debuggerCode + content.slice(appFunctionBodyStart);
    }
  }
  
  // Write the modified content
  fs.writeFileSync(appJsPath, content);
  console.log('App.js modified successfully.');
  return true;
}

// Run the implementation
try {
  // Ensure utils directory exists
  ensureDirectoryExists('./src/utils');
  
  // Modify files
  const indexModified = modifyIndexJs();
  const appModified = modifyAppJs();
  
  if (indexModified || appModified) {
    console.log('Diagnostic framework implemented successfully!');
  } else {
    console.log('No changes were needed or possible.');
  }
} catch (error) {
  console.error('Error implementing diagnostic framework:', error);
}
'@

Set-Content -Path "$scriptsDir/implement-diagnostics.js" -Value $diagnosticImplementationContent

# Add the changes to git
git add "$examplesDir/RouterDebugExample.js" "$examplesDir/React18Example.js" "$scriptsDir/implement-diagnostics.js"

# Commit the changes
git commit -m "Add practical examples and implementation script (Part 4 - Chunk 2)"

# Push the changes to GitHub
git push

Write-Host "Practical examples and implementation script (Part 4 - Chunk 2) pushed to GitHub."
Write-Host "This includes concrete examples of how to use the debugging framework and a script to implement it in existing projects."
