
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/index';
import App from './App';
import EnhancedThemeProvider from './theme/EnhancedThemeProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

// Production-safe error handling for Router errors
const RouterErrorBoundary = ({ children }) => {
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
    <Provider store={store}>
      <EnhancedThemeProvider>
        <ErrorBoundary>
          <RouterErrorBoundary>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </RouterErrorBoundary>
        </ErrorBoundary>
      </EnhancedThemeProvider>
    </Provider>
  </React.StrictMode>
);
