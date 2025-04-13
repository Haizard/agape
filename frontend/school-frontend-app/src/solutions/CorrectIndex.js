/**
 * Application Entry Point
 * 
 * This file demonstrates the correct way to initialize a React 18 application
 * with React Router to prevent Error #299.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Import debugging tools if needed
// import { initializeDebugging, DebugProvider } from './utils/debug';

// Initialize debugging if needed
// initializeDebugging();

/**
 * CORRECT INITIALIZATION PATTERN
 * 
 * This pattern prevents React Router Error #299 by ensuring:
 * 1. createRoot is called before Router initialization
 * 2. Only one Router instance is created
 * 3. Proper component hierarchy
 */

// Step 1: Get the container element
const container = document.getElementById('root');

// Step 2: Create the root BEFORE any Router initialization
// This is critical to prevent Error #299
const root = createRoot(container);

// Step 3: Render with proper structure
// - Single Router instance at the top level
// - No nested Routers
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

/**
 * INCORRECT PATTERNS TO AVOID
 * 
 * The following patterns can cause Error #299:
 * 
 * 1. Creating Router before createRoot:
 *    const router = <BrowserRouter><App /></BrowserRouter>;
 *    const root = createRoot(container);
 *    root.render(router);
 * 
 * 2. Multiple Router instances:
 *    root.render(
 *      <BrowserRouter>
 *        <SomeComponent>
 *          <BrowserRouter>  // NESTED ROUTER - BAD!
 *            <App />
 *          </BrowserRouter>
 *        </SomeComponent>
 *      </BrowserRouter>
 *    );
 * 
 * 3. Changing history after initialization:
 *    const history = createBrowserHistory();
 *    // ... later ...
 *    history = createBrowserHistory(); // CHANGING HISTORY - BAD!
 */
