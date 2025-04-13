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
