/**
 * React Router Diagnostics
 * 
 * Specialized tools for diagnosing React Router issues, particularly
 * focusing on Error #299 and initialization problems.
 */

import debugLogger from './debugLogger';

// Constants for known React Router errors
const ROUTER_ERRORS = {
  ERROR_299: 'You cannot change <Router history>',
  ERROR_MISSING_ROUTER: 'useLocation() may be used only in the context of a <Router> component',
  ERROR_MULTIPLE_ROUTERS: 'You cannot render a <Router> inside another <Router>',
};

// Router initialization tracker
class RouterInitTracker {
  constructor() {
    this.initEvents = [];
    this.routerInstances = 0;
    this.historyInstances = 0;
    this.initialized = false;
  }
  
  // Track router initialization
  trackRouterInit(routerType, props) {
    this.routerInstances++;
    
    const event = {
      timestamp: new Date().toISOString(),
      routerType,
      props: this.sanitizeProps(props),
      instanceCount: this.routerInstances,
      stackTrace: this.getStackTrace(),
    };
    
    this.initEvents.push(event);
    
    debugLogger.info('RouterInit', {
      routerType,
      instanceCount: this.routerInstances,
    });
    
    // Check for multiple routers
    if (this.routerInstances > 1) {
      debugLogger.warn('RouterInit', {
        message: 'Multiple Router instances detected',
        instanceCount: this.routerInstances,
      });
    }
    
    this.initialized = true;
  }
  
  // Track history initialization
  trackHistoryInit(historyType, options) {
    this.historyInstances++;
    
    const event = {
      timestamp: new Date().toISOString(),
      historyType,
      options,
      instanceCount: this.historyInstances,
      stackTrace: this.getStackTrace(),
    };
    
    this.initEvents.push(event);
    
    debugLogger.info('HistoryInit', {
      historyType,
      instanceCount: this.historyInstances,
    });
    
    // Check for multiple history instances
    if (this.historyInstances > 1) {
      debugLogger.warn('HistoryInit', {
        message: 'Multiple history instances detected',
        instanceCount: this.historyInstances,
      });
    }
  }
  
  // Get initialization events
  getInitEvents() {
    return this.initEvents;
  }
  
  // Check if router is initialized
  isInitialized() {
    return this.initialized;
  }
  
  // Get router instance count
  getRouterInstanceCount() {
    return this.routerInstances;
  }
  
  // Get history instance count
  getHistoryInstanceCount() {
    return this.historyInstances;
  }
  
  // Reset tracker
  reset() {
    this.initEvents = [];
    this.routerInstances = 0;
    this.historyInstances = 0;
    this.initialized = false;
    
    debugLogger.info('RouterInit', {
      message: 'Router initialization tracker reset',
    });
  }
  
  // Helper to get stack trace
  getStackTrace() {
    try {
      throw new Error('Stack trace');
    } catch (e) {
      return e.stack.split('\n').slice(2).join('\n');
    }
  }
  
  // Helper to sanitize props
  sanitizeProps(props) {
    if (!props) return null;
    
    const sanitized = {};
    
    Object.keys(props).forEach(key => {
      const value = props[key];
      
      if (key === 'history') {
        sanitized[key] = '[History Object]';
      } else if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = `[Object: ${value.constructor ? value.constructor.name : typeof value}]`;
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
}

// Create singleton instance
const routerInitTracker = new RouterInitTracker();

// Enhanced Router components for diagnostics
export const createDiagnosticRouter = (RouterComponent, name) => {
  return (props) => {
    const React = require('react');
    
    // Track initialization
    React.useEffect(() => {
      routerInitTracker.trackRouterInit(name, props);
      
      debugLogger.debug('RouterMount', {
        routerType: name,
        props: routerInitTracker.sanitizeProps(props),
      });
      
      return () => {
        debugLogger.debug('RouterUnmount', {
          routerType: name,
        });
      };
    }, []);
    
    // Render with error handling
    try {
      return <RouterComponent {...props} />;
    } catch (error) {
      debugLogger.error('RouterRender', {
        routerType: name,
        error: error.message,
        stack: error.stack,
      });
      
      // Check for known errors
      if (error.message.includes(ROUTER_ERRORS.ERROR_299)) {
        debugLogger.error('RouterError299', {
          message: 'Detected Error #299: You cannot change <Router history>',
          routerType: name,
          props: routerInitTracker.sanitizeProps(props),
        });
      } else if (error.message.includes(ROUTER_ERRORS.ERROR_MULTIPLE_ROUTERS)) {
        debugLogger.error('RouterErrorMultiple', {
          message: 'Detected multiple Router components',
          routerType: name,
          props: routerInitTracker.sanitizeProps(props),
        });
      }
      
      throw error;
    }
  };
};

// Enhanced history creator for diagnostics
export const createDiagnosticHistory = (createHistoryFn, name) => {
  return (options) => {
    // Track initialization
    routerInitTracker.trackHistoryInit(name, options);
    
    try {
      const history = createHistoryFn(options);
      
      // Wrap history methods for tracking
      const originalPush = history.push;
      const originalReplace = history.replace;
      const originalGo = history.go;
      
      history.push = (...args) => {
        debugLogger.debug('HistoryPush', {
          historyType: name,
          args,
        });
        
        return originalPush.apply(history, args);
      };
      
      history.replace = (...args) => {
        debugLogger.debug('HistoryReplace', {
          historyType: name,
          args,
        });
        
        return originalReplace.apply(history, args);
      };
      
      history.go = (...args) => {
        debugLogger.debug('HistoryGo', {
          historyType: name,
          args,
        });
        
        return originalGo.apply(history, args);
      };
      
      return history;
    } catch (error) {
      debugLogger.error('HistoryCreate', {
        historyType: name,
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  };
};

// Function to patch React Router for diagnostics
export const patchReactRouter = () => {
  try {
    // Get React Router
    const ReactRouter = require('react-router-dom');
    
    // Patch Router components
    if (ReactRouter.BrowserRouter) {
      const OriginalBrowserRouter = ReactRouter.BrowserRouter;
      ReactRouter.BrowserRouter = createDiagnosticRouter(OriginalBrowserRouter, 'BrowserRouter');
    }
    
    if (ReactRouter.HashRouter) {
      const OriginalHashRouter = ReactRouter.HashRouter;
      ReactRouter.HashRouter = createDiagnosticRouter(OriginalHashRouter, 'HashRouter');
    }
    
    if (ReactRouter.MemoryRouter) {
      const OriginalMemoryRouter = ReactRouter.MemoryRouter;
      ReactRouter.MemoryRouter = createDiagnosticRouter(OriginalMemoryRouter, 'MemoryRouter');
    }
    
    if (ReactRouter.Router) {
      const OriginalRouter = ReactRouter.Router;
      ReactRouter.Router = createDiagnosticRouter(OriginalRouter, 'Router');
    }
    
    // Patch history (if available)
    try {
      const History = require('history');
      
      if (History.createBrowserHistory) {
        const originalCreateBrowserHistory = History.createBrowserHistory;
        History.createBrowserHistory = createDiagnosticHistory(originalCreateBrowserHistory, 'browserHistory');
      }
      
      if (History.createHashHistory) {
        const originalCreateHashHistory = History.createHashHistory;
        History.createHashHistory = createDiagnosticHistory(originalCreateHashHistory, 'hashHistory');
      }
      
      if (History.createMemoryHistory) {
        const originalCreateMemoryHistory = History.createMemoryHistory;
        History.createMemoryHistory = createDiagnosticHistory(originalCreateMemoryHistory, 'memoryHistory');
      }
      
      debugLogger.info('RouterPatch', {
        message: 'History library patched for diagnostics',
      });
    } catch (e) {
      debugLogger.warn('RouterPatch', {
        message: 'History library not available for patching',
        error: e.message,
      });
    }
    
    debugLogger.info('RouterPatch', {
      message: 'React Router patched for diagnostics',
    });
    
    return true;
  } catch (e) {
    debugLogger.error('RouterPatch', {
      message: 'Failed to patch React Router',
      error: e.message,
      stack: e.stack,
    });
    
    return false;
  }
};

// Function to diagnose router issues
export const diagnoseRouterIssues = () => {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    routerInitialized: routerInitTracker.isInitialized(),
    routerInstanceCount: routerInitTracker.getRouterInstanceCount(),
    historyInstanceCount: routerInitTracker.getHistoryInstanceCount(),
    initEvents: routerInitTracker.getInitEvents(),
    issues: [],
    recommendations: [],
  };
  
  // Check for multiple router instances
  if (diagnosis.routerInstanceCount > 1) {
    diagnosis.issues.push({
      severity: 'high',
      message: 'Multiple Router instances detected',
      details: 'You should only have one Router component in your application',
    });
    
    diagnosis.recommendations.push(
      'Move the Router component to the top level of your application',
      'Remove any nested Router components',
      'Ensure you\'re not rendering the same component twice'
    );
  }
  
  // Check for multiple history instances
  if (diagnosis.historyInstanceCount > 1) {
    diagnosis.issues.push({
      severity: 'high',
      message: 'Multiple history instances detected',
      details: 'This can cause Error #299 when using React Router',
    });
    
    diagnosis.recommendations.push(
      'Create only one history instance and reuse it',
      'Move history creation outside of component rendering',
      'Use a context provider to share history'
    );
  }
  
  // Check for router not initialized
  if (!diagnosis.routerInitialized) {
    diagnosis.issues.push({
      severity: 'medium',
      message: 'Router not initialized',
      details: 'No Router component was detected in your application',
    });
    
    diagnosis.recommendations.push(
      'Add a Router component at the top level of your application',
      'Check if the Router component is being conditionally rendered'
    );
  }
  
  return diagnosis;
};

export default {
  routerInitTracker,
  createDiagnosticRouter,
  createDiagnosticHistory,
  patchReactRouter,
  diagnoseRouterIssues,
  ROUTER_ERRORS,
};
