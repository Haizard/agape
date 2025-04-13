/**
 * React 18 Diagnostics
 * 
 * Specialized tools for diagnosing React 18 specific issues,
 * particularly focusing on concurrent rendering and createRoot.
 */

import debugLogger from './debugLogger';

// Track React root creation
class ReactRootTracker {
  constructor() {
    this.roots = [];
    this.createRootCalls = 0;
    this.renderCalls = 0;
  }
  
  // Track createRoot calls
  trackCreateRoot(container, options) {
    this.createRootCalls++;
    
    const rootInfo = {
      timestamp: new Date().toISOString(),
      container: container ? container.tagName : 'unknown',
      containerId: container ? container.id : 'unknown',
      options,
      callNumber: this.createRootCalls,
      stackTrace: this.getStackTrace(),
    };
    
    this.roots.push(rootInfo);
    
    debugLogger.info('ReactRoot', {
      message: `createRoot called (${this.createRootCalls})`,
      container: rootInfo.container,
      containerId: rootInfo.containerId,
    });
    
    // Check for multiple roots
    if (this.createRootCalls > 1) {
      debugLogger.warn('ReactRoot', {
        message: 'Multiple createRoot calls detected',
        rootCount: this.createRootCalls,
      });
    }
    
    return rootInfo;
  }
  
  // Track root render calls
  trackRender(rootInfo, element) {
    this.renderCalls++;
    
    const renderInfo = {
      timestamp: new Date().toISOString(),
      rootInfo,
      elementType: element ? (element.type ? (typeof element.type === 'string' ? element.type : element.type.name || 'Component') : 'unknown') : 'unknown',
      callNumber: this.renderCalls,
    };
    
    debugLogger.info('ReactRender', {
      message: `Root render called (${this.renderCalls})`,
      elementType: renderInfo.elementType,
      rootContainer: rootInfo ? rootInfo.container : 'unknown',
    });
    
    return renderInfo;
  }
  
  // Get all tracked roots
  getRoots() {
    return this.roots;
  }
  
  // Get root count
  getRootCount() {
    return this.createRootCalls;
  }
  
  // Get render count
  getRenderCount() {
    return this.renderCalls;
  }
  
  // Reset tracker
  reset() {
    this.roots = [];
    this.createRootCalls = 0;
    this.renderCalls = 0;
    
    debugLogger.info('ReactRoot', {
      message: 'React root tracker reset',
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
}

// Create singleton instance
const reactRootTracker = new ReactRootTracker();

// Function to patch React DOM for diagnostics
export const patchReactDOM = () => {
  try {
    // Get React DOM
    const ReactDOM = require('react-dom/client');
    
    // Store original createRoot
    const originalCreateRoot = ReactDOM.createRoot;
    
    // Replace with diagnostic version
    ReactDOM.createRoot = (container, options) => {
      const rootInfo = reactRootTracker.trackCreateRoot(container, options);
      
      try {
        // Call original createRoot
        const root = originalCreateRoot(container, options);
        
        // Store original render
        const originalRender = root.render;
        
        // Replace with diagnostic version
        root.render = (element) => {
          reactRootTracker.trackRender(rootInfo, element);
          
          try {
            return originalRender(element);
          } catch (error) {
            debugLogger.error('ReactRender', {
              message: 'Error in root.render',
              error: error.message,
              stack: error.stack,
              rootInfo,
              elementType: element ? (element.type ? (typeof element.type === 'string' ? element.type : element.type.name || 'Component') : 'unknown') : 'unknown',
            });
            
            throw error;
          }
        };
        
        return root;
      } catch (error) {
        debugLogger.error('ReactCreateRoot', {
          message: 'Error in createRoot',
          error: error.message,
          stack: error.stack,
          container: container ? container.tagName : 'unknown',
          containerId: container ? container.id : 'unknown',
        });
        
        throw error;
      }
    };
    
    debugLogger.info('ReactPatch', {
      message: 'React DOM patched for diagnostics',
    });
    
    return true;
  } catch (e) {
    debugLogger.error('ReactPatch', {
      message: 'Failed to patch React DOM',
      error: e.message,
      stack: e.stack,
    });
    
    return false;
  }
};

// Function to diagnose React 18 issues
export const diagnoseReact18Issues = () => {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    reactVersion: getReactVersion(),
    rootCount: reactRootTracker.getRootCount(),
    renderCount: reactRootTracker.getRenderCount(),
    roots: reactRootTracker.getRoots(),
    issues: [],
    recommendations: [],
  };
  
  // Check for multiple roots
  if (diagnosis.rootCount > 1) {
    diagnosis.issues.push({
      severity: 'high',
      message: 'Multiple createRoot calls detected',
      details: 'You should only have one root in your application',
    });
    
    diagnosis.recommendations.push(
      'Create only one root with createRoot',
      'Ensure you\'re not calling createRoot multiple times',
      'Check for duplicate root container elements'
    );
  }
  
  // Check for React version
  if (diagnosis.reactVersion && !diagnosis.reactVersion.startsWith('18.')) {
    diagnosis.issues.push({
      severity: 'medium',
      message: `Using React ${diagnosis.reactVersion} with createRoot`,
      details: 'createRoot is only available in React 18+',
    });
    
    diagnosis.recommendations.push(
      'Upgrade to React 18',
      'Use ReactDOM.render instead of createRoot for React 17 and below'
    );
  }
  
  return diagnosis;
};

// Helper to get React version
const getReactVersion = () => {
  try {
    const React = require('react');
    return React.version;
  } catch (e) {
    return 'unknown';
  }
};

export default {
  reactRootTracker,
  patchReactDOM,
  diagnoseReact18Issues,
};
