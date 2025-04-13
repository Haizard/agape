// Implementation script for the debugging framework
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Implementing debugging framework...');

// Set environment variables
process.env.REACT_DEBUG_ENABLED = 'true';
process.env.REACT_DEBUG_LEVEL = 'debug';

// Function to modify index.js to include debugging
const modifyIndexJs = () => {
  const indexJsPath = path.join(__dirname, '..', 'src', 'index.js');
  
  if (fs.existsSync(indexJsPath)) {
    console.log('Modifying index.js to include debugging framework...');
    
    let content = fs.readFileSync(indexJsPath, 'utf8');
    
    // Check if already modified
    if (content.includes('debug.js')) {
      console.log('index.js already includes debugging framework');
      return;
    }
    
    // Add import for debugging
    content = `// Debug framework import
import { DebugProvider, initializeDebugging } from './utils/debug';

${content}`;
    
    // Wrap root rendering with DebugProvider
    content = content.replace(
      /root\.render\(\s*(<React\.StrictMode>[\s\S]*?<\/React\.StrictMode>|<App\s*\/>)\s*\);/,
      `// Initialize debugging
initializeDebugging({
  patchReact: true,
  patchRouter: true,
  logLevel: 'debug',
  componentTracing: true,
  routerTracing: true,
});

// Render with DebugProvider
root.render(
  <DebugProvider>
    $1
  </DebugProvider>
);`
    );
    
    fs.writeFileSync(indexJsPath, content);
    console.log('index.js modified successfully');
  } else {
    console.log('index.js not found');
  }
};

// Function to modify App.js to include router debugging
const modifyAppJs = () => {
  const appJsPath = path.join(__dirname, '..', 'src', 'App.js');
  
  if (fs.existsSync(appJsPath)) {
    console.log('Modifying App.js to include router debugging...');
    
    let content = fs.readFileSync(appJsPath, 'utf8');
    
    // Check if already modified
    if (content.includes('useRouterDebugger')) {
      console.log('App.js already includes router debugging');
      return;
    }
    
    // Add import for router debugger
    if (content.includes('react-router-dom')) {
      content = content.replace(
        /import [^;]*? from ['"]react-router-dom['"]/,
        `$&\nimport { useRouterDebugger, RouterErrorBoundary } from './utils/debug'`
      );
    } else {
      content = `import { useRouterDebugger, RouterErrorBoundary } from './utils/debug';\n${content}`;
    }
    
    // Add router debugger to App component
    content = content.replace(
      /function App\(\) {/,
      `function App() {
  // Use router debugger
  const { location, navigate, history } = useRouterDebugger();
  
  // Log router information
  console.log('Current location:', location.pathname);
  `
    );
    
    // Wrap Router with RouterErrorBoundary if it exists
    if (content.includes('<BrowserRouter') || content.includes('<Router')) {
      content = content.replace(
        /(<(?:BrowserRouter|Router)[^>]*>)/g,
        '<RouterErrorBoundary>\n      $1'
      );
      
      content = content.replace(
        /(<\/(?:BrowserRouter|Router)>)/g,
        '$1\n      </RouterErrorBoundary>'
      );
    }
    
    fs.writeFileSync(appJsPath, content);
    console.log('App.js modified successfully');
  } else {
    console.log('App.js not found');
  }
};

// Run the modifications
try {
  modifyIndexJs();
  modifyAppJs();
  
  console.log('Debugging framework implemented successfully!');
} catch (error) {
  console.error('Error implementing debugging framework:', error);
}
