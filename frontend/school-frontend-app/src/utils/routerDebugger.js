/**
 * React Router Debugger
 * 
 * This utility provides specialized debugging for React Router,
 * focusing on history, location, and routing issues.
 */

import debugLogger from './debugLogger';

// Router history tracker
export class RouterHistoryTracker {
  constructor() {
    this.history = [];
    this.isTracking = false;
    this.maxHistoryLength = 100;
  }
  
  // Start tracking
  startTracking() {
    if (this.isTracking) return;
    
    try {
      // Get window history
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      
      // Override pushState
      window.history.pushState = (...args) => {
        this.trackHistoryChange('pushState', ...args);
        return originalPushState.apply(window.history, args);
      };
      
      // Override replaceState
      window.history.replaceState = (...args) => {
        this.trackHistoryChange('replaceState', ...args);
        return originalReplaceState.apply(window.history, args);
      };
      
      // Track popstate events
      window.addEventListener('popstate', this.handlePopState);
      
      this.isTracking = true;
      debugLogger.info('RouterHistory', { message: 'Started tracking router history' });
      
      // Track initial state
      this.trackHistoryChange('initial', null, null, window.location.pathname + window.location.search);
    } catch (e) {
      debugLogger.error('RouterHistory', { message: 'Failed to start tracking router history', error: e });
    }
  }
  
  // Stop tracking
  stopTracking() {
    if (!this.isTracking) return;
    
    try {
      // Remove popstate listener
      window.removeEventListener('popstate', this.handlePopState);
      
      this.isTracking = false;
      debugLogger.info('RouterHistory', { message: 'Stopped tracking router history' });
    } catch (e) {
      debugLogger.error('RouterHistory', { message: 'Failed to stop tracking router history', error: e });
    }
  }
  
  // Handle popstate events
  handlePopState = (event) => {
    this.trackHistoryChange('popstate', event.state, null, window.location.pathname + window.location.search);
  };
  
  // Track history changes
  trackHistoryChange(method, state, title, url) {
    const entry = {
      timestamp: new Date().toISOString(),
      method,
      url: url || (window.location ? window.location.pathname + window.location.search : 'unknown'),
      state: state ? JSON.stringify(state) : null,
    };
    
    this.history.push(entry);
    
    // Trim history if needed
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }
    
    debugLogger.debug('RouterHistory', { action: method, url: entry.url });
  }
  
  // Get history
  getHistory() {
    return this.history;
  }
  
  // Clear history
  clearHistory() {
    this.history = [];
    debugLogger.info('RouterHistory', { message: 'Router history cleared' });
  }
}

// Create singleton instance
const routerHistoryTracker = new RouterHistoryTracker();

// Router location debugger
export const useRouterDebugger = () => {
  const React = require('react');
  const { useLocation, useNavigate, useParams } = require('react-router-dom');
  
  // Get router objects
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  // Track location changes
  React.useEffect(() => {
    debugLogger.debug('RouterLocation', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
    });
  }, [location]);
  
  // Create enhanced navigate function
  const debugNavigate = React.useCallback((...args) => {
    debugLogger.debug('RouterNavigate', {
      args,
    });
    
    return navigate(...args);
  }, [navigate]);
  
  // Start history tracking
  React.useEffect(() => {
    routerHistoryTracker.startTracking();
    
    return () => {
      // Don't stop tracking on unmount, as we want to track throughout the app
    };
  }, []);
  
  // Return enhanced router objects
  return {
    location,
    navigate: debugNavigate,
    params,
    history: routerHistoryTracker.getHistory(),
  };
};

// Router error boundary
export class RouterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    debugLogger.error('RouterError', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <h2>Router Error</h2>
          <p>{this.state.error && this.state.error.message}</p>
          <button onClick={() => window.location.href = '/'}>Go to Home</button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Function to analyze router configuration
export const analyzeRouterConfig = (routes) => {
  const analysis = {
    routeCount: 0,
    nestedRoutes: 0,
    dynamicRoutes: 0,
    catchAllRoutes: 0,
    issues: [],
  };
  
  // Recursively analyze routes
  const analyzeRoute = (route, path = '', level = 0) => {
    analysis.routeCount++;
    
    // Check for dynamic segments
    if (route.path && route.path.includes(':')) {
      analysis.dynamicRoutes++;
    }
    
    // Check for catch-all routes
    if (route.path === '*') {
      analysis.catchAllRoutes++;
    }
    
    // Check for nested routes
    if (route.children && route.children.length > 0) {
      analysis.nestedRoutes += route.children.length;
      
      // Recursively analyze children
      route.children.forEach(child => {
        analyzeRoute(child, `${path}/${child.path || ''}`, level + 1);
      });
    }
    
    // Check for potential issues
    
    // Missing path
    if (!route.path && level > 0 && !route.index) {
      analysis.issues.push({
        type: 'missingPath',
        route,
        message: 'Route is missing a path and is not an index route',
      });
    }
    
    // Duplicate paths
    // This would require tracking paths across the whole tree
    
    // Missing element
    if (!route.element) {
      analysis.issues.push({
        type: 'missingElement',
        route,
        message: 'Route is missing an element',
      });
    }
  };
  
  // Start analysis
  routes.forEach(route => analyzeRoute(route));
  
  return analysis;
};

export default {
  routerHistoryTracker,
  useRouterDebugger,
  RouterErrorBoundary,
  analyzeRouterConfig,
};
