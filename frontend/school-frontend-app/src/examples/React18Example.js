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
