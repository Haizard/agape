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
