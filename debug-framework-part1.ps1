# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# 1. Create a debug logger utility
$debugLoggerContent = @'
/**
 * Advanced Debug Logger for React Applications
 * 
 * This utility provides comprehensive logging capabilities for debugging React applications,
 * with a focus on initialization, rendering, and router-related issues.
 */

// Configuration
const DEBUG_CONFIG = {
  enabled: true,
  logLevel: 'debug', // 'error', 'warn', 'info', 'debug', 'trace'
  logToConsole: true,
  logToStorage: true,
  maxStorageLogs: 1000,
  componentTracing: true,
  routerTracing: true,
  reduxTracing: false,
  performanceTracing: true,
  storageKey: 'react_debug_logs',
};

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// Utility to get current timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

// Main logger class
class DebugLogger {
  constructor(config = DEBUG_CONFIG) {
    this.config = { ...DEBUG_CONFIG, ...config };
    this.logs = [];
    this.loadLogsFromStorage();
    
    // Initialize
    this.info('DebugLogger initialized', { config: this.config });
    
    // Set up global error handler
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }
  
  // Set up global error handlers
  setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null,
      });
      
      // Don't prevent default to allow normal error handling
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason ? (event.reason.stack || event.reason.message || event.reason) : 'Unknown reason',
      });
    });
    
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    
    // Only override if we're not already in a debug session
    if (!window.__REACT_DEBUG_SESSION__) {
      window.__REACT_DEBUG_SESSION__ = true;
      
      console.log = (...args) => {
        this.captureConsoleLog('log', ...args);
        originalConsole.log(...args);
      };
      
      console.info = (...args) => {
        this.captureConsoleLog('info', ...args);
        originalConsole.info(...args);
      };
      
      console.warn = (...args) => {
        this.captureConsoleLog('warn', ...args);
        originalConsole.warn(...args);
      };
      
      console.error = (...args) => {
        this.captureConsoleLog('error', ...args);
        originalConsole.error(...args);
      };
      
      console.debug = (...args) => {
        this.captureConsoleLog('debug', ...args);
        originalConsole.debug(...args);
      };
    }
  }
  
  // Capture console logs
  captureConsoleLog(level, ...args) {
    // Convert args to a more serializable format
    const serializedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          errorType: arg.name,
          message: arg.message,
          stack: arg.stack,
        };
      }
      
      if (typeof arg === 'object' && arg !== null) {
        try {
          // Try to convert to JSON and back to handle circular references
          return JSON.parse(JSON.stringify(arg));
        } catch (e) {
          return `[Object: ${typeof arg}]`;
        }
      }
      
      return arg;
    });
    
    this[level === 'log' ? 'debug' : level]('Console', { args: serializedArgs });
  }
  
  // Log methods
  log(level, category, data = {}) {
    if (!this.config.enabled) return;
    
    // Check if we should log based on level
    if (LOG_LEVELS[level] > LOG_LEVELS[this.config.logLevel]) return;
    
    const logEntry = {
      timestamp: getTimestamp(),
      level,
      category,
      data,
    };
    
    // Add to memory logs
    this.logs.push(logEntry);
    
    // Trim logs if needed
    if (this.logs.length > this.config.maxStorageLogs) {
      this.logs = this.logs.slice(-this.config.maxStorageLogs);
    }
    
    // Save to storage
    if (this.config.logToStorage) {
      this.saveLogsToStorage();
    }
    
    // Log to console
    if (this.config.logToConsole) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      if (console[consoleMethod]) {
        console[consoleMethod](`[${logEntry.timestamp}] [${level.toUpperCase()}] [${category}]`, data);
      }
    }
  }
  
  // Convenience methods
  error(category, data) { this.log('error', category, data); }
  warn(category, data) { this.log('warn', category, data); }
  info(category, data) { this.log('info', category, data); }
  debug(category, data) { this.log('debug', category, data); }
  trace(category, data) { this.log('trace', category, data); }
  
  // Storage methods
  saveLogsToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.logs));
      } catch (e) {
        // If storage fails (e.g., quota exceeded), just continue without saving
        console.warn('Failed to save logs to localStorage', e);
      }
    }
  }
  
  loadLogsFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const storedLogs = localStorage.getItem(this.config.storageKey);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      } catch (e) {
        // If loading fails, start with empty logs
        console.warn('Failed to load logs from localStorage', e);
        this.logs = [];
      }
    }
  }
  
  clearLogs() {
    this.logs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
    this.info('Logs cleared');
  }
  
  // Get all logs
  getLogs() {
    return this.logs;
  }
  
  // Get logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }
  
  // Get logs by category
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }
  
  // Export logs as JSON
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
  
  // Create diagnostic report
  createDiagnosticReport() {
    const report = {
      timestamp: getTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available',
      logs: this.logs,
      stats: {
        totalLogs: this.logs.length,
        errorCount: this.getLogsByLevel('error').length,
        warnCount: this.getLogsByLevel('warn').length,
        infoCount: this.getLogsByLevel('info').length,
        debugCount: this.getLogsByLevel('debug').length,
        traceCount: this.getLogsByLevel('trace').length,
      },
      environment: {
        windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Not available',
        language: typeof navigator !== 'undefined' ? navigator.language : 'Not available',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Not available',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    
    return report;
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export
export default debugLogger;
'@

Set-Content -Path "frontend/school-frontend-app/src/utils/debugLogger.js" -Value $debugLoggerContent

# 2. Create a React component tracer
$reactTracerContent = @'
/**
 * React Component Tracer
 * 
 * This utility provides detailed tracing of React component lifecycle events,
 * helping to debug rendering, mounting, and update issues.
 */

import debugLogger from './debugLogger';

// Higher-order component to trace component lifecycle
export const withComponentTracing = (Component, options = {}) => {
  const componentName = options.name || Component.displayName || Component.name || 'UnknownComponent';
  
  // Return a wrapped component with tracing
  const TracedComponent = (props) => {
    // Use React hooks for tracing
    const React = require('react');
    
    // Trace mounting
    React.useEffect(() => {
      debugLogger.debug('ComponentMount', {
        component: componentName,
        props: sanitizeProps(props),
      });
      
      // Trace unmounting
      return () => {
        debugLogger.debug('ComponentUnmount', {
          component: componentName,
        });
      };
    }, []);
    
    // Trace renders
    debugLogger.trace('ComponentRender', {
      component: componentName,
      props: sanitizeProps(props),
    });
    
    // Trace updates
    const prevPropsRef = React.useRef(props);
    React.useEffect(() => {
      const prevProps = prevPropsRef.current;
      
      // Find changed props
      const changedProps = {};
      let hasChanges = false;
      
      Object.keys(props).forEach(key => {
        if (props[key] !== prevProps[key]) {
          changedProps[key] = {
            from: prevProps[key],
            to: props[key],
          };
          hasChanges = true;
        }
      });
      
      // Log if props changed
      if (hasChanges) {
        debugLogger.debug('ComponentUpdate', {
          component: componentName,
          changedProps: sanitizeProps(changedProps),
        });
      }
      
      // Update ref
      prevPropsRef.current = props;
    });
    
    // Render the original component
    return <Component {...props} />;
  };
  
  // Set display name for debugging
  TracedComponent.displayName = `Traced(${componentName})`;
  
  return TracedComponent;
};

// Helper to sanitize props for logging (remove circular references, etc.)
const sanitizeProps = (props) => {
  try {
    // Convert to JSON and back to handle circular references
    return JSON.parse(JSON.stringify(props));
  } catch (e) {
    // If serialization fails, return a simplified version
    const sanitized = {};
    
    Object.keys(props).forEach(key => {
      const value = props[key];
      
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = `[Object: ${value.constructor.name || typeof value}]`;
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
};

// Function to trace all components in an app
export const traceAllComponents = (rootComponent) => {
  // Recursively trace all components
  const traceComponent = (component) => {
    // Skip if already traced
    if (component.displayName && component.displayName.startsWith('Traced(')) {
      return component;
    }
    
    // Trace this component
    const traced = withComponentTracing(component);
    
    // If it has subcomponents, trace those too
    if (component.subcomponents) {
      traced.subcomponents = {};
      
      Object.keys(component.subcomponents).forEach(key => {
        traced.subcomponents[key] = traceComponent(component.subcomponents[key]);
      });
    }
    
    return traced;
  };
  
  return traceComponent(rootComponent);
};

// React Router specific tracing
export const traceRouterComponents = () => {
  try {
    // Get React Router components
    const ReactRouter = require('react-router-dom');
    
    // Trace key components
    const originalComponents = {
      BrowserRouter: ReactRouter.BrowserRouter,
      Routes: ReactRouter.Routes,
      Route: ReactRouter.Route,
      Link: ReactRouter.Link,
      NavLink: ReactRouter.NavLink,
      Navigate: ReactRouter.Navigate,
      Outlet: ReactRouter.Outlet,
      useNavigate: ReactRouter.useNavigate,
      useLocation: ReactRouter.useLocation,
      useParams: ReactRouter.useParams,
    };
    
    // Replace with traced versions
    Object.keys(originalComponents).forEach(key => {
      if (typeof originalComponents[key] === 'function') {
        if (key.startsWith('use')) {
          // For hooks, we need special handling
          const originalHook = originalComponents[key];
          
          ReactRouter[key] = (...args) => {
            debugLogger.trace('RouterHook', {
              hook: key,
              args,
            });
            
            const result = originalHook(...args);
            
            debugLogger.trace('RouterHookResult', {
              hook: key,
              result: typeof result === 'function' ? '[Function]' : result,
            });
            
            return result;
          };
        } else {
          // For components
          ReactRouter[key] = withComponentTracing(originalComponents[key], { name: `Router.${key}` });
        }
      }
    });
    
    debugLogger.info('RouterTracing', { message: 'React Router components traced successfully' });
  } catch (e) {
    debugLogger.error('RouterTracing', { message: 'Failed to trace React Router components', error: e });
  }
};

// Export a hook to trace component renders
export const useTraceRender = (componentName) => {
  const React = require('react');
  
  React.useEffect(() => {
    debugLogger.debug('HookComponentMount', {
      component: componentName,
    });
    
    return () => {
      debugLogger.debug('HookComponentUnmount', {
        component: componentName,
      });
    };
  }, [componentName]);
  
  debugLogger.trace('HookComponentRender', {
    component: componentName,
  });
};

// Export a hook to trace state changes
export const useTraceState = (state, stateName, componentName) => {
  const React = require('react');
  const prevStateRef = React.useRef(state);
  
  React.useEffect(() => {
    const prevState = prevStateRef.current;
    
    if (prevState !== state) {
      debugLogger.debug('StateChange', {
        component: componentName,
        state: stateName,
        from: prevState,
        to: state,
      });
    }
    
    prevStateRef.current = state;
  }, [state, stateName, componentName]);
};
'@

Set-Content -Path "frontend/school-frontend-app/src/utils/reactTracer.js" -Value $reactTracerContent

# 3. Create a Router debugger
$routerDebuggerContent = @'
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
'@

Set-Content -Path "frontend/school-frontend-app/src/utils/routerDebugger.js" -Value $routerDebuggerContent

# Add the changes to git
git add frontend/school-frontend-app/src/utils/debugLogger.js frontend/school-frontend-app/src/utils/reactTracer.js frontend/school-frontend-app/src/utils/routerDebugger.js

# Commit the changes
git commit -m "Add core debugging infrastructure (Part 1)"

# Push the changes to GitHub
git push

Write-Host "Core debugging infrastructure (Part 1) pushed to GitHub."
Write-Host "This includes the debug logger, React component tracer, and Router debugger."
