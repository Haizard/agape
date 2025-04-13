// React Router patch to fix Error #299
import { useEffect } from 'react';

// This component will help prevent Router history issues
export const RouterErrorBoundary = ({ children }) => {
  useEffect(() => {
    // Mark that we've mounted the router error boundary
    window.__ROUTER_ERROR_BOUNDARY_MOUNTED__ = true;
    
    // Cleanup function
    return () => {
      window.__ROUTER_ERROR_BOUNDARY_MOUNTED__ = false;
    };
  }, []);
  
  return children;
};

// Helper function to create a safe history object
export const createSafeHistory = (historyImpl) => {
  // Only create one history instance
  if (window.__SAFE_HISTORY_INSTANCE__) {
    return window.__SAFE_HISTORY_INSTANCE__;
  }
  
  const history = historyImpl();
  window.__SAFE_HISTORY_INSTANCE__ = history;
  
  return history;
};

// Export a wrapped Router component
export const SafeRouter = ({ children, ...props }) => {
  // Increment router instance count
  if (typeof window !== 'undefined') {
    window.__ROUTER_INSTANCE_COUNT__ = (window.__ROUTER_INSTANCE_COUNT__ || 0) + 1;
    
    // Warn if multiple routers are detected
    if (window.__ROUTER_INSTANCE_COUNT__ > 1) {
      console.warn('Multiple Router instances detected. This may cause issues.');
    }
  }
  
  return children;
};
