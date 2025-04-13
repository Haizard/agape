/**
 * Debug Initialization
 * 
 * Initializes all debugging tools and provides a unified interface
 * for debugging React applications.
 */

import debugLogger from './debugLogger';
import routerDiagnostics from './routerDiagnostics';
import react18Diagnostics from './react18Diagnostics';
import diagnosticReport from './diagnosticReport';

// Initialize all debugging tools
export const initializeDebugging = (options = {}) => {
  const defaultOptions = {
    patchReact: true,
    patchRouter: true,
    logLevel: 'debug',
    componentTracing: true,
    routerTracing: true,
    performanceTracing: true,
  };
  
  const config = { ...defaultOptions, ...options };
  
  debugLogger.info('DebugInit', {
    message: 'Initializing debugging tools',
    config,
  });
  
  // Set up React patching
  if (config.patchReact) {
    const reactPatched = react18Diagnostics.patchReactDOM();
    
    debugLogger.info('DebugInit', {
      message: `React DOM patching ${reactPatched ? 'successful' : 'failed'}`,
    });
  }
  
  // Set up Router patching
  if (config.patchRouter) {
    const routerPatched = routerDiagnostics.patchReactRouter();
    
    debugLogger.info('DebugInit', {
      message: `React Router patching ${routerPatched ? 'successful' : 'failed'}`,
    });
  }
  
  // Set up error boundary
  window.__REACT_ERROR_OVERLAY__ = true;
  
  // Set up global debugging object
  window.__REACT_DEBUG__ = {
    logger: debugLogger,
    routerDiagnostics,
    react18Diagnostics,
    diagnosticReport,
    generateReport: diagnosticReport.generateDiagnosticReport,
    exportReport: diagnosticReport.exportDiagnosticReport,
    saveReport: diagnosticReport.saveDiagnosticReport,
    loadReport: diagnosticReport.loadDiagnosticReport,
  };
  
  debugLogger.info('DebugInit', {
    message: 'Debugging tools initialized successfully',
  });
  
  return window.__REACT_DEBUG__;
};

// Create a debug error boundary component
export const DebugErrorBoundary = ({ children, fallback }) => {
  const React = require('react');
  
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      debugLogger.error('ErrorBoundary', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      
      // Check for Router errors
      if (error.message.includes('You cannot change <Router history>')) {
        debugLogger.error('RouterError299', {
          message: 'Caught Error #299 in error boundary',
          error: error.message,
          stack: error.stack,
        });
      }
    }
    
    render() {
      if (this.state.hasError) {
        if (this.props.fallback) {
          return this.props.fallback(this.state.error);
        }
        
        return (
          <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
            <h2>Something went wrong</h2>
            <p>{this.state.error && this.state.error.message}</p>
            <button onClick={() => window.location.reload()}>Reload Page</button>
            <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
            <button onClick={() => {
              const report = diagnosticReport.generateDiagnosticReport();
              console.log('Diagnostic Report:', report);
              diagnosticReport.saveDiagnosticReport();
              alert('Diagnostic report generated and saved to localStorage');
            }}>Generate Diagnostic Report</button>
          </div>
        );
      }
      
      return this.props.children;
    }
  }
  
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};

// Create a debug provider component
export const DebugProvider = ({ children, options }) => {
  const React = require('react');
  
  React.useEffect(() => {
    initializeDebugging(options);
  }, []);
  
  return (
    <DebugErrorBoundary>
      {children}
    </DebugErrorBoundary>
  );
};

export default {
  initializeDebugging,
  DebugErrorBoundary,
  DebugProvider,
};
