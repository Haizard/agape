/**
 * React Router Error #299 Solution
 * 
 * This file provides a complete solution for React Router Error #299
 * by implementing the correct initialization pattern for React 18 and React Router.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * Safe initialization function that prevents Error #299
 * 
 * This function implements the correct initialization pattern:
 * 1. Create root first
 * 2. Initialize Router once
 * 3. Proper component hierarchy
 */
function safeInitialize() {
  console.log('Initializing application with Error #299 prevention...');
  
  // Step 1: Get the container element
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element not found!');
    return;
  }
  
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
  
  console.log('Application initialized successfully!');
}

// Export the safe initialization function
export default safeInitialize;

/**
 * Why this works:
 * 
 * Error #299 occurs when the Router's history object is changed after initialization.
 * This typically happens when:
 * 
 * 1. Multiple Router instances are created
 * 2. React 18's concurrent rendering creates/destroys components during rendering
 * 3. The Router is initialized before createRoot
 * 
 * This solution ensures:
 * - createRoot is called before any Router initialization
 * - Only one Router instance is created
 * - The Router is at the top level of the component hierarchy
 * - StrictMode doesn't cause issues with Router initialization
 */
